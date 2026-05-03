import { randomBytes, randomUUID } from 'node:crypto'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import {
  address,
  createSolanaRpc,
  getBase58Encoder,
  signatureBytes,
  verifySignature,
} from '@solana/kit'
import {
  fetchAssetV1,
  fetchAssetsByCollection,
  fetchAssetsByOwner,
  fetchAssetsByUpdateAuthority,
  getAssetV1AccountDataDecoder,
  getPluginRegistryV1AccountDataDecoder,
  type AssetV1,
} from '@obrera/mpl-core-kit-lib'
import { Hono } from 'hono'
import { deleteCookie, getCookie, setCookie } from 'hono/cookie'
import { z } from 'zod'
import { db } from './db.js'

export const app = new Hono()

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const clientRoot = path.resolve(__dirname, '..', 'client')
const rpcUrl = process.env.SOLANA_RPC_URL ?? 'https://api.devnet.solana.com'
const baseUrl = process.env.PUBLIC_BASE_URL ?? 'http://127.0.0.1:3000'
const operatorWallets = new Set(
  (process.env.OPERATOR_WALLETS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
)
const rpc = createSolanaRpc(rpcUrl)
const sessionMaxAgeSeconds = 60 * 60 * 24 * 7

const searchQuerySchema = z.object({
  collection: z.string().trim().optional().default(''),
  limit: z.coerce.number().min(1).max(100).default(30),
  name: z.string().trim().optional().default(''),
  owner: z.string().trim().optional().default(''),
  updateAuthority: z.string().trim().optional().default(''),
})

const verifySchema = z.object({
  accountAddress: z.string().min(32),
  input: z.object({
    domain: z.string().min(1),
    requestId: z.string().min(1),
    statement: z.string().min(1),
    uri: z.string().url(),
  }),
  method: z.string().min(1),
  signature: z.array(z.number().int().min(0).max(255)).length(64),
  signedMessage: z.array(z.number().int().min(0).max(255)).min(1),
})

const presetSchema = z.object({
  filters: z.object({
    collection: z.string(),
    limit: z.number().min(1).max(100),
    name: z.string(),
    owner: z.string(),
    updateAuthority: z.string(),
  }),
  kind: z.enum(['preset', 'watchlist']),
  name: z.string().trim().min(1).max(60),
})

const queueBatchSchema = z.object({
  items: z
    .array(
      z.object({
        assetAddress: z.string().min(32),
        assetName: z.string().trim().nullable().optional(),
        note: z.string().trim().min(1).max(1000),
        status: z.string().trim().min(1).max(32),
        tags: z.array(z.string().trim().min(1).max(32)).max(8),
      }),
    )
    .min(1)
    .max(25),
})

type SessionRow = {
  userId: number
  walletAddress: string
  isOperator: number
  lastLoginAt: string
}

function nowIso() {
  return new Date().toISOString()
}

function jsonValue(value: unknown) {
  return JSON.parse(
    JSON.stringify(value, (_, entry) => (typeof entry === 'bigint' ? entry.toString() : entry)),
  ) as unknown
}

function deriveAuthority(decodedAsset: AssetV1) {
  const { updateAuthority } = decodedAsset
  if (updateAuthority.__kind === 'Collection') {
    return {
      authorityAddress: updateAuthority.fields[0],
      authorityType: 'Collection',
      collectionAddress: updateAuthority.fields[0],
    }
  }
  if (updateAuthority.__kind === 'Address') {
    return {
      authorityAddress: updateAuthority.fields[0],
      authorityType: 'Address',
      collectionAddress: null,
    }
  }
  return {
    authorityAddress: null,
    authorityType: 'None',
    collectionAddress: null,
  }
}

function getSession(cookies: Record<string, string | undefined>): SessionRow | null {
  const token = cookies.assetops_session
  if (!token) return null

  const row = db
    .prepare(
      `
        SELECT users.id as userId, users.wallet_address as walletAddress, users.is_operator as isOperator, users.last_login_at as lastLoginAt
        FROM sessions
        JOIN users ON users.id = sessions.user_id
        WHERE sessions.token = ? AND sessions.expires_at > ?
      `,
    )
    .get(token, nowIso()) as SessionRow | undefined

  return row ?? null
}

function requireSession(cookies: Record<string, string | undefined>) {
  const session = getSession(cookies)
  if (!session) {
    throw new Error('Authentication required')
  }
  return session
}

function requireOperator(cookies: Record<string, string | undefined>) {
  const session = requireSession(cookies)
  if (!session.isOperator) {
    throw new Error('Operator access required')
  }
  return session
}

function buildNonce() {
  return randomBytes(18).toString('hex')
}

function setSessionCookie(token: string, maxAgeSeconds: number, context: Parameters<typeof setCookie>[0]) {
  setCookie(context, 'assetops_session', token, {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
    maxAge: maxAgeSeconds,
  })
}

function parseSiwsMessage(bytes: Uint8Array) {
  return new TextDecoder().decode(bytes)
}

async function verifyWalletSignature(walletAddress: string, signatureData: Uint8Array, message: Uint8Array) {
  const publicKeyBytes = getBase58Encoder().encode(walletAddress)
  const publicKey = await crypto.subtle.importKey(
    'raw',
    publicKeyBytes,
    { name: 'Ed25519' },
    true,
    ['verify'],
  )
  return verifySignature(publicKey, signatureBytes(signatureData), message)
}

async function loadAssetDetails(assetAddress: string) {
  const accountAddress = address(assetAddress)
  const accountInfo = await rpc.getAccountInfo(accountAddress, { encoding: 'base64' }).send()
  if (!accountInfo.value?.data?.[0]) {
    throw new Error('Asset account was not found')
  }

  const asset = await fetchAssetV1(rpc, accountAddress)
  const base64 = accountInfo.value.data[0]
  const rawBytes = Buffer.from(base64, 'base64')
  const hooked = getAssetV1AccountDataDecoder().decode(rawBytes)
  const registry = hooked.pluginHeader
    ? getPluginRegistryV1AccountDataDecoder().decode(rawBytes, Number(hooked.pluginHeader.pluginRegistryOffset))
    : { registry: [], externalRegistry: [] }

  return {
    accountBase64: base64,
    address: assetAddress,
    decoded: jsonValue(hooked) as Record<string, unknown>,
    lamports: asset.lamports.toString(),
    ownerProgram: asset.programAddress,
    pluginHeader: hooked.pluginHeader
      ? { pluginRegistryOffset: hooked.pluginHeader.pluginRegistryOffset.toString() }
      : null,
    registry: registry.registry.map((entry: (typeof registry.registry)[number]) => ({
      authorityAddress: entry.authority.__kind === 'Address' ? entry.authority.address : null,
      authorityType: entry.authority.__kind,
      pluginType: String(entry.pluginType),
    })),
  }
}

app.get('/api/health', (context) => {
  return context.json({
    ok: true,
    service: 'assetops',
    timestamp: nowIso(),
  })
})

app.get('/api/bootstrap', (context) => {
  const session = getSession(getCookie(context))
  return context.json({
    ok: true,
    runtime: {
      build: '075',
      environment: process.env.NODE_ENV ?? 'development',
      operatorWalletCount: operatorWallets.size,
      rpcUrl,
    },
    sessionUser: session
      ? {
          isOperator: Boolean(session.isOperator),
          lastLoginAt: session.lastLoginAt,
          walletAddress: session.walletAddress,
        }
      : null,
  })
})

app.post('/api/auth/nonce', async (context) => {
  const input = await context.req.json().catch(() => ({}))
  const walletAddress = typeof input.walletAddress === 'string' ? input.walletAddress.trim() : ''
  const nonce = buildNonce()
  const createdAt = nowIso()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

  db.prepare(
    'INSERT INTO auth_nonces (nonce, wallet_address, created_at, expires_at, used_at) VALUES (?, ?, ?, ?, NULL)',
  ).run(nonce, walletAddress || null, createdAt, expiresAt)

  return context.json({
    nonce,
    domain: new URL(baseUrl).host,
    statement: 'Sign in to AssetOps and bind this wallet to an operator console session.',
    uri: baseUrl,
  })
})

app.post('/api/auth/verify', async (context) => {
  const body = verifySchema.parse(await context.req.json())
  if (body.method !== 'solana:signIn') {
    return context.json({ error: 'Wallet must use SIWS native sign-in' }, 400)
  }

  const nonceRow = db
    .prepare('SELECT nonce, wallet_address, expires_at, used_at FROM auth_nonces WHERE nonce = ?')
    .get(body.input.requestId) as
    | { nonce: string; wallet_address: string | null; expires_at: string; used_at: string | null }
    | undefined

  if (!nonceRow || nonceRow.used_at || nonceRow.expires_at <= nowIso()) {
    return context.json({ error: 'Nonce is invalid or expired' }, 400)
  }

  if (nonceRow.wallet_address && nonceRow.wallet_address !== body.accountAddress) {
    return context.json({ error: 'Wallet address mismatch for nonce' }, 400)
  }

  const signedMessage = Uint8Array.from(body.signedMessage)
  const signature = Uint8Array.from(body.signature)
  const verified = await verifyWalletSignature(body.accountAddress, signature, signedMessage)
  if (!verified) {
    return context.json({ error: 'Signature verification failed' }, 400)
  }

  const messageText = parseSiwsMessage(signedMessage)
  const expectedDomain = new URL(baseUrl).host
  const messageChecks = [
    messageText.includes(expectedDomain),
    messageText.includes(body.input.requestId),
    messageText.includes(body.accountAddress),
    messageText.includes(body.input.statement),
  ]

  if (messageChecks.includes(false)) {
    return context.json({ error: 'SIWS message content failed validation' }, 400)
  }

  db.prepare('UPDATE auth_nonces SET used_at = ? WHERE nonce = ?').run(nowIso(), body.input.requestId)

  const loginAt = nowIso()
  db.prepare(
    `
      INSERT INTO users (wallet_address, is_operator, created_at, last_login_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(wallet_address) DO UPDATE SET
        is_operator = excluded.is_operator,
        last_login_at = excluded.last_login_at
    `,
  ).run(body.accountAddress, operatorWallets.has(body.accountAddress) ? 1 : 0, loginAt, loginAt)

  const userRow = db.prepare('SELECT id FROM users WHERE wallet_address = ?').get(body.accountAddress) as
    | { id: number }
    | undefined
  if (!userRow) {
    return context.json({ error: 'User provisioning failed' }, 500)
  }

  const token = randomUUID()
  const expiresAt = new Date(Date.now() + sessionMaxAgeSeconds * 1000).toISOString()
  db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(
    token,
    userRow.id,
    loginAt,
    expiresAt,
  )
  setSessionCookie(token, sessionMaxAgeSeconds, context)

  return context.json({ ok: true })
})

app.post('/api/auth/logout', (context) => {
  const token = getCookie(context, 'assetops_session')
  if (token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
  }
  deleteCookie(context, 'assetops_session', { path: '/' })
  return context.json({ ok: true })
})

app.get('/api/assets/search', async (context) => {
  const query = searchQuerySchema.parse(context.req.query())
  const selectorCount = [query.owner, query.collection, query.updateAuthority].filter(Boolean).length
  if (selectorCount !== 1) {
    return context.json(
      { error: 'Provide exactly one primary selector: owner, collection, or updateAuthority' },
      400,
    )
  }

  let accounts
  if (query.owner) {
    accounts = await fetchAssetsByOwner(rpc, address(query.owner))
  } else if (query.collection) {
    accounts = await fetchAssetsByCollection(rpc, address(query.collection))
  } else {
    accounts = await fetchAssetsByUpdateAuthority(rpc, address(query.updateAuthority))
  }

  const filtered = accounts
    .map((account: Awaited<ReturnType<typeof fetchAssetsByOwner>>[number]) => {
      const authority = deriveAuthority(account.data)
      return {
        address: account.address,
        authorityAddress: authority.authorityAddress,
        authorityType: authority.authorityType,
        collectionAddress: authority.collectionAddress,
        hasPlugins: account.data.uri.length > 0,
        name: account.data.name,
        owner: account.data.owner,
        uri: account.data.uri,
      }
    })
    .filter((result: { name: string }) =>
      query.name ? result.name.toLowerCase().includes(query.name.toLowerCase()) : true,
    )
    .slice(0, query.limit)

  return context.json({ results: filtered })
})

app.get('/api/assets/:address', async (context) => {
  try {
    const asset = await loadAssetDetails(context.req.param('address'))
    return context.json({ asset })
  } catch (error) {
    return context.json({ error: error instanceof Error ? error.message : 'Failed to load asset' }, 404)
  }
})

app.get('/api/presets', (context) => {
  try {
    const session = requireSession(getCookie(context))
    const rows = db
      .prepare(
        'SELECT id, name, kind, filters_json, updated_at FROM presets WHERE user_id = ? ORDER BY updated_at DESC',
      )
      .all(session.userId) as Array<{
      filters_json: string
      id: number
      kind: 'preset' | 'watchlist'
      name: string
      updated_at: string
    }>

    return context.json({
      presets: rows.map((row) => ({
        filters: JSON.parse(row.filters_json),
        id: row.id,
        kind: row.kind,
        name: row.name,
        updatedAt: row.updated_at,
      })),
    })
  } catch (error) {
    return context.json({ error: error instanceof Error ? error.message : 'Failed to load presets' }, 401)
  }
})

app.post('/api/presets', async (context) => {
  try {
    const session = requireSession(getCookie(context))
    const body = presetSchema.parse(await context.req.json())
    const timestamp = nowIso()
    db.prepare(
      `
        INSERT INTO presets (user_id, name, kind, filters_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
    ).run(session.userId, body.name, body.kind, JSON.stringify(body.filters), timestamp, timestamp)
    return context.json({ ok: true })
  } catch (error) {
    return context.json({ error: error instanceof Error ? error.message : 'Failed to save preset' }, 400)
  }
})

app.delete('/api/presets/:id', (context) => {
  try {
    const session = requireSession(getCookie(context))
    db.prepare('DELETE FROM presets WHERE id = ? AND user_id = ?').run(Number(context.req.param('id')), session.userId)
    return context.json({ ok: true })
  } catch (error) {
    return context.json({ error: error instanceof Error ? error.message : 'Failed to delete preset' }, 401)
  }
})

app.get('/api/operator/queue', (context) => {
  try {
    requireOperator(getCookie(context))
    const rows = db
      .prepare(
        `
          SELECT
            operator_queue.id as id,
            operator_queue.asset_address as assetAddress,
            operator_queue.asset_name as assetName,
            operator_queue.note as note,
            operator_queue.status as status,
            operator_queue.tags_json as tagsJson,
            operator_queue.created_at as createdAt,
            users.wallet_address as actorWalletAddress
          FROM operator_queue
          JOIN users ON users.id = operator_queue.actor_user_id
          ORDER BY operator_queue.created_at DESC
          LIMIT 40
        `,
      )
      .all() as Array<{
      actorWalletAddress: string
      assetAddress: string
      assetName: string | null
      createdAt: string
      id: number
      note: string
      status: string
      tagsJson: string
    }>

    return context.json({
      items: rows.map((row) => ({
        actorWalletAddress: row.actorWalletAddress,
        assetAddress: row.assetAddress,
        assetName: row.assetName,
        createdAt: row.createdAt,
        id: row.id,
        note: row.note,
        status: row.status,
        tags: JSON.parse(row.tagsJson) as string[],
      })),
    })
  } catch (error) {
    return context.json({ error: error instanceof Error ? error.message : 'Forbidden' }, 403)
  }
})

app.post('/api/operator/queue/batch', async (context) => {
  try {
    const session = requireOperator(getCookie(context))
    const body = queueBatchSchema.parse(await context.req.json())
    const insert = db.prepare(
      `
        INSERT INTO operator_queue (asset_address, asset_name, note, status, tags_json, actor_user_id, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
    )
    const timestamp = nowIso()
    const transaction = db.transaction(() => {
      for (const item of body.items) {
        insert.run(
          item.assetAddress,
          item.assetName ?? null,
          item.note,
          item.status,
          JSON.stringify(item.tags),
          session.userId,
          timestamp,
        )
      }
    })
    transaction()
    return context.json({ ok: true })
  } catch (error) {
    return context.json({ error: error instanceof Error ? error.message : 'Failed to queue assets' }, 400)
  }
})

app.use('/assets/*', serveStatic({ root: clientRoot }))
app.use('/*', serveStatic({ root: clientRoot }))
app.get('*', serveStatic({ path: path.join(clientRoot, 'index.html') }))

const port = Number(process.env.PORT ?? 3000)
const entrypointHref = process.argv[1] ? pathToFileURL(process.argv[1]).href : ''
if (entrypointHref === import.meta.url) {
  serve({
    fetch: app.fetch,
    port,
  })
}
