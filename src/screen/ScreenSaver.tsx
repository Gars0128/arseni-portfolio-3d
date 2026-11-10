import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { projects } from '../content/projects'
import { categories } from '../content/schema'
import { site } from '../content/site'

const W = 1280
const H = 725
const MONO = "'Courier New', ui-monospace, monospace"

function wrap(c: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number, maxLines: number) {
  const words = text.split(' ')
  let line = ''
  let lines = 0
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i]
    if (c.measureText(test).width > maxW && line) {
      c.fillText(lines === maxLines - 1 ? `${line}…` : line, x, y + lines * lineH)
      if (++lines >= maxLines) return lines
      line = words[i]
    } else line = test
  }
  c.fillText(line, x, y + lines * lineH)
  return lines + 1
}

/**
 * What the monitor shows from the room: projects cycling like a screensaver; hover highlights the call to action.
 * Drawn into a texture (not DOM) so the chair and other objects correctly occlude the screen.
 */
export function useScreenSaverTexture(hovered: boolean) {
  const { canvas, tex } = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = W
    canvas.height = H
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 8
    return { canvas, tex }
  }, [])
  const state = useRef({ i: 0, t: 0 })

  const draw = useMemo(
    () => (hover: boolean) => {
      const c = canvas.getContext('2d')!
      const p = projects[state.current.i]
      const g = c.createRadialGradient(W * 0.7, H * 0.1, 50, W * 0.6, H * 0.4, W)
      g.addColorStop(0, '#3b5a4a')
      g.addColorStop(0.75, '#141d22')
      c.fillStyle = g
      c.fillRect(0, 0, W, H)
      c.textBaseline = 'alphabetic'
      c.fillStyle = '#f3eadb99'
      c.font = `26px ${MONO}`
      c.fillText(`${site.name} / portfolio`, 48, 64)
      const count = `${state.current.i + 1} / ${projects.length}`
      c.fillText(count, W - 48 - c.measureText(count).width, 64)
      c.fillStyle = '#e8894a'
      c.font = `bold 32px ${MONO}`
      c.fillText(categories[p.category].toUpperCase(), 48, 180)
      c.fillStyle = '#f3eadb'
      c.font = `bold 96px ${MONO}`
      const titleLines = wrap(c, p.title, 48, 285, W - 96, 100, 2)
      c.fillStyle = '#f3eadbd9'
      c.font = `38px ${MONO}`
      const sumY = 285 + titleLines * 100 + 10
      const sumLines = wrap(c, p.summary, 48, sumY, W - 96, 48, 2)
      let x = 48
      const chipY = sumY + sumLines * 48 + 10
      c.font = `26px ${MONO}`
      for (const s of p.stack.slice(0, 5)) {
        const w = c.measureText(s).width + 24
        if (x + w > W - 48) break
        c.fillStyle = '#4f6b4a'
        c.fillRect(x, chipY, w, 40)
        c.fillStyle = '#f3eadb'
        c.fillText(s, x + 12, chipY + 29)
        x += w + 12
      }
      const cta = '▶ click to open my projects'
      c.font = `bold 32px ${MONO}`
      const cw = c.measureText(cta).width + 44
      const cy = H - 110
      if (hover) {
        c.fillStyle = '#e8894a'
        c.fillRect(48, cy, cw, 64)
      }
      c.strokeStyle = '#e8894a'
      c.lineWidth = 3
      c.strokeRect(48, cy, cw, 64)
      c.fillStyle = hover ? '#1a100b' : '#e8894a'
      c.fillText(cta, 70, cy + 43)
      tex.needsUpdate = true
    },
    [canvas, tex],
  )

  useEffect(() => draw(hovered), [draw, hovered])

  useFrame((_, dt) => {
    const s = state.current
    s.t += dt
    if (s.t < (hovered ? 1.8 : 3.5)) return
    s.t = 0
    s.i = (s.i + 1) % projects.length
    draw(hovered)
  })

  return tex
}
