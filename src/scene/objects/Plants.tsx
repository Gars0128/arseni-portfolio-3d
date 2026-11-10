import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { swayMaterial } from '../shaders/sway'
import { rand } from '../util'

const leafGeo = new THREE.IcosahedronGeometry(0.03, 0)
const leafMats = [swayMaterial('#3f6b3a'), swayMaterial('#5b8a45')]

type PlantProps = {
  position: [number, number, number]
  seed: number
  hanging?: boolean
  leaves?: number
  spread?: number
  potColor?: string
}

/** Pot + instanced leaves. Bush leaves grow up; hanging leaves trail down in vines. */
function Plant({ position, seed, hanging, leaves = 40, spread = 0.12, potColor = '#d8cbb5' }: PlantProps) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const mat = leafMats[seed % 2]
  const matrices = useMemo(() => {
    const r = rand(seed)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const e = new THREE.Euler()
    return Array.from({ length: leaves }, (_, i) => {
      const pos = hanging
        ? new THREE.Vector3(Math.cos(i % 6) * 0.07 + (r() - 0.5) * 0.03, -r() * 0.6, Math.sin(i % 6) * 0.07 + (r() - 0.5) * 0.03)
        : new THREE.Vector3((r() - 0.5) * spread * 2, 0.04 + r() * spread * 1.4, (r() - 0.5) * spread * 2)
      const s = 0.6 + r() * 0.8
      q.setFromEuler(e.set(r() * 3, r() * 3, r() * 3))
      return m.clone().compose(pos, q, new THREE.Vector3(s * 1.4, s * 0.5, s))
    })
  }, [seed, leaves, spread, hanging])

  useLayoutEffect(() => {
    matrices.forEach((mx, i) => ref.current!.setMatrixAt(i, mx))
    ref.current!.instanceMatrix.needsUpdate = true
  }, [matrices])

  return (
    <group position={position}>
      {hanging && (
        <mesh position-y={0.4}>
          <cylinderGeometry args={[0.003, 0.003, 0.8, 4]} />
          <meshStandardMaterial color="#e9dcc4" />
        </mesh>
      )}
      <mesh position-y={hanging ? 0.04 : -0.035}>
        <cylinderGeometry args={[0.07, 0.05, 0.08, 10]} />
        <meshStandardMaterial color={potColor} roughness={0.8} />
      </mesh>
      <instancedMesh ref={ref} args={[leafGeo, mat, leaves]} position-y={hanging ? 0.06 : 0} />
    </group>
  )
}

export function Plants() {
  return (
    <>
      <Plant position={[-1.25, 2.05, -1.6]} seed={11} hanging leaves={70} />
      {/* windowsill */}
      <Plant position={[1.5, 0.97, -0.75]} seed={8} leaves={26} spread={0.06} potColor="#d8cbb5" />
    </>
  )
}
