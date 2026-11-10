// Vercel Function: forwards anonymous visit events to the owner's Telegram.
// Env (set in the Vercel dashboard, never in code): TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.
// Stores nothing, never reads or forwards IPs; country comes from Vercel's geo header.

const ALLOWED_HOSTS = ['arseni-portfolio-3d.vercel.app', 'safeplace-rose.vercel.app']
const ACTION = /^(monitor|cv|contact|music|play|game|terminal|kero|kero_ask|kero_voice|pc|inspect|day|night|led|project:[a-z0-9-]{1,60})$/
const LABEL: Record<string, string> = {
  monitor: '💻 opened the monitor',
  cv: '📄 read the CV',
  contact: '✉️ opened Contact',
  music: '🎧 opened Music',
  play: '▶️ played the track',
  game: '🎮 played Cat Climb',
  terminal: '⌨️ used the terminal',
  kero: '🐸 opened Kero',
  kero_ask: '💬 asked Kero',
  kero_voice: '🎙 talked to Kero by voice',
  pc: '🖥 looked inside the PC',
  inspect: '🔍 inspected objects',
  day: '☀️ switched to day',
  night: '🌙 switched to night',
  led: '🌈 changed the LED colour',
}

const flag = (cc: string) => (/^[A-Z]{2}$/.test(cc) ? String.fromCodePoint(...[...cc].map((c) => 0x1f1a5 + c.charCodeAt(0))) : '🌍')
const clean = (s: unknown, re: RegExp, max: number) => (typeof s === 'string' && re.test(s) ? s.slice(0, max) : '')

function describe(body: Record<string, unknown>, country: string) {
  if (body.type === 'visit') {
    const ref = clean(body.ref, /^[a-z0-9.-]*$/i, 60)
    const device = body.device === 'mobile' ? '📱 mobile' : '🖥 desktop'
    const lang = clean(body.lang, /^[a-z]{2}$/, 2)
    return `👀 New visitor · ${flag(country)} ${country || '??'} · ${ref ? `from ${ref}` : 'direct'} · ${device}${lang ? ` · ${lang}` : ''}`
  }
  if (body.type === 'summary') {
    const seconds = Math.min(Math.max(Number(body.seconds) || 0, 0), 6 * 3600)
    const time = seconds >= 60 ? `${Math.floor(seconds / 60)}m ${seconds % 60}s` : `${seconds}s`
    const list = Array.isArray(body.actions) ? body.actions.slice(0, 40).filter((a): a is string => typeof a === 'string' && ACTION.test(a)) : []
    const counts = new Map<string, number>()
    for (const a of list) counts.set(a, (counts.get(a) ?? 0) + 1)
    const lines = [...counts].map(([a, n]) => {
      const text = a.startsWith('project:') ? `📂 project: ${a.slice(8)}` : LABEL[a]
      return n > 1 ? `${text} ×${n}` : text
    })
    return `🕒 ${flag(country)} visit ended after ${time}${lines.length ? `\n${lines.join('\n')}` : '\n(just looked around)'}`
  }
  return null
}

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chat = process.env.TELEGRAM_CHAT_ID
  if (!token || !chat) return new Response(null, { status: 204 })

  // only accept beacons from the portfolio itself
  const origin = request.headers.get('origin') ?? request.headers.get('referer') ?? ''
  let host = ''
  try {
    host = new URL(origin).hostname
  } catch {
    /* no or malformed origin */
  }
  if (!ALLOWED_HOSTS.includes(host)) return new Response(null, { status: 403 })

  const raw = await request.text()
  if (raw.length > 4000) return new Response(null, { status: 413 })
  let body: Record<string, unknown>
  try {
    body = JSON.parse(raw)
  } catch {
    return new Response(null, { status: 400 })
  }

  const text = describe(body, (request.headers.get('x-vercel-ip-country') ?? '').toUpperCase())
  if (!text) return new Response(null, { status: 400 })

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
  }).catch(() => {})
  return new Response(null, { status: 204 })
}
