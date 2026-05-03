import { useCallback, useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import { WalletUiAuth, WalletUiDropdown, type WalletUiAuthState, useWalletUi } from '@wallet-ui/react'

type SessionUser = {
  walletAddress: string
  isOperator: boolean
  lastLoginAt: string
}

type Bootstrap = {
  ok: boolean
  sessionUser: SessionUser | null
  runtime: {
    build: string
    environment: string
    rpcUrl: string
    operatorWalletCount: number
  }
}

type SearchResult = {
  address: string
  name: string
  owner: string
  uri: string
  authorityType: string
  authorityAddress: string | null
  collectionAddress: string | null
  hasPlugins: boolean
}

type AssetDetail = {
  accountBase64: string
  address: string
  decoded: Record<string, unknown>
  lamports: string
  ownerProgram: string
  pluginHeader: { pluginRegistryOffset: string } | null
  registry: Array<{
    authorityType: string
    authorityAddress: string | null
    pluginType: string
  }>
}

type Preset = {
  id: number
  name: string
  filters: SearchFilters
  kind: 'preset' | 'watchlist'
  updatedAt: string
}

type QueueItem = {
  id: number
  assetAddress: string
  assetName: string | null
  note: string
  status: string
  tags: string[]
  createdAt: string
  actorWalletAddress: string
}

type SearchFilters = {
  owner: string
  collection: string
  updateAuthority: string
  name: string
  limit: number
}

const defaultFilters: SearchFilters = {
  owner: '',
  collection: '',
  updateAuthority: '',
  name: '',
  limit: 30,
}

async function readJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  const data = (await response.json()) as T & { error?: string }
  if (!response.ok) {
    throw new Error(data.error ?? 'Request failed')
  }
  return data
}

function shortAddress(value: string | null | undefined) {
  if (!value) return 'n/a'
  return `${value.slice(0, 4)}..${value.slice(-4)}`
}

function App() {
  const walletUi = useWalletUi()
  const wallet = walletUi.wallet
  const [bootstrap, setBootstrap] = useState<Bootstrap | null>(null)
  const [filters, setFilters] = useState<SearchFilters>(defaultFilters)
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null)
  const [detail, setDetail] = useState<AssetDetail | null>(null)
  const [presets, setPresets] = useState<Preset[]>([])
  const [queue, setQueue] = useState<QueueItem[]>([])
  const [operatorNote, setOperatorNote] = useState('')
  const [presetName, setPresetName] = useState('')
  const [presetKind, setPresetKind] = useState<'preset' | 'watchlist'>('preset')
  const [viewMode, setViewMode] = useState<'decoded' | 'raw'>('decoded')
  const [status, setStatus] = useState('Ready')
  const [busy, setBusy] = useState(false)

  const isOperator = bootstrap?.sessionUser?.isOperator ?? false

  const refreshBootstrap = useCallback(async () => {
    const data = await readJson<Bootstrap>('/api/bootstrap', { method: 'GET' })
    setBootstrap(data)
  }, [])

  const refreshPresets = useCallback(async () => {
    const data = await readJson<{ presets: Preset[] }>('/api/presets', { method: 'GET' })
    setPresets(data.presets)
  }, [])

  const refreshQueue = useCallback(async () => {
    const data = await readJson<{ items: QueueItem[] }>('/api/operator/queue', { method: 'GET' })
    setQueue(data.items)
  }, [])

  async function runSearch(nextFilters = filters) {
    setBusy(true)
    setStatus('Querying MPL Core accounts')
    try {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(nextFilters)) {
        if (value !== '' && value !== null && value !== undefined) {
          params.set(key, String(value))
        }
      }
      const data = await readJson<{ results: SearchResult[] }>(`/api/assets/search?${params.toString()}`, {
        method: 'GET',
      })
      setResults(data.results)
      setSelectedAddress(data.results[0]?.address ?? null)
      setStatus(`Loaded ${data.results.length} assets`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Search failed')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    void refreshBootstrap()
  }, [refreshBootstrap])

  useEffect(() => {
    if (bootstrap?.sessionUser) {
      void refreshPresets()
    } else {
      setPresets([])
    }
  }, [bootstrap?.sessionUser, refreshPresets])

  useEffect(() => {
    if (isOperator) {
      void refreshQueue()
    } else {
      setQueue([])
    }
  }, [isOperator, refreshQueue])

  useEffect(() => {
    if (!selectedAddress) {
      setDetail(null)
      return
    }

    let cancelled = false
    setStatus(`Loading ${shortAddress(selectedAddress)}`)
    void readJson<{ asset: AssetDetail }>(`/api/assets/${selectedAddress}`, { method: 'GET' })
      .then((data) => {
        if (!cancelled) {
          setDetail(data.asset)
          setStatus(`Viewing ${shortAddress(selectedAddress)}`)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setStatus(error instanceof Error ? error.message : 'Asset detail failed')
        }
      })

    return () => {
      cancelled = true
    }
  }, [selectedAddress])

  const selectedResult = useMemo(
    () => results.find((result) => result.address === selectedAddress) ?? null,
    [results, selectedAddress],
  )

  async function handleSignIn(auth: WalletUiAuthState) {
    if (!wallet || !walletUi.connected || !auth.canSignIn || !walletUi.account) {
      setStatus('Connect a wallet with SIWS support first')
      return
    }

    setBusy(true)
    setStatus('Requesting sign-in nonce')
    try {
      const nonceData = await readJson<{ nonce: string; domain: string; statement: string; uri: string }>(
        '/api/auth/nonce',
        { method: 'POST', body: JSON.stringify({ walletAddress: walletUi.account.address }) },
      )

      const result = await auth.signIn({
        input: {
          domain: nonceData.domain,
          statement: nonceData.statement,
          requestId: nonceData.nonce,
          uri: nonceData.uri,
        },
      })

      await readJson<{ ok: boolean }>('/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({
          accountAddress: result.account.address,
          input: result.input,
          method: result.method,
          signature: Array.from(result.signature),
          signedMessage: Array.from(result.signedMessage),
        }),
      })

      await refreshBootstrap()
      setStatus(`Signed in as ${shortAddress(result.account.address)}`)
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  async function handleLogout() {
    await readJson<{ ok: boolean }>('/api/auth/logout', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    await refreshBootstrap()
    setStatus('Signed out')
  }

  async function savePreset() {
    if (!presetName.trim()) {
      setStatus('Preset name is required')
      return
    }

    await readJson<{ ok: boolean }>('/api/presets', {
      method: 'POST',
      body: JSON.stringify({
        name: presetName.trim(),
        kind: presetKind,
        filters,
      }),
    })
    setPresetName('')
    await refreshPresets()
    setStatus(`Saved ${presetKind}`)
  }

  async function deletePreset(id: number) {
    await readJson<{ ok: boolean }>(`/api/presets/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({}),
    })
    await refreshPresets()
    setStatus('Preset removed')
  }

  async function queueSelectedAsset() {
    if (!selectedResult || !operatorNote.trim()) {
      setStatus('Pick an asset and enter an operator note')
      return
    }

    await readJson<{ ok: boolean }>('/api/operator/queue/batch', {
      method: 'POST',
      body: JSON.stringify({
        items: [
          {
            assetAddress: selectedResult.address,
            assetName: selectedResult.name,
            note: operatorNote.trim(),
            status: 'triage',
            tags: ['manual-review'],
          },
        ],
      }),
    })
    setOperatorNote('')
    await refreshQueue()
    setStatus('Asset routed to operator queue')
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">nightshift build 075</p>
          <h1>AssetOps</h1>
          <p className="lede">
            Wallet-first MPL Core operations console for asset search, saved surveillance, and operator triage.
          </p>
        </div>
        <div className="topbar-actions">
          <div className="status-pill">{status}</div>
          <WalletUiDropdown />
          {bootstrap?.sessionUser ? (
            <button className="action ghost" onClick={() => void handleLogout()}>
              Sign out
            </button>
          ) : wallet ? (
            <WalletUiAuth wallet={wallet}>
              {(authState) => (
                <button
                  className="action"
                  disabled={busy || !walletUi.connected || !authState.canSignIn}
                  onClick={() => void handleSignIn(authState)}
                >
                  {busy ? 'Working…' : 'Sign in with Solana'}
                </button>
              )}
            </WalletUiAuth>
          ) : (
            <button className="action" disabled>
              Connect wallet to sign in
            </button>
          )}
        </div>
      </header>

      <section className="hero-grid">
        <article className="hero-panel">
          <div className="hero-copy">
            <span>operator-first</span>
            <span>cross-collection</span>
            <span>plugin inspection</span>
            <span>durable watchlists</span>
          </div>
          <div className="runtime-grid">
            <div>
              <label>session</label>
              <strong>{bootstrap?.sessionUser ? shortAddress(bootstrap.sessionUser.walletAddress) : 'signed out'}</strong>
            </div>
            <div>
              <label>role</label>
              <strong>{isOperator ? 'operator' : 'observer'}</strong>
            </div>
            <div>
              <label>rpc</label>
              <strong>{bootstrap?.runtime.rpcUrl.replace(/^https?:\/\//, '') ?? 'loading'}</strong>
            </div>
            <div>
              <label>build</label>
              <strong>{bootstrap?.runtime.build ?? '075'}</strong>
            </div>
          </div>
        </article>

        <article className="hero-panel dense">
          <div className="panel-header">
            <h2>Search sweep</h2>
            <button className="action" disabled={busy} onClick={() => void runSearch()}>
              Run
            </button>
          </div>
          <div className="form-grid">
            <label>
              owner
              <input
                value={filters.owner}
                onChange={(event) => setFilters((current) => ({ ...current, owner: event.target.value }))}
                placeholder="wallet address"
              />
            </label>
            <label>
              collection
              <input
                value={filters.collection}
                onChange={(event) => setFilters((current) => ({ ...current, collection: event.target.value }))}
                placeholder="collection address"
              />
            </label>
            <label>
              update authority
              <input
                value={filters.updateAuthority}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, updateAuthority: event.target.value }))
                }
                placeholder="authority address"
              />
            </label>
            <label>
              name contains
              <input
                value={filters.name}
                onChange={(event) => setFilters((current) => ({ ...current, name: event.target.value }))}
                placeholder="optional text filter"
              />
            </label>
            <label>
              limit
              <input
                type="number"
                min={1}
                max={100}
                value={filters.limit}
                onChange={(event) =>
                  setFilters((current) => ({ ...current, limit: Number(event.target.value) || 30 }))
                }
              />
            </label>
          </div>
        </article>
      </section>

      <main className="content-grid">
        <section className="left-column">
          <article className="panel">
            <div className="panel-header">
              <h2>Saved sweeps</h2>
              <span>{presets.length}</span>
            </div>
            {bootstrap?.sessionUser ? (
              <>
                <div className="save-row">
                  <input
                    value={presetName}
                    onChange={(event) => setPresetName(event.target.value)}
                    placeholder="watchlist or preset name"
                  />
                  <select
                    value={presetKind}
                    onChange={(event) => setPresetKind(event.target.value as 'preset' | 'watchlist')}
                  >
                    <option value="preset">preset</option>
                    <option value="watchlist">watchlist</option>
                  </select>
                </div>
                <button className="action wide" onClick={() => void savePreset()}>
                  Save current query
                </button>
                <div className="preset-list">
                  {presets.map((preset) => (
                    <div key={preset.id} className="preset-card">
                      <button
                        className="preset-open"
                        onClick={() => {
                          setFilters(preset.filters)
                          void runSearch(preset.filters)
                        }}
                      >
                        <strong>{preset.name}</strong>
                        <span>{preset.kind}</span>
                      </button>
                      <button className="mini" onClick={() => void deletePreset(preset.id)}>
                        delete
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="empty">Sign in to persist watchlists and saved sweeps.</p>
            )}
          </article>

          <article className={clsx('panel', !isOperator && 'muted-panel')}>
            <div className="panel-header">
              <h2>Operator queue</h2>
              <span>{queue.length}</span>
            </div>
            {isOperator ? (
              <>
                <textarea
                  value={operatorNote}
                  onChange={(event) => setOperatorNote(event.target.value)}
                  placeholder="route the selected asset for manual review, tagging, or owner outreach"
                  rows={4}
                />
                <button className="action wide" onClick={() => void queueSelectedAsset()}>
                  Queue selected asset
                </button>
                <div className="queue-list">
                  {queue.map((item) => (
                    <div key={item.id} className="queue-card">
                      <strong>{item.assetName ?? shortAddress(item.assetAddress)}</strong>
                      <p>{item.note}</p>
                      <div className="meta-row">
                        <span>{item.status}</span>
                        <span>{shortAddress(item.actorWalletAddress)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="empty">Operator tools unlock when the signed-in wallet is allowlisted on the server.</p>
            )}
          </article>
        </section>

        <section className="results-column">
          <article className="panel">
            <div className="panel-header">
              <h2>Result stream</h2>
              <span>{results.length}</span>
            </div>
            <div className="results-list">
              {results.map((result) => (
                <button
                  key={result.address}
                  className={clsx('result-row', selectedAddress === result.address && 'active')}
                  onClick={() => setSelectedAddress(result.address)}
                >
                  <div>
                    <strong>{result.name || 'Unnamed asset'}</strong>
                    <p>{result.address}</p>
                  </div>
                  <div className="result-meta">
                    <span>{result.collectionAddress ? 'collection' : result.authorityType}</span>
                    <span>{result.hasPlugins ? 'plugins' : 'plain'}</span>
                  </div>
                </button>
              ))}
              {!results.length && <p className="empty">Run an owner, collection, or authority search to start.</p>}
            </div>
          </article>
        </section>

        <section className="detail-column">
          <article className="panel detail-panel">
            <div className="panel-header">
              <h2>Asset detail</h2>
              <div className="segmented">
                <button
                  className={clsx(viewMode === 'decoded' && 'active')}
                  onClick={() => setViewMode('decoded')}
                >
                  decoded
                </button>
                <button className={clsx(viewMode === 'raw' && 'active')} onClick={() => setViewMode('raw')}>
                  raw
                </button>
              </div>
            </div>
            {detail && selectedResult ? (
              <>
                <div className="detail-summary">
                  <div>
                    <label>asset</label>
                    <strong>{selectedResult.name}</strong>
                  </div>
                  <div>
                    <label>owner</label>
                    <strong>{shortAddress(selectedResult.owner)}</strong>
                  </div>
                  <div>
                    <label>authority</label>
                    <strong>{selectedResult.authorityType}</strong>
                  </div>
                  <div>
                    <label>plugins</label>
                    <strong>{detail.registry.length}</strong>
                  </div>
                </div>
                <div className="registry-strip">
                  {detail.registry.length ? (
                    detail.registry.map((entry, index) => (
                      <span key={`${entry.pluginType}-${index}`}>
                        {entry.pluginType}:{entry.authorityType}
                      </span>
                    ))
                  ) : (
                    <span>no plugin registry entries</span>
                  )}
                </div>
                <pre className="json-view">
                  {viewMode === 'decoded'
                    ? JSON.stringify(detail.decoded, null, 2)
                    : JSON.stringify({ accountBase64: detail.accountBase64 }, null, 2)}
                </pre>
              </>
            ) : (
              <p className="empty">Select an asset to inspect decoded account state and raw bytes.</p>
            )}
          </article>
        </section>
      </main>
    </div>
  )
}

export default App
