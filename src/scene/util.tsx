import { RoundedBox, useCursor } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { Select } from '@react-three/postprocessing'
import { useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import * as THREE from 'three'

export const rand = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}

type BoxProps = Omit<ComponentProps<typeof RoundedBox>, 'args' | 'children' | 'ref'> & {
  size: [number, number, number]
  color: string
  emissive?: string
  emissiveIntensity?: number
  roughness?: number
  metalness?: number
  map?: THREE.Texture
  radius?: number
}

/** Rounded box: bevelled edges catch light, which is most of what makes primitives look "modelled". */
export function Box({ size, color, emissive, emissiveIntensity = 1, roughness = 0.75, metalness = 0, map, radius = 0.012, ...props }: BoxProps) {
  return (
    <RoundedBox args={size} radius={Math.min(radius, Math.min(...size) * 0.45)} smoothness={radius > 0.012 ? 4 : 2} {...props}>
      <meshStandardMaterial
        color={color}
        map={map}
        roughness={roughness}
        metalness={metalness}
        emissive={emissive ?? '#000'}
        emissiveIntensity={emissiveIntensity}
      />
    </RoundedBox>
  )
}

export function useCanvasTexture(
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
) {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = w
    c.height = h
    draw(c.getContext('2d')!, w, h)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    t.anisotropy = 4
    return t
    // draw is a static recipe per call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h])
}

type InteractiveProps = Omit<ThreeElements['group'], 'children'> & {
  label?: string
  disabled?: boolean
  onSelect?: () => void
  children: ReactNode | ((hovered: boolean) => ReactNode)
}

/** Hover = outline + pointer cursor; click = onSelect. */
export function Interactive({ disabled, onSelect, children, label, ...props }: InteractiveProps) {
  const [hovered, setHovered] = useState(false)
  const on = hovered && !disabled
  useCursor(on)
  return (
    <Select enabled={on}>
      <group
        {...props}
        name={label}
        onPointerOver={(e) => (e.stopPropagation(), setHovered(true))}
        onPointerOut={() => setHovered(false)}
        onClick={(e) => {
          if (disabled) return
          e.stopPropagation()
          onSelect?.()
        }}
      >
        {typeof children === 'function' ? children(on) : children}
      </group>
    </Select>
  )
}
