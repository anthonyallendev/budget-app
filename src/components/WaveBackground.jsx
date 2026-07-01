import { useEffect, useRef } from 'react'

const SPACING = 14  // grid cell size in px

// Three overlapping wave layers — diagonal built into rowFactor, no CSS rotation needed
const WAVES = [
  { freq: 0.042, amp: 26, speed: 0.22, rowFactor: 0.38, phase: 0.0 },
  { freq: 0.078, amp: 11, speed: 0.38, rowFactor: 0.22, phase: 1.9 },
  { freq: 0.018, amp: 38, speed: 0.11, rowFactor: 0.55, phase: 3.7 },
]

const MAX_AMP = WAVES.reduce((s, w) => s + w.amp, 0)

export default function WaveBackground() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx    = canvas.getContext('2d')
    let animId, t = 0

    function resize() {
      const dpr        = window.devicePixelRatio || 1
      canvas.width     = window.innerWidth  * dpr
      canvas.height    = window.innerHeight * dpr
      canvas.style.width  = window.innerWidth  + 'px'
      canvas.style.height = window.innerHeight + 'px'
      ctx.scale(dpr, dpr)
    }
    resize()
    window.addEventListener('resize', resize)

    function draw() {
      const W = window.innerWidth
      const H = window.innerHeight
      ctx.clearRect(0, 0, W, H)

      const cols = Math.ceil(W / SPACING) + 2
      const rows = Math.ceil(H / SPACING) + 4

      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
          // Sum wave layers
          let disp = 0
          for (const w of WAVES) {
            disp += Math.sin(
              col * w.freq + row * w.freq * w.rowFactor + t * w.speed + w.phase
            ) * w.amp
          }

          // Normalise to 0 (trough) → 1 (crest)
          const n = (disp / MAX_AMP + 1) / 2

          // Crests are large and bright; troughs are tiny and near-invisible
          const alpha  = 0.03 + n * 0.88
          if (alpha < 0.05) continue   // skip invisible dots

          const radius = 0.3 + n * 2.4

          // Colour: deep cyan at base → pure white at crests
          const r = Math.round(n * 255)
          const g = Math.round(180 + n * 75)
          const b = 255

          // Subtle Y displacement makes the dots actually ripple
          const cy = row * SPACING + disp * 0.18

          ctx.beginPath()
          ctx.arc(col * SPACING, cy, radius, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(2)})`
          ctx.fill()
        }
      }

      t += 0.007
      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  )
}
