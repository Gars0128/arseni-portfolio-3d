import { Environment, Lightformer } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import { useStore } from '../../store'

/** 0 = night, 1 = day; eased every frame so every light crossfades together. */
export const dayMix = { value: 0 }
export const SUN_POS = new THREE.Vector3(5, 3.6, -0.3)
export const SUN_TARGET = new THREE.Vector3(0.4, 0, -1.25)

const lerp = THREE.MathUtils.lerp

/** All global lights. Practical lights (LED arc, screens) live with their objects. */
export function Lights() {
  const night = useStore((s) => s.night)
  const scene = useThree((s) => s.scene)
  const amb = useRef<THREE.AmbientLight>(null)
  const hemi = useRef<THREE.HemisphereLight>(null)
  const sun = useRef<THREE.DirectionalLight>(null)
  const key = useRef<THREE.SpotLight>(null)
  const fill = useRef<THREE.PointLight>(null)
  const sky = useRef<THREE.PointLight>(null)
  const pc = useRef<THREE.PointLight>(null)
  const [targets] = useState(() => {
    const sunT = new THREE.Object3D()
    sunT.position.copy(SUN_TARGET)
    const keyT = new THREE.Object3D()
    keyT.position.set(0.5, 0.76, -1.55)
    return { sunT, keyT }
  })

  useFrame((_, dt) => {
    const d = (dayMix.value = THREE.MathUtils.damp(dayMix.value, night ? 0 : 1, 2.2, dt))
    // night palette after the reference room's night bake: violet-blue base, orange desk pool, blue PC glow
    amb.current!.intensity = lerp(0.22, 0.28, d)
    amb.current!.color.lerpColors(C.ambN, C.ambD, d)
    hemi.current!.intensity = lerp(0.35, 0.6, d)
    hemi.current!.color.lerpColors(C.hemiN, C.hemiD, d)
    hemi.current!.groundColor.lerpColors(C.groundN, C.groundD, d)
    sun.current!.intensity = lerp(0, 5, d)
    key.current!.intensity = lerp(3.2, 0.4, d)
    key.current!.color.lerpColors(C.keyN, C.keyD, d)
    fill.current!.intensity = lerp(0.55, 0.3, d)
    fill.current!.color.lerpColors(C.fillN, C.fillD, d)
    pc.current!.intensity = lerp(1.4, 0.2, d)
    sky.current!.intensity = lerp(0.6, 2.2, d)
    sky.current!.color.lerpColors(NIGHT_SKY, DAY_SKY, d)
    scene.environmentIntensity = lerp(0.1, 0.55, d)
    scene.background = BG.lerpColors(BG_NIGHT, BG_DAY, d)
  })

  return (
    <>
      <Environment resolution={64}>
        <Lightformer form="rect" intensity={1.6} color="#ffe2c4" position={[0, 3, 0]} rotation-x={Math.PI / 2} scale={[5, 5, 1]} />
        <Lightformer form="rect" intensity={2} color="#cfe0ff" position={[4, 1.6, -1]} rotation-y={-Math.PI / 2} scale={[2, 2, 1]} />
      </Environment>
      <ambientLight ref={amb} color="#ffe6cc" />
      <hemisphereLight ref={hemi} args={['#fff4e6', '#4a3a30']} />
      <primitive object={targets.sunT} />
      <primitive object={targets.keyT} />
      {/* sun through the window: the hard-edged patch on the floor and desk */}
      <directionalLight
        ref={sun}
        position={SUN_POS}
        target={targets.sunT}
        color="#fff1d6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
        shadow-camera-near={0.5}
        shadow-camera-far={10}
      />
      {/* warm ceiling pendant (off-screen): soft key light and shadows at night */}
      <spotLight
        ref={key}
        position={[-0.3, 2.7, -0.4]}
        target={targets.keyT}
        color="#ffd2a0"
        angle={0.75}
        penumbra={1}
        decay={1.6}
        distance={6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
      <pointLight ref={fill} position={[-0.8, 2.2, 0.8]} decay={1.6} />
      {/* blue PC glow under the desk */}
      <pointLight ref={pc} position={[-0.1, 0.35, -1.45]} color="#0082ff" distance={1.8} decay={1.8} />
      {/* sky light spilling in from the window */}
      <pointLight ref={sky} position={[1.3, 1.7, -0.95]} distance={4} decay={1.4} />
    </>
  )
}

const C = {
  ambN: new THREE.Color('#6b5cff'), ambD: new THREE.Color('#ffe6cc'),
  hemiN: new THREE.Color('#7a6cff'), hemiD: new THREE.Color('#fff4e6'),
  groundN: new THREE.Color('#2a1630'), groundD: new THREE.Color('#4a3a30'),
  keyN: new THREE.Color('#ff7a2a'), keyD: new THREE.Color('#ffd2a0'),
  fillN: new THREE.Color('#9a6cff'), fillD: new THREE.Color('#ffcf9a'),
}
const NIGHT_SKY = new THREE.Color('#4a6aff')
const DAY_SKY = new THREE.Color('#dbe8ff')
const BG = new THREE.Color()
const BG_NIGHT = new THREE.Color('#0c0912')
const BG_DAY = new THREE.Color('#2a2622')
