import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Suspended from './components/Suspended.jsx'
import { SITE_SUSPENDED } from './config/site.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {SITE_SUSPENDED ? <Suspended /> : <App />}
  </StrictMode>,
)
