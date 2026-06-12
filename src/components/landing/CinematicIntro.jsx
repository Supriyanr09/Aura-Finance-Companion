// CinematicIntro.jsx
// ═══════════════════════════════════════════════════════════════
// One continuous timeline. Replaces BrandReveal.
// Controls: wordmark descent → impact burst → particle drift →
//           tagline emergence → handoff to scroll sequence.
//
// TIMELINE (ms from mount):
//   0        — video plays, screen dark, anticipation
//   400      — wordmark begins descent from far above viewport
//   1600     — wordmark arrives at center (settle)
//   1650     — IMPACT: burst fires, particles scatter outward
//   1700     — screen micro-pulse (scale settle on wordmark)
//   2200     — burst particles begin drifting/dissolving
//   2800     — survivors slow, tagline text assembles beneath wordmark
//   3400     — tagline fully visible, wordmark begins subtle fade-back
//   3800     — onComplete() fires → LandingPage shows hero state
//
// Styles: src/styles/landing.css (.lp-intro__)
// ═══════════════════════════════════════════════════════════════
import { motion, AnimatePresence, useAnimation } from 'framer-motion'
import { useEffect, useState, useMemo } from 'react'

// ── Particle system ───────────────────────────────────────────
const GLYPHS = [
  '₹','$','€','¥','£','₹','$','€','¥','£',
  '12,543','4,382','9,120','2,185','87,340',
  '803,200','31,090','5,670','54,300',
  '₹','$','€','¥','£',
  '290','803','182','54','12','99',
  '3,291','9,940','22,780',
]

// Build 48 particles — wider range, more depth layers
function buildParticles() {
  return GLYPHS.map((glyph, i) => {
    const angle   = (i / GLYPHS.length) * 360 + (i % 7) * 8.5
    const rad     = (angle * Math.PI) / 180
    // Distance varies significantly — creates depth
    const dist    = 140 + (i % 6) * 62
    const layer   = i % 3  // 0=near, 1=mid, 2=far
    return {
      id:       i,
      glyph,
      // Impact trajectory — how far they fly on burst
      bx:       Math.cos(rad) * dist,
      by:       Math.sin(rad) * dist,
      // Drift destination — where survivors slowly settle
      dx:       Math.cos(rad + 0.3) * (dist * 1.6),
      dy:       Math.sin(rad + 0.3) * (dist * 1.4),
      rotation: angle * 0.25 - 15,
      // Stagger so particles don't all fire simultaneously
      delay:    0.01 + (i % 8) * 0.022,
      // Visual properties vary by layer
      fontSize: layer === 0 ? 18 + (i % 4) * 5
              : layer === 1 ? 12 + (i % 3) * 4
              :               9  + (i % 2) * 3,
      peakOpacity: layer === 0 ? 0.82
                 : layer === 1 ? 0.60
                 :               0.38,
      // Survivors persist after burst — used for tagline bridge
      isSurvivor: i % 5 === 0,
    }
  })
}

const PARTICLES = buildParticles()

// Easing curves
const EASE_ARRIVE  = [0.12, 0, 0.08, 1]     // heavy momentum, hard stop
const EASE_SETTLE  = [0.34, 1.12, 0.64, 1]  // slight overshoot on settle
const EASE_OUT     = [0.16, 1,    0.3,  1]

export default function CinematicIntro({ onComplete }) {
  const [phase, setPhase] = useState('wait')
  // phases: wait → descend → impact → drift → assemble → done

  const wordmarkCtrl  = useAnimation()
  const taglineCtrl   = useAnimation()
  const subtagCtrl    = useAnimation()

  useEffect(() => {
    let cancelled = false
    const go = async () => {
      // ── Phase 1: Wordmark descends ─────────────────────
      await delay(400)
      if (cancelled) return
      setPhase('descend')
      await wordmarkCtrl.start({
        y:       0,
        opacity: 1,
        // Scale breathes in slightly on arrival — weight
        scale:   [1, 1.04, 1.0],
        filter:  'blur(0px)',
        transition: {
          y:       { duration: 1.15, ease: EASE_ARRIVE },
          opacity: { duration: 0.5,  ease: 'easeOut' },
          scale:   { duration: 0.5,  delay: 1.05, ease: EASE_SETTLE, times: [0, 0.5, 1] },
          filter:  { duration: 0.6,  ease: 'easeOut' },
        },
      })

      // ── Phase 2: Impact ────────────────────────────────
      if (cancelled) return
      setPhase('impact')
      // Micro-settle pulse on wordmark
      wordmarkCtrl.start({
        scale: [1.0, 0.97, 1.0],
        transition: { duration: 0.35, ease: EASE_SETTLE, times: [0, 0.4, 1] },
      })

      // ── Phase 3: Particles drift ───────────────────────
      await delay(600)
      if (cancelled) return
      setPhase('drift')

      // ── Phase 4: Tagline assembles ─────────────────────
      await delay(800)
      if (cancelled) return
      setPhase('assemble')
      await taglineCtrl.start({
        opacity: 1,
        y:       0,
        filter:  'blur(0px)',
        transition: { duration: 0.75, ease: EASE_OUT },
      })
      await delay(200)
      if (cancelled) return
      await subtagCtrl.start({
        opacity: 1,
        y:       0,
        transition: { duration: 0.6, ease: EASE_OUT },
      })

      // ── Phase 5: Handoff ───────────────────────────────
      await delay(400)
      if (cancelled) return
      setPhase('done')
      onComplete?.()
    }

    go()
    return () => { cancelled = true }
  }, []) // eslint-disable-line

  const showParticles = phase === 'impact' || phase === 'drift' || phase === 'assemble'
  const showTagline   = phase === 'assemble' || phase === 'done'

  return (
    <div className="lp-intro">
      <div className="lp-intro__stage">

        {/* ── Particles ───────────────────────────────── */}
        <AnimatePresence>
          {showParticles && PARTICLES.map((p) => {
            const isDrift = phase === 'drift' || phase === 'assemble'
            return (
              <motion.span
                key={p.id}
                className="lp-intro__particle"
                initial={{ opacity: 0, x: 0, y: 0, scale: 0.3, filter: 'blur(6px)' }}
                animate={isDrift ? {
                  // Survivors drift slowly outward; others dissolve
                  opacity: p.isSurvivor && phase === 'drift' ? p.peakOpacity * 0.4 : 0,
                  x: p.dx,
                  y: p.dy,
                  scale:  p.isSurvivor ? 0.6 : 0.3,
                  filter: 'blur(2px)',
                } : {
                  // Impact burst
                  opacity: [0, p.peakOpacity, p.peakOpacity * 0.5],
                  x: p.bx,
                  y: p.by,
                  scale:  [0.3, 1.1, 0.85],
                  filter: ['blur(6px)', 'blur(0px)', 'blur(1px)'],
                }}
                exit={{ opacity: 0, transition: { duration: 0.4 } }}
                transition={{
                  duration: isDrift ? 1.4 : 0.65,
                  delay:    isDrift ? 0    : p.delay,
                  ease:     isDrift ? [0.4, 0, 0.6, 1] : EASE_OUT,
                }}
                style={{
                  fontSize: p.fontSize,
                  rotate:   `${p.rotation}deg`,
                }}
              >
                {p.glyph}
              </motion.span>
            )
          })}
        </AnimatePresence>

        {/* ── Wordmark ────────────────────────────────── */}
        <motion.div
          className="lp-intro__wordmark"
          initial={{ y: '-120vh', opacity: 0, scale: 1, filter: 'blur(8px)' }}
          animate={wordmarkCtrl}
        >
          Aura
        </motion.div>

        {/* ── Tagline — assembles from particle aftermath ─ */}
        <motion.div
          className="lp-intro__tagline"
          initial={{ opacity: 0, y: 18, filter: 'blur(4px)' }}
          animate={taglineCtrl}
        >
          Explore. Navigate. Prosper.
        </motion.div>

        {/* ── Sub-tagline ──────────────────────────────── */}
        <motion.p
          className="lp-intro__sub"
          initial={{ opacity: 0, y: 10 }}
          animate={subtagCtrl}
        >
          Chart your course toward financial freedom.
        </motion.p>

      </div>
    </div>
  )
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
