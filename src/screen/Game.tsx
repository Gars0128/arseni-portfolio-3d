import { useEffect, useRef } from 'react'

// Cat Climb: endless vertical platform jumper. Low-res canvas upscaled with nearest-neighbour for the pixel look.
const W = 160
const H = 240
const GRAVITY = 900
const JUMP = -330
const BOOST = -560
const SPEED = 120
const BEST_KEY = 'cat-climb-best'

type Platform = { x: number; y: number; vx: number; boost: boolean }

const readBest = () => {
  try {
    return Number(localStorage.getItem(BEST_KEY)) || 0
  } catch {
    return 0
  }
}

export function Game() {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const el = canvas.current!
    const c = el.getContext('2d')!
    el.focus()
    const cat = { x: W / 2, y: H - 40, vy: 0 }
    let platforms: Platform[] = []
    let camY = 0 // world y at the top of the screen; decreases as we climb
    let score = 0
    let best = readBest()
    let state: 'ready' | 'play' | 'over' = 'ready'
    const keys = { left: false, right: false }
    let last = performance.now()
    let raf = 0
    const stars = Array.from({ length: 40 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: Math.random() }))

    const spawn = (y: number): Platform => {
      const level = Math.max(0, -y) / 1000 // harder as you climb
      return {
        x: Math.random() * (W - 28),
        y,
        vx: Math.random() < 0.15 + level * 0.2 ? (Math.random() < 0.5 ? -1 : 1) * (25 + level * 15) : 0,
        boost: Math.random() < 0.07,
      }
    }
    const reset = () => {
      cat.x = W / 2 - 5
      cat.y = H - 40
      cat.vy = JUMP
      camY = 0
      score = 0
      platforms = [{ x: W / 2 - 14, y: H - 20, vx: 0, boost: false }]
      for (let y = H - 55; y > -H; y -= 28 + Math.random() * 14) platforms.push(spawn(y))
    }

    const update = (dt: number) => {
      const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0)
      cat.x += dir * SPEED * dt
      if (cat.x < -10) cat.x = W // wrap around the screen edges
      if (cat.x > W) cat.x = -10
      const prevFeet = cat.y + 10
      cat.vy += GRAVITY * dt
      cat.y += cat.vy * dt
      for (const p of platforms) {
        p.x += p.vx * dt
        if (p.x < 0 || p.x > W - 28) p.vx *= -1
        // land only while falling, when the feet cross the platform top
        const feet = cat.y + 10
        if (cat.vy > 0 && prevFeet <= p.y && feet >= p.y && cat.x + 8 > p.x && cat.x + 2 < p.x + 28) {
          cat.vy = p.boost ? BOOST : JUMP
          cat.y = p.y - 10
        }
      }
      // camera follows upward only
      if (cat.y < camY + H * 0.4) camY = cat.y - H * 0.4
      score = Math.max(score, Math.floor(-(cat.y - (H - 40)) / 10))
      platforms = platforms.filter((p) => p.y < camY + H + 10)
      let top = Math.min(...platforms.map((p) => p.y))
      while (top > camY - 40) platforms.push(spawn((top -= 28 + Math.random() * (14 + Math.min(score, 400) / 25))))
      if (cat.y > camY + H) {
        state = 'over'
        if (score > best) {
          best = score
          try {
            localStorage.setItem(BEST_KEY, String(best))
          } catch {
            /* storage blocked: best only lasts this session */
          }
        }
      }
    }

    const drawCat = (x: number, y: number) => {
      x = Math.round(x)
      y = Math.round(y - camY)
      c.fillStyle = '#3a3330'
      c.fillRect(x + 1, y + 3, 8, 7) // body + head
      c.fillRect(x + 1, y + 1, 2, 2) // ears
      c.fillRect(x + 7, y + 1, 2, 2)
      c.fillRect(x + 9, y + 6, 2, 1) // tail
      c.fillStyle = '#ffd36a'
      c.fillRect(x + 2, y + 5, 2, 1) // eyes
      c.fillRect(x + 6, y + 5, 2, 1)
    }
    const text = (s: string, y: number, size = 8, color = '#f3eadb') => {
      c.fillStyle = color
      c.font = `bold ${size}px monospace`
      c.textAlign = 'center'
      c.fillText(s, W / 2, y)
    }
    const draw = () => {
      const g = c.createLinearGradient(0, 0, 0, H)
      g.addColorStop(0, '#120c2a')
      g.addColorStop(1, '#3a1850')
      c.fillStyle = g
      c.fillRect(0, 0, W, H)
      for (const s of stars) {
        c.fillStyle = `rgba(255,255,255,${0.2 + s.s * 0.5})`
        c.fillRect(s.x, (((s.y - camY * (0.1 + s.s * 0.2)) % H) + H) % H, 1, 1) // parallax
      }
      for (const p of platforms) {
        const y = Math.round(p.y - camY)
        c.fillStyle = p.vx ? '#6a8cff' : '#c9a46a'
        c.fillRect(Math.round(p.x), y, 28, 4)
        c.fillStyle = '#00000044'
        c.fillRect(Math.round(p.x), y + 3, 28, 1)
        if (p.boost) {
          c.fillStyle = '#f3eadb' // coffee cup trampoline
          c.fillRect(Math.round(p.x) + 11, y - 5, 6, 5)
          c.fillStyle = '#6b3a1e'
          c.fillRect(Math.round(p.x) + 12, y - 4, 4, 1)
        }
      }
      drawCat(cat.x, cat.y)
      c.textAlign = 'left'
      c.font = 'bold 8px monospace'
      c.fillStyle = '#e8894a'
      c.fillText(`${score}m  BEST ${best}m`, 3, 10)
      if (state !== 'play') {
        c.fillStyle = '#000000aa'
        c.fillRect(0, 0, W, H)
        text(state === 'over' ? 'GAME OVER' : 'CAT CLIMB', 90, 16, '#e8894a')
        if (state === 'over') text(`climbed ${score}m`, 108)
        text('SPACE / TAP TO START', 140)
        text('←/→ or A/D, or hold', 156, 7, '#f3eadb99')
        text('left/right side of the screen', 166, 7, '#f3eadb99')
      }
    }

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 1 / 30) // no huge steps after a stalled frame
      last = now
      if (state === 'play') update(dt)
      draw()
      raf = requestAnimationFrame(loop)
    }

    const start = () => {
      if (state === 'play') return
      reset()
      state = 'play'
    }
    const setKey = (code: string, down: boolean) => {
      if (code === 'ArrowLeft' || code === 'KeyA') keys.left = down
      else if (code === 'ArrowRight' || code === 'KeyD') keys.right = down
      else return false
      return true
    }
    const onDown = (e: KeyboardEvent) => {
      if (e.code === 'Escape') return // let Esc leave the monitor
      e.preventDefault()
      e.stopPropagation()
      if (e.code === 'Space' || e.code === 'Enter') start()
      else setKey(e.code, true)
    }
    const onUp = (e: KeyboardEvent) => setKey(e.code, false) && e.preventDefault()
    // touch / mouse: hold the left or right half to steer
    const onPointer = (e: PointerEvent) => {
      if (state !== 'play') return start()
      const left = e.offsetX < el.clientWidth / 2
      keys.left = left
      keys.right = !left
    }
    const onRelease = () => (keys.left = keys.right = false)
    el.addEventListener('keydown', onDown)
    el.addEventListener('keyup', onUp)
    el.addEventListener('pointerdown', onPointer)
    window.addEventListener('pointerup', onRelease)
    reset()
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      el.removeEventListener('keydown', onDown)
      el.removeEventListener('keyup', onUp)
      el.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('pointerup', onRelease)
    }
  }, [])

  return (
    <canvas
      ref={canvas}
      className="game"
      width={W}
      height={H}
      tabIndex={0}
      aria-label="Cat Climb game. Press space to start, left and right arrows to move."
    />
  )
}
