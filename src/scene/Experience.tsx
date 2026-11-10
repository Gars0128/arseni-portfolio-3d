import { useFrame, useThree } from '@react-three/fiber'
import { Selection } from '@react-three/postprocessing'
import { useLayoutEffect } from 'react'
import * as THREE from 'three'
import { CameraRig } from './CameraRig'
import { Post } from './effects/Post'
import { Room } from './Room'
import { FloatingCode } from './objects/FloatingCode'
import { Lamp } from './objects/Lamp'
import { Monitor } from './objects/Monitor'
import { Mug } from './objects/Mug'
import { PC } from './objects/PC'
import { Pegboard } from './objects/Pegboard'
import { Plants } from './objects/Plants'
import { SideMonitor } from './objects/SideMonitor'
import { swayTime } from './shaders/sway'
import { Cat } from './objects/Cat'

function Setup() {
  const scene = useThree((s) => s.scene)
  useLayoutEffect(() => {
    scene.background = new THREE.Color('#1a100b')
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
      <ambientLight intensity={0.45} color="#ffe2c8" />
      <hemisphereLight args={['#ffe0c0', '#40302a', 0.5]} />
      <pointLight position={[-0.6, 2.4, 0.6]} intensity={1.6} color="#ffc896" decay={1.5} />
      {/* monitor backlight glow on the wall */}
      <pointLight position={[0.45, 1.3, -1.93]} intensity={1.6} distance={1.6} color="#ff7a3a" decay={2} />

      <Room />
      <Monitor />
      <SideMonitor />
      <PC />
      <Lamp />
      <Pegboard />
      <Plants />
      <Mug />
      <Cat />
      <FloatingCode />

      <CameraRig />
      <Setup />
      <Post />
    </Selection>
  )
}
