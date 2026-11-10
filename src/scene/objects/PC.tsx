import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { Box, Interactive } from '../util'

/** Glass-front tower on the floor: spinning fans + slowly cycling RGB. */
export function PC() {
  const fans = useRef<THREE.Group[]>([])
  const [rgb] = useState(() => new THREE.MeshStandardMaterial({ color: '#111', emissive: '#ff00aa', emissiveIntensity: 3 }))
  const boost = useRef(1)

  useFrame(({ clock }, dt) => {
    boost.current = THREE.MathUtils.lerp(boost.current, 1, dt)
    fans.current.forEach((f) => (f.rotation.z -= dt * 9 * boost.current))
    rgb.emissive.setHSL((clock.elapsedTime * 0.05) % 1, 0.8, 0.5)
  })

  return (
    <Interactive label="pc" position={[-0.88, 0.25, -1.62]} onSelect={() => (boost.current = 5)}>
      <Box size={[0.24, 0.5, 0.02]} position-z={-0.23} color="#161616" />
      <Box size={[0.02, 0.5, 0.46]} position-x={0.11} color="#161616" />
      <Box size={[0.02, 0.5, 0.46]} position-x={-0.11} color="#161616" />
      <Box size={[0.24, 0.02, 0.46]} position-y={0.24} color="#161616" />
      <Box size={[0.24, 0.02, 0.46]} position-y={-0.24} color="#161616" />
      {/* glass front */}
      <mesh position-z={0.23} userData={{ noShadow: true }}>
        <planeGeometry args={[0.22, 0.48]} />
        <meshStandardMaterial color="#9ab" transparent opacity={0.18} roughness={0.05} />
      </mesh>
      {[0.14, 0, -0.14].map((y, i) => (
        <group key={y} position={[0, y, -0.2]} ref={(g) => void (g && (fans.current[i] = g))}>
          {[0, 1, 2, 3].map((b) => (
            <Box key={b} size={[0.1, 0.03, 0.005]} rotation-z={(b * Math.PI) / 2 + 0.3} position={[0, 0, 0.01]} color="#333" />
          ))}
          <mesh material={rgb}>
            <torusGeometry args={[0.058, 0.006, 8, 32]} />
          </mesh>
        </group>
      ))}
      {/* GPU with a light strip */}
      <Box size={[0.16, 0.04, 0.2]} position={[0.02, -0.06, -0.08]} color="#2a2a2a" metalness={0.5} roughness={0.4} />
      <mesh position={[0.02, -0.038, -0.08]} material={rgb}>
        <boxGeometry args={[0.14, 0.004, 0.01]} />
      </mesh>
    </Interactive>
  )
}
