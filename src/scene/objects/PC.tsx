import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { Box, Interactive } from '../util'

/** Glass-front tower on the floor: spinning fans + slowly cycling RGB. */
export function PC() {
  const fans = useRef<THREE.Group[]>([])
  const [rgb] = useState(() => new THREE.MeshStandardMaterial({ color: '#111', emissive: '#2a7dff', emissiveIntensity: 3 }))
  const boost = useRef(1)

  useFrame(({ clock }, dt) => {
    boost.current = THREE.MathUtils.lerp(boost.current, 1, dt)
    fans.current.forEach((f) => (f.rotation.z -= dt * 9 * boost.current))
    // blue, like the reference room PC glow; gently breathing
    rgb.emissiveIntensity = 2.4 + Math.sin(clock.elapsedTime * 1.2) * 0.8
  })

  return (
    <Interactive label="pc" position={[-0.22, 0.26, -1.66]} onSelect={() => (boost.current = 5)}>
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
