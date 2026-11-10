// Self-check for api/notify.ts: run with `node scripts/test-notify.ts` (part of `npm run check`).
import assert from 'node:assert/strict'
import { POST } from '../api/notify.ts'

const sent: string[] = []
globalThis.fetch = (async (_url: string, init: { body: string }) => {
  sent.push(JSON.parse(init.body).text)
  return new Response('{}')
}) as unknown as typeof fetch

const req = (body: unknown, origin = 'https://arseni-portfolio-3d.vercel.app', country = 'PL') =>
  new Request('https://arseni-portfolio-3d.vercel.app/api/notify', {
    method: 'POST',
    headers: { origin, 'x-vercel-ip-country': country, 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })

const cases: [string, () => Promise<void>][] = [
  ['silent without a token', async () => {
    delete process.env.TELEGRAM_BOT_TOKEN
    assert.equal((await POST(req({ type: 'visit' }))).status, 204)
    assert.equal(sent.length, 0)
    process.env.TELEGRAM_BOT_TOKEN = 'test'
    process.env.TELEGRAM_CHAT_ID = '1'
  }],
  ['visit becomes a readable message', async () => {
    assert.equal((await POST(req({ type: 'visit', vid: 'a3f9c2d1', n: 1, daysSince: -1, ref: 'www.linkedin.com', device: 'desktop', lang: 'pl' }))).status, 204)
    assert.match(sent.at(-1)!, /Visitor #a3f9c2d1 · 🆕 first visit/)
    assert.match(sent.at(-1)!, /🇵🇱 PL · from www\.linkedin\.com · 🖥 desktop · pl/)
  }],
  ['same visitor coming back is recognised', async () => {
    await POST(req({ type: 'visit', vid: 'a3f9c2d1', n: 3, daysSince: 2 }))
    assert.match(sent.at(-1)!, /Visitor #a3f9c2d1 · 🔁 returning · visit 3 · last seen 2 days ago/)
  }],
  ['a forged visitor id is not echoed', async () => {
    await POST(req({ type: 'visit', vid: '<img src=x>', n: 'lots' }))
    assert.match(sent.at(-1)!, /Visitor #unknown · 🆕 first visit/)
  }],
  ['rejects other origins', async () => {
    assert.equal((await POST(req({ type: 'visit' }, 'https://evil.example'))).status, 403)
  }],
  ['drops unknown or malicious actions, counts repeats', async () => {
    const before = sent.length
    await POST(req({ type: 'summary', vid: 'a3f9c2d1', seconds: 192, actions: ['cv', 'kero_ask', 'kero_ask', '<script>', 'project:agentic-ticket-workflow', 'rm -rf'] }))
    assert.equal(sent.length, before + 1)
    const msg = sent.at(-1)!
    assert.match(msg, /Visitor #a3f9c2d1/)
    assert.match(msg, /3m 12s/)
    assert.match(msg, /read the CV/)
    assert.match(msg, /asked Kero ×2/)
    assert.match(msg, /project: agentic-ticket-workflow/)
    assert.doesNotMatch(msg, /script|rm -rf/)
  }],
  ['rejects oversized bodies and junk', async () => {
    assert.equal((await POST(req('x'.repeat(5000)))).status, 413)
    assert.equal((await POST(req('{not json'))).status, 400)
    assert.equal((await POST(req({ type: 'nope' }))).status, 400)
  }],
  ['never forwards a spoofed referrer with markup', async () => {
    await POST(req({ type: 'visit', ref: '<b>hi</b>' }))
    assert.match(sent.at(-1)!, / direct /)
  }],
]

let failed = 0
for (const [name, fn] of cases) {
  try {
    await fn()
  } catch (e) {
    failed++
    console.error(`x ${name}: ${(e as Error).message}`)
  }
}
if (failed) process.exit(1)
console.log(`ok: ${cases.length} notify checks passed`)
