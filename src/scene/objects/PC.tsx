import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { cameraApi } from '../CameraRig'
import { Box, Interactive } from '../util'

// Case lives at POS; local axes: +z is the glass side panel (faces the room), the motherboard sits on the back wall (-z),
// +x is the front panel with the radiator, -x the rear with the exhaust fan.
const POS = new THREE.Vector3(-0.22, 0.26, -1.66)
const CASE = '#161616'

const metal = (color: string, roughness = 0.35, metalness = 0.8) => new THREE.MeshStandardMaterial({ color, roughness, metalness })
const M = {
  gun: metal('#2a2d33'),
  dark: metal('#15171a', 0.5, 0.4),
  alu: metal('#9aa0a8', 0.3, 0.9),
  copper: metal('#b87333', 0.3, 1),
  cable: new THREE.MeshStandardMaterial({ color: '#202226', roughness: 0.8 }),
  cableWhite: new THREE.MeshStandardMaterial({ color: '#d8dadc', roughness: 0.7 }),
  blade: new THREE.MeshStandardMaterial({ color: '#2b2f36', roughness: 0.5, transparent: true, opacity: 0.92 }),
}

/** Motherboard silkscreen: dark PCB, copper traces, slots, labels (own design, no brands). */
function useBoardTexture() {
  return useMemo(() => {
    const W = 360, H = 600
    const el = document.createElement('canvas')
    el.width = W
    el.height = H
    const c = el.getContext('2d')!
    c.fillStyle = '#0f141b'
    c.fillRect(0, 0, W, H)
    let seed = 11
    const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    // copper traces: right-angled runs
    for (let i = 0; i < 140; i++) {
      c.strokeStyle = r() > 0.5 ? '#3a2e1a' : '#22303c'
      c.lineWidth = 1 + r() * 1.5
      let x = r() * W, y = r() * H
      c.beginPath()
      c.moveTo(x, y)
      for (let k = 0; k < 3; k++) {
        if (r() > 0.5) x += (r() - 0.5) * 120
        else y += (r() - 0.5) * 120
        c.lineTo(x, y)
      }
      c.stroke()
    }
    // PCIe slot outlines + RAM slot outlines + silkscreen
    c.strokeStyle = '#c9cdd2'
    c.lineWidth = 2
    c.strokeRect(30, 380, 290, 22)
    c.strokeRect(30, 470, 290, 16)
    c.strokeRect(250, 60, 12, 250)
    c.strokeRect(272, 60, 12, 250)
    c.fillStyle = '#c9cdd2'
    c.font = 'bold 22px monospace'
    c.fillText('AX-760 PRO', 30, 560)
    c.font = '13px monospace'
    c.fillText('PCIE_X16', 34, 374)
    c.fillText('DIMM_A1  B1', 216, 52)
    c.fillText('M.2_1', 120, 330)
    for (let i = 0; i < 26; i++) c.fillRect(20 + r() * 320, 330 + r() * 240, 6, 3) // smd parts
    const t = new THREE.CanvasTexture(el)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 8
    return t
  }, [])
}

/** Fan: frame ring (RGB), 7 swept blades, hub. Spins around its local z. */
function Fan({
  rgb,
  spinners,
  index,
  ...p
}: {
  rgb: THREE.Material
  spinners: React.RefObject<THREE.Group[]>
  index: number
  position: [number, number, number]
  rotation?: [number, number, number]
}) {
  return (
    <group {...p}>
      <mesh material={rgb}>
        <torusGeometry args={[0.052, 0.005, 8, 40]} />
      </mesh>
      <mesh material={M.dark} position-z={-0.006}>
        <torusGeometry args={[0.055, 0.004, 6, 40]} />
      </mesh>
      <group ref={(g) => void (g && (spinners.current[index] = g))}>
        {Array.from({ length: 7 }, (_, b) => (
          <group key={b} rotation-z={(b * Math.PI * 2) / 7}>
            {/* pitched blade */}
            <mesh material={M.blade} position={[0.026, 0, 0.002]} rotation-x={0.35}>
              <boxGeometry args={[0.044, 0.016, 0.002]} />
            </mesh>
          </group>
        ))}
        <mesh material={M.dark}>
          <cylinderGeometry args={[0.014, 0.014, 0.008, 20]} />
        </mesh>
      </group>
    </group>
  )
}

/** Tube through points (cables, AIO hoses). */
function Hose({ points, r, m }: { points: [number, number, number][]; r: number; m: THREE.Material }) {
  const geo = useMemo(
    () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p))), 24, r, 8),
    // static path literals
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )
  return <mesh geometry={geo} material={m} />
}

/** Glass-side tower with a full build inside. Click it to fly up to the glass and look in. */
export function PC() {
  const fans = useRef<THREE.Group[]>([])
  const [rgb] = useState(() => new THREE.MeshStandardMaterial({ color: '#111', emissive: '#2a7dff', emissiveIntensity: 3 }))
  const [ramLed] = useState(() => new THREE.MeshStandardMaterial({ color: '#111', emissive: '#a24dff', emissiveIntensity: 2.5 }))
  const boost = useRef(1)
  const board = useBoardTexture()

  useFrame(({ clock }, dt) => {
    boost.current = THREE.MathUtils.lerp(boost.current, 1, dt)
    fans.current.forEach((f) => (f.rotation.z -= dt * 9 * boost.current))
    // blue, like the reference room PC glow; gently breathing. RAM runs a slow colour wave.
    rgb.emissiveIntensity = 2.4 + Math.sin(clock.elapsedTime * 1.2) * 0.8
    ramLed.emissive.setHSL((0.75 + Math.sin(clock.elapsedTime * 0.5) * 0.08) % 1, 0.9, 0.55)
  })

  return (
    <Interactive
      label="pc"
      position={POS.toArray()}
      onSelect={() => {
        boost.current = 5
        cameraApi.focus(new THREE.Vector3(POS.x, POS.y + 0.02, POS.z + 0.23), 0.62)
      }}
    >
      {/* white gamepad resting on top */}
      <group position={[0.02, 0.27, 0.05]} rotation-y={0.4}>
        <Box size={[0.15, 0.035, 0.08]} radius={0.016} color="#f2f0ec" roughness={0.4} />
        {[-0.04, 0.04].map((dx) => (
          <mesh key={dx} position={[dx, 0.022, 0.0]}>
            <cylinderGeometry args={[0.009, 0.009, 0.012, 10]} />
            <meshStandardMaterial color="#2a2a2a" />
          </mesh>
        ))}
      </group>

      {/* case shell */}
      <Box size={[0.24, 0.5, 0.02]} position-z={-0.23} color={CASE} />
      <Box size={[0.02, 0.5, 0.46]} position-x={0.11} color={CASE} />
      <Box size={[0.02, 0.5, 0.46]} position-x={-0.11} color={CASE} />
      <Box size={[0.24, 0.02, 0.46]} position-y={0.24} color={CASE} />
      <Box size={[0.24, 0.02, 0.46]} position-y={-0.24} color={CASE} />
      {/* tempered glass side panel */}
      <mesh position-z={0.23} userData={{ noShadow: true }}>
        <planeGeometry args={[0.22, 0.48]} />
        <meshPhysicalMaterial color="#aabbcc" transparent opacity={0.14} roughness={0.03} metalness={0.1} clearcoat={1} />
      </mesh>

      {/* motherboard + VRM heatsinks + chipset + M.2 */}
      <mesh position={[-0.02, 0.06, -0.2185]}>
        <planeGeometry args={[0.18, 0.3]} />
        <meshStandardMaterial map={board} roughness={0.6} metalness={0.2} />
      </mesh>
      <Box size={[0.018, 0.075, 0.016]} position={[-0.085, 0.15, -0.21]} color="#2a2d33" metalness={0.8} roughness={0.35} />
      <Box size={[0.065, 0.017, 0.016]} position={[-0.04, 0.19, -0.21]} color="#2a2d33" metalness={0.8} roughness={0.35} />
      <Box size={[0.04, 0.035, 0.01]} position={[0.03, -0.035, -0.213]} color="#2a2d33" metalness={0.8} roughness={0.35} />
      <mesh material={rgb} position={[0.03, -0.035, -0.2075]}>
        <boxGeometry args={[0.026, 0.002, 0.001]} />
      </mesh>
      <Box size={[0.024, 0.065, 0.006]} position={[-0.05, 0.04, -0.214]} color="#3a3f47" metalness={0.7} roughness={0.3} />

      {/* AIO pump block on the CPU with an RGB ring */}
      <mesh material={M.gun} position={[-0.02, 0.12, -0.2]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.03, 0.032, 0.024, 32]} />
      </mesh>
      <mesh material={rgb} position={[-0.02, 0.12, -0.1875]}>
        <torusGeometry args={[0.024, 0.0025, 8, 40]} />
      </mesh>
      <mesh material={M.alu} position={[-0.02, 0.12, -0.1872]}>
        <circleGeometry args={[0.018, 32]} />
      </mesh>
      <Hose r={0.006} m={M.cable} points={[[-0.0, 0.13, -0.195], [0.03, 0.17, -0.15], [0.06, 0.2, -0.06], [0.082, 0.19, 0.0]]} />
      <Hose r={0.006} m={M.cable} points={[[-0.0, 0.11, -0.195], [0.035, 0.12, -0.14], [0.065, 0.15, -0.05], [0.082, 0.15, 0.03]]} />

      {/* two RAM sticks with light bars */}
      {[0.04, 0.053].map((x) => (
        <group key={x}>
          <Box size={[0.007, 0.13, 0.034]} position={[x, 0.135, -0.2]} color="#1f2228" metalness={0.6} roughness={0.35} />
          <mesh material={ramLed} position={[x, 0.135, -0.1815]}>
            <boxGeometry args={[0.0065, 0.128, 0.004]} />
          </mesh>
        </group>
      ))}

      {/* graphics card: shroud, backplate, window-side light bar, heatsink fins, PCIe bracket */}
      <Box size={[0.17, 0.042, 0.12]} position={[-0.005, -0.06, -0.155]} color="#202329" metalness={0.6} roughness={0.35} />
      <Box size={[0.17, 0.004, 0.12]} position={[-0.005, -0.037, -0.155]} color="#5a5f68" metalness={0.9} roughness={0.25} />
      <mesh material={rgb} position={[-0.005, -0.05, -0.0945]}>
        <boxGeometry args={[0.14, 0.004, 0.002]} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} material={M.alu} position={[-0.075 + i * 0.012, -0.072, -0.0948]}>
          <boxGeometry args={[0.0018, 0.014, 0.002]} />
        </mesh>
      ))}
      <Box size={[0.004, 0.05, 0.12]} position={[-0.094, -0.055, -0.155]} color="#9aa0a8" metalness={0.9} roughness={0.3} />

      {/* PSU shroud with vent slots */}
      <Box size={[0.2, 0.07, 0.44]} position={[0, -0.198, 0]} color="#1b1d21" metalness={0.4} roughness={0.5} />
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} material={M.dark} position={[0.02 + i * 0.011, -0.162, 0.12]} rotation-x={-Math.PI / 2}>
          <planeGeometry args={[0.005, 0.12]} />
        </mesh>
      ))}

      {/* cables: 24-pin bundle, GPU power, CPU 8-pin */}
      {[0, 1, 2, 3].map((k) => (
        <Hose key={k} r={0.0028} m={k % 2 ? M.cableWhite : M.cable} points={[[0.06 + k * 0.006, -0.163, -0.12], [0.065 + k * 0.006, -0.11, -0.17], [0.072 + k * 0.004, 0.0, -0.2], [0.072 + k * 0.004, 0.03, -0.212]]} />
      ))}
      {[0, 1].map((k) => (
        <Hose key={k} r={0.0028} m={M.cableWhite} points={[[0.04 + k * 0.006, -0.163, -0.06], [0.045 + k * 0.006, -0.11, -0.08], [0.05 + k * 0.006, -0.04, -0.11]]} />
      ))}
      <Hose r={0.003} m={M.cable} points={[[-0.09, 0.215, -0.21], [-0.095, 0.23, -0.16], [-0.098, 0.23, -0.05]]} />

      {/* front radiator with three intake fans, rear exhaust fan */}
      <Box size={[0.02, 0.33, 0.125]} position={[0.094, 0.035, 0.01]} color="#25282d" metalness={0.7} roughness={0.4} />
      {[0.145, 0.035, -0.075].map((y, i) => (
        <Fan key={y} rgb={rgb} spinners={fans} index={i} position={[0.078, y, 0.01]} rotation={[0, -Math.PI / 2, 0]} />
      ))}
      <Fan rgb={rgb} spinners={fans} index={3} position={[-0.096, 0.135, -0.06]} rotation={[0, Math.PI / 2, 0]} />

      {/* soft interior light so the build reads through the glass */}
      <pointLight position={[0.0, 0.12, 0.05]} intensity={0.22} distance={0.45} decay={2} color="#8fb6ff" />
    </Interactive>
  )
}
