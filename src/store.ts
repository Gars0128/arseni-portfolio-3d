import { create } from 'zustand'

type Mode = 'room' | 'monitor'

/** LED palette borrowed from the reference room's TV / stream-deck glow; 'rainbow' animates along the arc. */
export const LED_COLORS = ['#ff115e', '#ff6700', '#0082ff', '#af55cf', '#dbd85d', 'rainbow'] as const
export type LedColor = (typeof LED_COLORS)[number]

type State = {
  mode: Mode
  night: boolean
  led: LedColor
  loaded: boolean
  setMode: (mode: Mode) => void
  toggleNight: () => void
  setLed: (led: LedColor) => void
  nextLed: () => void
  setLoaded: () => void
}

export const useStore = create<State>((set) => ({
  // shareable deep link straight into the monitor: /#monitor
  mode: location.hash === '#monitor' ? 'monitor' : 'room',
  night: true,
  led: '#ff115e',
  loaded: false,
  setMode: (mode) => set({ mode }),
  toggleNight: () => set((s) => ({ night: !s.night })),
  setLed: (led) => set({ led }),
  nextLed: () => set((s) => ({ led: LED_COLORS[(LED_COLORS.indexOf(s.led) + 1) % LED_COLORS.length] })),
  setLoaded: () => set({ loaded: true }),
}))
