import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { audioCtx, audioEl } from '../../music'

/** 0..1 bass level, read by the speaker woofers. */
export const beat = { value: 0 }

// Module singleton: a media element can be connected to Web Audio only once (StrictMode/HMR remounts).
let shared: { listener: THREE.AudioListener; sound: THREE.PositionalAudio; analyser: THREE.AudioAnalyser } | null = null
function getRig() {
  if (shared) return shared
  const listener = new THREE.AudioListener()
  const sound = new THREE.PositionalAudio(listener)
  sound.setMediaElementSource(audioEl)
  sound.setRefDistance(1.6)
  sound.setRolloffFactor(0.6)
  sound.position.set(0.5, 0.9, -1.82)
  audioCtx.resume = () => listener.context.resume()
  return (shared = { listener, sound, analyser: new THREE.AudioAnalyser(sound, 64) })
}

/** Routes the shared <audio> through a positional source between the desk speakers. */
export function SpeakerAudio() {
  const camera = useThree((s) => s.camera)
  const [rig] = useState(getRig)

  useEffect(() => {
    camera.add(rig.listener)
    return () => void camera.remove(rig.listener)
  }, [camera, rig])

  useFrame((_, dt) => {
    const data = rig.analyser.getFrequencyData()
    const bass = (data[1] + data[2] + data[3]) / (3 * 255)
    beat.value = THREE.MathUtils.damp(beat.value, audioEl.paused ? 0 : bass, 18, dt)
  })

  return <primitive object={rig.sound} />
}
