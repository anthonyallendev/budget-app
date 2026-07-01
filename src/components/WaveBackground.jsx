import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import NET from 'vanta/dist/vanta.net.min'

export default function WaveBackground() {
  const ref     = useRef(null)
  const vantaRef = useRef(null)

  useEffect(() => {
    vantaRef.current = NET({
      el:            ref.current,
      THREE,
      mouseControls: true,
      touchControls: true,
      gyroControls:  false,
      minHeight:     200,
      minWidth:      200,
      scale:         1.0,
      scaleMobile:   1.0,
      // Brand colours
      backgroundColor: 0x060b1a,  // dark navy — matches our bg-space-900
      color:           0x00d4ff,  // cyan
      color2:          0x7c3aed,  // purple (used for secondary points)
      // Network density
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
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  )
}
