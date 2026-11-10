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

const ease = (x: number) => 1 - (1 - x) ** 3

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
  // phase: 'show' holds a project; 'out' fades it up and away; 'in' brings the next one up from below
  const state = useRef({ i: 0, t: 0, phase: 'show' as 'show' | 'out' | 'in', ft: 0, hover: hovered })

  const draw = useMemo(
    () =>
      (alpha = 1, dy = 0) => {
        const c = canvas.getContext('2d')!
        const { i, hover } = state.current
        const p = projects[i]
        const g = c.createRadialGradient(W * 0.7, H * 0.1, 50, W * 0.6, H * 0.4, W)
        g.addColorStop(0, '#3b5a4a')
        g.addColorStop(0.75, '#141d22')
        c.fillStyle = g
        c.fillRect(0, 0, W, H)
        c.textBaseline = 'alphabetic'
        c.fillStyle = '#f3eadb99'
        c.font = `26px ${MONO}`
        c.fillText(`${site.name} / portfolio`, 48, 64)
        // progress strip: one segment per project, the current one lit
        const seg = 22
        const gap = 6
        const total = projects.length * (seg + gap) - gap
        projects.forEach((_, k) => {
          c.fillStyle = k === i ? '#e8894a' : '#f3eadb33'
          c.fillRect(W - 48 - total + k * (seg + gap), 52, seg, 5)
        })

        // project content: everything in here crossfades
        c.save()
        c.globalAlpha = alpha
        c.translate(0, dy)
        c.fillStyle = '#e8894a'
        c.font = `bold 30px ${MONO}`
        c.fillText(categories[p.category].toUpperCase(), 48, 160)
        c.fillStyle = '#f3eadb'
        c.font = `bold 84px ${MONO}`
        const titleLines = wrap(c, p.title, 48, 250, W - 96, 90, 2)
        c.fillStyle = '#f3eadbd9'
        c.font = `34px ${MONO}`
        // worst case (2 title + 2 summary lines) still ends ~110 px above the button
        const sumY = 250 + (titleLines - 1) * 90 + 70
        const sumLines = wrap(c, p.summary, 48, sumY, W - 96, 44, 2)
        const chipY = sumY + (sumLines - 1) * 44 + 30
        let x = 48
        c.font = `24px ${MONO}`
        for (const st of p.stack.slice(0, 5)) {
          const w = c.measureText(st).width + 22
          if (x + w > W - 48) break
          c.fillStyle = '#4f6b4a'
          c.fillRect(x, chipY, w, 36)
          c.fillStyle = '#f3eadb'
          c.fillText(st, x + 11, chipY + 26)
          x += w + 10
        }
        c.restore()

        // the call to action stays put while projects change
        const cta = '▶ click to open my projects'
        c.font = `bold 30px ${MONO}`
        const cw = c.measureText(cta).width + 44
        const cy = H - 96
        if (hover) {
          c.fillStyle = '#e8894a'
          c.fillRect(48, cy, cw, 58)
        }
        c.strokeStyle = '#e8894a'
        c.lineWidth = 3
        c.strokeRect(48, cy, cw, 58)
        c.fillStyle = hover ? '#1a100b' : '#e8894a'
        c.fillText(cta, 70, cy + 39)
        tex.needsUpdate = true
      },
    [canvas, tex],
  )

  useEffect(() => {
    state.current.hover = hovered
    if (state.current.phase === 'show') draw()
  }, [draw, hovered])

  useFrame((_, dt) => {
    const s = state.current
    if (s.phase === 'show') {
      s.t += dt
      if (s.t >= (s.hover ? 1.8 : 3.5)) {
        s.phase = 'out'
        s.ft = 0
      }
      return
    }
    // redraw only during the short transition
    s.ft += dt
    if (s.phase === 'out') {
      const k = Math.min(s.ft / 0.3, 1)
      draw(1 - k, -18 * ease(k))
      if (k === 1) {
        s.i = (s.i + 1) % projects.length
        s.phase = 'in'
        s.ft = 0
      }
    } else {
      const k = Math.min(s.ft / 0.45, 1)
      draw(ease(k), 26 * (1 - ease(k)))
      if (k === 1) {
        s.phase = 'show'
        s.t = 0
      }
    }
  })

  return tex
}
