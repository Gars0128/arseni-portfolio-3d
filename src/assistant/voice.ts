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

/** A light English voice with a raised pitch — the assistant is a small robot frog. */
function pickVoice() {
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en'))
  return (
    voices.find((v) => /daniel|google uk english male|ryan|arthur|george/i.test(v.name)) ??
    voices.find((v) => v.lang === 'en-GB') ??
    voices[0]
  )
}

export function speak(text: string, onStart: () => void, onEnd: () => void) {
  if (!canSpeak) return onEnd()
  speechSynthesis.cancel()
  // bullet lists read badly aloud: speak them as a sentence
  const u = new SpeechSynthesisUtterance(text.replace(/•/g, '').replace(/\n+/g, '. ').replace(/\s+—\s+/g, ': '))
  const v = pickVoice()
  if (v) u.voice = v
  u.lang = v?.lang ?? 'en-GB'
  u.rate = 1.05
  u.pitch = 1.35
  u.onstart = onStart
  u.onend = onEnd
  u.onerror = onEnd
  speechSynthesis.speak(u)
}

export const stopSpeaking = () => canSpeak && speechSynthesis.cancel()
