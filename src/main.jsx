import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

/* Design system — load order is intentional */
import './styles/tokens.css'
import './styles/themes.css'
import './styles/globals.css'
import './styles/animations.css'

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
