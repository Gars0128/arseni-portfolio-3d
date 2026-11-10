// Anonymous visit notifications — only with the visitor's consent (EU ePrivacy: a persistent ID needs opt-in).
// With consent the browser keeps a random ID + visit counter (localStorage) so returning visitors are recognised.
// Never sent: IPs, cookies, chat text. Disabled on localhost and for the owner (open the site once with ?notrack).

const NOTRACK = 'notrack'
const CONSENT = 'stats-consent'
const ID = 'visitor-id'
const VISITS = 'visitor-visits'
const LAST = 'visitor-last'

const store = {
  get: (k: string) => {
    try {
      return localStorage.getItem(k)
    } catch {
      return null
    }
  },
  set: (k: string, v: string) => {
    try {
      localStorage.setItem(k, v)
    } catch {
      /* storage blocked: consent can't be remembered, nothing is sent */
    }
  },
}

if (new URLSearchParams(location.search).has(NOTRACK)) store.set(NOTRACK, '1')
/** Tracking can run at all here (not local dev, not the owner's browser). */
export const trackingAvailable = store.get(NOTRACK) !== '1' && !/^(localhost|127\.|192\.168\.)/.test(location.hostname)

export type Consent = 'yes' | 'no' | null
export const getConsent = (): Consent => (store.get(CONSENT) as Consent) ?? null

const actions: string[] = []
const started = Date.now()
let visitSent = false
let summarySent = false
let vid = ''

function send(body: object, beacon = false) {
  const data = JSON.stringify(body)
  try {
    if (beacon && navigator.sendBeacon) navigator.sendBeacon('/api/notify', new Blob([data], { type: 'application/json' }))
    else void fetch('/api/notify', { method: 'POST', headers: { 'content-type': 'application/json' }, body: data, keepalive: true }).catch(() => {})
  } catch {
    /* analytics must never break the page */
  }
}

/** Record a visitor action, e.g. `track('cv')`. Kept in memory; only sent if the visitor agreed. */
export function track(action: string) {
  if (trackingAvailable && actions.length < 40) actions.push(action)
}

function startVisit() {
  if (visitSent || !trackingAvailable || getConsent() !== 'yes') return
  visitSent = true
  vid = store.get(ID) ?? ''
  if (!/^[a-f0-9]{8}$/.test(vid)) {
    vid = crypto.randomUUID().replace(/-/g, '').slice(0, 8)
    store.set(ID, vid)
  }
  // one visit per browser session; the counter and "last seen" live only in this browser
  let newSession = true
  try {
    newSession = !sessionStorage.getItem('visit-counted')
    sessionStorage.setItem('visit-counted', '1')
  } catch {
    /* treat as a new session */
  }
  if (!newSession) return
  const visits = (Number(store.get(VISITS)) || 0) + 1
  const last = Number(store.get(LAST)) || 0
  store.set(VISITS, String(visits))
  store.set(LAST, String(Date.now()))
  let ref = ''
  try {
    ref = document.referrer ? new URL(document.referrer).hostname : ''
  } catch {
    /* malformed referrer */
  }
  send({
    type: 'visit',
    vid,
    n: visits,
    daysSince: last ? Math.floor((Date.now() - last) / 86_400_000) : -1,
    ref,
    device: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
    lang: navigator.language.slice(0, 2),
  })
}

export function setConsent(value: 'yes' | 'no') {
  store.set(CONSENT, value)
  if (value === 'yes') startVisit()
}

if (trackingAvailable) {
  startVisit()
  const summary = () => {
    if (summarySent || !visitSent) return
    const seconds = Math.round((Date.now() - started) / 1000)
    if (!actions.length && seconds < 15) return
    summarySent = true
    send({ type: 'summary', vid, seconds, actions }, true)
  }
  addEventListener('pagehide', summary)
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && summary())
}
