import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import { AssistantPanel } from './assistant/AssistantPanel'
import { Experience } from './scene/Experience'
import { LED_COLORS, useStore } from './store'

export default function App() {
  const { mode, setMode, loaded, night, toggleNight, led, setLed } = useStore()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMode('room')
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setMode])

  return (
    <>
      <Canvas className="scene" dpr={[1, 2]} shadows camera={{ fov: 45, near: 0.05, far: 40, position: [-0.85, 1.7, 1.45] }}>
        <Suspense fallback={null}>
          <Experience />
        </Suspense>
      </Canvas>

      <div className={loaded ? 'boot done' : 'boot'}>booting…</div>

      <AssistantPanel />

      <div className="hud">
        {mode === 'monitor' ? (
          <button onClick={() => setMode('room')}>← Back to room</button>
        ) : (
          <span className="hint">click the monitor or ask the frog · drag to look around</span>
        )}
        {mode === 'room' && (
          <div className="controls">
            <div className="swatches" role="group" aria-label="LED colour">
              {LED_COLORS.map((c) => (
                <button
                  key={c}
                  className={c === led ? 'swatch on' : 'swatch'}
                  style={{ background: c === 'rainbow' ? 'conic-gradient(red, yellow, lime, cyan, blue, magenta, red)' : c }}
                  onClick={() => setLed(c)}
                  aria-label={c === 'rainbow' ? 'Rainbow LED' : `LED ${c}`}
                  aria-pressed={c === led}
                />
              ))}
            </div>
            <button className="daynight" onClick={toggleNight} aria-label={night ? 'Switch to day' : 'Switch to night'}>
              {night ? '☀ day' : '☾ night'}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
