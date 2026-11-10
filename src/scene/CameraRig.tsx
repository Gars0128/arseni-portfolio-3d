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
  // until the scene has loaded: wide establishing shot; then the camera flies in by itself
  const loaded = useStore((s) => s.loaded)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const baseAzimuth = Math.atan2(view.pos[0] - view.target[0], view.pos[2] - view.target[2])

  useEffect(() => {
    camera.fov = view.fov
    camera.updateProjectionMatrix()
  }, [camera, view.fov])

  useEffect(() => {
    const c = ref.current!
    const [x, y, z] = view.screen
    if (!loaded) {
      const [px, py, pz] = view.pos, [tx, ty, tz] = view.target
      c.setLookAt(tx + (px - tx) * 1.9, ty + (py - ty) * 1.9 + 0.6, tz + (pz - tz) * 1.9, tx, ty, tz, false)
    } else if (mode === 'monitor') c.setLookAt(x, y, z + view.monitorDistance, x, y, z, true)
    else c.setLookAt(...view.pos, ...view.target, true)
  }, [mode, view, loaded])

  // Idle parallax: drift the view slightly toward the mouse.
  useFrame(({ pointer }) => {
    const k = mode === 'room' ? view.parallax : 0
    ref.current?.setFocalOffset(pointer.x * k, pointer.y * k * 0.6, 0, true)
  })

  return (
    <CameraControls
      ref={ref}
      makeDefault
      enabled={mode === 'room' && loaded}
      minDistance={mode === 'room' ? view.minDistance : 0.1}
      smoothTime={0.6}
      maxDistance={loaded ? view.maxDistance : view.maxDistance * 2}
      minAzimuthAngle={baseAzimuth - view.azimuthRange * deg}
      maxAzimuthAngle={baseAzimuth + view.azimuthRange * deg}
      minPolarAngle={view.polar[0] * deg}
      maxPolarAngle={view.polar[1] * deg}
      truckSpeed={0}
    />
  )
}
