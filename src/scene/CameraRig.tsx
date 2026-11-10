import { CameraControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { SCREEN } from './objects/Monitor'
import { useStore } from '../store'

const ROOM_POS = [-1.1, 1.6, 1.5] as const
const ROOM_TARGET = [0.35, 1.1, -1.6] as const
const BASE_AZIMUTH = Math.atan2(ROOM_POS[0] - ROOM_TARGET[0], ROOM_POS[2] - ROOM_TARGET[2])
const deg = Math.PI / 180

export function CameraRig() {
  const ref = useRef<CameraControls>(null)
  const mode = useStore((s) => s.mode)

  useEffect(() => {
    const c = ref.current!
    const [x, y, z] = SCREEN.position
    if (mode === 'monitor') c.setLookAt(x, y, z + 0.56, x, y, z, true)
    else c.setLookAt(...ROOM_POS, ...ROOM_TARGET, true)
  }, [mode])

  // Idle parallax: drift the view slightly toward the mouse.
  useFrame(({ pointer }) => {
    const k = mode === 'room' ? 1 : 0
    ref.current?.setFocalOffset(pointer.x * 0.07 * k, pointer.y * 0.04 * k, 0, true)
  })

  return (
    <CameraControls
      ref={ref}
      makeDefault
      enabled={mode === 'room'}
      smoothTime={0.45}
      minDistance={mode === 'room' ? 1.3 : 0.1}
      maxDistance={3.6}
      minAzimuthAngle={BASE_AZIMUTH - 35 * deg}
      maxAzimuthAngle={BASE_AZIMUTH + 35 * deg}
      minPolarAngle={60 * deg}
      maxPolarAngle={95 * deg}
      truckSpeed={0}
    />
  )
}
