import { Html } from '@react-three/drei'
import { Desktop } from '../../screen/Desktop'
import { ScreenSaver } from '../../screen/ScreenSaver'
import { useStore } from '../../store'
import { Box, Interactive } from '../util'

export const SCREEN = { position: [0.55, 1.22, -1.8] as const, w: 0.62, h: 0.355 }
const CSS_WIDTH = 1280

/** The HTML mini-OS (or the project screensaver) mapped onto a w×h world-space screen facing +z. */
export function ScreenHtml({ w, h, hovered, z = 0.015 }: { w: number; h: number; hovered: boolean; z?: number }) {
  const mode = useStore((s) => s.mode)
  const px = w / CSS_WIDTH
  return (
    <Html
      transform
      // drei <Html transform>: 1 CSS px = distanceFactor / 400 world units
      distanceFactor={px * 400}
      position-z={z}
      pointerEvents={mode === 'monitor' ? 'auto' : 'none'}
    >
      <div className="os" style={{ width: CSS_WIDTH, height: h / px }}>
        {mode === 'monitor' ? <Desktop /> : <ScreenSaver hovered={hovered} />}
      </div>
    </Html>
  )
}

export function Monitor() {
  const mode = useStore((s) => s.mode)
  const setMode = useStore((s) => s.setMode)
  const [x, y, z] = SCREEN.position
  return (
    <Interactive label="monitor" disabled={mode === 'monitor'} onSelect={() => setMode('monitor')}>
      {(hovered) => (
        <group position={[x, y, z]}>
          <Box size={[SCREEN.w + 0.03, SCREEN.h + 0.03, 0.025]} color="#151515" />
          <mesh position-z={0.0135}>
            <planeGeometry args={[SCREEN.w, SCREEN.h]} />
            <meshBasicMaterial color="#1d2a3a" />
          </mesh>
          {/* glowing light bar */}
          {/* silver stand */}
          <Box size={[0.2, 0.14, 0.02]} position={[0, 0, -0.022]} color="#c9c9cd" metalness={0.7} roughness={0.35} />
          <Box size={[0.06, 0.33, 0.025]} position={[0, -0.29, -0.05]} color="#c9c9cd" metalness={0.7} roughness={0.35} />
          <Box size={[0.25, 0.012, 0.19]} position={[0, -0.454, -0.01]} color="#c9c9cd" metalness={0.7} roughness={0.35} />
          <ScreenHtml w={SCREEN.w} h={SCREEN.h} hovered={hovered} />
        </group>
      )}
    </Interactive>
  )
}
