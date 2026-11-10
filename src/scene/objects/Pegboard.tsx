import { useFrame } from '@react-three/fiber'
import { useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { Box, Interactive, useCanvasTexture } from '../util'

/** Slides out from the wall while hovered. */
function Slide({ out, children }: { out: boolean; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, dt) => {
    const g = ref.current!
    g.position.x = THREE.MathUtils.damp(g.position.x, out ? -0.06 : 0, 10, dt)
  })
  return <group ref={ref}>{children}</group>
}

function Hanging({ z, y, children }: { z: number; y: number; children: ReactNode }) {
  return <Interactive position={[1.555, y, z]}>{(h) => <Slide out={h}>{children}</Slide>}</Interactive>
}

export function Pegboard() {
  const holes = useCanvasTexture(256, 224, (c, w, h) => {
    c.fillStyle = '#c99a62'
    c.fillRect(0, 0, w, h)
    c.fillStyle = '#5b3d22'
    for (let x = 8; x < w; x += 16) for (let y = 8; y < h; y += 16) c.fillRect(x - 2, y - 2, 4, 4)
  })

  return (
    <group>
      <mesh position={[1.592, 1.42, -1.3]} rotation-y={-Math.PI / 2}>
        <boxGeometry args={[0.82, 0.72, 0.012]} />
        <meshStandardMaterial map={holes} roughness={0.9} />
      </mesh>

      {/* shelf above with books */}
      <Box size={[0.22, 0.025, 0.9]} position={[1.49, 1.92, -1.3]} color="#a06d45" />
      {['#4f6b4a', '#7a2f2a', '#d9b25a', '#4b6a8a', '#2f2f2f'].map((c, i) => (
        <Box key={c} size={[0.15, 0.17 + (i % 3) * 0.02, 0.035]} position={[1.5, 2.02 + (i % 3) * 0.01, -1.05 - i * 0.04]} color={c} />
      ))}

      {/* mini keyboard */}
      <Hanging z={-1.32} y={1.68}>
        <Box size={[0.025, 0.09, 0.32]} color="#2b2b2b" />
        <Box size={[0.006, 0.07, 0.3]} position-x={-0.015} color="#e8894a" />
      </Hanging>

      {/* headphones */}
      <Hanging z={-1.52} y={1.42}>
        <mesh rotation-y={Math.PI / 2}>
          <torusGeometry args={[0.07, 0.01, 6, 16, Math.PI]} />
          <meshStandardMaterial color="#1f1f1f" />
        </mesh>
        {[-1, 1].map((s) => (
          <Box key={s} size={[0.04, 0.07, 0.05]} position={[0, -0.01, s * 0.07]} color="#2b2b2b" />
        ))}
      </Hanging>

      {/* gamepad */}
      <Hanging z={-1.12} y={1.44}>
        <Box size={[0.03, 0.07, 0.15]} color="#efe9df" />
        {[-0.04, 0.04].map((dz) => (
          <mesh key={dz} position={[-0.02, -0.01, dz]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.011, 0.011, 0.012, 8]} />
            <meshStandardMaterial color="#333" />
          </mesh>
        ))}
      </Hanging>

      {/* little shelf with pencil cup */}
      <Box size={[0.12, 0.015, 0.36]} position={[1.53, 1.18, -1.38]} color="#a06d45" />
      <mesh position={[1.53, 1.23, -1.28]}>
        <cylinderGeometry args={[0.03, 0.03, 0.08, 10]} />
        <meshStandardMaterial color="#2f4a3a" />
      </mesh>
      {['#e8894a', '#4b6a8a', '#d9b25a'].map((c, i) => (
        <Box key={c} size={[0.006, 0.12, 0.006]} position={[1.53 + (i - 1) * 0.01, 1.28, -1.28 + (i - 1) * 0.012]} rotation-z={(i - 1) * 0.15} color={c} />
      ))}
    </group>
  )
}
