import { CameraControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
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
  /** the camera and its target never leave this box (the room) */
  bounds: [[number, number, number], [number, number, number]]
}

const deg = Math.PI / 180

/** Imperative camera moves for the rest of the app (PC click, HUD reset). Set while CameraRig is mounted. */
export const cameraApi = {
  /** Fly to look at `point`, `distance` metres in front of it along the current viewing direction. */
  focus: (() => {}) as (point: THREE.Vector3Like, distance?: number) => void,
  reset: () => {},
}

export function CameraRig({ view }: { view: View }) {
  const ref = useRef<CameraControls>(null)
  const mode = useStore((s) => s.mode)
  // until the scene has loaded: wide establishing shot; then the camera flies in by itself
  const loaded = useStore((s) => s.loaded)
  const { camera, gl, scene, raycaster } = useThree()
  const baseAzimuth = Math.atan2(view.pos[0] - view.target[0], view.pos[2] - view.target[2])

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    cam.fov = view.fov
    cam.updateProjectionMatrix()
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

  // keep target and camera inside the room
  useEffect(() => {
    const c = ref.current!
    c.setBoundary(new THREE.Box3(new THREE.Vector3(...view.bounds[0]), new THREE.Vector3(...view.bounds[1])))
    c.boundaryEnclosesCamera = true
  }, [view.bounds])

  useEffect(() => {
    const dir = new THREE.Vector3()
    cameraApi.focus = (point, distance = 0.55) => {
      const c = ref.current
      if (!c) return
      const p = new THREE.Vector3().copy(point)
      // approach from where we already look, slightly from above
      c.getPosition(dir).sub(p).setY(Math.max(dir.y, 0.15)).normalize().multiplyScalar(distance).add(p)
      c.setLookAt(dir.x, dir.y, dir.z, p.x, p.y, p.z, true)
    }
    cameraApi.reset = () => ref.current?.setLookAt(...view.pos, ...view.target, true)
  }, [view])

  // double-click anything in the room to fly up to it
  useEffect(() => {
    const el = gl.domElement
    const ndc = new THREE.Vector2()
    const onDbl = (e: MouseEvent) => {
      if (useStore.getState().mode !== 'room') return
      const r = el.getBoundingClientRect()
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
      raycaster.setFromCamera(ndc, camera)
      const hit = raycaster.intersectObjects(scene.children, true).find((h) => (h.object as THREE.Mesh).isMesh && h.object.visible)
      if (hit) cameraApi.focus(hit.point, 0.75)
    }
    el.addEventListener('dblclick', onDbl)
    return () => el.removeEventListener('dblclick', onDbl)
  }, [gl, camera, scene, raycaster])

  // Idle parallax: drift the overview slightly toward the mouse; fades out when inspecting up close.
  useFrame(({ pointer }) => {
    const c = ref.current
    if (!c) return
    const k = mode === 'room' ? view.parallax * THREE.MathUtils.clamp((c.distance - 1) / 1.5, 0, 1) : 0
    c.setFocalOffset(pointer.x * k, pointer.y * k * 0.6, 0, true)
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
      // wheel zooms toward whatever is under the cursor; right-drag pans
      dollyToCursor
      truckSpeed={1.2}
    />
  )
}
