import { useEffect, useRef, useState } from 'react'
import { projects } from '../content/projects'
import { site } from '../content/site'
import { useStore } from '../store'
import { ASSISTANT_NAME, answer, buildIndex, type Answer } from './brain'
import { canListen, canSpeak, listen, speak, stopListening, stopSpeaking } from './voice'
import './assistant.css'

const index = buildIndex(projects, site)
const CHIPS = ['What does Arseni do?', 'AI agent projects?', 'Experience with .NET?', "What's his tech stack?", 'Any 3D work?', 'How can I contact him?']

type Msg = { from: 'you' | 'alfred'; text: string; refs?: Answer['refs'] }

const reducedMotion = () => {
  try {
    return matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

// Small inline icons: universally readable symbols instead of abstract glyphs.
const icon = { width: 15, height: 15, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
const SpeakerOn = () => (
  <svg {...icon}>
    <path d="M11 5 6 9H3v6h3l5 4z" />
    <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />
  </svg>
)
const SpeakerOff = () => (
  <svg {...icon}>
    <path d="M11 5 6 9H3v6h3l5 4z" />
    <path d="m16 9 5 6M21 9l-5 6" />
  </svg>
)
const Mic = () => (
  <svg {...icon}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
)

/** Terminal-style typing: characters appear left to right behind a blinking cursor. */
function Typed({ text }: { text: string }) {
  const [shown, setShown] = useState(() => (reducedMotion() ? text.length : 0))
  useEffect(() => {
    if (shown >= text.length) return
    const id = window.setTimeout(() => setShown((n) => Math.min(text.length, n + Math.max(2, Math.ceil(text.length / 60)))), 14)
    return () => clearTimeout(id)
  }, [shown, text])
  return (
    <p aria-label={text}>
      {text.slice(0, shown)}
      {shown < text.length && <span className="cursor" aria-hidden />}
    </p>
  )
}

/** Chat with the robot desk frog: retrieval over the portfolio, optional voice in and out. */
export function AssistantPanel() {
  const { assistantOpen, setAssistantOpen, robot, setRobot, openProject } = useStore()
  const [msgs, setMsgs] = useState<Msg[]>(() => [{ from: 'alfred', ...answer(index, '') }])
  const [input, setInput] = useState('')
  const [voiceOn, setVoiceOn] = useState(canSpeak)
  const [error, setError] = useState('')
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

  if (!assistantOpen) return null

  const ask = (text: string) => {
    const q = text.trim()
    if (!q) return
    setInput('')
    setError('')
    setRobot('thinking')
    const a = answer(index, q)
    setMsgs((m) => [...m, { from: 'you', text: q }, { from: 'alfred', ...a }])
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
    <aside className="alfred" role="dialog" aria-label={`${ASSISTANT_NAME}, desk assistant`}>
      <header>
        <span className={`alfred-dot ${robot}`} aria-hidden />
        <div className="id">
          <span className="alfred-title" data-text={ASSISTANT_NAME.toUpperCase()}>
            {ASSISTANT_NAME.toUpperCase()}<span className="alfred-static" aria-hidden />
          </span>
          <span className="alfred-sys">sys_ver 1.0 // loc 52.4069N 16.9299E</span>
          <span className={`alfred-status ${robot}`}>{status}</span>
        </div>
        {canSpeak && (
          <button
            className="voice-toggle"
            onClick={() => (stopSpeaking(), setVoiceOn((v) => !v))}
            aria-pressed={voiceOn}
            title={voiceOn ? `${ASSISTANT_NAME} reads answers aloud — click to mute` : 'Answers are text only — click to hear them'}
          >
            {voiceOn ? <SpeakerOn /> : <SpeakerOff />}
            <span>{voiceOn ? 'Voice on' : 'Voice off'}</span>
          </button>
        )}
        <button onClick={() => setAssistantOpen(false)} aria-label={`Close ${ASSISTANT_NAME}`}>
          ✕
        </button>
      </header>

      <div className="alfred-log" aria-live="polite" ref={log}>
        {msgs.map((m, i) => {
          const latest = i === msgs.length - 1
          return (
            <div key={i} className={`msg from-${m.from}${latest ? ' fresh' : ''}`}>
              {m.from === 'alfred' && latest ? <Typed text={m.text} /> : <p>{m.text}</p>}
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
          placeholder={canListen ? 'Type, or press Talk and just ask…' : "Ask about Arseni's work…"}
          aria-label="Your question"
          maxLength={300}
          autoFocus
        />
        {canListen && (
          <button
            type="button"
            className={robot === 'listening' ? 'mic on' : 'mic'}
            onClick={onMic}
            title={robot === 'listening' ? 'Listening — click to stop' : `Talk to ${ASSISTANT_NAME} out loud`}
          >
            <Mic />
            <span>{robot === 'listening' ? 'Listening…' : 'Talk'}</span>
          </button>
        )}
        <button type="submit" aria-label="Send">
          ▶
        </button>
      </form>
    </aside>
  )
}
