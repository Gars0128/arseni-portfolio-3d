import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { Box, rand } from '../util'
import { dayMix, SUN_POS, SUN_TARGET } from './Lights'

// Window on the right wall (x = WALL_X), right next to the desk. Local frame: x runs along the wall (= world z), +z points into the room.
export const WALL_X = 1.62
export const WIN = { z: -0.975, y: 1.675, w: 0.85, h: 1.55 }
const FRAME = '#f2f0ea'

function skyTexture(day: boolean) {
  const el = document.createElement('canvas')
  el.width = 128
  el.height = 256
  const c = el.getContext('2d')!
  const g = c.createLinearGradient(0, 0, 0, 256)
  if (day) {
    g.addColorStop(0, '#7fb0ea')
    g.addColorStop(0.7, '#cfe2f6')
    g.addColorStop(1, '#f4f1e6')
  } else {
    g.addColorStop(0, '#0b1230')
    g.addColorStop(0.6, '#26345e')
    g.addColorStop(0.92, '#6a5a78')
    g.addColorStop(1, '#c48a6a')
  }
  c.fillStyle = g
  c.fillRect(0, 0, 128, 256)
  const r = rand(day ? 2 : 3)
  if (day) {
    // soft clouds
    for (let i = 0; i < 9; i++) {
      const x = r() * 128, y = 30 + r() * 120
      const cg = c.createRadialGradient(x, y, 0, x, y, 18 + r() * 22)
      cg.addColorStop(0, '#ffffffaa')
      cg.addColorStop(1, '#ffffff00')
      c.fillStyle = cg
      c.fillRect(0, 0, 128, 256)
    }
  } else {
    for (let i = 0; i < 70; i++) {
      c.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`
      c.fillRect(r() * 128, r() * 170, 1, 1)
    }
    c.fillStyle = '#f4f0dc'
    c.beginPath()
    c.arc(92, 52, 9, 0, Math.PI * 2)
    c.fill()
  }
  const t = new THREE.CanvasTexture(el)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Pleated curtain: a dense plane folded with sine waves; fold depth grows toward the hem. */
function Curtain({ x, width }: { x: number; width: number }) {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, 2.72, 56, 14)
    const p = g.attributes.position
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) / width + 0.5
      const v = p.getY(i) / 2.72 + 0.5
      p.setZ(i, Math.sin(u * Math.PI * 11) * 0.04 + Math.sin(u * Math.PI * 27) * 0.006 * (1 - v) + (1 - v) * 0.025)
    }
    g.computeVertexNormals()
    return g
  }, [width])
  return (
    <mesh geometry={geo} position={[x, 1.39, 0.1]}>
      <meshPhysicalMaterial color="#6f7377" roughness={0.95} sheen={1} sheenRoughness={0.7} sheenColor="#9aa0a8" side={THREE.DoubleSide} />
    </mesh>
  )
}

/** Fake volumetric sunbeam: the window rectangle extruded along the sun direction to the floor. */
function SunBeam() {
  const { geometry, material } = useMemo(() => {
    const dir = SUN_TARGET.clone().sub(SUN_POS).normalize()
    const corners = [
      [WIN.z - WIN.w / 2, WIN.y - WIN.h / 2],
      [WIN.z + WIN.w / 2, WIN.y - WIN.h / 2],
      [WIN.z + WIN.w / 2, WIN.y + WIN.h / 2],
      [WIN.z - WIN.w / 2, WIN.y + WIN.h / 2],
    ].map(([z, y]) => new THREE.Vector3(WALL_X, y, z))
    const far = corners.map((c) => c.clone().addScaledVector(dir, -c.y / dir.y))
    const pos: number[] = []
    const along: number[] = []
    for (let i = 0; i < 4; i++) {
      const a = corners[i], b = corners[(i + 1) % 4], fa = far[i], fb = far[(i + 1) % 4]
      for (const [p, t] of [[a, 0], [b, 0], [fb, 1], [a, 0], [fb, 1], [fa, 1]] as const) {
        pos.push(p.x, p.y, p.z)
        along.push(t)
      }
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
    geometry.setAttribute('along', new THREE.Float32BufferAttribute(along, 1))
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      uniforms: { uDay: { value: 0 } },
      vertexShader: /* glsl */ `
        attribute float along; varying float vAlong;
        void main() { vAlong = along; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uDay; varying float vAlong;
        void main() { gl_FragColor = vec4(vec3(1.0, 0.93, 0.8), (1.0 - vAlong * 0.85) * 0.085 * uDay); }`,
    })
    return { geometry, material }
  }, [])
  useFrame(() => (material.uniforms.uDay.value = dayMix.value))
  return <mesh geometry={geometry} material={material} userData={{ noShadow: true }} />
}

/** Dust motes drifting in the beam; only visible by day. */
function Dust() {
  const ref = useRef<THREE.Points>(null)
  const mat = useRef<THREE.PointsMaterial>(null)
  const positions = useMemo(() => {
    const r = rand(17)
    const dir = SUN_TARGET.clone().sub(SUN_POS).normalize()
    const out = new Float32Array(160 * 3)
    for (let i = 0; i < 160; i++) {
      const start = new THREE.Vector3(WALL_X, WIN.y + (r() - 0.5) * WIN.h, WIN.z + (r() - 0.5) * WIN.w)
      start.addScaledVector(dir, r() * (start.y / -dir.y) * 0.85)
      out.set([start.x, start.y, start.z], i * 3)
    }
    return out
  }, [])
  useFrame(({ clock }) => {
    ref.current!.rotation.y = Math.sin(clock.elapsedTime * 0.05) * 0.01
    ref.current!.position.y = Math.sin(clock.elapsedTime * 0.2) * 0.03
    mat.current!.opacity = 0.7 * dayMix.value
  })
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial ref={mat} color="#fff6e0" size={0.007} transparent depthWrite={false} />
    </points>
  )
}

export function Window() {
  const skies = useMemo(() => ({ day: skyTexture(true), night: skyTexture(false) }), [])
  const daySky = useRef<THREE.MeshBasicMaterial>(null)
  useFrame(() => (daySky.current!.opacity = dayMix.value))

  const { w, h } = WIN
  return (
    <>
      <group position={[WALL_X, WIN.y, WIN.z]} rotation-y={-Math.PI / 2}>
        <mesh position-z={-0.06} userData={{ noShadow: true }}>
          <planeGeometry args={[w * 1.3, h * 1.2]} />
          <meshBasicMaterial map={skies.night} toneMapped={false} />
        </mesh>
        <mesh position-z={-0.055} userData={{ noShadow: true }}>
          <planeGeometry args={[w * 1.3, h * 1.2]} />
          <meshBasicMaterial ref={daySky} map={skies.day} transparent toneMapped={false} />
        </mesh>
        {/* reveal (wall depth) */}
        <Box size={[0.04, h, 0.12]} position={[-w / 2 - 0.02, 0, 0]} color="#e6dccc" />
        <Box size={[0.04, h, 0.12]} position={[w / 2 + 0.02, 0, 0]} color="#e6dccc" />
        <Box size={[w + 0.08, 0.04, 0.12]} position={[0, h / 2 + 0.02, 0]} color="#e6dccc" />
        {/* frame + mullions */}
        {[-w / 2, 0, w / 2].map((dx) => (
          <Box key={dx} size={[0.05, h, 0.06]} position={[dx, 0, 0]} color={FRAME} roughness={0.4} />
        ))}
        {[-h / 2, h * 0.18, h / 2].map((dy) => (
          <Box key={dy} size={[w, 0.05, 0.06]} position={[0, dy, 0]} color={FRAME} roughness={0.4} />
        ))}
        {/* sill */}
        <Box size={[w + 0.2, 0.03, 0.2]} position={[0, -h / 2 - 0.02, 0.07]} color={FRAME} roughness={0.35} />
        {/* radiator */}
        <group position={[0, 0.45 - WIN.y, 0.05]}>
          {Array.from({ length: 12 }, (_, i) => (
            <Box key={i} size={[0.05, 0.5, 0.07]} position-x={(i - 5.5) * 0.062} color="#efede8" roughness={0.35} />
          ))}
          <Box size={[0.76, 0.03, 0.04]} position={[0, 0.2, 0]} color="#e2e0db" />
          <Box size={[0.76, 0.03, 0.04]} position={[0, -0.2, 0]} color="#e2e0db" />
        </group>
        {/* curtain pushed to the desk side */}
        <mesh position={[-0.25, 2.76 - WIN.y, 0.12]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.012, 0.012, 1.6, 10]} />
          <meshStandardMaterial color="#3a3a3a" metalness={0.7} roughness={0.35} />
        </mesh>
        <group position-y={-WIN.y}>
          <Curtain x={-0.74} width={0.56} />
        </group>
      </group>
      <SunBeam />
      <Dust />
    </>
  )
}
