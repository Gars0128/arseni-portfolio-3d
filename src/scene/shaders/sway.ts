import * as THREE from 'three'

export const swayTime = { value: 0 }

/** Foliage material whose vertices sway with a sine wave; amplitude grows with distance from the plant root. */
export function swayMaterial(color: string) {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true })
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = swayTime
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
#ifdef USE_INSTANCING
  vec3 ip = (instanceMatrix * vec4(position, 1.0)).xyz;
#else
  vec3 ip = position;
#endif
  float amp = abs(ip.y) * 0.08;
  transformed.x += sin(uTime * 1.3 + ip.y * 4.0 + ip.z * 3.0) * amp;
  transformed.z += cos(uTime * 1.1 + ip.y * 3.0) * amp * 0.6;`,
      )
  }
  return m
}
