import { create } from 'zustand'

type Mode = 'room' | 'monitor'

type State = {
  mode: Mode
  pixel: boolean
  lampOn: boolean
  setMode: (mode: Mode) => void
  togglePixel: () => void
  toggleLamp: () => void
}

export const useStore = create<State>((set) => ({
  // shareable deep link straight into the monitor: /#monitor
  mode: location.hash === '#monitor' ? 'monitor' : 'room',
  pixel: true,
  lampOn: true,
  setMode: (mode) => set({ mode }),
  togglePixel: () => set((s) => ({ pixel: !s.pixel })),
  toggleLamp: () => set((s) => ({ lampOn: !s.lampOn })),
}))
