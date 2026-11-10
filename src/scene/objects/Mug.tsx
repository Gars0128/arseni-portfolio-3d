import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { rand } from '../util'

const STEAM = 24

export function Mug() {
  const ref = useRef<THREE.Points>(null)
  const positions = useMemo(() => {
    const r = rand(21)
    return Float32Array.from({ length: STEAM * 3 }, (_, i) => (i % 3 === 1 ? r() * 0.18 : (r() - 0.5) * 0.03))
  }, [])

  useFrame(({ clock }, dt) => {
    const a = ref.current!.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < STEAM; i++) {
      let y = a.getY(i) + dt * 0.05
      if (y > 0.18) y = 0
      a.setY(i, y)
      a.setX(i, Math.sin(clock.elapsedTime * 1.5 + i + y * 20) * 0.012 * (1 + y * 8))
    }
    a.needsUpdate = true
  })

  return (
    <group position={[1.08, 0.76, -1.4]}>
      <mesh position-y={0.045}>
        <cylinderGeometry args={[0.038, 0.034, 0.09, 16]} />
        <meshStandardMaterial color="#b0603a" roughness={0.5} />
      </mesh>
      <mesh position={[0.042, 0.05, 0]}>
        <torusGeometry args={[0.02, 0.006, 6, 12]} />
        <meshStandardMaterial color="#b0603a" />
      </mesh>
      <mesh position-y={0.084} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.034, 16]} />
        <meshStandardMaterial color="#3a2014" />
      </mesh>
      <points ref={ref} position-y={0.1}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#fff" size={0.012} transparent opacity={0.25} depthWrite={false} />
      </points>
    </group>
  )
}
