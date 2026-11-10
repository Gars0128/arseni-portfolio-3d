import { useMemo } from 'react'
import * as THREE from 'three'
import { deskmatTexture, laminateTexture, plasterTexture, rugTexture, woodTexture } from './textures'
import { Box } from './util'

const METAL = '#1e1e20'
const LEATHER = '#1b1c1f'
// back wall spans x ∈ [-2, 3.4]; window hole x ∈ [2.25, 3.05], y ∈ [0.85, 2.55]
const WALL_PIECES: [number, number, number, number][] = [
  [-2, 2.25, 0, 2.8],
  [3.05, 3.4, 0, 2.8],
  [2.25, 3.05, 0, 0.85],
  [2.25, 3.05, 2.55, 2.8],
]

function Wall({ x0, x1, y0, y1 }: { x0: number; x1: number; y0: number; y1: number }) {
  const tex = useMemo(() => {
    const t = plasterTexture().clone()
    t.repeat.set((x1 - x0) / 1.3, (y1 - y0) / 1.3)
    return t
  }, [x0, x1, y0, y1])
  return (
    <mesh position={[(x0 + x1) / 2, (y0 + y1) / 2, -2]}>
      <planeGeometry args={[x1 - x0, y1 - y0]} />
      <meshStandardMaterial map={tex} roughness={0.95} />
    </mesh>
  )
}

/** Blanket draped over the seat: flat on top, then hanging over the front edge with soft wrinkles. */
function useDrapeGeometry() {
  return useMemo(() => {
    const g = new THREE.PlaneGeometry(0.52, 0.8, 16, 32)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i)
      const t = p.getY(i) + 0.4 // 0..0.8 along the blanket
      const wrinkle = Math.sin(x * 40 + t * 6) * 0.008
      if (t < 0.44) p.setXYZ(i, x, 0.012 + wrinkle * 0.5, 0.22 - t)
      else {
        const d = t - 0.44
        p.setXYZ(i, x * (1 + d * 0.15), -d + wrinkle, -0.22 - 0.03 * Math.sin(d * 4) + Math.abs(wrinkle) * 2)
      }
    }
    g.computeVertexNormals()
    return g
  }, [])
}

/** Static set dressing modelled on the real room: walls, floor, desk, desk items, chair. */
export function Room() {
  const drape = useDrapeGeometry()
  const keys = Array.from({ length: 61 }, (_, i) => i)

  return (
    <group>
      {/* shell */}
      <mesh rotation-x={-Math.PI / 2} position={[0.7, 0, -0.5]}>
        <planeGeometry args={[6, 5]} />
        <meshStandardMaterial map={laminateTexture()} roughness={0.45} />
      </mesh>
      {WALL_PIECES.map(([x0, x1, y0, y1]) => (
        <Wall key={`${x0}${y0}`} x0={x0} x1={x1} y0={y0} y1={y1} />
      ))}
      <mesh position={[3.4, 1.4, -0.5]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[5, 2.8]} />
        <meshStandardMaterial map={plasterTexture()} roughness={0.95} />
      </mesh>
      <mesh position={[0.7, 2.8, -0.5]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[6, 5]} />
        <meshStandardMaterial color="#e8e0d2" roughness={1} />
      </mesh>
      <Box size={[5.4, 0.07, 0.015]} position={[0.7, 0.035, -1.99]} color="#f0ece4" />

      {/* desk: light wood top on a black loft frame */}
      <Box size={[2, 0.035, 0.72]} position={[0.45, 0.742, -1.63]} color="#ffffff" map={woodTexture()} roughness={0.55} />
      {[-0.52, 1.42].map((x) => (
        <group key={x} position-x={x}>
          {[-1.95, -1.31].map((z) => (
            <Box key={z} size={[0.04, 0.72, 0.04]} position={[0, 0.36, z]} color={METAL} metalness={0.4} roughness={0.5} />
          ))}
          <Box size={[0.03, 0.03, 0.64]} position={[0, 0.7, -1.63]} color={METAL} metalness={0.4} roughness={0.5} />
          <Box size={[0.03, 0.03, 0.64]} position={[0, 0.12, -1.63]} color={METAL} metalness={0.4} roughness={0.5} />
        </group>
      ))}
      <Box size={[1.94, 0.03, 0.03]} position={[0.45, 0.7, -1.95]} color={METAL} metalness={0.4} roughness={0.5} />

      {/* desk mat */}
      <mesh position={[0.62, 0.761, -1.6]} rotation-x={-Math.PI / 2} userData={{ noShadow: true }} receiveShadow>
        <planeGeometry args={[1.55, 0.56]} />
        <meshStandardMaterial map={deskmatTexture()} roughness={0.7} />
      </mesh>

      {/* studio speakers */}
      {(
        [
          [-0.42, -1.86, 0.3],
          [1.22, -1.82, -0.25],
        ] as const
      ).map(([x, z, ry]) => (
        <group key={x} position={[x, 0.76 + 0.13, z]} rotation-y={ry}>
          <Box size={[0.16, 0.26, 0.2]} radius={0.015} color="#141416" roughness={0.6} />
          <mesh position={[0, -0.03, 0.101]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.058, 0.058, 0.004, 32]} />
            <meshStandardMaterial color="#2a2a2e" roughness={0.9} />
          </mesh>
          <mesh position={[0, -0.03, 0.104]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.022, 0.03, 0.006, 24]} />
            <meshStandardMaterial color="#555" metalness={0.6} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.08, 0.102]} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.02, 0.02, 0.004, 24]} />
            <meshStandardMaterial color="#3a3a3e" metalness={0.5} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* 60% keyboard: white case, white alphas, dark mods, green Esc, painted spacebar */}
      <group position={[0.5, 0.775, -1.47]}>
        <Box size={[0.3, 0.025, 0.105]} radius={0.006} color="#f2f0ea" roughness={0.4} />
        <instancedMesh
          args={[undefined, undefined, keys.length]}
          ref={(m) => {
            if (!m) return
            const mat = new THREE.Matrix4()
            const white = new THREE.Color('#f4f2ee'), dark = new THREE.Color('#2a2a2c'), green = new THREE.Color('#b7d39a')
            const s = new THREE.Vector3(), q = new THREE.Quaternion(), p = new THREE.Vector3()
            const rows = [14, 14, 13, 12, 8]
            let i = 0
            rows.forEach((n, row) => {
              for (let k = 0; k < n; k++) {
                const isSpace = row === 4 && k === 3
                const wide = isSpace ? 6 : row > 0 && (k === 0 || k === n - 1) ? 1.6 : 1
                const x = -0.135 + (k + (row === 4 && k > 3 ? 5 : 0)) * 0.0195 + (wide - 1) * 0.009 + (row === 4 ? 0 : row * 0.004)
                p.set(x, 0.017, -0.04 + row * 0.019)
                s.set(wide, 1, 1)
                m.setMatrixAt(i, mat.compose(p, q, s))
                const mod = row === 4 ? !isSpace : k === 0 || k === n - 1
                m.setColorAt(i, row === 0 && k === 0 ? green : mod ? dark : white)
                i++
              }
            })
            m.count = i
          }}
        >
          <boxGeometry args={[0.017, 0.012, 0.017]} />
          <meshStandardMaterial roughness={0.5} />
        </instancedMesh>
      </group>

      {/* mouse with purple glow */}
      <group position={[0.86, 0.775, -1.5]}>
        <mesh scale={[0.031, 0.018, 0.055]}>
          <sphereGeometry args={[1, 20, 14]} />
          <meshStandardMaterial color="#141416" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.002, 0.004]} rotation-x={-Math.PI / 2} userData={{ noShadow: true }}>
          <ringGeometry args={[0.028, 0.038, 32, 1, Math.PI * 0.1, Math.PI * 0.8]} />
          <meshBasicMaterial color="#b46bff" toneMapped={false} />
        </mesh>
        <pointLight position={[0, 0.03, 0]} intensity={0.25} distance={0.4} color="#a060ff" />
      </group>

      {/* headphones lying on the desk */}
      <group position={[-0.28, 0.79, -1.4]} rotation={[Math.PI / 2 - 0.15, 0, 0.5]}>
        <mesh>
          <torusGeometry args={[0.085, 0.012, 10, 32, Math.PI]} />
          <meshStandardMaterial color="#18181a" roughness={0.5} />
        </mesh>
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[sd * 0.085, -0.01, 0]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.045, 0.045, 0.035, 24]} />
            <meshStandardMaterial color="#1f1f22" roughness={0.45} />
          </mesh>
        ))}
      </group>

      {/* teal glass */}
      <mesh position={[-0.03, 0.82, -1.52]} userData={{ noShadow: true }}>
        <cylinderGeometry args={[0.036, 0.03, 0.12, 24, 1, true]} />
        <meshStandardMaterial color="#3fa59a" transparent opacity={0.55} roughness={0.08} metalness={0.1} side={THREE.DoubleSide} />
      </mesh>

      {/* rug */}
      <mesh rotation-x={-Math.PI / 2} rotation-z={0.03} position={[1.1, 0.004, -0.75]} userData={{ noShadow: true }} receiveShadow>
        <planeGeometry args={[2.2, 1.5]} />
        <meshStandardMaterial map={rugTexture()} roughness={1} />
      </mesh>

      {/* office chair with a draped blanket */}
      <group position={[1.95, 0, -0.95]} rotation-y={2.3}>
        {[0, 1, 2, 3, 4].map((i) => (
          <group key={i} rotation-y={(i * Math.PI * 2) / 5}>
            <Box size={[0.035, 0.03, 0.28]} position={[0, 0.065, 0.14]} color="#18181a" metalness={0.5} roughness={0.4} />
            <mesh position={[0, 0.025, 0.27]}>
              <sphereGeometry args={[0.024, 12, 8]} />
              <meshStandardMaterial color="#111" roughness={0.3} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.022, 0.03, 0.36, 12]} />
          <meshStandardMaterial color="#222" metalness={0.8} roughness={0.3} />
        </mesh>
        <Box size={[0.52, 0.09, 0.5]} radius={0.04} position={[0, 0.47, 0]} color={LEATHER} roughness={0.55} />
        <Box size={[0.48, 0.7, 0.08]} radius={0.04} position={[0, 0.9, 0.24]} rotation-x={-0.1} color={LEATHER} roughness={0.55} />
        {[-1, 1].map((s) => (
          <group key={s}>
            <Box size={[0.03, 0.2, 0.03]} position={[s * 0.27, 0.6, 0.05]} color="#18181a" />
            <Box size={[0.06, 0.035, 0.3]} radius={0.015} position={[s * 0.27, 0.71, 0.02]} color="#18181a" roughness={0.5} />
          </group>
        ))}
        <mesh geometry={drape} position={[0, 0.515, 0]} userData={{ noShadow: true }} castShadow>
          <meshStandardMaterial color="#9fb2b4" roughness={1} side={THREE.DoubleSide} />
        </mesh>
        {/* folded red blanket on the armrest */}
        <Box size={[0.12, 0.08, 0.34]} radius={0.035} position={[0.27, 0.77, 0.0]} rotation-z={-0.15} color="#a3302a" roughness={1} />
      </group>
    </group>
  )
}
