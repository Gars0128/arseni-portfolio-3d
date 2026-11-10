import { create } from 'zustand'
import { track } from './track'

// The track is local-only (public/music is git-ignored: commercial music can't be published).
const SRC = `${import.meta.env.BASE_URL}music/track.mp3`
export const TRACK = { title: 'I Love You', artist: 'Fontaines D.C.' }

/** One shared <audio>; the 3D scene routes it through a positional source between the speakers. */
export const audioEl = new Audio()
audioEl.preload = 'metadata'
audioEl.loop = true

/** Set by the scene once Web Audio is wired, so play() can resume the context inside the click. */
export const audioCtx: { resume?: () => Promise<void> } = {}

type MusicState = {
  available: boolean
  playing: boolean
  time: number
  duration: number
  volume: number
  toggle: () => void
  seek: (t: number) => void
  setVolume: (v: number) => void
}

export const useMusic = create<MusicState>((set, get) => ({
  available: false,
  playing: false,
  time: 0,
  duration: 0,
  volume: 0.7,
  toggle: () => {
    if (!get().available) return
    if (audioEl.paused) {
      track('play')
      void audioCtx.resume?.()
      void audioEl.play()
    } else audioEl.pause()
  },
  seek: (t) => (audioEl.currentTime = t),
  setVolume: (v) => {
    audioEl.volume = v
    set({ volume: v })
  },
}))

audioEl.volume = useMusic.getState().volume
audioEl.addEventListener('play', () => useMusic.setState({ playing: true }))
audioEl.addEventListener('pause', () => useMusic.setState({ playing: false }))
audioEl.addEventListener('timeupdate', () => useMusic.setState({ time: audioEl.currentTime }))
audioEl.addEventListener('loadedmetadata', () => useMusic.setState({ duration: audioEl.duration, available: true }))

fetch(SRC, { method: 'HEAD' })
  // the dev server answers unknown paths with index.html, so check the type too
  .then((r) => r.ok && !r.headers.get('content-type')?.includes('html') && (audioEl.src = SRC))
  .catch(() => {})
