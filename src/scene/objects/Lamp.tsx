import { useState } from 'react'
import * as THREE from 'three'
import { useStore } from '../../store'
import { Interactive } from '../util'

const CENTER = new THREE.Vector3(0.98, 1.0, -1.9)
const R = 0.22

/** Ring lamp behind the monitor: click toggles it. Washes the wall and casts the soft desk shadows. */
export function Lamp() {
  const on = useStore((s) => s.lampOn)
  const toggle = useStore((s) => s.toggleLamp)
  const [target] = useState(() => {
    const o = new THREE.Object3D()
    o.position.set(0.4, 0.76, -1.35)
    return o
  })

  return (
    <>
      <Interactive label="ring lamp" onSelect={toggle}>
        <group position={CENTER} rotation-y={-0.6}>
          {/* dark housing + glowing inner strip */}
          <mesh userData={{ noShadow: true }}>
            <torusGeometry args={[R, 0.012, 12, 64]} />
            <meshStandardMaterial color="#1c1c1e" roughness={0.4} metalness={0.4} />
          </mesh>
          <mesh userData={{ noShadow: true }}>
            <torusGeometry args={[R - 0.012, 0.005, 8, 64]} />
            <meshStandardMaterial color="#fff" emissive="#fff3e0" emissiveIntensity={on ? 2.2 : 0} toneMapped={false} />
          </mesh>
          <mesh position-y={-R - 0.015}>
            <cylinderGeometry args={[0.008, 0.008, 0.03, 8]} />
            <meshStandardMaterial color="#1c1c1e" />
          </mesh>
          <mesh position-y={-0.24 + 0.006}>
            <cylinderGeometry args={[0.07, 0.075, 0.012, 24]} />
            <meshStandardMaterial color="#1c1c1e" roughness={0.5} />
          </mesh>
        </group>
      </Interactive>
      <primitive object={target} />
      {/* wall wash */}
      <pointLight position={[CENTER.x - 0.05, CENTER.y, CENTER.z - 0.04]} intensity={on ? 0.9 : 0} distance={1.6} color="#fff0dc" decay={2} />
      {/* soft key light onto the desk */}
      <spotLight
        position={[CENTER.x - 0.1, CENTER.y + 0.25, CENTER.z + 0.15]}
        target={target}
        intensity={on ? 3.2 : 0}
        color="#ffe6c8"
        angle={0.9}
        penumbra={1}
        decay={2}
        distance={4}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-radius={6}
      />
    </>
  )
}
