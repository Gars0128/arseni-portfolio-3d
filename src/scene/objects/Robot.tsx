import { Billboard } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { ASSISTANT_NAME } from '../../assistant/brain'
import { useStore, type RobotState } from '../../store'
import { Interactive } from '../util'

const EYE: Record<RobotState, string> = { idle: '#39ffb0', listening: '#ff2a6d', thinking: '#ffb347', speaking: '#00f0ff' }

const shell = new THREE.MeshStandardMaterial({ color: '#4caf5a', roughness: 0.3, metalness: 0.45 })
const belly = new THREE.MeshStandardMaterial({ color: '#b9dfa0', roughness: 0.45, metalness: 0.2 })
const metal = new THREE.MeshStandardMaterial({ color: '#1a1d22', roughness: 0.3, metalness: 0.8 })

/** "Ask me" speech bubble drawn once on a canvas. */
function useBubbleTexture() {
  return useMemo(() => {
    const el = document.createElement('canvas')
    el.width = 256
    el.height = 128
    const c = el.getContext('2d')!
    c.fillStyle = '#ffffff'
    c.beginPath()
    c.roundRect(8, 8, 240, 84, 36)
    c.fill()
    c.beginPath()
    c.moveTo(110, 90)
    c.lineTo(128, 120)
    c.lineTo(146, 90)
    c.fill()
    c.fillStyle = '#120e1c'
    c.font = 'bold 44px -apple-system, Segoe UI, Arial, sans-serif'
    c.textAlign = 'center'
    c.fillText('Ask me ✦', 128, 66)
    const t = new THREE.CanvasTexture(el)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
}

/** The desk assistant: an original little robot frog. Click it to open the chat. */
export function Robot() {
  const robot = useStore((s) => s.robot)
  const open = useStore((s) => s.assistantOpen)
  const setOpen = useStore((s) => s.setAssistantOpen)
  const [asked, setAsked] = useState(false)
  const head = useRef<THREE.Group>(null)
  const eyes = useRef<THREE.Mesh[]>([])
  const mouth = useRef<THREE.Mesh>(null)
  const bubble = useRef<THREE.Group>(null)
  const eyeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#000', emissive: EYE.idle, emissiveIntensity: 2.4, toneMapped: false }), [])
  const glowMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#0b2a1a', emissive: '#39ffb0', emissiveIntensity: 0.6, toneMapped: false, transparent: true, opacity: 0.85 }), [])
  const bubbleTex = useBubbleTexture()

  useFrame(({ clock, pointer }, dt) => {
    const t = clock.elapsedTime
    const h = head.current!
    // look toward the mouse; tilt the head while "thinking"
    h.rotation.y = THREE.MathUtils.damp(h.rotation.y, pointer.x * 0.45 + Math.sin(t * 0.6) * 0.06, 4, dt)
    h.rotation.z = THREE.MathUtils.damp(h.rotation.z, robot === 'thinking' ? 0.18 : 0, 5, dt)
    const blink = t % 4.2 > 4.05 ? 0.12 : 1
    eyes.current.forEach((e) => e && (e.scale.y = blink))
    eyeMat.emissive.lerp(new THREE.Color(EYE[robot]), 0.15)
    const talk = robot === 'speaking' ? Math.abs(Math.sin(t * 13)) : 0
    mouth.current!.scale.y = 1 + talk * 2.5
    // spine strip glows with speech
    glowMat.emissiveIntensity = robot === 'speaking' ? 1.2 + talk * 2 : robot === 'listening' ? 1.4 : 0.5
    glowMat.emissive.set(robot === 'listening' ? '#ff2a6d' : '#39ffb0')
    if (bubble.current) bubble.current.position.y = 0.27 + Math.sin(t * 2) * 0.008
  })

  return (
    <group position={[0.02, 0.76, -1.6]} rotation-y={-0.27} scale={1.3}>
      <Interactive
        label={ASSISTANT_NAME}
        onSelect={() => {
          setAsked(true)
          setOpen(!open)
        }}
      >
        {/* hind legs folded at the sides, front feet in front */}
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh material={shell} position={[s * 0.058, 0.026, -0.008]} scale={[0.55, 0.45, 1.15]}>
              <sphereGeometry args={[0.04, 20, 14]} />
            </mesh>
            <mesh material={shell} position={[s * 0.03, 0.012, 0.05]} scale={[1.3, 0.45, 1]}>
              <sphereGeometry args={[0.014, 14, 10]} />
            </mesh>
            <mesh material={metal} position={[s * 0.058, 0.028, 0.03]} rotation-x={Math.PI / 2}>
              <torusGeometry args={[0.012, 0.003, 6, 16]} />
            </mesh>
          </group>
        ))}
        {/* body + belly plate */}
        <mesh material={shell} position-y={0.048} scale={[1.15, 0.85, 1]}>
          <sphereGeometry args={[0.05, 28, 20]} />
        </mesh>
        <mesh material={belly} position={[0, 0.042, 0.022]} scale={[0.85, 0.75, 0.7]}>
          <sphereGeometry args={[0.045, 24, 16]} />
        </mesh>
        {/* neon spine strip */}
        <mesh material={glowMat} position={[0, 0.07, -0.042]} rotation-x={-0.6}>
          <boxGeometry args={[0.006, 0.004, 0.05]} />
        </mesh>

        <group ref={head} position-y={0.088}>
          <mesh material={shell} scale={[1.4, 0.68, 1.1]}>
            <sphereGeometry args={[0.045, 28, 20]} />
          </mesh>
          {/* mouth: a wide light strip */}
          <mesh ref={mouth} material={eyeMat} position={[0, -0.002, 0.049]}>
            <boxGeometry args={[0.06, 0.0025, 0.002]} />
          </mesh>
          {/* domed eyes with screen pupils */}
          {[-1, 1].map((s, i) => (
            <group key={s} position={[s * 0.034, 0.03, 0.006]}>
              <mesh material={shell}>
                <sphereGeometry args={[0.022, 24, 18]} />
              </mesh>
              <mesh material={metal} position-z={0.0205}>
                <torusGeometry args={[0.014, 0.0025, 8, 24]} />
              </mesh>
              <mesh ref={(m) => void (m && (eyes.current[i] = m))} material={eyeMat} position-z={0.0226}>
                <circleGeometry args={[0.011, 24]} />
              </mesh>
            </group>
          ))}
        </group>
      </Interactive>
      {!asked && (
        <Billboard>
          <group ref={bubble} position-y={0.27}>
            <mesh userData={{ noShadow: true }}>
              <planeGeometry args={[0.13, 0.065]} />
              <meshBasicMaterial map={bubbleTex} transparent toneMapped={false} depthWrite={false} />
            </mesh>
          </group>
        </Billboard>
      )}
    </group>
  )
}
