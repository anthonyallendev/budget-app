import { useEffect, useRef } from 'react'

const SPACING   = 22   // px between dots
const DOT_SIZE  = 1.2  // dot radius
const WAVES = [
  { freq: 0.07, amp: 14, speed: 0.18, rowShift: 0.12 },
  { freq: 0.11, amp: 9,  speed: 0.12, rowShift: 0.08 },
  { freq: 0.05, amp: 18, speed: 0.09, rowShift: 0.05 },
]

export default function WaveBackground() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx    = canvas.getContext('2d')
    let   animId
    let   t = 0

    function resize() {
      const dpr = window.devicePixelRatio || 1
      canvas.width  = window.innerWidth  * dpr
      canvas.height = window.innerHeight * dpr
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
          const baseX = col * SPACING

          // Combine multiple wave layers for organic look
          let dy = 0
          for (const w of WAVES) {
            dy += Math.sin(col * w.freq + row * w.rowShift + t * w.speed) * w.amp
          }

          const x = baseX
          const y = baseY + dy

          // Brightness peaks at wave crests
          const intensity = (Math.sin(col * 0.09 + t * 0.15) + 1) / 2
          const alpha = 0.12 + intensity * 0.28

          ctx.beginPath()
          ctx.arc(x, y, DOT_SIZE, 0, Math.PI * 2)
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
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}
