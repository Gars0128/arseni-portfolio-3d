import { useState } from 'react'
import { getConsent, setConsent, trackingAvailable } from './track'

/** Short opt-in for anonymous visit stats; details only on demand. Nothing is sent unless accepted. */
export function ConsentBanner() {
  const [open, setOpen] = useState(() => trackingAvailable && getConsent() === null)
  const [policy, setPolicy] = useState(false)
  if (!open) return null

  const answer = (v: 'yes' | 'no') => {
    setConsent(v)
    setOpen(false)
  }

  return (
    <div className="consent" role="region" aria-label="Privacy">
      <p>
        This site counts visits anonymously.{' '}
        <button className="link" onClick={() => setPolicy((p) => !p)} aria-expanded={policy}>
          Privacy policy
        </button>
      </p>
      {policy && (
        <p className="policy">
          With your consent, a random ID is stored in this browser (no cookies) so return visits can be told apart from new ones. Sent: country,
          referring site, device type and which parts of the room you opened. Never collected: IP address, name, anything you type to Kero.
          Decline and nothing is sent.
        </p>
      )}
      <div>
        <button onClick={() => answer('yes')}>Accept</button>
        <button className="ghost" onClick={() => answer('no')}>
          Decline
        </button>
      </div>
    </div>
  )
}
