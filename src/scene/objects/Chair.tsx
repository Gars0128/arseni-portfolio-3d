import { useMemo } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

const fabric = (color: string, sheen = '#6a6e78') =>
  new THREE.MeshPhysicalMaterial({ color, roughness: 0.85, sheen: 1, sheenRoughness: 0.55, sheenColor: sheen, side: THREE.DoubleSide })

const FABRIC = fabric('#232428')
const PLASTIC = new THREE.MeshStandardMaterial({ color: '#141416', roughness: 0.45 })
const CHROME = new THREE.MeshStandardMaterial({ color: '#9a9a9e', metalness: 1, roughness: 0.25 })

/** Backrest: rounded slab bent so the sides wrap forward, with a lumbar bulge and a slightly narrower top. */
function backGeometry() {
  const g = new RoundedBoxGeometry(0.48, 0.74, 0.07, 6, 0.032)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i)
    const y = p.getY(i)
    let z = p.getZ(i)
    x *= 1 - 0.1 * (y / 0.74 + 0.5)
    z -= x * x * 0.9
    z -= 0.03 * Math.exp(-(((y + 0.16) / 0.12) ** 2))
    p.setXYZ(i, x, y, z)
  }
  g.computeVertexNormals()
  return g
}

/** Seat cushion with a gentle dome on top. */
function seatGeometry() {
  const g = new RoundedBoxGeometry(0.5, 0.09, 0.48, 6, 0.04)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
    if (y > 0) p.setY(i, y + 0.018 * Math.max(0, 1 - (x / 0.25) ** 2) * Math.max(0, 1 - (z / 0.24) ** 2))
  }
  g.computeVertexNormals()
  return g
}

/** Cloth lying flat for `flat` metres, then hanging over an edge with soft folds. */
function drapeGeometry(width: number, length: number, flat: number, seed: number) {
  const g = new THREE.PlaneGeometry(width, length, 24, 48)
  const p = g.attributes.position
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i)
    const t = p.getY(i) + length / 2
    const fold = Math.sin(x * 38 + seed + t * 5) * 0.01 + Math.sin(x * 13 + seed * 2) * 0.006
    if (t < flat) p.setXYZ(i, x, 0.012 + Math.abs(fold) * 0.6, flat / 2 - t)
    else {
      const d = t - flat
      const bend = Math.min(d / 0.05, 1)
      p.setXYZ(i, x * (1 + d * 0.12), -d * bend + fold * 0.3, -flat / 2 - 0.06 * Math.sin(bend * Math.PI * 0.5) - Math.abs(fold) * bend)
    }
  }
  g.computeVertexNormals()
  return g
}

/** Office chair after the real one: tall curved back, soft cushion, tube armrests, two blankets. */
export function Chair(props: { position: [number, number, number]; rotation: number }) {
  const geo = useMemo(
    () => ({
      back: backGeometry(),
      seat: seatGeometry(),
      blanket: drapeGeometry(0.56, 0.86, 0.44, 1),
      throw: drapeGeometry(0.3, 0.5, 0.1, 4),
      arms: [-1, 1].map(
        (s) =>
          new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3([
              new THREE.Vector3(s * 0.25, 0.49, 0.17),
              new THREE.Vector3(s * 0.28, 0.66, 0.12),
              new THREE.Vector3(s * 0.28, 0.68, -0.02),
              new THREE.Vector3(s * 0.28, 0.66, -0.14),
              new THREE.Vector3(s * 0.25, 0.5, -0.17),
            ]),
            32,
            0.013,
            8,
          ),
      ),
    }),
    [],
  )
  const blanketMat = useMemo(() => fabric('#8fa1a4', '#c8d8da'), [])
  const throwMat = useMemo(() => fabric('#a3302a', '#ff9a8a'), [])

  return (
    <group position={props.position} rotation-y={props.rotation}>
      {/* five-star base with twin-wheel casters */}
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} rotation-y={(i * Math.PI * 2) / 5}>
          <mesh material={PLASTIC} position={[0, 0.075, 0.15]} rotation-x={Math.PI / 2 - 0.12}>
            <cylinderGeometry args={[0.014, 0.022, 0.3, 10]} />
          </mesh>
          <mesh material={PLASTIC} position={[0, 0.03, 0.29]} rotation-z={Math.PI / 2}>
            <cylinderGeometry args={[0.028, 0.028, 0.03, 16]} />
          </mesh>
        </group>
      ))}
      <mesh material={CHROME} position-y={0.26}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 16]} />
      </mesh>
      <mesh material={PLASTIC} position-y={0.17}>
        <cylinderGeometry args={[0.032, 0.036, 0.16, 16]} />
      </mesh>
      <mesh material={PLASTIC} position-y={0.405}>
        <boxGeometry args={[0.22, 0.03, 0.2]} />
      </mesh>
      <mesh geometry={geo.seat} material={FABRIC} position-y={0.465} />
      {/* back + spine */}
      <mesh material={PLASTIC} position={[0, 0.55, 0.21]} rotation-x={-0.1}>
        <boxGeometry args={[0.05, 0.22, 0.03]} />
      </mesh>
      <mesh geometry={geo.back} material={FABRIC} position={[0, 0.92, 0.25]} rotation-x={-0.1} />
      {geo.arms.map((g, i) => (
        <mesh key={i} geometry={g} material={PLASTIC} />
      ))}
      {[-1, 1].map((s) => (
        <mesh key={s} material={PLASTIC} position={[s * 0.28, 0.69, -0.02]}>
          <boxGeometry args={[0.055, 0.022, 0.22]} />
        </mesh>
      ))}
      {/* blanket over the seat, hanging over the front edge */}
      <mesh geometry={geo.blanket} material={blanketMat} position={[0, 0.535, 0.02]} userData={{ noShadow: true }} castShadow />
      {/* red throw over the right armrest */}
      <group position={[0.28, 0.705, -0.02]} rotation-y={-Math.PI / 2}>
        <mesh geometry={geo.throw} material={throwMat} userData={{ noShadow: true }} castShadow />
      </group>
    </group>
  )
}
