import { Environment, Lightformer, SoftShadows } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Selection } from '@react-three/postprocessing'
import { useLayoutEffect } from 'react'
import * as THREE from 'three'
import { CameraRig, type View } from './CameraRig'
import { Post } from './effects/Post'
import { Room } from './Room'
import { Cat } from './objects/Cat'
import { Collage } from './objects/Collage'
import { Lamp } from './objects/Lamp'
import { Monitor, SCREEN } from './objects/Monitor'
import { Mug } from './objects/Mug'
import { PC } from './objects/PC'
import { Plants } from './objects/Plants'
import { SideMonitor } from './objects/SideMonitor'
import { Window } from './objects/Window'
import { swayTime } from './shaders/sway'
import { Loaded } from './util'

const VIEW: View = {
  fov: 45,
  pos: [-0.55, 1.55, 1.35],
  target: [0.8, 1.15, -1.6],
  screen: SCREEN.position,
  monitorDistance: 0.55,
  minDistance: 1.4,
  maxDistance: 4.2,
  azimuthRange: 32,
  polar: [60, 95],
  parallax: 0.07,
}

function Setup() {
  const scene = useThree((s) => s.scene)
  useLayoutEffect(() => {
    scene.background = new THREE.Color('#15110e')
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh && !o.userData.noShadow) o.castShadow = o.receiveShadow = true
    })
  }, [scene])
  useFrame((_, dt) => (swayTime.value += dt))
  return null
}

export function Experience() {
  return (
    <Selection>
      <SoftShadows size={22} samples={12} focus={0.7} />
      {/* soft image-based fill: warm ceiling bounce + cool window side */}
      <Environment resolution={64} environmentIntensity={0.3}>
        <Lightformer form="rect" intensity={1.6} color="#ffe2c4" position={[0, 3, 0]} rotation-x={Math.PI / 2} scale={[5, 5, 1]} />
        <Lightformer form="rect" intensity={1.4} color="#a8bfff" position={[2.6, 1.6, -4]} scale={[2, 2, 1]} />
      </Environment>
      <ambientLight intensity={0.18} color="#ffe6cc" />
      <hemisphereLight args={['#fff0dc', '#4a3a30', 0.3]} />
      {/* warm ceiling fill */}
      <pointLight position={[0.6, 2.6, -0.3]} intensity={1.1} color="#ffd6a8" decay={1.6} />
      {/* monitor glow */}
      <pointLight position={[0.55, 1.22, -1.6]} intensity={0.35} distance={1.2} color="#bcd0ff" decay={2} />

      <Room />
      <Collage />
      <Window />
      <Monitor />
      <SideMonitor />
      <PC />
      <Lamp />
      <Plants />
      <Mug />
      <Cat />

      <CameraRig view={VIEW} />
      <Loaded />
      <Setup />
      <Post />
    </Selection>
  )
}
