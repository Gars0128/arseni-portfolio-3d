import { useEffect, useRef, useState } from 'react'
import { projects } from '../content/projects'
import { site } from '../content/site'
import { useStore } from '../store'
import { answer, buildIndex, type Answer } from './brain'
import { canListen, canSpeak, listen, speak, stopListening, stopSpeaking } from './voice'
import './assistant.css'

const index = buildIndex(projects, site)
const CHIPS = ['What does Arseni do?', 'AI agent projects?', 'Experience with .NET?', "What's his tech stack?", 'Any 3D work?', 'How can I contact him?']

type Msg = { from: 'you' | 'alfred'; text: string; refs?: Answer['refs'] }

/** Chat with Alfred, the desk robot: retrieval over the portfolio, optional voice in and out. */
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
        setError("I didn't catch that — try again or type your question.")
      }
    } catch (e) {
      setRobot('idle')
      setError((e as Error).message === 'not-allowed' ? 'Microphone access was blocked.' : 'Voice input failed — please type instead.')
    }
  }

  return (
    <aside className="alfred" role="dialog" aria-label="Alfred, desk assistant">
      <header>
        <span className={`alfred-dot ${robot}`} aria-hidden />
        <div>
          <strong>Alfred</strong>
          <small>{robot === 'listening' ? 'listening…' : robot === 'speaking' ? 'speaking…' : 'answers from this portfolio only'}</small>
        </div>
        {canSpeak && (
          <button onClick={() => (stopSpeaking(), setVoiceOn((v) => !v))} aria-pressed={voiceOn} title="Read answers aloud">
            {voiceOn ? '🔊' : '🔈'}
          </button>
        )}
        <button onClick={() => setAssistantOpen(false)} aria-label="Close Alfred">
          ✕
        </button>
      </header>

      <div className="alfred-log" aria-live="polite" ref={log}>
        {msgs.map((m, i) => (
          <div key={i} className={`msg from-${m.from}`}>
            <p>{m.text}</p>
            {!!m.refs?.length && (
              <div className="refs">
                {m.refs.map((r) => (
                  <button key={r.slug} onClick={() => (setAssistantOpen(false), openProject(r.slug))}>
                    Open “{r.title}” →
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
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
          placeholder="Ask about Arseni's work…"
          aria-label="Your question"
          maxLength={300}
          autoFocus
        />
        {canListen && (
          <button type="button" className={robot === 'listening' ? 'mic on' : 'mic'} onClick={onMic} aria-label={robot === 'listening' ? 'Stop listening' : 'Ask by voice'}>
            🎙
          </button>
        )}
        <button type="submit" aria-label="Send">
          ➤
        </button>
      </form>
    </aside>
  )
}
