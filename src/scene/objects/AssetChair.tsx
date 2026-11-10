import { useGLTF, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { dayMix } from './Lights'

// Course assets are local-only (public/room is git-ignored); the procedural Chair is used when they're missing.
const BASE = `${import.meta.env.BASE_URL}room/`
const MODEL = `${BASE}topChairModel.glb`
const DRACO = `${import.meta.env.BASE_URL}draco/`
const HEIGHT = 1.3 // metres, floor → top of the backrest
const BASE_RADIUS = 1.25 // reference-room units around the swivel axis (covers the casters)
const TRI = new THREE.Triangle()
const NORMAL = new THREE.Vector3()

export const chairAssetAvailable: Promise<boolean> = fetch(MODEL, { method: 'HEAD' })
  // the dev server answers unknown paths with index.html, so check the type too
  .then((r) => r.ok && !r.headers.get('content-type')?.includes('html'))
  .catch(() => false)

/**
 * The chair's legs and casters are baked into the room mesh, not the chair model.
 * Cut them out: room triangles inside a cylinder around the swivel axis, below the seat, minus flat floor pieces.
 */
function cutChairBase(room: THREE.Object3D, axis: THREE.Vector3, seatBottom: number) {
  room.updateMatrixWorld(true)
  const pos: number[] = []
  const uv: number[] = []
  const tri = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]
  const tuv = [new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2()]
  room.traverse((o) => {
    if (!(o instanceof THREE.Mesh)) return
    const g = o.geometry as THREE.BufferGeometry
    const p = g.attributes.position as THREE.BufferAttribute, u = g.attributes.uv as THREE.BufferAttribute
    const idx = g.index
    const count = idx ? idx.count : p.count

    for (let i = 0; i < count; i += 3) {
      for (let k = 0; k < 3; k++) {
        const v = idx ? idx.getX(i + k) : i + k
        tri[k].fromBufferAttribute(p, v).applyMatrix4(o.matrixWorld)
        tuv[k].fromBufferAttribute(u, v)
      }
      const cx = (tri[0].x + tri[1].x + tri[2].x) / 3 - axis.x
      const cz = (tri[0].z + tri[1].z + tri[2].z) / 3 - axis.z
      const cy = (tri[0].y + tri[1].y + tri[2].y) / 3
      if (cx * cx + cz * cz > BASE_RADIUS ** 2 || cy > seatBottom) continue
      // floor pieces are large and horizontal; caster faces are tiny, so they survive
      const n = TRI.set(tri[0], tri[1], tri[2])
      // only at floor level, so the flat tops of the legs stay
      if (Math.max(tri[0].y, tri[1].y, tri[2].y) < 0.05 && n.getArea() > 0.01 && Math.abs(n.getNormal(NORMAL).y) > 0.98) continue
      for (const t of tri) pos.push(t.x, t.y, t.z)
      for (const t of tuv) uv.push(t.x, t.y)
    }
  })
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  g.computeBoundingBox()
  return g
}

/**
 * The top model's lowest part (the upper gas-lift stub under the seat) sits ~0.2 units off the swivel axis,
 * so it hangs crooked next to the column. Move that connected part onto the axis. Idempotent (cached scene).
 */
function centerLowestPart(top: THREE.Object3D, axis: THREE.Vector3) {
  const m = top.getObjectByProperty('isMesh', true) as THREE.Mesh | undefined
  if (!m || m.geometry.userData.stubCentered) return
  const p = m.geometry.attributes.position as THREE.BufferAttribute
  const idx = m.geometry.index!
  // union-find over vertices sharing a position (Draco splits seams)
  const key = (i: number) => [p.getX(i), p.getY(i), p.getZ(i)].map((n) => n.toFixed(4)).join()
  const first = new Map<string, number>()
  const parent: number[] = []
  const find = (a: number): number => (parent[a] === a ? a : (parent[a] = find(parent[a])))
  const rep = (i: number) => first.get(key(i))!
  for (let i = 0; i < p.count; i++) if (!first.has(key(i))) first.set(key(i), (parent[i] = i))
  for (let t = 0; t < idx.count; t += 3) {
    const a = find(rep(idx.getX(t)))
    for (const k of [1, 2]) {
      const b = find(rep(idx.getX(t + k)))
      if (a !== b) parent[b] = a
    }
  }
  const v = new THREE.Vector3()
  let lowest = -1, minY = Infinity
  for (let i = 0; i < p.count; i++) {
    const y = v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld).y
    if (y < minY) [minY, lowest] = [y, find(rep(i))]
  }
  const part = [...Array(p.count).keys()].filter((i) => find(rep(i)) === lowest)
  const box = new THREE.Box3()
  for (const i of part) box.expandByPoint(v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld))
  const c = box.getCenter(new THREE.Vector3())
  const inv = m.matrixWorld.clone().invert()
  for (const i of part) {
    v.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld)
    v.x += axis.x - c.x
    v.z += axis.z - c.z
    v.applyMatrix4(inv)
    p.setXYZ(i, v.x, v.y, v.z)
  }
  p.needsUpdate = true
  m.geometry.computeBoundingBox()
  m.geometry.computeBoundingSphere()
  m.geometry.userData.stubCentered = true
}

/** The reference room's chair — top and baked-in base — with its day/night bake and slow swivel. */
export function AssetChair({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  const { scene } = useGLTF(MODEL, DRACO)
  const { scene: room } = useGLTF(`${BASE}roomModel.glb`, DRACO)
  const [day, night] = useTexture([`${BASE}bakedDay.jpg`, `${BASE}bakedNight.jpg`])

  const material = useMemo(() => {
    for (const t of [day, night]) t.flipY = false
    return new THREE.ShaderMaterial({
      uniforms: { uDay: { value: day }, uNight: { value: night }, uMix: { value: 0 } },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uDay, uNight; uniform float uMix; varying vec2 vUv;
        void main() {
          vec3 c = mix(texture2D(uNight, vUv).rgb, texture2D(uDay, vUv).rgb, uMix);
          // bakes are display-referred: convert to linear so the output pass restores them
          gl_FragColor = sRGBTransferEOTF(vec4(c, 1.0));
        }`,
    })
  }, [day, night])

  const pivot = scene.children[0]
  const [fit] = useState(() => {
    // the cached scene keeps the offset/swivel of a previous mount (StrictMode, HMR): measure from rest
    scene.position.set(0, 0, 0)
    pivot.rotation.set(0, 0, 0)
    scene.updateMatrixWorld(true)
    const top = new THREE.Box3().setFromObject(scene)
    centerLowestPart(scene, pivot.position)
    const base = cutChairBase(room, pivot.position, top.min.y + 0.02)
    const floor = base.boundingBox!.min.y
    return { base, scale: HEIGHT / (top.max.y - floor), offset: [-pivot.position.x, -floor, -pivot.position.z] as const }
  })

  useLayoutEffect(() => scene.traverse((o) => o instanceof THREE.Mesh && (o.material = material)), [scene, material])
  useFrame(({ clock }) => {
    pivot.rotation.y = Math.sin(clock.elapsedTime * 0.5) * 0.5
    material.uniforms.uMix.value = dayMix.value
  })

  return (
    <group position={position} rotation-y={rotation} scale={fit.scale}>
      <group position={fit.offset}>
        <primitive object={scene} />
        <mesh geometry={fit.base} material={material} />
      </group>
    </group>
  )
}
