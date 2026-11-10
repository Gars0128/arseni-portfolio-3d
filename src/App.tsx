import { Canvas } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import { Experience } from './scene/Experience'
import { useStore } from './store'

export default function App() {
  const { mode, pixel, setMode, togglePixel } = useStore()
  const [ready, setReady] = useState(false)
  // Low-res render + CSS nearest-neighbour upscale = the pixel look. Monitor mode stays sharp.
  const lowRes = pixel && mode === 'room'
  const dpr = lowRes ? 0.35 : Math.min(window.devicePixelRatio, 2)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMode('room')
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setMode])

  return (
    <>
      <Canvas
        className={lowRes ? 'scene pixel' : 'scene'}
        dpr={dpr}
        shadows
        camera={{ fov: 45, near: 0.05, far: 30, position: [-1.1, 1.6, 1.5] }}
        onCreated={() => setReady(true)}
      >
        <Experience />
      </Canvas>

      <div className={ready ? 'boot done' : 'boot'}>booting…</div>

      <div className="hud">
        {mode === 'monitor' ? (
          <button onClick={() => setMode('room')}>← Back to room</button>
        ) : (
          <span className="hint">click the monitor</span>
        )}
        <button onClick={togglePixel} aria-pressed={pixel}>
          pixel: {pixel ? 'on' : 'off'}
        </button>
        <a href="?lite">2D version</a>
      </div>
    </>
  )
}
