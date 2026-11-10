import { useMemo } from 'react'
import * as THREE from 'three'
import { rand } from '../util'

type Draw = (c: CanvasRenderingContext2D, w: number, h: number) => void

const mountains = (sky: [string, string], ridges: string[], snow = false): Draw => (c, w, h) => {
  const g = c.createLinearGradient(0, 0, 0, h)
  g.addColorStop(0, sky[0])
  g.addColorStop(1, sky[1])
  c.fillStyle = g
  c.fillRect(0, 0, w, h)
  const r = rand(ridges.length * 7 + w)
  ridges.forEach((col, i) => {
    const base = h * (0.35 + i * 0.2)
    c.fillStyle = col
    c.beginPath()
    c.moveTo(0, h)
    for (let x = 0; x <= w; x += w / 12) c.lineTo(x, base - r() * h * 0.25)
    c.lineTo(w, h)
    c.fill()
    if (snow && i === 0) {
      c.fillStyle = '#ffffffaa'
      for (let k = 0; k < 40; k++) c.fillRect(r() * w, base - h * 0.2 + r() * h * 0.12, 6 + r() * 14, 2)
    }
  })
}

const polaroid = (inner: Draw, caption = ''): Draw => (c, w, h) => {
  c.fillStyle = '#f7f5ef'
  c.fillRect(0, 0, w, h)
  const m = w * 0.07
  c.save()
  c.translate(m, m)
  inner(c, w - 2 * m, h * 0.72)
  c.restore()
  if (caption) {
    c.fillStyle = '#333'
    c.font = `${Math.round(w * 0.09)}px Helvetica, Arial, sans-serif`
    c.textAlign = 'center'
    c.fillText(caption, w / 2, h * 0.92)
  }
}

const CARDS: { pos: [number, number]; size: [number, number]; rot: number; draw: Draw }[] = [
  // misty mountain, B&W
  { pos: [0.18, 2.33], size: [0.2, 0.14], rot: 0.12, draw: mountains(['#d8d8d8', '#9a9a9a'], ['#2a2a2a', '#4a4a4a'], true) },
  // LA-style city postcard
  {
    pos: [0.42, 2.12], size: [0.22, 0.14], rot: -0.03,
    draw: (c, w, h) => {
      const g = c.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, '#1d2a5a')
      g.addColorStop(0.7, '#7a4a8a')
      g.addColorStop(1, '#e8894a')
      c.fillStyle = g
      c.fillRect(0, 0, w, h)
      const r = rand(4)
      c.fillStyle = '#0b0e1c'
      for (let x = 10; x < w - 10; x += 14) {
        const bh = 30 + r() * h * 0.45
        c.fillRect(x, h - bh, 11, bh)
        c.fillStyle = '#ffd98a'
        for (let k = 0; k < 6; k++) c.fillRect(x + 2 + (k % 2) * 5, h - bh + 6 + k * 10, 2, 3)
        c.fillStyle = '#0b0e1c'
      }
      c.fillStyle = '#f2e6c8'
      c.font = `bold ${Math.round(h * 0.16)}px Georgia, serif`
      c.textAlign = 'center'
      c.fillText('LOS ANGELES', w / 2, h * 0.24)
    },
  },
  { pos: [0.83, 2.38], size: [0.07, 0.09], rot: 0.02, draw: polaroid(mountains(['#cfd6dc', '#8a949c'], ['#4b5560'])) },
  // horses in a misty field
  {
    pos: [0.1, 1.84], size: [0.12, 0.17], rot: 0.05,
    draw: (c, w, h) => {
      mountains(['#9aa0a0', '#c9c4b0'], ['#3e4a40'])(c, w, h)
      c.fillStyle = '#8a7046'
      c.fillRect(0, h * 0.62, w, h * 0.38)
      c.fillStyle = '#1e1a16'
      for (const [x, s] of [[0.3, 1], [0.48, 0.9]] as const) {
        c.fillRect(w * x, h * 0.68, w * 0.14 * s, h * 0.05)
        c.fillRect(w * x, h * 0.72, 2, h * 0.06)
        c.fillRect(w * (x + 0.12 * s), h * 0.72, 2, h * 0.06)
        c.fillRect(w * (x + 0.13 * s), h * 0.65, w * 0.03, h * 0.05)
      }
    },
  },
  // dark green mountains with a tiny orange hiker
  {
    pos: [-0.17, 1.8], size: [0.12, 0.18], rot: -0.04,
    draw: (c, w, h) => {
      mountains(['#3a4650', '#26302a'], ['#5a6670', '#1e2a22'], true)(c, w, h)
      c.fillStyle = '#e07a2a'
      c.fillRect(w * 0.48, h * 0.82, 5, 10)
    },
  },
  // colour-stripe card (own design)
  {
    pos: [0.5, 1.84], size: [0.2, 0.08], rot: -0.02,
    draw: (c, w, h) => {
      ;['#c0432a', '#2f3e5a', '#d9a24a', '#5a3a7a', '#2f6a6a'].forEach((col, i) => {
        c.fillStyle = col
        c.fillRect((i * w) / 5, 0, w / 5 + 1, h)
      })
      c.fillStyle = '#111'
      c.fillRect(0, 0, w, h * 0.18)
      c.fillStyle = '#f2e6c8'
      c.font = `bold ${Math.round(h * 0.14)}px Arial`
      c.fillText('SAFE PLACE · CHAPTER ONE', 6, h * 0.14)
    },
  },
  // "Feel Croatia" polaroid: stone wall
  {
    pos: [0.82, 1.95], size: [0.11, 0.13], rot: 0.01,
    draw: polaroid((c, w, h) => {
      c.fillStyle = '#8a8a86'
      c.fillRect(0, 0, w, h)
      const r = rand(12)
      for (let y = 0; y < h; y += 12)
        for (let x = (y / 12) % 2 ? -10 : 0; x < w; x += 22) {
          const v = 90 + Math.floor(r() * 80)
          c.fillStyle = `rgb(${v},${v},${v - 6})`
          c.fillRect(x + 1, y + 1, 20, 10)
        }
      c.fillStyle = '#d8dcdc'
      c.fillRect(0, 0, w, h * 0.3)
    }, 'Feel Croatia'),
  },
  // ink sketch panel (own)
  {
    pos: [1.1, 2.1], size: [0.15, 0.11], rot: -0.08,
    draw: (c, w, h) => {
      c.fillStyle = '#f4f2ec'
      c.fillRect(0, 0, w, h)
      c.strokeStyle = '#111'
      c.lineWidth = 3
      c.strokeRect(4, 4, w * 0.48, h - 8)
      c.strokeRect(w * 0.52, 4, w * 0.46, h - 8)
      const r = rand(3)
      c.lineWidth = 1.2
      for (let i = 0; i < 70; i++) {
        const x = 8 + r() * (w - 16), y = 8 + r() * (h - 16)
        c.beginPath()
        c.moveTo(x, y)
        c.lineTo(x + (r() - 0.5) * 30, y + (r() - 0.5) * 30)
        c.stroke()
      }
      c.fillStyle = '#111'
      c.beginPath()
      c.arc(w * 0.75, h * 0.38, h * 0.16, Math.PI, 0)
      c.fill()
    },
  },
  // poem on crumpled paper (Lermontov, public domain)
  {
    pos: [1.08, 1.78], size: [0.1, 0.14], rot: 0.02,
    draw: (c, w, h) => {
      c.fillStyle = '#e8e4da'
      c.fillRect(0, 0, w, h)
      const r = rand(8)
      for (let i = 0; i < 30; i++) {
        c.strokeStyle = r() > 0.5 ? '#ffffff55' : '#00000018'
        c.beginPath()
        c.moveTo(r() * w, r() * h)
        c.lineTo(r() * w, r() * h)
        c.stroke()
      }
      c.fillStyle = '#222'
      c.font = `${Math.round(w * 0.055)}px Georgia, serif`
      const lines = ['Я жить хочу! хочу печали', 'Любви и счастию назло;', 'Они мой ум избаловали', 'И слишком сгладили чело.', 'Пора, пора насмешкам света', 'Прогнать спокойствия туман;', 'Что без страданий жизнь поэта?', 'И что без бури океан?', '', 'М. Ю. Лермонтов']
      lines.forEach((l, i) => c.fillText(l, w * 0.08, h * 0.12 + i * h * 0.075))
    },
  },
  // New Year card
  {
    pos: [1.3, 1.98], size: [0.08, 0.12], rot: 0.09,
    draw: (c, w, h) => {
      const g = c.createLinearGradient(0, 0, 0, h)
      g.addColorStop(0, '#9ab0b8')
      g.addColorStop(1, '#e8e4dc')
      c.fillStyle = g
      c.fillRect(0, 0, w, h)
      c.fillStyle = '#2f5a3a'
      for (let i = 0; i < 4; i++) {
        c.beginPath()
        c.moveTo(w * 0.7, h * (0.15 + i * 0.13))
        c.lineTo(w * (0.98 - i * 0.02), h * (0.35 + i * 0.13))
        c.lineTo(w * (0.42 + i * 0.02), h * (0.35 + i * 0.13))
        c.fill()
      }
      c.fillStyle = '#ffffff'
      const r = rand(5)
      for (let i = 0; i < 40; i++) c.fillRect(r() * w, r() * h, 2, 2)
      c.fillStyle = '#c0432a'
      c.font = `italic bold ${Math.round(w * 0.11)}px Georgia, serif`
      c.fillText('С Новым годом!', w * 0.05, h * 0.92)
    },
  },
  { pos: [0.33, 1.67], size: [0.06, 0.08], rot: -0.05, draw: polaroid(mountains(['#dfe4e8', '#a0a8b0'], ['#6a7078', '#3a4048'], true)) },
  { pos: [-0.2, 1.57], size: [0.07, 0.085], rot: 0.07, draw: polaroid(mountains(['#e8dccc', '#b8a890'], ['#7a6a5a'])) },
]

/** Postcards and polaroids taped above the desk, each drawn on its own canvas. */
export function Collage() {
  const textures = useMemo(
    () =>
      CARDS.map(({ size, draw }) => {
        const el = document.createElement('canvas')
        el.width = 512
        el.height = Math.round((512 * size[1]) / size[0])
        draw(el.getContext('2d')!, el.width, el.height)
        const t = new THREE.CanvasTexture(el)
        t.colorSpace = THREE.SRGBColorSpace
        t.anisotropy = 8
        return t
      }),
    [],
  )
  return (
    <group position-z={-1.993}>
      {CARDS.map((card, i) => (
        <mesh key={i} position={[0.55 + (card.pos[0] - 0.55) * 1.25, 1.98 + (card.pos[1] - 1.98) * 1.2, i * 0.0004]} rotation-z={card.rot}>
          {/* real postcards read larger than the layout grid: scale up around the collage centre */}
          <planeGeometry args={[card.size[0] * 1.5, card.size[1] * 1.5]} />
          <meshStandardMaterial map={textures[i]} roughness={0.6} />
        </mesh>
      ))}
    </group>
  )
}
