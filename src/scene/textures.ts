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
export const woodTexture = (base = '#c9a46a', grain = '#9c7642') =>
  canvasTex(`wood${base}${grain}`, 1024, 512, (c) => {
    const r = rand(13)
    c.fillStyle = base
    c.fillRect(0, 0, 1024, 512)
    for (let i = 0; i < 220; i++) {
      const y = r() * 512
      c.strokeStyle = grain
      c.globalAlpha = 0.05 + r() * 0.14
      c.lineWidth = 0.6 + r() * 2.4
      c.beginPath()
      for (let x = 0; x <= 1024; x += 16) c.lineTo(x, y + Math.sin(x / (60 + r() * 90) + i) * (2 + r() * 4))
      c.stroke()
    }
    c.globalAlpha = 1
  })

/** Narrow multi-tone laminate strips, like the real floor. */
export const laminateTexture = () =>
  canvasTex(
    'laminate',
    512,
    512,
    (c) => {
      const r = rand(31)
      const shades = ['#5a3a24', '#7a5233', '#4a2f1d', '#8a6040', '#6a4529', '#3e2716', '#9a7048']
      let x = 0
      while (x < 512) {
        const w = 6 + r() * 14
        let y = -r() * 300
        while (y < 512) {
          const len = 120 + r() * 260
          c.fillStyle = shades[Math.floor(r() * shades.length)]
          c.fillRect(x, y, w, len)
          c.fillStyle = '#00000022'
          c.fillRect(x, y, w, 1)
          y += len
        }
        c.fillStyle = '#00000030'
        c.fillRect(x, 0, 1, 512)
        x += w
      }
      for (let i = 0; i < 1500; i++) {
        c.fillStyle = r() > 0.5 ? '#ffffff08' : '#00000010'
        c.fillRect(r() * 512, r() * 512, 1, 6 + r() * 20)
      }
    },
    [4, 4],
  )

/** Warm off-white plaster with very soft mottling. */
export const plasterTexture = () =>
  canvasTex(
    'plaster',
    512,
    512,
    (c) => {
      const r = rand(5)
      c.fillStyle = '#ece3d4'
      c.fillRect(0, 0, 512, 512)
      for (let i = 0; i < 60; i++) {
        const g = c.createRadialGradient(r() * 512, r() * 512, 0, r() * 512, r() * 512, 40 + r() * 90)
        g.addColorStop(0, r() > 0.5 ? '#ffffff06' : '#a0907807')
        g.addColorStop(1, '#00000000')
        c.fillStyle = g
        c.fillRect(0, 0, 512, 512)
      }
      for (let i = 0; i < 4000; i++) {
        c.fillStyle = r() > 0.5 ? '#ffffff0a' : '#0000000a'
        c.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2)
      }
    },
    [4, 3],
  )

/** Desk mat: glossy black/grey "goo bubbles" on white with ink outlines and highlights. */
export const deskmatTexture = () =>
  canvasTex('deskmat', 1536, 560, (c) => {
    const r = rand(9)
    const W = 1536, H = 560
    c.fillStyle = '#ecebea'
    c.fillRect(0, 0, W, H)
    const blobs = Array.from({ length: 38 }, () => ({
      x: r() * W, y: r() * H, rad: 30 + r() * 90, col: ['#1d1d1f', '#5b5b60', '#9a9aa0', '#2c2c30'][Math.floor(r() * 4)],
    }))
    for (const b of blobs) {
      c.fillStyle = '#111'
      c.beginPath()
      c.arc(b.x, b.y, b.rad + 5, 0, Math.PI * 2)
      c.fill()
    }
    for (const b of blobs) {
      const g = c.createRadialGradient(b.x - b.rad * 0.3, b.y - b.rad * 0.3, b.rad * 0.1, b.x, b.y, b.rad)
      g.addColorStop(0, b.col === '#9a9aa0' ? '#c4c4ca' : '#6a6a70')
      g.addColorStop(1, b.col)
      c.fillStyle = g
      c.beginPath()
      c.arc(b.x, b.y, b.rad, 0, Math.PI * 2)
      c.fill()
    }
    for (const b of blobs) {
      c.strokeStyle = '#ffffffcc'
      c.lineWidth = Math.max(3, b.rad * 0.08)
      c.lineCap = 'round'
      c.beginPath()
      c.arc(b.x, b.y, b.rad * 0.7, Math.PI * 1.1, Math.PI * 1.45)
      c.stroke()
      c.fillStyle = '#ffffffcc'
      c.beginPath()
      c.arc(b.x - b.rad * 0.32, b.y - b.rad * 0.62, Math.max(2, b.rad * 0.06), 0, Math.PI * 2)
      c.fill()
    }
    // stitched edge
    c.strokeStyle = '#222'
    c.lineWidth = 10
    c.strokeRect(5, 5, W - 10, H - 10)
  })

/** Soft woollen rug (own pattern): muted oat/grey with a thin terracotta border and fringe. */
export const rugTexture = () =>
  canvasTex('rug', 1024, 692, (c) => {
    const r = rand(77)
    const W = 1024, H = 692, F = 30
    c.strokeStyle = '#e4dccd'
    c.lineWidth = 2
    for (let y = 14; y < H - 14; y += 7)
      for (const [x0, x1] of [[2 + r() * 8, F], [W - F, W - 2 - r() * 8]]) {
        c.beginPath()
        c.moveTo(x0, y)
        c.lineTo(x1, y + (r() - 0.5) * 3)
        c.stroke()
      }
    const x = F, w = W - 2 * F
    const bands: [string, number][] = [['#d8cdb8', 0], ['#b8674a', 26], ['#d8cdb8', 36], ['#8c8a84', 70], ['#cfc3ad', 76]]
    for (const [col, inset] of bands) {
      c.fillStyle = col
      c.fillRect(x + inset, inset, w - inset * 2, H - inset * 2)
    }
    c.strokeStyle = '#8c8a84'
    c.lineWidth = 3
    for (let i = 0; i < 7; i++) {
      const cx = x + w / 2 + (i - 3) * 120
      c.beginPath()
      c.moveTo(cx, H / 2 - 70)
      c.lineTo(cx + 45, H / 2)
      c.lineTo(cx, H / 2 + 70)
      c.lineTo(cx - 45, H / 2)
      c.closePath()
      c.stroke()
    }
    for (let i = 0; i < 14000; i++) {
      c.fillStyle = r() > 0.5 ? '#ffffff14' : '#00000014'
      c.fillRect(x + r() * w, r() * H, 2, 2)
    }
  })
