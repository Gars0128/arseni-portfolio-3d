import { Billboard } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useStore, type RobotState } from '../../store'
import { Box, Interactive } from '../util'

const SHELL = '#eceef3'
const EYE: Record<RobotState, string> = { idle: '#39d5ff', listening: '#ff4d6d', thinking: '#ffb347', speaking: '#39d5ff' }

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

/** Alfred: a small desk robot. Click it to open the assistant. */
export function Robot() {
  const robot = useStore((s) => s.robot)
  const open = useStore((s) => s.assistantOpen)
  const setOpen = useStore((s) => s.setAssistantOpen)
  const [asked, setAsked] = useState(false)
  const head = useRef<THREE.Group>(null)
  const eyes = useRef<THREE.Group>(null)
  const mouth = useRef<THREE.Mesh>(null)
  const tip = useRef<THREE.MeshStandardMaterial>(null)
  const bubble = useRef<THREE.Group>(null)
  const eyeMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#000', emissive: EYE.idle, emissiveIntensity: 2.5, toneMapped: false }), [])
  const bubbleTex = useBubbleTexture()

  useFrame(({ clock, pointer }, dt) => {
    const t = clock.elapsedTime
    const h = head.current!
    // look toward the mouse, plus a little idle wobble
    h.rotation.y = THREE.MathUtils.damp(h.rotation.y, pointer.x * 0.5 + Math.sin(t * 0.7) * 0.08, 4, dt)
    h.rotation.x = THREE.MathUtils.damp(h.rotation.x, -pointer.y * 0.25 + (robot === 'thinking' ? 0.15 : 0), 4, dt)
    eyes.current!.scale.y = t % 3.6 > 3.45 ? 0.15 : 1 // blink
    eyeMat.emissive.lerp(new THREE.Color(EYE[robot]), 0.15)
    mouth.current!.scale.x = robot === 'speaking' ? 0.5 + Math.abs(Math.sin(t * 14)) * 0.9 : 0.6
    tip.current!.emissiveIntensity = robot === 'idle' ? 1.2 + Math.sin(t * 2) * 0.6 : 3 + Math.sin(t * 10)
    if (bubble.current) bubble.current.position.y = 0.3 + Math.sin(t * 2) * 0.008
  })

  return (
    <group position={[0.02, 0.76, -1.6]} rotation-y={-0.27}>
      <Interactive
        label="Alfred"
        onSelect={() => {
          setAsked(true)
          setOpen(!open)
        }}
      >
        <mesh position-y={0.012}>
          <cylinderGeometry args={[0.05, 0.058, 0.024, 32]} />
          <meshStandardMaterial color="#2a2a30" roughness={0.4} metalness={0.4} />
        </mesh>
        <Box size={[0.085, 0.075, 0.07]} radius={0.025} position-y={0.062} color={SHELL} roughness={0.35} />
        {[-1, 1].map((s) => (
          <Box key={s} size={[0.018, 0.05, 0.03]} radius={0.008} position={[s * 0.054, 0.06, 0]} rotation-z={s * 0.15} color={SHELL} roughness={0.35} />
        ))}
        <mesh position-y={0.108}>
          <cylinderGeometry args={[0.012, 0.014, 0.02, 16]} />
          <meshStandardMaterial color="#2a2a30" />
        </mesh>
        <group ref={head} position-y={0.155}>
          <Box size={[0.13, 0.095, 0.09]} radius={0.032} color={SHELL} roughness={0.3} />
          {/* face screen */}
          <Box size={[0.105, 0.066, 0.01]} radius={0.004} position-z={0.042} color="#0d0f16" roughness={0.15} metalness={0.3} />
          <group ref={eyes} position={[0, 0.008, 0.048]}>
            {[-1, 1].map((s) => (
              <mesh key={s} position-x={s * 0.023} material={eyeMat}>
                <boxGeometry args={[0.016, 0.022, 0.002]} />
              </mesh>
            ))}
          </group>
          <mesh ref={mouth} position={[0, -0.016, 0.048]} material={eyeMat}>
            <boxGeometry args={[0.028, 0.004, 0.002]} />
          </mesh>
          {/* antenna */}
          <mesh position-y={0.065}>
            <cylinderGeometry args={[0.0025, 0.0025, 0.04, 8]} />
            <meshStandardMaterial color="#2a2a30" />
          </mesh>
          <mesh position-y={0.088}>
            <sphereGeometry args={[0.009, 16, 12]} />
            <meshStandardMaterial ref={tip} color="#000" emissive="#39d5ff" toneMapped={false} />
          </mesh>
        </group>
      </Interactive>
      {!asked && (
        <Billboard>
          <group ref={bubble} position-y={0.3}>
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
