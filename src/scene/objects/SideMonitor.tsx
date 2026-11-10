import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Box } from '../util'

const CODE = `$ npm run dev
  VITE ready in 312 ms
> agent.run(transcript)
  extract ........ ok
  retrieve_spec .. ok
  classify ....... 3 conflicts
  write_stories .. ok
  critic ......... pass
> awaiting human review
$ git push origin main
  deploy: success
def sway(t): return sin(t)
const room = useRoom()
SELECT * FROM coffee;
$ pytest -q
  42 passed in 1.8s`.split('\n')

/** Canvas texture with a scrolling fake terminal. */
export function useTerminalTexture(width = 192, height = 320, fontPx = 11) {
  const { canvas, tex } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return { canvas, tex }
  }, [width, height])
  const state = useRef({ t: 1, line: 0 })

  useFrame((_, dt) => {
    const s = state.current
    s.t += dt
    if (s.t < 0.45) return
    s.t = 0
    s.line++
    const c = canvas.getContext('2d')!
    c.fillStyle = '#10161c'
    c.fillRect(0, 0, width, height)
    c.font = `${fontPx}px Courier New`
    const rows = Math.floor((height - 8) / (fontPx * 1.3))
    for (let i = 0; i < rows; i++) {
      const text = CODE[(s.line + i) % CODE.length]
      c.fillStyle = text.startsWith('$') ? '#e8894a' : text.startsWith('>') ? '#9ccf8a' : '#c9d4dc'
      c.fillText(text, 8, 6 + fontPx + i * fontPx * 1.3)
    }
    tex.needsUpdate = true
  })
  return tex
}

/** Portrait monitor showing the terminal. */
export function SideMonitor() {
  const tex = useTerminalTexture()

  return (
    <group position={[-0.2, 1.2, -1.68]} rotation-y={0.38}>
      <Box size={[0.36, 0.62, 0.025]} color="#151515" />
      <mesh position-z={0.0135}>
        <planeGeometry args={[0.34, 0.6]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {/* silver stand */}
      <Box size={[0.06, 0.3, 0.025]} position={[0, -0.24, -0.04]} color="#c9c9cd" metalness={0.7} roughness={0.35} />
      <Box size={[0.24, 0.012, 0.19]} position={[0, -0.434, -0.01]} color="#c9c9cd" metalness={0.7} roughness={0.35} />
    </group>
  )
}
