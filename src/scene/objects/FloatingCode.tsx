import { Float } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'
import { useStore } from '../../store'

const SNIPPETS: { lines: string[]; color: string; pos: [number, number, number] }[] = [
  { lines: ['graph.add_edge(', '  "classify", "write")'], color: '#9ccf8a', pos: [-0.45, 1.62, -1.25] },
  { lines: ['useFrame((_, dt) =>', '  fan.rotation.z -= dt)'], color: '#8ab8e8', pos: [1.05, 1.68, -1.15] },
  { lines: ['public async Task', '  Run() => await go();'], color: '#c9a0e8', pos: [0.2, 1.75, -1.05] },
  { lines: ['SELECT mood', 'FROM room;'], color: '#e8c38a', pos: [-0.8, 1.35, -0.9] },
]

/** Text drawn to a canvas once: no font downloads, one draw call per snippet. */
function Snippet({ lines, color }: { lines: string[]; color: string }) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 256
    c.height = 64
    const ctx = c.getContext('2d')!
    ctx.font = 'bold 22px Courier New'
    ctx.fillStyle = color
    lines.forEach((l, i) => ctx.fillText(l, 4, 26 + i * 26))
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [lines, color])
  return (
    <mesh userData={{ noShadow: true }}>
      <planeGeometry args={[0.44, 0.11]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} depthWrite={false} />
    </mesh>
  )
}

export function FloatingCode() {
  const visible = useStore((s) => s.mode === 'room')
  return (
    <group visible={visible}>
      {SNIPPETS.map((s, i) => (
        <Float key={i} position={s.pos} speed={1 + i * 0.3} rotationIntensity={0.3} floatIntensity={0.6}>
          <Snippet {...s} />
        </Float>
      ))}
    </group>
  )
}
