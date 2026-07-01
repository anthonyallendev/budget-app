import { useEffect, useRef } from 'react'

export default function WaveBackground() {
  const ref      = useRef(null)
  const vantaRef = useRef(null)

  useEffect(() => {
    if (!window.VANTA) return

    vantaRef.current = window.VANTA.NET({
      el:            ref.current,
      mouseControls: true,
      touchControls: true,
      gyroControls:  false,
      minHeight:     200,
      minWidth:      200,
      scale:         1.0,
      scaleMobile:   1.0,
      backgroundColor: 0x060b1a,
      color:           0x00d4ff,
      color2:          0x7c3aed,
      points:      18,
      maxDistance: 22,
      spacing:     16,
    })

    return () => {
      if (vantaRef.current) vantaRef.current.destroy()
    }
  }, [])

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.2 }}
    />
  )
}
