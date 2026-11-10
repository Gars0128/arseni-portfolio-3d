import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useStore } from '../../store'
import { Interactive } from '../util'
import { dayMix } from './Lights'

// Arc LED standing behind the main monitor, ends resting on the desk.
const CENTER = new THREE.Vector3(0.5, 0.77, -1.965)
// stays within the monitor width (0.68 m); hidden behind the monitor except its legs
const R = 0.3
const SQUASH = 1.7 // top stays below the monitor top: only the legs show

/** Elliptical arch as a tube: constant thickness, uv.x runs along the strip (used by the rainbow). */
const arcGeometries = new Map<number, THREE.TubeGeometry>()
function arcGeometry(radius: number) {
  let g = arcGeometries.get(radius)
  if (!g) {
    const pts = Array.from({ length: 49 }, (_, i) => {
      const t = (i / 48) * Math.PI
      return new THREE.Vector3(Math.cos(t) * R, Math.sin(t) * R * SQUASH, 0)
    })
    g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 128, radius, 10)
    arcGeometries.set(radius, g)
  }
  return g
}

const glowTexture = (() => {
  let t: THREE.Texture | null = null
  return () => {
    if (t) return t
    const el = document.createElement('canvas')
    el.width = 512
    el.height = 400
    const c = el.getContext('2d')!
    c.filter = 'blur(28px)'
    c.strokeStyle = '#fff'
    c.lineWidth = 46
    c.beginPath()
    c.ellipse(256, 380, 200, 250, 0, Math.PI, 0)
    c.stroke()
    c.filter = 'blur(60px)'
    c.globalAlpha = 0.35
    c.fillStyle = '#fff'
    c.beginPath()
    c.ellipse(256, 380, 170, 220, 0, Math.PI, 0)
    c.fill()
    t = new THREE.CanvasTexture(el)
    return t
  }
})()

/** The LED arc. Click it (or use the HUD) to cycle colours; 'rainbow' runs a hue wave along the strip. */
export function ArcLight() {
  const led = useStore((s) => s.led)
  const nextLed = useStore((s) => s.nextLed)
  const color = useMemo(() => new THREE.Color(), [])
  const glow = useRef<THREE.MeshBasicMaterial>(null)
  const lights = useRef<THREE.PointLight[]>([])

  const strip = useMemo(
    () =>
      new THREE.ShaderMaterial({
        toneMapped: false,
        uniforms: { uColor: { value: new THREE.Color() }, uRainbow: { value: 0 }, uTime: { value: 0 }, uPower: { value: 4 } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor; uniform float uRainbow, uTime, uPower;
          varying vec2 vUv;
          vec3 hue(float h) { return clamp(abs(mod(h * 6.0 + vec3(0, 4, 2), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
          void main() {
            vec3 c = mix(uColor, hue(vUv.x * 1.5 - uTime * 0.15), uRainbow);
            gl_FragColor = vec4(c * uPower, 1.0);
          }`,
      }),
    [],
  )

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const rainbow = led === 'rainbow'
    if (rainbow) color.setHSL((t * 0.15 * 1.5) % 1, 0.9, 0.55)
    else color.set(led)
    const u = strip.uniforms
    u.uColor.value.copy(color)
    u.uRainbow.value = rainbow ? 1 : 0
    u.uTime.value = t
    const night = 1 - dayMix.value
    u.uPower.value = 1.6 + 2.6 * night
    glow.current!.color.copy(color).multiplyScalar(0.25 + 0.75 * night)
    lights.current.forEach((l, i) => {
      if (rainbow) l.color.setHSL((t * 0.225 + i * 0.25) % 1, 0.9, 0.55)
      else l.color.copy(color)
      l.intensity = 0.15 + 0.75 * night
    })
  })

  return (
    <group>
      <Interactive label="LED arc" onSelect={nextLed}>
        <group position={CENTER}>
          <mesh userData={{ noShadow: true }}>
            <primitive object={arcGeometry(0.012)} attach="geometry" />
            <meshStandardMaterial color="#1a1a1c" roughness={0.4} metalness={0.5} />
          </mesh>
          <mesh material={strip} position-z={0.012} userData={{ noShadow: true }}>
            <primitive object={arcGeometry(0.005)} attach="geometry" />
          </mesh>
        </group>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[CENTER.x + s * R, 0.772, CENTER.z]}>
            <cylinderGeometry args={[0.025, 0.03, 0.01, 20]} />
            <meshStandardMaterial color="#1a1a1c" roughness={0.5} />
          </mesh>
        ))}
      </Interactive>
      {/* fake bounce: blurred arc of light on the wall, like the reference room's light-map glow */}
      <mesh position={[CENTER.x, CENTER.y + 0.55, -1.997]} userData={{ noShadow: true }}>
        <planeGeometry args={[1.25, 1.75]} />
        <meshBasicMaterial ref={glow} map={glowTexture()} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      {[-0.25, 0, 0.25].map((dx, i) => (
        <pointLight
          key={dx}
          ref={(l) => void (l && (lights.current[i] = l))}
          position={[CENTER.x + dx, CENTER.y + (i === 1 ? R * SQUASH : 0.35), CENTER.z + 0.08]}
          distance={1.3}
          decay={2}
        />
      ))}
    </group>
  )
}
