import { useCursor } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import { Select } from '@react-three/postprocessing'
import { useMemo, useState, type ReactNode } from 'react'
import * as THREE from 'three'

export const rand = (seed: number) => () => {
  seed = (seed * 16807) % 2147483647
  return (seed - 1) / 2147483646
}

type BoxProps = ThreeElements['mesh'] & {
  size: [number, number, number]
  color: string
  emissive?: string
  emissiveIntensity?: number
}

export function Box({ size, color, emissive, emissiveIntensity = 1, ...props }: BoxProps) {
  return (
    <mesh {...props}>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={color}
        roughness={0.85}
        emissive={emissive ?? '#000'}
        emissiveIntensity={emissiveIntensity}
      />
    </mesh>
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
