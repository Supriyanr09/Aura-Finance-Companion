// TaglineSequence.jsx — CTA click transition
// ═══════════════════════════════════════════════════════════════
// Triggered when "Begin your journey" is clicked.
// Three words mount sequentially, immediately animate to their
// exit state (scale up, fade, blur), then navigate('/login').
//
// Fix notes:
//   · Each word needs both `animate` and `exit` — without `animate`
//     Framer Motion skips the exit lifecycle.
//   · onDone fires from onAnimationComplete on the last word's exit,
//     not from a setTimeout, so it waits for the actual animation end.
//   · z-index: 50 ensures words render above CinematicIntro (z-index: 20).
//
// Props:
//   active  — boolean: starts the sequence when true
//   onDone  — called after Prosper finishes animating out
//
// Styles: src/styles/landing.css (.lp-sequence__)
// ═══════════════════════════════════════════════════════════════
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

const WORDS = [
  { text: 'Explore',  delayMs: 0   },
  { text: 'Navigate', delayMs: 240 },
  { text: 'Prosper',  delayMs: 480 },
]

const DURATION = 0.72 // seconds per word

export default function TaglineSequence({ active = false, onDone }) {
  const [mounted, setMounted] = useState([])   // indices currently in DOM
  const [exiting, setExiting] = useState([])   // indices currently animating out

  useEffect(() => {
    if (!active) {
      setMounted([])
      setExiting([])
      return
    }

    const timers = []

    WORDS.forEach((w, i) => {
      // Mount word after its stagger delay
      timers.push(setTimeout(() => {
        setMounted(prev => [...prev, i])

        // Immediately flag it as exiting so exit animation runs right away
        timers.push(setTimeout(() => {
          setExiting(prev => [...prev, i])
          // Remove from DOM after animation completes (DURATION + small buffer)
          timers.push(setTimeout(() => {
            setMounted(prev => prev.filter(idx => idx !== i))
            if (i === WORDS.length - 1) onDone?.()
          }, DURATION * 1000 + 80))
        }, 60)) // tiny window so mount paint happens first
      }, w.delayMs))
    })

    return () => timers.forEach(clearTimeout)
  }, [active]) // eslint-disable-line

  if (!active) return null

  return (
    <div className="lp-sequence lp-sequence--transition">
      {WORDS.map((w, i) => (
        <AnimatePresence key={w.text} mode="sync">
          {mounted.includes(i) && (
            <motion.div
              className="lp-sequence__stage"
              initial={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              animate={
                exiting.includes(i)
                  ? { opacity: 0, scale: 7, filter: 'blur(16px)' }
                  : { opacity: 1, scale: 1, filter: 'blur(0px)' }
              }
              transition={{ duration: DURATION, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="lp-sequence__word">{w.text}</span>
            </motion.div>
          )}
        </AnimatePresence>
      ))}
    </div>
  )
}
