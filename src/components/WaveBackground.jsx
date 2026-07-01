import { useEffect, useRef } from 'react'

const SPACING   = 7
const DOT_SIZE  = 0.4   // compensates for CSS scale(1.5) so visual size stays ~0.6px
const WAVES = [
  { freq: 0.07, amp: 18, speed: 0.35, rowShift: 0.12 },
  { freq: 0.11, amp: 11, speed: 0.22, rowShift: 0.08 },
  { freq: 0.05, amp: 24, speed: 0.16, rowShift: 0.05 },
]

export default function WaveBackground() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx    = canvas.getContext('2d')
    let animId
    let t = 0

    function resize() {
      const dpr = window.devicePixelRatio || 1
      canvas.width        = window.innerWidth  * dpr
      canvas.height       = window.innerHeight * dpr
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
      const rows = Math.ceil(H / SPACING) + 2

      for (let row = 0; row < rows; row++) {
        const baseY = row * SPACING
        for (let col = 0; col < cols; col++) {
          let dy = 0
          for (const w of WAVES) {
            dy += Math.sin(col * w.freq + row * w.rowShift + t * w.speed) * w.amp
          }

          const intensity = (Math.sin(col * 0.09 + t * 0.15) + 1) / 2
          const alpha     = 0.15 + intensity * 0.5

          ctx.beginPath()
          ctx.arc(col * SPACING, baseY + dy, DOT_SIZE, 0, Math.PI * 2)
          ctx.fillStyle = `rgba(40, 160, 255, ${alpha})`
          ctx.fill()
        }
      }

      t += 0.016
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
      style={{
        position:        'fixed',
        inset:           0,
        zIndex:          0,
        pointerEvents:   'none',
        transform:       'rotate(45deg) scale(1.5)',
        transformOrigin: 'center center',
      }}
    />
  )
}
