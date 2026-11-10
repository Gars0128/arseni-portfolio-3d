import { useEffect, useRef, useState } from 'react'
import { projects } from '../content/projects'
import { site } from '../content/site'
import { useStore } from '../store'
import { answer, buildIndex, type Answer } from './brain'
import { canListen, canSpeak, listen, speak, stopListening, stopSpeaking } from './voice'
import './assistant.css'

const index = buildIndex(projects, site)
const CHIPS = ['What does Arseni do?', 'AI agent projects?', 'Experience with .NET?', "What's his tech stack?", 'Any 3D work?', 'How can I contact him?']
const GLYPHS = '!<>-_\\/[]{}—=+*^?#01ABCDEF'

type Msg = { from: 'you' | 'alfred'; text: string; refs?: Answer['refs'] }

const reducedMotion = () => {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/** Text that "decodes" in: unrevealed characters flicker as random glyphs, then lock in left to right. */
function Decode({ text }: { text: string }) {
  const [shown, setShown] = useState(() => (reducedMotion() ? text.length : 0))
  useEffect(() => {
    if (shown >= text.length) return
    const id = window.setTimeout(() => setShown((n) => Math.min(text.length, n + Math.max(3, Math.ceil(text.length / 45)))), 16)
    return () => clearTimeout(id)
  }, [shown, text])
  const done = shown >= text.length
  const tail = done
    ? ''
    : // pseudo-random glyph per position that changes with progress, so it flickers without impure renders
      Array.from(text.slice(shown, shown + 14), (ch, k) => (/\s/.test(ch) ? ch : GLYPHS[(k * 7 + shown * 13) % GLYPHS.length])).join('')
  return (
    <p aria-label={text}>
      {text.slice(0, shown)}
      {tail}
      {!done && <span className="cursor" aria-hidden />}
    </p>
  )
}

/** Chat with Alfred, the desk robot: retrieval over the portfolio, optional voice in and out. */
export function AssistantPanel() {
  const { assistantOpen, setAssistantOpen, robot, setRobot, openProject } = useStore()
  const [msgs, setMsgs] = useState<Msg[]>(() => [{ from: 'alfred', ...answer(index, '') }])
  const [input, setInput] = useState('')
  const [voiceOn, setVoiceOn] = useState(canSpeak)
  const [error, setError] = useState('')
  const [jolt, setJolt] = useState(false)
  const log = useRef<HTMLDivElement>(null)

  // scroll only the message list (scrollIntoView would also scroll the panel and hide its header)
  useEffect(() => {
    const el = log.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [msgs, assistantOpen])
  useEffect(() => {
    if (assistantOpen) return
    stopListening()
    stopSpeaking()
    setRobot('idle')
  }, [assistantOpen, setRobot])
  useEffect(() => {
    if (!jolt) return
    const id = window.setTimeout(() => setJolt(false), 200)
    return () => clearTimeout(id)
  }, [jolt])

  if (!assistantOpen) return null

  const ask = (text: string) => {
    const q = text.trim()
    if (!q) return
    setInput('')
    setError('')
    setRobot('thinking')
    const a = answer(index, q)
    setMsgs((m) => [...m, { from: 'you', text: q }, { from: 'alfred', ...a }])
    setJolt(true)
    if (voiceOn) speak(a.text, () => setRobot('speaking'), () => setRobot('idle'))
    else window.setTimeout(() => setRobot('idle'), 600)
  }

  const onMic = async () => {
    if (robot === 'listening') return stopListening()
    stopSpeaking()
    setError('')
    setRobot('listening')
    try {
      const heard = await listen()
      if (heard) ask(heard)
      else {
        setRobot('idle')
        setError("Didn't catch that — try again or type")
      }
    } catch (e) {
      setRobot('idle')
      setError((e as Error).message === 'not-allowed' ? 'Microphone access blocked' : 'Voice input failed — type instead')
    }
  }

  const status = robot === 'listening' ? 'listening…' : robot === 'speaking' ? 'transmitting…' : robot === 'thinking' ? 'scanning archive…' : 'online · portfolio data only'

  return (
    <aside className={jolt ? 'alfred jolt' : 'alfred'} role="dialog" aria-label="Alfred, desk assistant">
      <span className="hud-corner tl" aria-hidden />
      <span className="hud-corner br" aria-hidden />
      <header>
        <span className={`alfred-dot ${robot}`} aria-hidden />
        <div className="id">
          <span className="alfred-title" data-text="ALFRED">
            ALFRED
          </span>
          <span className="alfred-sys">sys_ver 1.0 // loc 52.4069N 16.9299E</span>
          <span className={`alfred-status ${robot}`}>{status}</span>
        </div>
        {canSpeak && (
          <button onClick={() => (stopSpeaking(), setVoiceOn((v) => !v))} aria-pressed={voiceOn} title="Read answers aloud" aria-label="Read answers aloud">
            {voiceOn ? '◉' : '○'}
          </button>
        )}
        <button onClick={() => setAssistantOpen(false)} aria-label="Close Alfred">
          ✕
        </button>
      </header>

      <div className="alfred-log" aria-live="polite" ref={log}>
        {msgs.length > 1 && <div className="alfred-sweep" key={msgs.length} aria-hidden />}
        {msgs.map((m, i) => {
          const latest = i === msgs.length - 1
          return (
            <div key={i} className={`msg from-${m.from}${latest ? ' fresh' : ''}`}>
              {m.from === 'alfred' && latest ? <Decode text={m.text} /> : <p>{m.text}</p>}
              {!!m.refs?.length && (
                <div className="refs">
                  {m.refs.map((r) => (
                    <button key={r.slug} onClick={() => (setAssistantOpen(false), openProject(r.slug))}>
                      ▸ open “{r.title}”
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="alfred-chips">
        {CHIPS.map((c) => (
          <button key={c} onClick={() => ask(c)}>
            {c}
          </button>
        ))}
      </div>

      {error && <p className="alfred-error">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault()
          ask(input)
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.stopPropagation()}
          placeholder="query arseni's work_"
          aria-label="Your question"
          maxLength={300}
          autoFocus
        />
        {canListen && (
          <button type="button" className={robot === 'listening' ? 'mic on' : 'mic'} onClick={onMic} aria-label={robot === 'listening' ? 'Stop listening' : 'Ask by voice'}>
            ◎
          </button>
        )}
        <button type="submit" aria-label="Send">
          ▶
        </button>
      </form>
    </aside>
  )
}
