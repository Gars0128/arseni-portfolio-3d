import * as THREE from 'three'
import { Box, rand, useCanvasTexture } from './util'

const WALL = '#d47a4c'
const WOOD = '#8a5a3a'
const DARK = '#2a2420'

/** Static set dressing: walls, desk, riser, speakers, keyboard, wall art, chair. */
export function Room() {
  const poster = useCanvasTexture(256, 352, (c, w, h) => {
    c.fillStyle = '#e9dcc4'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#2f4a3a'
    c.fillRect(14, 14, w - 28, h - 110)
    // own artwork: a pixel moth over a sun
    c.fillStyle = '#e8894a'
    c.beginPath()
    c.arc(w / 2, 120, 62, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = '#f6e7d3'
    for (const [x, y, s] of [[-3, 0, 1], [-2, -1, 1], [-2, 1, 1], [-1, 0, 2], [0, -1, 1], [0, 1, 1]] as const)
      for (const side of [-1, 1]) c.fillRect(w / 2 + side * x * 14 - 7, 120 + y * 14 - 7, 14 * s, 14)
    c.fillStyle = '#c0432a'
    c.font = 'bold 48px Courier New'
    c.textAlign = 'center'
    c.fillText('SAFE', w / 2, h - 52)
    c.font = 'bold 26px Courier New'
    c.fillText('PLACE · 2026', w / 2, h - 20)
  })

  const calendar = useCanvasTexture(160, 224, (c, w, h) => {
    c.fillStyle = '#f4efe6'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#c0432a'
    c.font = 'bold 22px Courier New'
    c.textAlign = 'center'
    c.fillText('NOV', w / 2, 30)
    c.fillStyle = '#6b8f5e'
    c.fillRect(20, 44, w - 40, 60)
    c.fillStyle = '#555'
    for (let i = 0; i < 30; i++) c.fillRect(14 + (i % 7) * 19, 118 + Math.floor(i / 7) * 20, 12, 10)
  })

  const polaroids = useCanvasTexture(64, 76 * 6, (c) => {
    const r = rand(7)
    const palette = ['#e8894a', '#6b8f5e', '#4b6a8a', '#d9b25a', '#a05a6a', '#7a9aa8']
    for (let i = 0; i < 6; i++) {
      c.fillStyle = '#f7f3ea'
      c.fillRect(0, i * 76, 64, 76)
      c.fillStyle = palette[i]
      c.fillRect(5, i * 76 + 5, 54, 50)
      c.fillStyle = '#ffffff55'
      c.fillRect(5 + r() * 30, i * 76 + 25 + r() * 20, 20, 10)
    }
  })

  const keys = Array.from({ length: 60 }, (_, i) => [(i % 15) - 7, Math.floor(i / 15)] as const)

  return (
    <group>
      {/* shell */}
      <mesh rotation-x={-Math.PI / 2} position={[-0.5, 0, -0.5]}>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial color="#5a3b28" roughness={0.9} />
      </mesh>
      <Box size={[5, 2.8, 0.05]} position={[-0.5, 1.4, -2.025]} color={WALL} />
      <Box size={[0.05, 2.8, 5]} position={[1.625, 1.4, -0.5]} color={WALL} />
      <Box size={[5, 0.05, 5]} position={[-0.5, 2.825, -0.5]} color="#a8532f" />

      {/* desk */}
      <Box size={[2, 0.04, 0.72]} position={[0.45, 0.74, -1.63]} color={WOOD} />
      {[-0.5, 1.4].flatMap((x) =>
        [-1.95, -1.32].map((z) => <Box key={`${x}${z}`} size={[0.05, 0.72, 0.05]} position={[x, 0.36, z]} color={DARK} />),
      )}
      <Box size={[1.05, 0.006, 0.42]} position={[0.4, 0.763, -1.45]} color="#4f6b4a" />

      {/* monitor riser + books underneath */}
      <Box size={[1.2, 0.03, 0.24]} position={[0.35, 0.885, -1.86]} color={WOOD} />
      <Box size={[0.03, 0.12, 0.24]} position={[-0.23, 0.82, -1.86]} color={WOOD} />
      <Box size={[0.03, 0.12, 0.24]} position={[0.93, 0.82, -1.86]} color={WOOD} />
      <Box size={[0.32, 0.04, 0.18]} position={[-0.05, 0.78, -1.86]} color="#7a2f2a" />
      <Box size={[0.3, 0.035, 0.17]} position={[-0.05, 0.818, -1.86]} color="#2f4a3a" />

      {/* speakers */}
      {(
        [
          [-0.43, 0.925, -1.8, 0.33],
          [0.92, 1.04, -1.86, 0.28],
        ] as const
      ).map(([x, y, z, h]) => (
        <group key={x} position={[x, y, z]}>
          <Box size={[0.16, h, 0.19]} color={DARK} />
          {[0.06, -0.05].map((dy, i) => (
            <mesh key={dy} position={[0, dy, 0.096]} rotation-x={Math.PI / 2}>
              <cylinderGeometry args={[i ? 0.055 : 0.025, i ? 0.055 : 0.025, 0.01, 16]} />
              <meshStandardMaterial color="#111" roughness={0.5} />
            </mesh>
          ))}
        </group>
      ))}

      {/* keyboard + wrist rest + mouse */}
      <group position={[0.38, 0.78, -1.44]}>
        <Box size={[0.43, 0.022, 0.14]} color="#3c4a3c" />
        <instancedMesh
          args={[undefined, undefined, keys.length]}
          ref={(m) => {
            if (!m) return
            const mat = new THREE.Matrix4()
            const accent = new THREE.Color('#e8894a')
            const base = new THREE.Color('#d8d2c2')
            keys.forEach(([x, z], i) => {
              m.setMatrixAt(i, mat.makeTranslation(x * 0.027, 0.016, -0.045 + z * 0.028))
              m.setColorAt(i, i % 15 === 14 || i === 52 ? accent : base)
            })
          }}
        >
          <boxGeometry args={[0.022, 0.012, 0.022]} />
          <meshStandardMaterial />
        </instancedMesh>
        <Box size={[0.43, 0.015, 0.06]} position={[0, -0.003, 0.11]} color="#a06d45" />
      </group>
      <mesh position={[0.74, 0.778, -1.42]} scale={[0.032, 0.018, 0.05]}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial color="#efe9df" roughness={0.4} />
      </mesh>

      {/* notebooks + pencil */}
      <Box size={[0.2, 0.03, 0.27]} position={[-0.32, 0.775, -1.42]} rotation-y={0.12} color="#4f6b4a" />
      <Box size={[0.19, 0.025, 0.26]} position={[-0.31, 0.8, -1.42]} rotation-y={0.05} color="#7a2f2a" />
      <Box size={[0.16, 0.008, 0.008]} position={[-0.3, 0.817, -1.4]} rotation-y={-0.3} color="#d9b25a" />

      {/* wall art (own designs) */}
      <mesh position={[0.02, 1.86, -1.995]}>
        <planeGeometry args={[0.42, 0.58]} />
        <meshStandardMaterial map={poster} roughness={0.8} />
      </mesh>
      <mesh position={[0.66, 1.8, -1.995]}>
        <planeGeometry args={[0.3, 0.42]} />
        <meshStandardMaterial map={calendar} roughness={0.9} />
      </mesh>

      {/* hex shelves */}
      {(
        [
          [-1.08, 1.92],
          [-0.76, 2.1],
          [-0.76, 1.74],
        ] as const
      ).map(([x, y]) => (
        <mesh key={`${x}${y}`} position={[x, y, -1.91]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.18, 0.18, 0.18, 6, 1, true]} />
          <meshStandardMaterial color="#9a6440" side={2} roughness={0.9} />
        </mesh>
      ))}

      {/* polaroid column on the right wall */}
      {Array.from({ length: 6 }, (_, i) => {
        const t = polaroids.clone()
        t.repeat.set(1, 1 / 6)
        t.offset.set(0, i / 6)
        return (
          <mesh key={i} position={[1.597, 1.02 + i * 0.165, -0.72]} rotation-y={-Math.PI / 2} rotation-z={(i % 2 ? 1 : -1) * 0.04}>
            <planeGeometry args={[0.1, 0.12]} />
            <meshStandardMaterial map={t} roughness={0.7} />
          </mesh>
        )
      })}

      {/* chair with a blanket */}
      <group position={[1.0, 0, -0.95]} rotation-y={-0.5}>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.42, 8]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <Box size={[0.5, 0.025, 0.06]} position={[0, 0.04, 0]} color="#222" />
        <Box size={[0.06, 0.025, 0.5]} position={[0, 0.04, 0]} color="#222" />
        <Box size={[0.46, 0.07, 0.44]} position={[0, 0.47, 0]} color="#6e4630" />
        <Box size={[0.44, 0.48, 0.06]} position={[0, 0.76, 0.22]} rotation-x={-0.1} color="#6e4630" />
        <Box size={[0.48, 0.42, 0.035]} position={[0.03, 0.82, 0.27]} rotation={[-0.12, 0, 0.06]} color="#a8845a" />
        <Box size={[0.48, 0.045, 0.16]} position={[0.03, 1.02, 0.21]} rotation-x={-0.1} color="#a8845a" />
      </group>
    </group>
  )
}
