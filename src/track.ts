// Anonymous visit notifications (no cookies, no IPs, no chat text).
// The browser sends a "visit" ping on arrival and a short summary of actions when the tab is hidden/closed.
// Disabled on localhost and in any browser that once opened the site with ?notrack (the owner).

const KEY = 'notrack'
const optedOut = (() => {
  try {
    if (new URLSearchParams(location.search).has(KEY)) localStorage.setItem(KEY, '1')
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
})()
const enabled = !optedOut && !/^(localhost|127\.|192\.168\.)/.test(location.hostname)

const actions: string[] = []
const started = Date.now()
let summarySent = false

function send(body: object, beacon = false) {
  const data = JSON.stringify(body)
  try {
    if (beacon && navigator.sendBeacon) navigator.sendBeacon('/api/notify', new Blob([data], { type: 'application/json' }))
    else void fetch('/api/notify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: data, keepalive: true }).catch(() => {})
  } catch {
    /* analytics must never break the page */
  }
}

/** Record a visitor action, e.g. `track('cv')` or `track('project:agentic-ticket-workflow')`. */
export function track(action: string) {
  if (!enabled || actions.length >= 40) return
  // collapse repeats so "asked Kero" ×5 stays one line with a count on the server
  actions.push(action)
}

if (enabled) {
  let firstVisit = true
  try {
    firstVisit = !sessionStorage.getItem('visited')
    sessionStorage.setItem('visited', '1')
  } catch {
    /* storage blocked: treat as a new visit */
  }
  if (firstVisit) {
    let ref = ''
    try {
      ref = document.referrer ? new URL(document.referrer).hostname : ''
    } catch {
      /* malformed referrer */
    }
    send({ type: 'visit', ref, device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop', lang: navigator.language.slice(0, 2) })
  }
  const summary = () => {
    if (summarySent) return
    const seconds = Math.round((Date.now() - started) / 1000)
    if (!actions.length && seconds < 15) return
    summarySent = true
    send({ type: 'summary', seconds, actions }, true)
  }
  addEventListener('pagehide', summary)
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && summary())
}
