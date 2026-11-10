import { SoftShadows } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Selection } from '@react-three/postprocessing'
import { useLayoutEffect } from 'react'
import * as THREE from 'three'
import { CameraRig, type View } from './CameraRig'
import { Post } from './effects/Post'
import { Room } from './Room'
import { Cat } from './objects/Cat'
import { Collage } from './objects/Collage'
import { ArcLight } from './objects/ArcLight'
import { Lights } from './objects/Lights'
import { Monitor, SCREEN } from './objects/Monitor'
import { Mug } from './objects/Mug'
import { PC } from './objects/PC'
import { Props } from './objects/Props'
import { Robot } from './objects/Robot'
import { Plants } from './objects/Plants'
import { SideMonitor } from './objects/SideMonitor'
import { SpeakerAudio } from './objects/SpeakerAudio'
import { Window } from './objects/Window'
import { swayTime } from './shaders/sway'
import { Loaded } from './util'

const VIEW: View = {
  fov: 45,
  pos: [-0.85, 1.7, 1.45],
  target: [0.55, 1.1, -1.45],
  screen: SCREEN.position,
  monitorDistance: 0.55,
  minDistance: 0.3,
  maxDistance: 4.2,
  azimuthRange: 32,
  polar: [60, 95],
  parallax: 0.07,
  bounds: [[-1.9, 0.08, -1.95], [1.55, 2.7, 2.2]],
}

function Setup() {
  const scene = useThree((s) => s.scene)
  useLayoutEffect(() => {
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
      <SoftShadows size={9} samples={12} focus={0.9} />
      <Lights />
      {/* screen glow */}
      <pointLight position={[0.5, 1.25, -1.6]} intensity={0.3} distance={1.2} color="#bcd0ff" decay={2} />

      <Room />
      <Collage />
      <Window />
      <Monitor />
      <SideMonitor />
      <PC />
      <ArcLight />
      <Plants />
      <Mug />
      <Cat />
      <SpeakerAudio />
      <Robot />
      <Props />

      <CameraRig view={VIEW} />
      <Loaded />
      <Setup />
      <Post />
    </Selection>
  )
}
