import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { Box, Interactive } from '../util'

/** Glass-front tower on the floor: spinning fans + slowly cycling RGB. */
export function PC() {
  const fans = useRef<THREE.Group[]>([])
  const rgb = useRef<THREE.MeshStandardMaterial>(null)
  const boost = useRef(1)

  useFrame(({ clock }, dt) => {
    boost.current = THREE.MathUtils.lerp(boost.current, 1, dt)
    fans.current.forEach((f) => (f.rotation.z -= dt * 9 * boost.current))
    rgb.current?.emissive.setHSL((clock.elapsedTime * 0.05) % 1, 0.8, 0.5)
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
          <mesh rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.055, 0.006, 6, 24]} />
            <meshStandardMaterial ref={i === 0 ? rgb : undefined} color="#111" emissive="#ff00aa" emissiveIntensity={2.5} />
          </mesh>
        </group>
      ))}
      <Box size={[0.16, 0.04, 0.12]} position={[0, -0.06, -0.1]} color="#2a2a2a" />
    </Interactive>
  )
}
