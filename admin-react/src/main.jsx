import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// When this app runs as the tickets iframe on the landing page, report our real
// content height to the parent so it can size the iframe. This removes the
// nested-scroll trap on mobile (the single biggest booking-funnel friction:
// ~95% of traffic is mobile/Instagram). Same-origin only; the parent clamps with
// a floor so this can never shrink the widget below its current default.
// Standalone /admin/?tickets=true is NOT embedded, so it is unaffected.
if (window.parent !== window.self) {
  document.documentElement.classList.add('embedded')
  let last = 0
  const report = () => {
    const h = document.documentElement.scrollHeight
    if (Math.abs(h - last) < 8) return
    last = h
    try {
      window.parent.postMessage({ type: 'lacasita:ticket-height', height: h }, window.location.origin)
    } catch (_e) { /* cross-origin or detached — ignore, parent keeps default height */ }
  }
  window.addEventListener('load', report)
  if ('ResizeObserver' in window) new ResizeObserver(report).observe(document.documentElement)
  setTimeout(report, 300)
  setInterval(report, 1500) // safety net for late-loading images / async content
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
