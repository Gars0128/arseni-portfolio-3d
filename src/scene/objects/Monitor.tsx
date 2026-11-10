import { Html } from '@react-three/drei'
import { Desktop } from '../../screen/Desktop'
import { useStore } from '../../store'
import { Box, Interactive } from '../util'

export const SCREEN = { position: [0.45, 1.17, -1.84] as const, w: 0.64, h: 0.37 }
// drei <Html transform>: 1 CSS px = distanceFactor / 400 world units.
const PX = 0.0005
const DISTANCE_FACTOR = PX * 400

export function Monitor() {
  const mode = useStore((s) => s.mode)
  const setMode = useStore((s) => s.setMode)
  const [x, y, z] = SCREEN.position
  return (
    <Interactive label="monitor" disabled={mode === 'monitor'} onSelect={() => setMode('monitor')}>
      <group position={[x, y, z]}>
        <Box size={[SCREEN.w + 0.03, SCREEN.h + 0.03, 0.025]} color="#151515" />
        <mesh position-z={0.0135}>
          <planeGeometry args={[SCREEN.w, SCREEN.h]} />
          <meshBasicMaterial color="#1d2a3a" />
        </mesh>
        {/* glowing light bar */}
        <Box size={[0.42, 0.018, 0.03]} position={[0, SCREEN.h / 2 + 0.03, 0.01]} color="#222" emissive="#ffb070" emissiveIntensity={0.6} />
        <Box size={[0.04, 0.16, 0.03]} position={[0, -0.25, -0.03]} color="#1a1a1a" />
        <Box size={[0.22, 0.012, 0.14]} position={[0, -0.28, -0.02]} color="#1a1a1a" />
        <Html
          transform
          distanceFactor={DISTANCE_FACTOR}
          position-z={0.015}
          pointerEvents={mode === 'monitor' ? 'auto' : 'none'}
          className="screen-html"
        >
          <div className="os" style={{ width: SCREEN.w / PX, height: SCREEN.h / PX }}>
            <Desktop />
          </div>
        </Html>
      </group>
    </Interactive>
  )
}
