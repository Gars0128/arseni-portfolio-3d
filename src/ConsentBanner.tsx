import { useState } from 'react'
import { getConsent, setConsent, trackingAvailable } from './track'

/** Opt-in for anonymous visit stats. Shown once; nothing is sent unless the visitor says yes. */
export function ConsentBanner() {
  const [open, setOpen] = useState(() => trackingAvailable && getConsent() === null)
  if (!open) return null
  const answer = (v: 'yes' | 'no') => {
    setConsent(v)
    setOpen(false)
  }
  return (
    <div className="consent" role="region" aria-label="Visit statistics">
      <p>
        <strong>Mind if I count your visit?</strong> Anonymous: country, where you came from and what you opened in the room. A random ID in
        this browser lets me tell a return visit from a new one. No cookies, no IP, nothing you type.
      </p>
      <div>
        <button onClick={() => answer('yes')}>Sure</button>
        <button className="ghost" onClick={() => answer('no')}>
          No thanks
        </button>
      </div>
    </div>
  )
}
