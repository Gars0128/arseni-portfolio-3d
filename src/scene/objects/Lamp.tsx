import { useFrame } from '@react-three/fiber'
import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useStore } from '../../store'
import { Interactive, rand } from '../util'

const HEAD = new THREE.Vector3(1.0, 1.26, -1.62)
const DUST = 90

/** Desk lamp: click toggles the spotlight; dust motes drift in the beam. */
export function Lamp() {
  const on = useStore((s) => s.lampOn)
  const toggle = useStore((s) => s.toggleLamp)
  const [target] = useState(() => {
    const o = new THREE.Object3D()
    o.position.set(0.62, 0.76, -1.38)
    return o
  })

  return (
    <>
      <Interactive label="lamp" onSelect={toggle}>
        <mesh position={[1.22, 0.775, -1.8]}>
          <cylinderGeometry args={[0.07, 0.08, 0.025, 16]} />
          <meshStandardMaterial color="#1c1c1c" />
        </mesh>
        <mesh position={[1.22, 1.02, -1.8]}>
          <cylinderGeometry args={[0.008, 0.008, 0.5, 6]} />
          <meshStandardMaterial color="#1c1c1c" />
        </mesh>
        <mesh position={[1.11, 1.27, -1.71]} rotation={[0.6, 0, 0.9]}>
          <cylinderGeometry args={[0.008, 0.008, 0.3, 6]} />
          <meshStandardMaterial color="#1c1c1c" />
        </mesh>
        <mesh position={HEAD} rotation={[0.35, 0, 0.5]} userData={{ noShadow: true }}>
          <coneGeometry args={[0.075, 0.1, 16, 1, true]} />
          <meshStandardMaterial color="#1c1c1c" side={2} />
        </mesh>
        <mesh position={[HEAD.x, HEAD.y - 0.03, HEAD.z]} userData={{ noShadow: true }}>
          <sphereGeometry args={[0.03, 12, 8]} />
          <meshStandardMaterial color="#fff" emissive="#ffc27a" emissiveIntensity={on ? 6 : 0} />
        </mesh>
      </Interactive>
      <primitive object={target} />
      <spotLight
        position={[HEAD.x, HEAD.y - 0.04, HEAD.z]}
        target={target}
        intensity={on ? 4 : 0}
        color="#ffbf80"
        angle={0.6}
        penumbra={0.6}
        decay={2}
        distance={4}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0005}
      />
      {on && <Dust />}
    </>
  )
}

function Dust() {
  const ref = useRef<THREE.Points>(null)
  const { positions, speed } = useMemo(() => {
    const r = rand(3)
    const positions = new Float32Array(DUST * 3)
    const speed = new Float32Array(DUST)
    for (let i = 0; i < DUST; i++) {
      positions.set([(r() - 0.5) * 0.3, r() * 0.45, (r() - 0.5) * 0.3], i * 3)
      speed[i] = 0.01 + r() * 0.02
    }
    return { positions, speed }
  }, [])

  useFrame(({ clock }, dt) => {
    const attr = ref.current!.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < DUST; i++) {
      let y = attr.getY(i) - speed[i] * dt
      if (y < 0) y = 0.45
      attr.setY(i, y)
      attr.setX(i, attr.getX(i) + Math.sin(clock.elapsedTime * 0.5 + i) * 0.0004)
    }
    attr.needsUpdate = true
  })

  return (
    <points ref={ref} position={[0.8, 0.8, -1.5]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#ffd9a0" size={0.006} transparent opacity={0.8} depthWrite={false} />
    </points>
  )
}
