// BrandReveal.jsx — opening cinematic sequence
// Styles: src/styles/landing.css (.lp-reveal__)
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

const BURST_GLYPHS = [
  '₹','$','€','¥','£',
  '12,543','4,382','9,120','2,185',
  '₹','$','€',
  '803','290','54',
]

const BURST_PARTICLES = BURST_GLYPHS.map((glyph, i) => {
  const angle = (i / BURST_GLYPHS.length) * 360 + (i % 3) * 14
  const dist  = 90 + (i % 4) * 28
  const rad   = (angle * Math.PI) / 180
  return {
    glyph,
    x: Math.cos(rad) * dist,
    y: Math.sin(rad) * dist,
    rotation: angle * 0.3 - 20,
    delay: 0.02 + (i % 5) * 0.025,
    fontSize: 13 + (i % 3) * 4,
  }
})

export default function BrandReveal({ onComplete }) {
  const [step, setStep]         = useState(0)
  const [burstActive, setBurst] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setStep(1),                       80)
    const t2 = setTimeout(() => setStep(2),                      900)
    const t3 = setTimeout(() => setBurst(true),                 1050)
    const t4 = setTimeout(() => { setBurst(false); setStep(4) }, 1900)
    const t5 = setTimeout(() => onComplete?.(),                 2100)
    return () => [t1, t2, t3, t4, t5].forEach(clearTimeout)
  }, [onComplete])

  return (
    <div className="lp-reveal">
      <div className="lp-reveal__inner">

        {/* Energy burst particles */}
        <AnimatePresence>
          {burstActive && BURST_PARTICLES.map((p, i) => (
            <motion.span
              key={i}
              className="lp-reveal__burst"
              initial={{ opacity: 0, x: 0, y: 0, scale: 0.4, filter: 'blur(4px)' }}
              animate={{
                opacity: [0, 0.65, 0],
                x: p.x, y: p.y,
                scale: [0.4, 1, 0.7],
                filter: ['blur(4px)', 'blur(0px)', 'blur(3px)'],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.72, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontSize: p.fontSize,
                rotate: `${p.rotation}deg`,
                transform: `translate(-50%, -50%)`,
              }}
            >
              {p.glyph}
            </motion.span>
          ))}
        </AnimatePresence>

        {/* Wordmark */}
        <motion.div
          className="lp-reveal__wordmark"
          initial={{ opacity: 0, y: 10 }}
          animate={step >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          Aura
        </motion.div>

      </div>
    </div>
  )
}
