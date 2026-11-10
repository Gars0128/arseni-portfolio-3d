import { use, useMemo } from 'react'
import * as THREE from 'three'
import { deskmatTexture, laminateTexture, plasterTexture, rugTexture, woodTexture } from './textures'
import { AssetChair, chairAssetAvailable } from './objects/AssetChair'
import { Chair } from './objects/Chair'
import { Box } from './util'

const METAL = '#1e1e20'
const RIGHT_X = 1.62
// right wall: window hole z ∈ [-1.4, -0.55], y ∈ [0.9, 2.45]  (see objects/Window.tsx)
const RIGHT_PIECES: [number, number, number, number][] = [
  [-2, -1.4, 0, 2.8],
  [-0.55, 2.5, 0, 2.8],
  [-1.4, -0.55, 0, 0.9],
  [-1.4, -0.55, 2.45, 2.8],
]

/** Plaster wall piece. Back wall: u = x. Right wall: u = z (rotated to face -x). */
function Wall({ u0, u1, y0, y1, right }: { u0: number; u1: number; y0: number; y1: number; right?: boolean }) {
  const tex = useMemo(() => {
    const t = plasterTexture().clone()
    t.repeat.set((u1 - u0) / 1.3, (y1 - y0) / 1.3)
    t.offset.set(u0 / 1.3, y0 / 1.3)
    return t
  }, [u0, u1, y0, y1])
  const u = (u0 + u1) / 2, y = (y0 + y1) / 2
  return (
    <mesh position={right ? [RIGHT_X, y, u] : [u, y, -2]} rotation-y={right ? -Math.PI / 2 : 0}>
      <planeGeometry args={[u1 - u0, y1 - y0]} />
      <meshStandardMaterial map={tex} roughness={0.95} />
    </mesh>
  )
}

// 60% ANSI layout, 15u per row: [width-in-u, colour] per key; w = white, d = dark, g = green
const U = 0.019
const ROWS: [number, 'w' | 'd' | 'g'][][] = [
  [[1, 'g'], ...Array.from({ length: 12 }, () => [1, 'w'] as [number, 'w']), [2, 'd']],
  [[1.5, 'd'], ...Array.from({ length: 12 }, () => [1, 'w'] as [number, 'w']), [1.5, 'w']],
  [[1.75, 'd'], ...Array.from({ length: 11 }, () => [1, 'w'] as [number, 'w']), [2.25, 'd']],
  [[2.25, 'd'], ...Array.from({ length: 10 }, () => [1, 'w'] as [number, 'w']), [2.75, 'd']],
  [[1.25, 'd'], [1.25, 'd'], [1.25, 'd'], [6.25, 'w'], [1.25, 'd'], [1.25, 'd'], [1.25, 'd'], [1.25, 'd']],
]
const KEYS = ROWS.flatMap((row, r) => {
  let x = 0
  return row.map(([w, c]) => {
    const k = [x, r, w, c] as const
    x += w
    return k
  })
})

/** Cable as a smooth tube through the given points. */
function Cable({ points, radius = 0.004, color = '#151517' }: { points: [number, number, number][]; radius?: number; color?: string }) {
  const geo = useMemo(
    () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), points.length * 12, radius, 6),
    // points are static literals
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  )
}

/** Static set dressing modelled on the real room: walls, floor, desk, desk items, chair. */
export function Room() {

  return (
    <group>
      {/* shell, trimmed to the room so nothing outside blocks the sun */}
      <mesh rotation-x={-Math.PI / 2} position={[-0.19, 0, 0.25]}>
        <planeGeometry args={[3.62, 4.5]} />
        <meshStandardMaterial map={laminateTexture()} roughness={0.45} />
      </mesh>
      <Wall u0={-2} u1={RIGHT_X} y0={0} y1={2.8} />
      {RIGHT_PIECES.map(([u0, u1, y0, y1]) => (
        <Wall key={u0 * 10 + y0} u0={u0} u1={u1} y0={y0} y1={y1} right />
      ))}
      <mesh position={[-0.19, 2.8, 0.25]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[3.62, 4.5]} />
        <meshStandardMaterial color="#ebe3d6" roughness={1} />
      </mesh>
      <Box size={[3.62, 0.07, 0.015]} position={[-0.19, 0.035, -1.99]} color="#f0ece4" />
      <Box size={[0.015, 0.07, 4.5]} position={[RIGHT_X - 0.01, 0.035, 0.25]} color="#f0ece4" />

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
          [0.065, -1.82, 0.06],
          [0.935, -1.82, -0.06],
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
          args={[undefined, undefined, KEYS.length]}
          ref={(m) => {
            if (!m) return
            const mat = new THREE.Matrix4(), q = new THREE.Quaternion()
            const colors = { w: new THREE.Color('#f4f2ee'), d: new THREE.Color('#2a2a2c'), g: new THREE.Color('#b7d39a') }
            KEYS.forEach(([x, row, w, c], i) => {
              m.setMatrixAt(i, mat.compose(new THREE.Vector3(-0.1425 + (x + w / 2) * U, 0.017, -0.038 + row * U), q, new THREE.Vector3(w, 1, 1)))
              m.setColorAt(i, colors[c])
            })
          }}
        >
          <boxGeometry args={[U - 0.002, 0.011, U - 0.002]} />
          <meshStandardMaterial roughness={0.5} />
        </instancedMesh>
      </group>

      {/* mouse with purple glow */}
      <group position={[0.9, 0.775, -1.5]}>
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
      <mesh position={[0.17, 0.82, -1.42]} userData={{ noShadow: true }}>
        <cylinderGeometry args={[0.036, 0.03, 0.12, 24, 1, true]} />
        <meshStandardMaterial color="#3fa59a" transparent opacity={0.55} roughness={0.08} metalness={0.1} side={THREE.DoubleSide} />
      </mesh>

      {/* rug */}
      <mesh rotation-x={-Math.PI / 2} rotation-z={0.03} position={[0.55, 0.004, -0.62]} userData={{ noShadow: true }} receiveShadow>
        <planeGeometry args={[2.2, 1.5]} />
        <meshStandardMaterial map={rugTexture()} roughness={1} />
      </mesh>

      {use(chairAssetAvailable) ? <AssetChair position={[1.15, 0, -1.18]} rotation={2.6} /> : <Chair position={[1.18, 0, -0.98]} rotation={2.05} />}

      {/* cables: keyboard + mouse to the back edge, monitors down behind the desk, PC power to the wall socket */}
      <Cable points={[[0.5, 0.79, -1.525], [0.48, 0.775, -1.6], [0.42, 0.767, -1.75], [0.38, 0.767, -1.95]]} radius={0.003} color="#d8d6d0" />
      <Cable points={[[0.9, 0.785, -1.555], [0.92, 0.768, -1.64], [0.98, 0.767, -1.8], [1.0, 0.767, -1.96]]} radius={0.0025} />
      <Cable points={[[0.5, 1.12, -1.86], [0.52, 0.9, -1.9], [0.48, 0.775, -1.96], [0.45, 0.72, -1.98], [0.2, 0.55, -1.97], [-0.15, 0.48, -1.9]]} />
      <Cable points={[[-0.33, 0.98, -1.75], [-0.3, 0.8, -1.86], [-0.28, 0.72, -1.96], [-0.22, 0.52, -1.94], [-0.18, 0.47, -1.88]]} />
      <Cable points={[[-0.3, 0.12, -1.86], [-0.42, 0.06, -1.92], [-0.55, 0.12, -1.97], [-0.62, 0.25, -1.985]]} radius={0.005} />
      <Box size={[0.07, 0.11, 0.012]} position={[-0.62, 0.27, -1.994]} color="#f2f0ea" roughness={0.4} />

    </group>
  )
}
