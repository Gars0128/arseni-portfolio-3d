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
      <Plant position={[-1.48, 2.05, -1.55]} seed={11} hanging leaves={70} />
      <Plant position={[1.36, 2.05, 0.15]} seed={4} hanging leaves={55} potColor="#c9a67a" />
      <Plant position={[1.48, 1.99, -1.55]} seed={8} leaves={40} spread={0.1} potColor="#2f4a3a" />
      {/* plants in the hex shelves */}
      <Plant position={[-1.03, 1.863, -1.92]} seed={2} leaves={18} spread={0.06} potColor="#e9dcc4" />
      <Plant position={[-0.76, 2.023, -1.92]} seed={5} leaves={18} spread={0.06} potColor="#7a4a30" />
      <Plant position={[-0.76, 1.703, -1.92]} seed={9} leaves={16} spread={0.06} />
      {/* desk plant */}
      <Plant position={[0.16, 0.94, -1.86]} seed={6} leaves={14} spread={0.045} potColor="#c0432a" />
    </>
  )
}
