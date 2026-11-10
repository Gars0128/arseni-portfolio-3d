import { Canvas } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import { Experience } from './scene/Experience'
import { useStore } from './store'

export default function App() {
  const { mode, setMode } = useStore()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMode('room')
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setMode])

  return (
    <>
      <Canvas
        className="scene"
        dpr={[1, 2]}
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
          <span className="hint">hover the computer · drag to look around</span>
        )}
      </div>
    </>
  )
}
