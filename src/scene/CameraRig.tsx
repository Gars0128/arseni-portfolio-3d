import { CameraControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import type { PerspectiveCamera } from 'three'
import { useStore } from '../store'

export type View = {
  fov: number
  pos: [number, number, number]
  target: [number, number, number]
  /** screen center; the camera stops `monitorDistance` in front of it (+z) */
  screen: readonly [number, number, number]
  monitorDistance: number
  minDistance: number
  maxDistance: number
  azimuthRange: number
  polar: [number, number]
  parallax: number
}

const deg = Math.PI / 180

export function CameraRig({ view }: { view: View }) {
  const ref = useRef<CameraControls>(null)
  const mode = useStore((s) => s.mode)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const baseAzimuth = Math.atan2(view.pos[0] - view.target[0], view.pos[2] - view.target[2])

  useEffect(() => {
    camera.fov = view.fov
    camera.updateProjectionMatrix()
  }, [camera, view.fov])

  useEffect(() => {
    const c = ref.current!
    const [x, y, z] = view.screen
    if (mode === 'monitor') c.setLookAt(x, y, z + view.monitorDistance, x, y, z, true)
    else c.setLookAt(...view.pos, ...view.target, true)
  }, [mode, view])

  // Idle parallax: drift the view slightly toward the mouse.
  useFrame(({ pointer }) => {
    const k = mode === 'room' ? view.parallax : 0
    ref.current?.setFocalOffset(pointer.x * k, pointer.y * k * 0.6, 0, true)
  })

  return (
    <CameraControls
      ref={ref}
      makeDefault
      enabled={mode === 'room'}
      smoothTime={0.45}
      minDistance={mode === 'room' ? view.minDistance : 0.1}
      maxDistance={view.maxDistance}
      minAzimuthAngle={baseAzimuth - view.azimuthRange * deg}
      maxAzimuthAngle={baseAzimuth + view.azimuthRange * deg}
      minPolarAngle={view.polar[0] * deg}
      maxPolarAngle={view.polar[1] * deg}
      truckSpeed={0}
    />
  )
}
