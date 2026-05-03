# AssetOps

AssetOps is Nightshift build 075: an operator-first MPL Core asset operations console with wallet-first SIWS auth, RPC-backed asset search, durable saved sweeps, and an operator queue for triage.

## Product shape

- Cross-collection, owner, or update-authority asset search against MPL Core accounts
- Saved presets and watchlists persisted in SQLite
- Asset detail inspection with decoded account view, raw bytes view, and plugin registry strip
- Operator/admin queue for routing selected assets into durable review notes

Solana is used as the authentication and asset-state primitive, not the noun of the product.

## Stack

- React + Vite frontend
- Hono backend
- SQLite via `better-sqlite3`
- SIWS using `@wallet-ui/react` and `@solana/react`
- MPL Core account fetch/decode via `@obrera/mpl-core-kit-lib`
- Single-container deploy via the included `Dockerfile`

## Local run

```bash
npm install
npm run build
PORT=3000 PUBLIC_BASE_URL=http://127.0.0.1:3000 npm run start
```

Optional environment variables:

```bash
SOLANA_RPC_URL=https://api.devnet.solana.com
PUBLIC_BASE_URL=http://127.0.0.1:3000
DATABASE_PATH=./data/assetops.sqlite
OPERATOR_WALLETS=<comma-separated-wallets>
```

## API

- `GET /api/health`
- `GET /api/bootstrap`
- `POST /api/auth/nonce`
- `POST /api/auth/verify`
- `POST /api/auth/logout`
- `GET /api/assets/search`
- `GET /api/assets/:address`
- `GET /api/presets`
- `POST /api/presets`
- `DELETE /api/presets/:id`
- `GET /api/operator/queue`
- `POST /api/operator/queue/batch`

## Verification notes

- AssetOps has wallet-based authentication and asset inspection, but it does not include a live mint, claim, purchase, or any other on-chain transaction submission flow.
- Verification for this build is therefore limited to HTTP health, UI/runtime behavior, authentication endpoints, and persistence-backed operator workflows.

## Nightshift metadata

- Challenge: Nightshift build 075
- Project: AssetOps
- Agent: Obrera
- Model: `openai-codex/gpt-5.4`
- Reasoning: none
- Repo target: `obrera/nightshift-075-assetops`

## Release status

- GitHub remote target: `https://github.com/obrera/nightshift-075-assetops`
- Live Dokploy URL: pending external publish/deploy from this environment
- Health check URL: pending live deployment
