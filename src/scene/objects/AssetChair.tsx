import { useGLTF, useTexture } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { dayMix } from './Lights'

// Course assets are local-only (public/room is git-ignored); the procedural Chair is used when they're missing.
const BASE = `${import.meta.env.BASE_URL}room/`
const MODEL = `${BASE}topChairModel.glb`
const DRACO = `${import.meta.env.BASE_URL}draco/`
const HEIGHT = 1.18 // metres, top of the backrest

export const chairAssetAvailable: Promise<boolean> = fetch(MODEL, { method: 'HEAD' })
  // the dev server answers unknown paths with index.html, so check the type too
  .then((r) => r.ok && !r.headers.get('content-type')?.includes('html'))
  .catch(() => false)

/** The reference room's chair with its baked day/night textures and its slow swivel. */
export function AssetChair({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  const { scene } = useGLTF(MODEL, DRACO)
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
    scene.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(scene)
    return { scale: HEIGHT / (box.max.y - box.min.y), offset: [-pivot.position.x, -box.min.y, -pivot.position.z] as const }
  })

  useLayoutEffect(() => scene.traverse((o) => o instanceof THREE.Mesh && (o.material = material)), [scene, material])
  useFrame(({ clock }) => {
    pivot.rotation.y = Math.sin(clock.elapsedTime * 0.5) * 0.5
    material.uniforms.uMix.value = dayMix.value
  })

  return (
    <group position={position} rotation-y={rotation} scale={fit.scale}>
      <primitive object={scene} position={fit.offset} />
    </group>
  )
}
