import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  WalletUi,
  createSolanaDevnet,
  createWalletUiConfig,
} from '@wallet-ui/react'
import App from './App'
import './index.css'

const walletConfig = createWalletUiConfig({
  clusters: [createSolanaDevnet()],
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WalletUi config={walletConfig}>
      <App />
    </WalletUi>
  </StrictMode>,
)
