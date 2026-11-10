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

/** Portrait monitor with a scrolling fake terminal drawn on a canvas. */
export function SideMonitor() {
  const { canvas, tex } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 192
    canvas.height = 320
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    return { canvas, tex }
  }, [])
  const state = useRef({ t: 0, line: 0 })

  useFrame((_, dt) => {
    const s = state.current
    s.t += dt
    if (s.t < 0.45) return
    s.t = 0
    s.line++
    const c = canvas.getContext('2d')!
    c.fillStyle = '#10161c'
    c.fillRect(0, 0, 192, 320)
    c.font = '11px Courier New'
    for (let i = 0; i < 22; i++) {
      const text = CODE[(s.line + i) % CODE.length]
      c.fillStyle = text.startsWith('$') ? '#e8894a' : text.startsWith('>') ? '#9ccf8a' : '#c9d4dc'
      c.fillText(text, 8, 16 + i * 14)
    }
    tex.needsUpdate = true
  })

  return (
    <group position={[-0.06, 1.24, -1.8]} rotation-y={0.28}>
      <Box size={[0.36, 0.6, 0.025]} color="#151515" />
      <mesh position-z={0.0135}>
        <planeGeometry args={[0.33, 0.57]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <Box size={[0.04, 0.06, 0.03]} position={[0, -0.32, -0.02]} color="#1a1a1a" />
    </group>
  )
}
