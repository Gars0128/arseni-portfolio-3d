import * as THREE from 'three'
import { rand } from './util'

const cache = new Map<string, THREE.Texture>()

function canvasTex(key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void, repeat = [1, 1]) {
  let t = cache.get(key)
  if (t) return t
  const el = document.createElement('canvas')
  el.width = w
  el.height = h
  draw(el.getContext('2d')!)
  t = new THREE.CanvasTexture(el)
  t.colorSpace = THREE.SRGBColorSpace
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(repeat[0], repeat[1])
  t.anisotropy = 8
  cache.set(key, t)
  return t
}

/** Long-grain wood; horizontal streaks with slight waviness. */
export const woodTexture = (base = '#9a6a45', grain = '#6e4529') =>
  canvasTex(`wood${base}${grain}`, 512, 512, (c) => {
    const r = rand(13)
    c.fillStyle = base
    c.fillRect(0, 0, 512, 512)
    for (let i = 0; i < 140; i++) {
      const y = r() * 512
      c.strokeStyle = grain
      c.globalAlpha = 0.08 + r() * 0.18
      c.lineWidth = 0.6 + r() * 2.2
      c.beginPath()
      for (let x = 0; x <= 512; x += 16) c.lineTo(x, y + Math.sin(x / (40 + r() * 60) + i) * (2 + r() * 3))
      c.stroke()
    }
    c.globalAlpha = 1
  })

/** Floor planks: wood strips with darker seams. */
export const plankTexture = () =>
  canvasTex(
    'planks',
    512,
    512,
    (c) => {
      const r = rand(31)
      const shades = ['#6e4c35', '#734f37', '#694832', '#765239']
      for (let row = 0; row < 8; row++) {
        let x = -r() * 200
        while (x < 512) {
          const len = 160 + r() * 200
          c.fillStyle = shades[Math.floor(r() * shades.length)]
          c.fillRect(x, row * 64, len, 64)
          c.fillStyle = '#00000018'
          for (let g = 0; g < 6; g++) c.fillRect(x, row * 64 + r() * 64, len, 1 + r())
          c.fillStyle = '#2a1a10'
          c.fillRect(x, row * 64, 2, 64)
          x += len
        }
        c.fillStyle = '#2a1a10'
        c.fillRect(0, row * 64, 512, 2)
      }
    },
    [5, 5],
  )

/** Subtle plaster noise so walls don't look like flat CG. */
export const plasterTexture = () =>
  canvasTex(
    'plaster',
    256,
    256,
    (c) => {
      const r = rand(5)
      c.fillStyle = '#d98a5c'
      c.fillRect(0, 0, 256, 256)
      for (let i = 0; i < 2500; i++) {
        c.fillStyle = r() > 0.5 ? '#ffffff0d' : '#0000000d'
        const s = 1 + r() * 3
        c.fillRect(r() * 256, r() * 256, s, s)
      }
    },
    [6, 4],
  )

/** Kilim-style rug (own pattern): terracotta field, cream diamonds, woven noise, fringe on the short ends. */
export const rugTexture = () =>
  canvasTex('rug', 1024, 692, (c) => {
    const r = rand(77)
    const W = 1024, H = 692, F = 34 // fringe length
    // fringe
    c.strokeStyle = '#e9dcc4'
    c.lineWidth = 2
    for (let y = 14; y < H - 14; y += 7)
      for (const [x0, x1] of [[2 + r() * 8, F], [W - F, W - 2 - r() * 8]]) {
        c.beginPath()
        c.moveTo(x0, y)
        c.lineTo(x1, y + (r() - 0.5) * 3)
        c.stroke()
      }
    const x = F, w = W - 2 * F
    const bands: [string, number][] = [['#2f2520', 0], ['#e9d9bd', 18], ['#b5522f', 34], ['#e9d9bd', 70], ['#3f5a45', 80], ['#c96a3f', 96]]
    for (const [col, inset] of bands) {
      c.fillStyle = col
      c.fillRect(x + inset, inset, w - inset * 2, H - inset * 2)
    }
    // zigzag in the border
    c.strokeStyle = '#2f2520'
    c.lineWidth = 6
    for (const [y0, dir] of [[52, 1], [H - 52, -1]] as const) {
      c.beginPath()
      for (let i = 0, px = x + 34; px <= x + w - 34; i++, px += 24) c.lineTo(px, y0 + (i % 2 ? 10 : -10) * dir)
      c.stroke()
    }
    // central diamonds
    const cy = H / 2
    for (let i = 0; i < 5; i++) {
      const cx = x + w / 2 + (i - 2) * 175
      for (const [s, col] of [[118, '#e9d9bd'], [92, '#2f2520'], [70, '#d9a24a'], [44, '#3f5a45'], [18, '#e9d9bd']] as const) {
        const sx = s * (i === 2 ? 1 : 0.72)
        c.fillStyle = col
        c.beginPath()
        c.moveTo(cx, cy - sx * 1.4)
        c.lineTo(cx + sx, cy)
        c.lineTo(cx, cy + sx * 1.4)
        c.lineTo(cx - sx, cy)
        c.fill()
      }
    }
    // woven texture
    for (let i = 0; i < 9000; i++) {
      c.fillStyle = r() > 0.5 ? '#ffffff12' : '#00000016'
      c.fillRect(x + r() * w, r() * H, 3, 1)
    }
  })
