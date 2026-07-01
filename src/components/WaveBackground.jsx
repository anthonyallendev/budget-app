import { useEffect, useRef } from 'react'

const COLS = 88
const ROWS = 32
const BG   = '#020B18'

function draw(ctx, W, H, t) {
  // Background
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, W, H)

  // Subtle blue ambient glow in the centre
  const ambient = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.55)
  ambient.addColorStop(0, 'rgba(0,40,130,0.18)')
  ambient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = ambient
  ctx.fillRect(0, 0, W, H)

  // Build particles
  const pts = []

  for (let r = 0; r < ROWS; r++) {
    const rowFrac = r / (ROWS - 1)          // 0 = front, 1 = back
    const depth   = 1 - rowFrac * 0.62      // perspective scale: 1.0 front → 0.38 back
    const zPos    = rowFrac * 420

    for (let c = 0; c < COLS; c++) {
      const colFrac = c / (COLS - 1)
      const xPos    = (colFrac - 0.5) * 820

      // Three overlapping sine waves for organic S-curve motion
      const w1 = Math.sin(xPos * 0.0072 + t * 0.85)              * 85
      const w2 = Math.sin(xPos * 0.0041 - t * 0.55 + zPos * 0.006) * 55
      const w3 = Math.sin(xPos * 0.0115 + t * 1.25 + zPos * 0.005) * 28
      const wave = w1 + w2 + w3

      // Screen position
      const sx = W * 0.5  + (colFrac - 0.5) * W * 1.08 * depth
      const sy = H * 0.84 - rowFrac * H * 0.68 - wave * depth * 0.58

      if (sx < -8 || sx > W + 8 || sy < -8 || sy > H + 8) continue

      // Brightness: peaks bright, troughs nearly invisible
      const heightNorm = (wave + 168) / 336    // 0–1
      const peakBoost  = Math.pow(heightNorm, 1.6)  // non-linear — peaks pop more
      const bright     = peakBoost * 0.72 + depth * 0.28

      const radius = Math.max(0.5, (1.2 + peakBoost * 3.8) * depth)

      pts.push({ sx, sy, bright, radius, r })
    }
  }

  // Sort back → front so closer rows paint over distant ones
  pts.sort((a, b) => a.r - b.r)

  // ── Dim particles (no expensive shadow) ──────────────────────────────────
  for (const p of pts) {
    if (p.bright > 0.58) continue
    const g = Math.round(40  + p.bright * 130)
    const b = Math.round(130 + p.bright * 90)
    ctx.fillStyle = `rgba(8,${g},${b},${0.12 + p.bright * 0.55})`
    ctx.beginPath()
    ctx.arc(p.sx, p.sy, p.radius, 0, Math.PI * 2)
    ctx.fill()
  }

  // ── Bright particles with glow ───────────────────────────────────────────
  for (const p of pts) {
    if (p.bright <= 0.58) continue
    const gf = (p.bright - 0.58) / 0.42   // 0–1 glow fraction
    const g  = Math.round(165 + gf * 90)
    const b  = Math.round(215 + gf * 40)
    const r  = Math.round(15  + gf * 65)
    ctx.shadowBlur  = 5 + gf * 14
    ctx.shadowColor = `rgba(0,190,255,${0.35 + gf * 0.55})`
    ctx.fillStyle   = `rgba(${r},${g},${b},${0.65 + gf * 0.35})`
    ctx.beginPath()
    ctx.arc(p.sx, p.sy, p.radius, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.shadowBlur = 0

  // Vignette — dark edges so UI content pops
  const vignette = ctx.createRadialGradient(W/2, H/2, H * 0.2, W/2, H/2, H * 0.85)
  vignette.addColorStop(0, 'rgba(0,0,0,0)')
  vignette.addColorStop(1, 'rgba(2,11,24,0.72)')
  ctx.fillStyle = vignette
  ctx.fillRect(0, 0, W, H)
}

export default function WaveBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId, t0

    const resize = () => {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const animate = ts => {
      if (!t0) t0 = ts
      draw(ctx, canvas.width, canvas.height, (ts - t0) * 0.00085)
      animId = requestAnimationFrame(animate)
    }
    animId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%', height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0.9,
      }}
    />
  )
}
