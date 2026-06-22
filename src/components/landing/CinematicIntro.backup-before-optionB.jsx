// CinematicIntro.jsx
// ═══════════════════════════════════════════════════════════════
// TIMELINE (ms from mount):
//   0        — dark, video plays, anticipation
//   300      — wordmark begins descent  ← tighter pre-roll
//   ~1150    — wordmark Y arrives at center  (0.85s travel)
//   ~1150    — IMPACT: burst fires instantly, no gap
//   ~1150    — wordmark scale settle [1→0.96→1] simultaneous
//   ~1750    — particles drift/dissolve
//   ~2400    — tagline assembles
//   ~3000    — sub-tagline fades
//   ~3600    — CTA fades in
//   ~3650    — onComplete() fires
//
// Styles: src/styles/landing.css (.lp-intro__)
// ═══════════════════════════════════════════════════════════════
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { useEffect, useState } from 'react'
import AuraPlatinumButton from '../ui/AuraPlatinumButton'

const GLYPHS = [
  '₹','$','€','¥','£','₹','$','€','¥','£',
  '12,543','4,382','9,120','2,185','87,340',
  '803,200','31,090','5,670','54,300',
  '₹','$','€','¥','£',
  '290','803','182','54','12','99',
  '3,291','9,940','22,780',
]

function buildParticles() {
  return GLYPHS.map((glyph, i) => {
    const angle = (i / GLYPHS.length) * 360 + (i % 7) * 8.5
    const rad   = (angle * Math.PI) / 180
    const dist  = 110 + (i % 6) * 40
    const layer = i % 3
    return {
      id:          i,
      glyph,
      bx:          Math.cos(rad) * dist,
      by:          Math.sin(rad) * dist,
      dx:          Math.cos(rad + 0.3) * (dist * 1.8),
      dy:          Math.sin(rad + 0.3) * (dist * 1.5),
      rotation:    angle * 0.25 - 15,
      delay:       (i % 8) * 0.012,
      fontSize:    layer === 0 ? 14 + (i % 4) * 3
                 : layer === 1 ? 10 + (i % 3) * 3
                 :               8  + (i % 2) * 2,
      peakOpacity: layer === 0 ? 0.60
                 : layer === 1 ? 0.38
                 :               0.20,
      isSurvivor:  i % 5 === 0,
    }
  })
}

const PARTICLES = buildParticles()

const EASE_IMPACT  = [0.08, 0, 0.04, 1]
const EASE_SETTLE  = [0.34, 1.08, 0.64, 1]
const EASE_OUT     = [0.16, 1,    0.3,  1]

const PRE_ROLL       = 300
const DESCENT_MS     = 720
const SETTLE_MS      = 320
const DRIFT_WAIT     = 580
const ASSEMBLE_WAIT  = 650
const SUB_WAIT       = 220
const CTA_WAIT       = 580

export default function CinematicIntro({ onComplete, onBegin }) {
  const [phase, setPhase]     = useState('wait')
  const [ctaReady, setCtaReady] = useState(false)

  const wordmarkCtrl = useAnimation()
  const taglineCtrl  = useAnimation()
  const subCtrl      = useAnimation()
  const ctaCtrl      = useAnimation()

  useEffect(() => {
    let cancelled  = false
    const timers   = []
    const t = (ms, fn) => { const id = setTimeout(fn, ms); timers.push(id) }

    const run = async () => {
      await delay(PRE_ROLL)
      if (cancelled) return

      setPhase('descend')
      wordmarkCtrl.start({
        y:       0,
        opacity: 1,
        filter:  'blur(0px)',
        transition: {
          y:       { duration: DESCENT_MS / 1000, ease: EASE_IMPACT },
          opacity: { duration: 0.45, ease: 'easeOut' },
          filter:  { duration: 0.55, ease: 'easeOut' },
        },
      })

      t(DESCENT_MS, () => {
        if (cancelled) return
        setPhase('impact')
        wordmarkCtrl.start({
          scale: [1.0, 0.96, 1.0],
          transition: {
            duration: SETTLE_MS / 1000,
            ease: EASE_SETTLE,
            times: [0, 0.45, 1],
          },
        })
      })

      t(DESCENT_MS + DRIFT_WAIT, () => {
        if (cancelled) return
        setPhase('drift')
      })

      t(DESCENT_MS + DRIFT_WAIT + ASSEMBLE_WAIT, async () => {
        if (cancelled) return
        setPhase('assemble')

        await taglineCtrl.start({
          opacity: 1, y: 0, filter: 'blur(0px)',
          transition: { duration: 0.70, ease: EASE_OUT },
        })
        if (cancelled) return

        await delay(SUB_WAIT)
        if (cancelled) return

        await subCtrl.start({
          opacity: 1, y: 0,
          transition: { duration: 0.60, ease: EASE_OUT },
        })
        if (cancelled) return

        await delay(CTA_WAIT)
        if (cancelled) return

        await ctaCtrl.start({
          opacity: 1, y: 0,
          transition: { duration: 0.65, ease: EASE_OUT },
        })
        if (cancelled) return

        setCtaReady(true)
        onComplete?.()
      })
    }

    run()
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, []) // eslint-disable-line

  const showParticles = phase === 'impact' || phase === 'drift' || phase === 'assemble'

  return (
    <div className="lp-intro">
      <div className="lp-intro__stage">

        <AnimatePresence>
          {showParticles && PARTICLES.map((p) => {
            const isDrift = phase === 'drift' || phase === 'assemble'
            return (
              <motion.span
                key={p.id}
                className="lp-intro__particle"
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.2, filter: 'blur(8px)' }}
                animate={isDrift ? {
                  opacity: p.isSurvivor && phase === 'drift' ? p.peakOpacity * 0.35 : 0,
                  x: p.dx, y: p.dy,
                  scale:  p.isSurvivor ? 0.55 : 0.2,
                  filter: 'blur(3px)',
                } : {
                  opacity: [0, p.peakOpacity, p.peakOpacity * 0.55],
                  x: p.bx, y: p.by,
                  scale:  [0.2, 1.2, 0.9],
                  filter: ['blur(8px)', 'blur(0px)', 'blur(1px)'],
                }}
                exit={{ opacity: 0, transition: { duration: 0.3 } }}
                transition={{
                  duration: isDrift ? 1.2 : 0.55,
                  delay:    isDrift ? 0   : p.delay,
                  ease:     isDrift ? [0.4, 0, 0.6, 1] : [0.2, 0, 0.1, 1],
                }}
                style={{ fontSize: p.fontSize, rotate: `${p.rotation}deg` }}
              >
                {p.glyph}
              </motion.span>
            )
          })}
        </AnimatePresence>

        <motion.div
          className="lp-intro__wordmark"
          initial={{ y: '-130vh', opacity: 0, scale: 1, filter: 'blur(10px)' }}
          animate={wordmarkCtrl}
        >
          Aura
        </motion.div>

        <motion.div
          className="lp-intro__tagline"
          initial={{ opacity: 0, y: 18, filter: 'blur(4px)' }}
          animate={taglineCtrl}
        >
          Explore. Navigate. Prosper.
        </motion.div>

        <motion.p
          className="lp-intro__sub"
          initial={{ opacity: 0, y: 10 }}
          animate={subCtrl}
        >
          Chart your course toward financial freedom.
        </motion.p>

        <motion.div
          className="lp-intro__cta-wrap"
          initial={{ opacity: 0, y: 12 }}
          animate={ctaCtrl}
          style={{ pointerEvents: ctaReady ? 'auto' : 'none' }}
        >
          <AuraPlatinumButton
            size="md"
            onClick={() => onBegin?.()}
            aria-label="Begin your journey"
          >
            Begin your journey
          </AuraPlatinumButton>
        </motion.div>

      </div>
    </div>
  )
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
