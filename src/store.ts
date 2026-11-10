import { create } from 'zustand'

type Mode = 'room' | 'monitor'

type State = {
  mode: Mode
  lampOn: boolean
  loaded: boolean
  setMode: (mode: Mode) => void
  toggleLamp: () => void
  setLoaded: () => void
}

export const useStore = create<State>((set) => ({
  // shareable deep link straight into the monitor: /#monitor
  mode: location.hash === '#monitor' ? 'monitor' : 'room',
  lampOn: true,
  loaded: false,
  setMode: (mode) => set({ mode }),
  toggleLamp: () => set((s) => ({ lampOn: !s.lampOn })),
  setLoaded: () => set({ loaded: true }),
}))
