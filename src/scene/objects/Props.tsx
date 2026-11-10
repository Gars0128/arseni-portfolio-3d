import { RoundedBox } from '@react-three/drei'
import { useMemo, type ReactNode } from 'react'
import * as THREE from 'three'

/* ------------------------------------------------------------------ helpers */

type V3 = [number, number, number]

const mat = (color: string, roughness = 0.6, metalness = 0, extra: Partial<THREE.MeshPhysicalMaterialParameters> = {}) =>
  new THREE.MeshPhysicalMaterial({ color, roughness, metalness, ...extra })

const M = {
  pen: mat('#1d2f4a', 0.35, 0.2, { clearcoat: 1 }),
  chrome: mat('#d4d8de', 0.18, 1),
  gold: mat('#e0b04a', 0.3, 0.75),
  silver: mat('#d6dae0', 0.28, 0.7),
  bronze: mat('#c07a42', 0.32, 0.7),
  foil: mat('#c9ccd2', 0.25, 1),
  choc: mat('#4a2817', 0.45),
  white: mat('#f4f5f3', 0.25, 0, { clearcoat: 1, clearcoatRoughness: 0.1 }),
  plastic: mat('#1a1c20', 0.5),
  fabric: mat('#3f7a52', 0.9, 0, { sheen: 1, sheenColor: new THREE.Color('#6a9a7a'), sheenRoughness: 0.6 }),
  fabricDark: mat('#2c5239', 0.9, 0, { sheen: 1, sheenColor: new THREE.Color('#556b5c') }),
  webbing: mat('#141617', 0.9),
  orange: mat('#e0702a', 0.6),
  mat: mat('#3a6aa0', 0.8),
  leather: mat('#6b4428', 0.7),
  sole: mat('#202020', 0.85),
  lace: mat('#c94a2a', 0.8),
  wood: mat('#8a5a3a', 0.55),
  goggles: mat('#2a8fd6', 0.1, 0.1, { transmission: 0.5, transparent: true, opacity: 0.75, clearcoat: 1 }),
  strap: mat('#ff4d6d', 0.6),
  ribbonRed: mat('#c0283a', 0.7, 0, { sheen: 1, sheenColor: new THREE.Color('#ff8a9a') }),
  ribbonBlue: mat('#1f4fa0', 0.7, 0, { sheen: 1, sheenColor: new THREE.Color('#7aa0ff') }),
  led: new THREE.MeshBasicMaterial({ color: '#7dff9a', toneMapped: false }),
}

const Part = ({ args, r = 0.004, m, position, rotation }: { args: V3; r?: number; m: THREE.Material; position?: V3; rotation?: V3 }) => (
  <RoundedBox args={args} radius={Math.min(r, Math.min(...args) * 0.45)} smoothness={3} material={m} position={position} rotation={rotation} />
)

/** Tube along a smooth path through points (straps, cables, lanyards, laces). */
function Tube({ points, r, m, closed = false }: { points: V3[]; r: number; m: THREE.Material; closed?: boolean }) {
  const geo = useMemo(
    () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), closed), points.length * 10, r, 8, closed),
    // points are static literals
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  return <mesh geometry={geo} material={m} />
}

/** Canvas-drawn texture, made once. */
function useCanvas(w: number, h: number, draw: (c: CanvasRenderingContext2D) => void) {
  return useMemo(() => {
    const el = document.createElement('canvas')
    el.width = w
    el.height = h
    draw(el.getContext('2d')!)
    const t = new THREE.CanvasTexture(el)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
    // static drawing recipe per call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

const Group = ({ children, ...p }: { children: ReactNode; position?: V3; rotation?: V3; scale?: number }) => <group {...p}>{children}</group>

/* ------------------------------------------------------------------ desk */

function Pen() {
  return (
    <Group position={[0.6, 0.766, -1.35]} rotation={[0, 0.3, Math.PI / 2]}>
      <mesh material={M.pen}>
        <cylinderGeometry args={[0.0045, 0.0045, 0.12, 16]} />
      </mesh>
      <mesh material={M.chrome} position-y={-0.064}>
        <cylinderGeometry args={[0.0045, 0.0012, 0.012, 16]} />
      </mesh>
      <mesh material={M.chrome} position-y={0.062}>
        <cylinderGeometry args={[0.0035, 0.0045, 0.006, 16]} />
      </mesh>
      {/* clip */}
      <Part args={[0.002, 0.045, 0.003]} r={0.001} m={M.chrome} position={[0, 0.035, 0.0055]} />
    </Group>
  )
}

function Chocolate() {
  const wrap = useCanvas(512, 256, (c) => {
    const g = c.createLinearGradient(0, 0, 512, 0)
    g.addColorStop(0, '#3b1f5c')
    g.addColorStop(1, '#5e2e8a')
    c.fillStyle = g
    c.fillRect(0, 0, 512, 256)
    c.strokeStyle = '#d9b25a'
    c.lineWidth = 6
    c.strokeRect(14, 14, 484, 228)
    c.fillStyle = '#d9b25a'
    c.font = 'bold 64px Georgia, serif'
    c.textAlign = 'center'
    c.fillText('CACAO', 256, 120)
    c.font = '34px Georgia, serif'
    c.fillText('72% · dark', 256, 178)
    c.fillStyle = '#ffffff22'
    for (let i = 0; i < 6; i++) c.fillRect(i * 90, 0, 30, 256)
  })
  return (
    <Group position={[0.3, 0.762, -1.34]} rotation={[0, 0.25, 0]}>
      {/* wrapped part */}
      <mesh position={[-0.02, 0.0055, 0]}>
        <boxGeometry args={[0.1, 0.011, 0.05]} />
        <meshPhysicalMaterial map={wrap} roughness={0.35} clearcoat={0.6} />
      </mesh>
      {/* torn foil edge + exposed segments */}
      <Part args={[0.012, 0.012, 0.052]} r={0.002} m={M.foil} position={[0.036, 0.0058, 0]} />
      {[0, 1].map((k) => (
        <Part key={k} args={[0.016, 0.009, 0.023]} r={0.0025} m={M.choc} position={[0.052 + k * 0.0005, 0.0048, k ? 0.012 : -0.012]} />
      ))}
      {/* a broken-off square nearby */}
      <Part args={[0.016, 0.008, 0.022]} r={0.0025} m={M.choc} position={[0.085, 0.004, 0.03]} rotation={[0, 0.6, 0]} />
    </Group>
  )
}

function EarbudCase() {
  return (
    <Group position={[0.76, 0.76, -1.7]} rotation={[0, 0.4, 0]}>
      <Part args={[0.05, 0.024, 0.04]} r={0.012} m={M.white} position={[0, 0.012, 0]} />
      {/* lid seam */}
      <mesh position={[0, 0.0175, 0.0201]}>
        <boxGeometry args={[0.044, 0.0006, 0.0004]} />
        <meshBasicMaterial color="#b8bab6" />
      </mesh>
      <mesh material={M.led} position={[0, 0.012, 0.0203]}>
        <circleGeometry args={[0.0011, 10]} />
      </mesh>
    </Group>
  )
}

function Badge() {
  const card = useCanvas(320, 480, (c) => {
    c.fillStyle = '#f4f2ee'
    c.fillRect(0, 0, 320, 480)
    c.fillStyle = '#ff2a6d'
    c.fillRect(0, 0, 320, 90)
    c.fillStyle = '#ffffff'
    c.font = 'bold 34px Arial'
    c.textAlign = 'center'
    c.fillText('DEV SUMMIT', 160, 58)
    c.fillStyle = '#1a1c22'
    c.font = 'bold 42px Arial'
    c.fillText('ARSENI', 160, 170)
    c.fillText('ALIOSHYN', 160, 218)
    c.font = '26px Arial'
    c.fillStyle = '#5a5f6a'
    c.fillText('AI ENGINEER', 160, 262)
    // QR-like block pattern
    let seed = 7
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let x = 0; x < 11; x++)
      for (let y = 0; y < 11; y++) {
        const corner = (x < 3 && y < 3) || (x > 7 && y < 3) || (x < 3 && y > 7)
        if (corner || r() > 0.55) c.fillRect(100 + x * 11, 300 + y * 11, 10, 10)
      }
    c.fillStyle = '#ff2a6d'
    c.fillRect(0, 456, 320, 24)
  })
  return (
    <Group position={[0.1, 0.762, -1.31]} rotation={[0, 0.25, 0]}>
      <mesh rotation-x={-Math.PI / 2} position-y={0.0012}>
        <planeGeometry args={[0.054, 0.081]} />
        <meshPhysicalMaterial map={card} roughness={0.3} clearcoat={1} />
      </mesh>
      {/* clear plastic sleeve */}
      <Part args={[0.06, 0.002, 0.088]} r={0.001} m={mat('#ffffff', 0.05, 0, { transparent: true, opacity: 0.18 })} position={[0, 0.0012, 0]} />
      <Part args={[0.006, 0.003, 0.012]} r={0.001} m={M.chrome} position={[0, 0.002, -0.048]} />
      {/* lanyard lying in a loose loop */}
      <Tube
        r={0.0028}
        m={M.strap}
        points={[
          [0, 0.002, -0.052],
          [-0.03, 0.002, -0.09],
          [-0.09, 0.002, -0.1],
          [-0.13, 0.002, -0.06],
          [-0.12, 0.002, 0.0],
          [-0.07, 0.002, 0.02],
          [-0.02, 0.002, -0.03],
          [0, 0.002, -0.052],
        ]}
      />
    </Group>
  )
}

function StickyNote() {
  const note = useCanvas(256, 256, (c) => {
    c.fillStyle = '#ffe36e'
    c.fillRect(0, 0, 256, 256)
    c.fillStyle = '#00000010'
    c.fillRect(0, 0, 256, 30)
    c.fillStyle = '#2a2a4a'
    c.font = 'italic 46px "Segoe Print", "Comic Sans MS", cursive'
    c.fillText('ship it', 34, 120)
    c.font = '60px "Segoe Print", cursive'
    c.fillText('✓', 160, 190)
  })
  return (
    <mesh position={[0.43, 0.7735, -1.76]} rotation={[-Math.PI / 2, 0, 0.3]}>
      <planeGeometry args={[0.05, 0.05]} />
      <meshStandardMaterial map={note} roughness={0.9} />
    </mesh>
  )
}

/* ------------------------------------------------------------------ hiking corner */

function Backpack() {
  return (
    <Group position={[-0.95, 0, -1.8]} rotation={[-0.12, 0.25, 0]}>
      {/* main body + top lid */}
      <Part args={[0.3, 0.46, 0.2]} r={0.07} m={M.fabric} position={[0, 0.26, 0]} />
      <Part args={[0.3, 0.09, 0.22]} r={0.04} m={M.fabricDark} position={[0, 0.5, 0.005]} />
      {/* front zip pocket with zipper line and pull */}
      <Part args={[0.22, 0.2, 0.05]} r={0.04} m={M.fabricDark} position={[0, 0.2, 0.11]} />
      <mesh position={[0, 0.27, 0.1355]}>
        <boxGeometry args={[0.17, 0.004, 0.002]} />
        <meshStandardMaterial color="#0c0d0e" />
      </mesh>
      <Part args={[0.008, 0.024, 0.004]} r={0.002} m={M.chrome} position={[0.06, 0.258, 0.138]} />
      {/* compression straps + buckles */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <Part args={[0.024, 0.34, 0.006]} r={0.002} m={M.webbing} position={[s * 0.08, 0.27, 0.103]} />
          <Part args={[0.03, 0.022, 0.01]} r={0.003} m={M.plastic} position={[s * 0.08, 0.36, 0.108]} />
          {/* shoulder strap curving over the top */}
          <Tube r={0.012} m={M.webbing} points={[[s * 0.08, 0.5, -0.09], [s * 0.085, 0.44, -0.13], [s * 0.09, 0.28, -0.13], [s * 0.1, 0.1, -0.1]]} />
          <Part args={[0.02, 0.012, 0.18]} r={0.004} m={M.orange} position={[s * 0.155, 0.39, 0]} />
        </group>
      ))}
      {/* carabiner on the lid */}
      <mesh material={M.orange} position={[0.1, 0.48, 0.12]} rotation={[0, 0, 0.3]}>
        <torusGeometry args={[0.016, 0.0035, 8, 20]} />
      </mesh>
      {/* rolled sleeping mat strapped underneath */}
      <mesh material={M.mat} position={[0, 0.045, 0.02]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.045, 0.045, 0.34, 24]} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={M.webbing} position={[s * 0.1, 0.045, 0.02]} rotation-z={Math.PI / 2}>
          <torusGeometry args={[0.047, 0.004, 6, 24]} />
        </mesh>
      ))}
    </Group>
  )
}

function TrekkingPoles() {
  return (
    <Group position={[-1.32, 0, -1.86]}>
      {[0, 0.05].map((dx, i) => (
        <group key={i} position={[dx, 0, i * 0.02]} rotation={[0.08, 0, -0.06 - i * 0.04]}>
          <mesh material={M.silver} position-y={0.42}>
            <cylinderGeometry args={[0.007, 0.006, 0.84, 12]} />
          </mesh>
          <mesh material={M.plastic} position-y={0.9}>
            <cylinderGeometry args={[0.012, 0.011, 0.13, 14]} />
          </mesh>
          <mesh material={M.orange} position-y={0.6}>
            <cylinderGeometry args={[0.0085, 0.0085, 0.012, 12]} />
          </mesh>
          {/* basket + tip */}
          <mesh material={M.plastic} position-y={0.06} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.022, 0.003, 6, 16]} />
          </mesh>
          <mesh material={M.chrome} position-y={0.012}>
            <coneGeometry args={[0.005, 0.025, 10]} />
          </mesh>
          {/* wrist strap */}
          <Tube r={0.003} m={M.webbing} points={[[0, 0.96, 0], [0.025, 0.93, 0.01], [0.03, 0.86, 0.015], [0.006, 0.84, 0.005]]} />
        </group>
      ))}
    </Group>
  )
}

function Boot({ position, rotation }: { position: V3; rotation: V3 }) {
  return (
    <Group position={position} rotation={rotation}>
      {/* lugged sole */}
      <Part args={[0.1, 0.025, 0.28]} r={0.01} m={M.sole} position={[0, 0.0125, 0]} />
      {[-0.1, -0.05, 0, 0.05, 0.1].map((z) => (
        <Part key={z} args={[0.1, 0.006, 0.012]} r={0.002} m={M.sole} position={[0, 0.003, z]} />
      ))}
      {/* upper + toe cap + ankle collar */}
      <Part args={[0.092, 0.08, 0.2]} r={0.035} m={M.leather} position={[0, 0.06, 0.03]} />
      <Part args={[0.086, 0.13, 0.11]} r={0.035} m={M.leather} position={[0, 0.12, -0.06]} />
      <Part args={[0.094, 0.03, 0.07]} r={0.012} m={M.sole} position={[0, 0.04, 0.12]} />
      <mesh material={M.fabricDark} position={[0, 0.19, -0.06]} rotation-x={Math.PI / 2}>
        <torusGeometry args={[0.04, 0.009, 8, 20]} />
      </mesh>
      {/* laces + eyelets */}
      {[0, 1, 2, 3].map((k) => (
        <group key={k}>
          <mesh material={M.lace} position={[0, 0.095 + k * 0.022, 0.04 - k * 0.028]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.0025, 0.0025, 0.07, 6]} />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} material={M.chrome} position={[s * 0.036, 0.095 + k * 0.022, 0.04 - k * 0.028]}>
              <sphereGeometry args={[0.004, 8, 6]} />
            </mesh>
          ))}
        </group>
      ))}
    </Group>
  )
}

/* ------------------------------------------------------------------ swimming shelf */

function Medal({ x, m, ribbon, label }: { x: number; m: THREE.Material; ribbon: THREE.Material; label: string }) {
  const face = useCanvas(128, 128, (c) => {
    c.fillStyle = '#00000000'
    c.clearRect(0, 0, 128, 128)
    c.strokeStyle = '#00000055'
    c.lineWidth = 6
    c.beginPath()
    c.arc(64, 64, 50, 0, Math.PI * 2)
    c.stroke()
    c.fillStyle = '#00000066'
    c.font = 'bold 52px Georgia, serif'
    c.textAlign = 'center'
    c.fillText(label, 64, 82)
  })
  return (
    <group position={[x, 1.32, -1.985]}>
      {/* V-shaped ribbon from the hook */}
      {[-1, 1].map((s) => (
        <mesh key={s} material={ribbon} position={[s * 0.012, -0.055, 0]} rotation-z={s * 0.22}>
          <boxGeometry args={[0.02, 0.11, 0.002]} />
        </mesh>
      ))}
      <mesh material={m} position={[0, -0.13, 0.002]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.03, 0.03, 0.005, 32]} />
      </mesh>
      <mesh position={[0, -0.13, 0.0049]}>
        <circleGeometry args={[0.027, 32]} />
        <meshStandardMaterial map={face} transparent metalness={1} roughness={0.3} color="#ffffff" />
      </mesh>
    </group>
  )
}

function SwimShelf() {
  const trophyGeo = useMemo(() => {
    const pts = [
      [0.0, 0],
      [0.035, 0],
      [0.035, 0.012],
      [0.012, 0.02],
      [0.008, 0.06],
      [0.02, 0.07],
      [0.04, 0.1],
      [0.045, 0.14],
      [0.0, 0.14],
    ].map(([r, y]) => new THREE.Vector2(r, y))
    return new THREE.LatheGeometry(pts, 32)
  }, [])
  return (
    <group>
      {/* wall shelf on brackets */}
      <Part args={[0.42, 0.018, 0.11]} r={0.004} m={M.wood} position={[-0.82, 1.36, -1.945]} />
      {[-1, 1].map((s) => (
        <Part key={s} args={[0.012, 0.05, 0.08]} r={0.003} m={M.plastic} position={[-0.82 + s * 0.16, 1.33, -1.955]} />
      ))}
      {/* warm display light: a thin LED bar under the shelf lights the medals */}
      <Part args={[0.38, 0.006, 0.012]} r={0.002} m={new THREE.MeshStandardMaterial({ color: '#000', emissive: '#ffd9a0', emissiveIntensity: 0.5 })} position={[-0.82, 1.348, -1.9]} />
      <pointLight position={[-0.82, 1.33, -1.85]} intensity={0.14} distance={0.5} decay={2} color="#ffcf8a" />
      <pointLight position={[-0.82, 1.5, -1.8]} intensity={0.1} distance={0.45} decay={2} color="#ffcf8a" />
      {/* trophy */}
      <mesh geometry={trophyGeo} material={M.gold} position={[-0.92, 1.369, -1.94]} />
      <Part args={[0.06, 0.03, 0.06]} r={0.004} m={mat('#2a2a30', 0.4)} position={[-0.92, 1.384, -1.94]} />
      <mesh geometry={trophyGeo} material={M.gold} position={[-0.92, 1.399, -1.94]} scale={[0.9, 0.9, 0.9]} />
      {/* swim goggles: two lenses, nose bridge, strap loop */}
      <group position={[-0.72, 1.373, -1.93]} rotation={[-Math.PI / 2 + 0.2, 0, 0.2]}>
        {[-1, 1].map((s) => (
          <group key={s} position-x={s * 0.024}>
            <mesh material={M.goggles} scale={[1, 0.75, 0.5]}>
              <sphereGeometry args={[0.018, 20, 14]} />
            </mesh>
            <mesh material={M.plastic} rotation-x={0} scale={[1, 0.75, 1]}>
              <torusGeometry args={[0.018, 0.003, 8, 24]} />
            </mesh>
          </group>
        ))}
        <mesh material={M.plastic} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.002, 0.002, 0.012, 6]} />
        </mesh>
        <Tube r={0.0035} m={M.strap} closed points={[[-0.042, 0, 0], [-0.06, 0.05, 0], [0, 0.075, 0], [0.06, 0.05, 0], [0.042, 0, 0], [0, -0.008, 0]]} />
      </group>
      {/* hooks + medals hanging under the shelf */}
      {[-0.95, -0.82, -0.69].map((x) => (
        <mesh key={x} material={M.chrome} position={[x, 1.325, -1.99]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.003, 0.003, 0.02, 8]} />
        </mesh>
      ))}
      <Medal x={-0.95} m={M.gold} ribbon={M.ribbonBlue} label="1" />
      <Medal x={-0.82} m={M.silver} ribbon={M.ribbonRed} label="2" />
      <Medal x={-0.69} m={M.bronze} ribbon={M.ribbonBlue} label="3" />
    </group>
  )
}

/** Personal clutter that makes the room feel lived-in: desk bits, hiking gear, swimming medals. */
export function Props() {
  return (
    <>
      <Pen />
      <Chocolate />
      <EarbudCase />
      <Badge />
      <StickyNote />
      <Backpack />
      <TrekkingPoles />
      <Boot position={[-0.74, 0, -1.56]} rotation={[0, 0.35, 0]} />
      <Boot position={[-0.63, 0, -1.64]} rotation={[0, 0.12, 0.04]} />
      <SwimShelf />
    </>
  )
}
