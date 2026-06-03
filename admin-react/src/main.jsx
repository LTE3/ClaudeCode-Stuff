import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config/supabase'

const newId = (p) => {
  try { return crypto.randomUUID() } catch (_e) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 10) }
}

// Persistent visitor id — set here too (not just on the landing page) so a tagged
// ad that deep-links straight to the booking app still attributes the resulting
// RSVP/purchase. useClaimFreeTicket / useCheckout read this same key.
function ensureVisitorId() {
  try {
    let v = localStorage.getItem('lacasita_vid')
    if (!v) { v = newId('v_'); localStorage.setItem('lacasita_vid', v) }
    return v
  } catch (_e) { return null }
}
const visitorId = ensureVisitorId()

const embedded = window.parent !== window.self

if (embedded) {
  // Embedded as the tickets iframe on the landing page: report real content height
  // so the parent sizes the iframe and removes the mobile nested-scroll trap.
  // Same-origin only; parent clamps with a floor so it can never collapse.
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
} else {
  // Standalone hit (e.g. a tagged ad deep-link to /admin/?tickets=true&date=...).
  // The landing page logs its own page_view; log ONE here for direct booking-app
  // visits so ad clicks that skip the homepage are still tracked with their UTMs.
  // Shares the 'lacasita_viewed' session flag with the landing to avoid double counts.
  try {
    const p = new URLSearchParams(window.location.search)
    const isTicketing = p.has('tickets') || p.has('date')
    if (isTicketing && !sessionStorage.getItem('lacasita_viewed')) {
      let sid = sessionStorage.getItem('lacasita_sid')
      if (!sid) { sid = newId('s_'); sessionStorage.setItem('lacasita_sid', sid) }
      fetch(`${SUPABASE_URL}/rest/v1/page_views`, {
        method: 'POST',
        headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({
          page: window.location.pathname,
          referrer: document.referrer || null,
          visitor_id: visitorId,
          session_id: sid,
          utm_source: p.get('utm_source'),
          utm_medium: p.get('utm_medium'),
          utm_campaign: p.get('utm_campaign'),
          utm_content: p.get('utm_content'),
        }),
      }).catch(() => {})
      sessionStorage.setItem('lacasita_viewed', '1')
    }
  } catch (_e) { /* tracking is best-effort, never block the app */ }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
