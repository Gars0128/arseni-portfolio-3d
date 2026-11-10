import { create } from 'zustand'
import { track } from './track'

type Mode = 'room' | 'monitor'
export type RobotState = 'idle' | 'listening' | 'thinking' | 'speaking'

/** LED palette borrowed from the reference room's TV / stream-deck glow; 'rainbow' animates along the arc. */
export const LED_COLORS = ['#ff115e', '#ff6700', '#0082ff', '#af55cf', '#dbd85d', 'rainbow'] as const
export type LedColor = (typeof LED_COLORS)[number]

type State = {
  mode: Mode
  night: boolean
  led: LedColor
  loaded: boolean
  /** project the assistant asked to show; Desktop opens it and clears this */
  pendingProject: string | null
  assistantOpen: boolean
  robot: RobotState
  openProject: (slug: string) => void
  setAssistantOpen: (open: boolean) => void
  setRobot: (robot: RobotState) => void
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
  pendingProject: null,
  assistantOpen: false,
  robot: 'idle',
  openProject: (slug) => {
    track(`project:${slug}`)
    set({ pendingProject: slug, mode: 'monitor' })
  },
  setAssistantOpen: (assistantOpen) => {
    if (assistantOpen) track('kero')
    set({ assistantOpen })
  },
  setRobot: (robot) => set({ robot }),
  setMode: (mode) => {
    if (mode === 'monitor') track('monitor')
    set({ mode })
  },
  toggleNight: () =>
    set((s) => {
      track(s.night ? 'day' : 'night')
      return { night: !s.night }
    }),
  setLed: (led) => {
    track('led')
    set({ led })
  },
  nextLed: () => {
    track('led')
    set((s) => ({ led: LED_COLORS[(LED_COLORS.indexOf(s.led) + 1) % LED_COLORS.length] }))
  },
  setLoaded: () => set({ loaded: true }),
}))
