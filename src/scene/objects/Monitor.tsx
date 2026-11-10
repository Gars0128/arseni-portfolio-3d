import { Html } from '@react-three/drei'
import { Desktop } from '../../screen/Desktop'
import { useScreenSaverTexture } from '../../screen/ScreenSaver'
import { useStore } from '../../store'
import { Box, Interactive } from '../util'

export const SCREEN = { position: [0.5, 1.13, -1.8] as const, w: 0.68, h: 0.385 }
const CSS_WIDTH = 1280

/**
 * The HTML mini-OS mapped onto a w×h world-space screen facing +z.
 * DOM always draws over the canvas, so it is mounted only in monitor mode, where nothing stands in front of the screen.
 */
export function ScreenHtml({ w, h, z = 0.015 }: { w: number; h: number; z?: number }) {
  const px = w / CSS_WIDTH
  return (
    // drei <Html transform>: 1 CSS px = distanceFactor / 400 world units
    <Html transform distanceFactor={px * 400} position-z={z}>
      <div className="os" style={{ width: CSS_WIDTH, height: h / px }}>
        <Desktop />
      </div>
    </Html>
  )
}

/** Room-mode screen: the project screensaver as a texture, so objects in front of it occlude it properly. */
function SaverScreen({ hovered }: { hovered: boolean }) {
  const tex = useScreenSaverTexture(hovered)
  return (
    <mesh position-z={0.0136}>
      <planeGeometry args={[SCREEN.w, SCREEN.h]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
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
          {mode === 'monitor' ? (
            <>
              <mesh position-z={0.0135}>
                <planeGeometry args={[SCREEN.w, SCREEN.h]} />
                <meshBasicMaterial color="#1d2a3a" />
              </mesh>
              <ScreenHtml w={SCREEN.w} h={SCREEN.h} />
            </>
          ) : (
            <SaverScreen hovered={hovered} />
          )}
          {/* silver stand */}
          <Box size={[0.2, 0.14, 0.02]} position={[0, 0, -0.022]} color="#c9c9cd" metalness={0.7} roughness={0.35} />
          <Box size={[0.06, 0.3, 0.025]} position={[0, -0.22, -0.042]} color="#c9c9cd" metalness={0.7} roughness={0.35} />
          <Box size={[0.25, 0.012, 0.19]} position={[0, -0.364, -0.01]} color="#c9c9cd" metalness={0.7} roughness={0.35} />
        </group>
      )}
    </Interactive>
  )
}
