import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import { Interactive } from '../util'

const FUR = '#3a3330'

/** Original low-poly desk cat. Blinks every few seconds; click makes it hop. */
export function Cat() {
  const eyes = useRef<THREE.Group>(null)
  const body = useRef<THREE.Group>(null)
  const hop = useRef(0)

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime % 4
    eyes.current!.scale.y = t > 3.85 ? 0.1 : 1
    hop.current = Math.max(0, hop.current - dt * 2.5)
    body.current!.position.y = Math.sin(hop.current * Math.PI) * 0.05
  })

  return (
    <Interactive label="cat" position={[-0.42, 1.02, -1.85]} rotation-y={0.6} onSelect={() => (hop.current = 1)}>
      <group ref={body}>
        <mesh position-y={0.04} scale={[1, 0.85, 1.2]}>
          <icosahedronGeometry args={[0.05, 1]} />
          <meshStandardMaterial color={FUR} flatShading />
        </mesh>
        <mesh position={[0, 0.1, 0.04]}>
          <icosahedronGeometry args={[0.04, 1]} />
          <meshStandardMaterial color={FUR} flatShading />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.022, 0.14, 0.04]} rotation-z={-s * 0.3}>
            <coneGeometry args={[0.014, 0.03, 4]} />
            <meshStandardMaterial color={FUR} flatShading />
          </mesh>
        ))}
        <group ref={eyes} position={[0, 0.105, 0.077]}>
          {[-1, 1].map((s) => (
            <mesh key={s} position-x={s * 0.015}>
              <sphereGeometry args={[0.007, 6, 6]} />
              <meshStandardMaterial color="#ffd36a" emissive="#ffb030" emissiveIntensity={1.5} />
            </mesh>
          ))}
        </group>
        <mesh position={[0, 0.05, -0.07]} rotation-x={-0.9}>
          <cylinderGeometry args={[0.008, 0.006, 0.09, 5]} />
          <meshStandardMaterial color={FUR} />
        </mesh>
      </group>
    </Interactive>
  )
}
