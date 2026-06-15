// ═══════════════════════════════════════════════════════════════
// LottiePlayer.jsx
// Thin wrapper around lottie-react.
// Requires: npm install lottie-react
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef } from 'react'
import lottie from 'lottie-web'

export default function LottiePlayer({ src, width = 172, height = 172 }) {
  const ref = useRef(null)

  useEffect(() => {
    if (!ref.current) return
    const anim = lottie.loadAnimation({
      container:     ref.current,
      renderer:      'svg',
      loop:          true,
      autoplay:      true,
      animationData: src,
    })
    return () => anim.destroy()
  }, [src])

  return <div ref={ref} style={{ width, height }} aria-hidden />
}