import { create } from 'zustand'

type Mode = 'room' | 'monitor'

type State = {
  mode: Mode
  lampOn: boolean
  setMode: (mode: Mode) => void
  toggleLamp: () => void
}

export const useStore = create<State>((set) => ({
  // shareable deep link straight into the monitor: /#monitor
  mode: location.hash === '#monitor' ? 'monitor' : 'room',
  lampOn: true,
  setMode: (mode) => set({ mode }),
  toggleLamp: () => set((s) => ({ lampOn: !s.lampOn })),
}))
