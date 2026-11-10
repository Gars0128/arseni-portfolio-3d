import * as THREE from 'three'
import { plankTexture, plasterTexture, rugTexture, woodTexture } from './textures'
import { Box, rand, useCanvasTexture } from './util'

const WOOD = '#8a5a3a'
const DARK = '#2a2420'
const LEATHER = '#5a3324'

export const HEX_R = 0.17
export const HEX_SHELVES: [number, number][] = [
  [-1.03, 1.92],
  [-0.76, 2.08],
  [-0.76, 1.76],
]

function hexPath<T extends THREE.Path>(p: T, r: number) {
  for (let i = 0; i <= 6; i++) {
    const a = (i * Math.PI) / 3
    if (i === 0) p.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else p.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  return p
}
const hexFrameGeo = (() => {
  const s = hexPath(new THREE.Shape(), HEX_R)
  s.holes.push(hexPath(new THREE.Path(), HEX_R - 0.018))
  return new THREE.ExtrudeGeometry(s, { depth: 0.16, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2 })
})()
const hexBackGeo = new THREE.ShapeGeometry(hexPath(new THREE.Shape(), HEX_R - 0.018))

/** Static set dressing: walls, desk, riser, speakers, keyboard, wall art, chair. */
export function Room() {
  // own artwork: minimal sunset-over-hills print
  const poster = useCanvasTexture(512, 704, (c, w, h) => {
    c.fillStyle = '#efe4cf'
    c.fillRect(0, 0, w, h)
    const ax = 36, ay = 36, aw = w - 72, ah = h - 210
    const sky = c.createLinearGradient(0, ay, 0, ay + ah)
    sky.addColorStop(0, '#2c3e4f')
    sky.addColorStop(0.6, '#d9774a')
    sky.addColorStop(1, '#f2b26b')
    c.fillStyle = sky
    c.fillRect(ax, ay, aw, ah)
    c.fillStyle = '#ffe2a8'
    c.beginPath()
    c.arc(w / 2, ay + ah * 0.62, 70, 0, Math.PI * 2)
    c.fill()
    const hills: [string, number, number][] = [['#7a3b2a', 0.68, 0.012], ['#4f3127', 0.78, 0.018], ['#2f4a3a', 0.88, 0.01]]
    for (const [col, base, f] of hills) {
      c.fillStyle = col
      c.beginPath()
      c.moveTo(ax, ay + ah)
      for (let x = 0; x <= aw; x += 8) c.lineTo(ax + x, ay + ah * base - Math.sin(x * f + base * 9) * 34 - Math.sin(x * f * 2.7) * 14)
      c.lineTo(ax + aw, ay + ah)
      c.fill()
    }
    c.fillStyle = '#2a1c14'
    c.textAlign = 'center'
    c.font = 'bold 72px Georgia, serif'
    c.fillText('SAFE PLACE', w / 2, h - 96)
    c.font = '24px Courier New'
    c.fillStyle = '#7a4a30'
    c.fillText('— a room to build things in —', w / 2, h - 52)
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
        <meshStandardMaterial map={plankTexture()} roughness={0.55} />
      </mesh>
      <mesh position={[-0.5, 1.4, -2.0]}>
        <planeGeometry args={[5, 2.8]} />
        <meshStandardMaterial map={plasterTexture()} roughness={0.95} />
      </mesh>
      <mesh position={[1.6, 1.4, -0.5]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[5, 2.8]} />
        <meshStandardMaterial map={plasterTexture()} roughness={0.95} />
      </mesh>
      <mesh position={[-0.5, 2.8, -0.5]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[5, 5]} />
        <meshStandardMaterial color="#b8673e" roughness={1} />
      </mesh>
      {/* skirting boards */}
      <Box size={[5, 0.08, 0.02]} position={[-0.5, 0.04, -1.99]} color="#e9dcc4" />
      <Box size={[0.02, 0.08, 5]} position={[1.59, 0.04, -0.5]} color="#e9dcc4" />
      {/* warm LED strip along the wall behind the desk */}
      <Box size={[1.9, 0.012, 0.012]} position={[0.45, 0.775, -1.99]} color="#ffb070" emissive="#ff9a4a" emissiveIntensity={4} />

      {/* desk */}
      <Box size={[2, 0.04, 0.72]} position={[0.45, 0.74, -1.63]} color="#ffffff" map={woodTexture()} roughness={0.5} />
      {[-0.5, 1.4].flatMap((x) =>
        [-1.95, -1.32].map((z) => <Box key={`${x}${z}`} size={[0.05, 0.72, 0.05]} position={[x, 0.36, z]} color={DARK} />),
      )}
      <Box size={[1.05, 0.006, 0.42]} position={[0.4, 0.763, -1.45]} color="#4f6b4a" />

      {/* monitor riser + books underneath */}
      <Box size={[1.2, 0.03, 0.24]} position={[0.35, 0.885, -1.86]} color="#ffffff" map={woodTexture()} roughness={0.5} />
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

      {/* hex shelves: solid wooden frames with a darker back panel */}
      {HEX_SHELVES.map(([x, y]) => (
        <group key={`${x}${y}`} position={[x, y, -2]}>
          <mesh geometry={hexFrameGeo}>
            <meshStandardMaterial color="#ffffff" map={woodTexture('#b07a4f', '#7a4a2c')} roughness={0.6} />
          </mesh>
          <mesh geometry={hexBackGeo} position-z={0.004}>
            <meshStandardMaterial color="#6e4630" roughness={0.9} />
          </mesh>
        </group>
      ))}

      {/* rug (own kilim-style pattern) */}
      <mesh rotation-x={-Math.PI / 2} rotation-z={0.04} position={[0.4, 0.004, -0.95]} userData={{ noShadow: true }} receiveShadow>
        <planeGeometry args={[2.0, 1.35]} />
        <meshStandardMaterial map={rugTexture()} roughness={1} alphaTest={0.5} />
      </mesh>

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

      {/* office chair, turned three-quarters toward the viewer */}
      <group position={[1.18, 0, -0.9]} rotation-y={-0.95} scale={0.92}>
        {[0, 1, 2, 3, 4].map((i) => (
          <group key={i} rotation-y={(i * Math.PI * 2) / 5}>
            <Box size={[0.035, 0.03, 0.27]} position={[0, 0.065, 0.135]} color="#1c1c1c" metalness={0.6} roughness={0.35} />
            <mesh position={[0, 0.025, 0.26]}>
              <sphereGeometry args={[0.024, 12, 8]} />
              <meshStandardMaterial color="#111" roughness={0.3} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.022, 0.03, 0.36, 12]} />
          <meshStandardMaterial color="#888" metalness={0.9} roughness={0.25} />
        </mesh>
        <Box size={[0.5, 0.09, 0.48]} radius={0.04} position={[0, 0.47, 0]} color={LEATHER} roughness={0.4} />
        <Box size={[0.46, 0.58, 0.08]} radius={0.04} position={[0, 0.83, 0.22]} rotation-x={-0.12} color={LEATHER} roughness={0.4} />
        <Box size={[0.3, 0.14, 0.07]} radius={0.03} position={[0, 1.2, 0.27]} rotation-x={-0.12} color={LEATHER} roughness={0.4} />
        <Box size={[0.38, 0.03, 0.02]} position={[0, 1.09, 0.255]} rotation-x={-0.12} color="#1c1c1c" />
        {[-1, 1].map((s) => (
          <group key={s}>
            <Box size={[0.03, 0.18, 0.03]} position={[s * 0.25, 0.58, 0.04]} color="#1c1c1c" />
            <Box size={[0.07, 0.035, 0.26]} radius={0.015} position={[s * 0.25, 0.68, 0.02]} color="#1c1c1c" roughness={0.5} />
          </group>
        ))}
      </group>
    </group>
  )
}
