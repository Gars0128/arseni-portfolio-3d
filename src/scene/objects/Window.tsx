import { useMemo } from 'react'
import * as THREE from 'three'
import { Box } from '../util'

const WIN = { x: 2.65, y: 1.7, w: 0.8, h: 1.7 }
const FRAME = '#f2f0ea'

/** Pleated curtain: a dense plane folded with sine waves; the fold depth fades toward the rod. */
function Curtain({ x, width }: { x: number; width: number }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, 2.72, 48, 12)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) / width + 0.5
      const v = p.getY(i) / 2.72 + 0.5
      p.setZ(i, Math.sin(u * Math.PI * 9) * 0.035 + Math.sin(u * Math.PI * 23) * 0.006 * (1 - v) + (1 - v) * 0.02)
    }
    g.computeVertexNormals()
    return g
  }, [width])
  return (
    <mesh geometry={geo} position={[x, 1.39, -1.9]}>
      <meshStandardMaterial color="#76797d" roughness={0.95} side={THREE.DoubleSide} />
    </mesh>
  )
}

export function Window() {
  const sky = useMemo(() => {
    const el = document.createElement('canvas')
    el.width = 64
    el.height = 256
    const c = el.getContext('2d')!
    const g = c.createLinearGradient(0, 0, 0, 256)
    g.addColorStop(0, '#2a3a66')
    g.addColorStop(0.55, '#6a7aa8')
    g.addColorStop(0.85, '#d9a08a')
    g.addColorStop(1, '#f0c49a')
    c.fillStyle = g
    c.fillRect(0, 0, 64, 256)
    const t = new THREE.CanvasTexture(el)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])

  const { x, y, w, h } = WIN
  return (
    <group>
      {/* dusk sky behind the glass */}
      <mesh position={[x, y, -2.05]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={sky} toneMapped={false} />
      </mesh>
      {/* reveal (wall depth) */}
      <Box size={[0.04, h, 0.12]} position={[x - w / 2 - 0.02, y, -2.0]} color="#e6dccc" />
      <Box size={[0.04, h, 0.12]} position={[x + w / 2 + 0.02, y, -2.0]} color="#e6dccc" />
      <Box size={[w + 0.08, 0.04, 0.12]} position={[x, y + h / 2 + 0.02, -2.0]} color="#e6dccc" />
      {/* frame + mullions */}
      {[-w / 2, 0, w / 2].map((dx) => (
        <Box key={dx} size={[0.05, h, 0.06]} position={[x + dx, y, -2.0]} color={FRAME} roughness={0.4} />
      ))}
      {[-h / 2, h * 0.18, h / 2].map((dy) => (
        <Box key={dy} size={[w, 0.05, 0.06]} position={[x, y + dy, -2.0]} color={FRAME} roughness={0.4} />
      ))}
      {/* glass */}
      <mesh position={[x, y, -1.985]} userData={{ noShadow: true }}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#cfe0ff" transparent opacity={0.12} roughness={0.05} metalness={0.2} />
      </mesh>
      {/* sill */}
      <Box size={[w + 0.2, 0.03, 0.2]} position={[x, y - h / 2 - 0.02, -1.93]} color={FRAME} roughness={0.35} />
      {/* radiator */}
      <group position={[x, 0.45, -1.95]}>
        {Array.from({ length: 12 }, (_, i) => (
          <Box key={i} size={[0.05, 0.5, 0.07]} position-x={(i - 5.5) * 0.062} color="#efede8" roughness={0.35} />
        ))}
        <Box size={[0.76, 0.03, 0.04]} position={[0, 0.2, 0]} color="#e2e0db" />
        <Box size={[0.76, 0.03, 0.04]} position={[0, -0.2, 0]} color="#e2e0db" />
      </group>
      {/* curtain rod + curtain */}
      <mesh position={[2.2, 2.76, -1.88]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.012, 0.012, 1.7, 10]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.35} />
      </mesh>
      <Curtain x={1.88} width={0.62} />
      {/* cool light from outside */}
      <pointLight position={[x, y, -1.7]} intensity={0.9} distance={4} color="#9fb4ff" decay={1.5} />
    </group>
  )
}
