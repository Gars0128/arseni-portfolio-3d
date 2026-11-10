import { Billboard } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo } from 'react'
import * as THREE from 'three'

/** Steam: a billboard plane with scrolling procedural noise, twisted in the vertex shader. */
function Steam() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uTime: { value: 0 } },
        vertexShader: /* glsl */ `
          uniform float uTime;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec3 p = position;
            p.x += sin(uv.y * 6.0 - uTime * 1.5) * 0.012 * uv.y;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }`,
        fragmentShader: /* glsl */ `
          uniform float uTime;
          varying vec2 vUv;
          float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float noise(vec2 p) {
            vec2 i = floor(p), f = fract(p);
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
          }
          void main() {
            vec2 uv = vec2(vUv.x * 3.0, vUv.y * 2.0 - uTime * 0.35);
            float n = noise(uv * 2.0) * 0.6 + noise(uv * 4.0) * 0.4;
            n = smoothstep(0.45, 1.0, n);
            float edge = smoothstep(0.0, 0.25, vUv.x) * smoothstep(1.0, 0.75, vUv.x);
            float fade = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.4, vUv.y);
            gl_FragColor = vec4(vec3(1.0, 0.95, 0.9), n * edge * fade * 0.55);
          }`,
      }),
    [],
  )
  useFrame((_, dt) => (material.uniforms.uTime.value += dt))
  return (
    <Billboard position-y={0.2} lockY>
      <mesh material={material} userData={{ noShadow: true }}>
        <planeGeometry args={[0.07, 0.22, 1, 16]} />
      </mesh>
    </Billboard>
  )
}

export function Mug() {
  return (
    <group position={[1.08, 0.76, -1.4]}>
      <mesh position-y={0.045}>
        <cylinderGeometry args={[0.038, 0.034, 0.09, 24]} />
        <meshStandardMaterial color="#b0603a" roughness={0.35} />
      </mesh>
      <mesh position={[0.042, 0.05, 0]}>
        <torusGeometry args={[0.02, 0.006, 8, 16]} />
        <meshStandardMaterial color="#b0603a" roughness={0.35} />
      </mesh>
      <mesh position-y={0.084} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.034, 24]} />
        <meshStandardMaterial color="#2a160c" roughness={0.1} />
      </mesh>
      <mesh position-y={0.002}>
        <cylinderGeometry args={[0.055, 0.055, 0.004, 24]} />
        <meshStandardMaterial color="#e9dcc4" />
      </mesh>
      <Steam />
    </group>
  )
}
