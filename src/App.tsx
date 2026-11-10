import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect } from 'react'
import { Experience } from './scene/Experience'
import { useStore } from './store'

export default function App() {
  const { mode, setMode, loaded } = useStore()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMode('room')
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setMode])

  return (
    <>
      <Canvas className="scene" dpr={[1, 2]} shadows camera={{ fov: 45, near: 0.05, far: 40, position: [-0.55, 1.55, 1.35] }}>
        <Suspense fallback={null}>
          <Experience />
        </Suspense>
      </Canvas>

      <div className={loaded ? 'boot done' : 'boot'}>booting…</div>

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
