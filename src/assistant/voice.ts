// Browser-native voice for the desk assistant: Web Speech API for listening, speechSynthesis for talking. Free, no downloads.
// Firefox has no SpeechRecognition — the UI hides the mic there and the assistant stays text-only.

type Recognition = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  abort: () => void
}
type RecognitionCtor = new () => Recognition

const Ctor = (window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor })
const SR = Ctor.SpeechRecognition ?? Ctor.webkitSpeechRecognition

export const canListen = !!SR
export const canSpeak = typeof speechSynthesis !== 'undefined'

let active: Recognition | null = null

/** Listen for one English utterance. Resolves with the transcript, or '' if nothing was heard. */
export function listen(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!SR) return reject(new Error('Speech recognition is not supported in this browser.'))
    active?.abort()
    const r = new SR()
    active = r
    r.lang = 'en-US'
    r.interimResults = false
    r.maxAlternatives = 1
    let heard = ''
    r.onresult = (e) => (heard = e.results[0]?.[0]?.transcript ?? '')
    r.onerror = (e) => (e.error === 'no-speech' || e.error === 'aborted' ? resolve('') : reject(new Error(e.error)))
    r.onend = () => {
      active = null
      resolve(heard)
    }
    r.start()
  })
}

export const stopListening = () => active?.abort()

/**
 * The most human-sounding British voice available: Edge's neural "Natural" voices first,
 * then Google UK, then any en-GB, then any English voice.
 */
function pickVoice() {
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en'))
  return (
    voices.find((v) => v.lang === 'en-GB' && /natural/i.test(v.name) && /ryan|thomas|oliver|george|male/i.test(v.name)) ??
    voices.find((v) => v.lang === 'en-GB' && /natural/i.test(v.name)) ??
    voices.find((v) => /google uk english male/i.test(v.name)) ??
    voices.find((v) => /natural/i.test(v.name)) ??
    voices.find((v) => v.lang === 'en-GB') ??
    voices[0]
  )
}

/** What to say out loud: links and e-mails are read as words, list markup is dropped. */
export function toSpeech(text: string) {
  return text
    .replace(/https?:\/\/(www\.)?linkedin\.com\S*/gi, 'his LinkedIn profile')
    .replace(/https?:\/\/(www\.)?github\.com\S*/gi, 'GitHub')
    .replace(/https?:\/\/\S+/gi, 'the link on screen')
    .replace(/\S+@\S+\.\w+/g, 'the e-mail address on screen')
    .replace(/•/g, '')
    .replace(/\n+/g, '. ')
    .replace(/\s+—\s+/g, ', ')
}

export function speak(text: string, onStart: () => void, onEnd: () => void) {
  if (!canSpeak) return onEnd()
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(toSpeech(text))
  const v = pickVoice()
  if (v) u.voice = v
  u.lang = v?.lang ?? 'en-GB'
  // natural pace and pitch: warm, not robotic
  u.rate = 0.98
  u.pitch = 1
  u.onstart = onStart
  u.onend = onEnd
  u.onerror = onEnd
  speechSynthesis.speak(u)
}

export const stopSpeaking = () => canSpeak && speechSynthesis.cancel()
