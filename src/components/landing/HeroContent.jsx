// HeroContent.jsx — persistent hero state after brand reveal
// Styles: src/styles/landing.css (.lp-hero-content__)
import { motion } from 'framer-motion'

const EASE_OUT = [0.16, 1, 0.3, 1]

export default function HeroContent({ visible, scrollProgress = 0 }) {
  const heroOpacity = Math.max(0, 1 - scrollProgress / 0.15)

  return (
    <motion.div
      className="lp-hero-content"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? heroOpacity : 0 }}
      transition={{ duration: 0.7, ease: EASE_OUT }}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
    >
      {/* Center cluster: name · taglines */}
      <div className="lp-hero-content__cluster">

        <motion.h1
          className="lp-hero-content__name"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 12 }}
          transition={{ duration: 0.65, delay: 0.15, ease: EASE_OUT }}
        >
          Aura
        </motion.h1>

        <motion.p
          className="lp-hero-content__tagline"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 10 }}
          transition={{ duration: 0.6, delay: 0.25, ease: EASE_OUT }}
        >
          Explore. Navigate. Prosper.
        </motion.p>

        <motion.p
          className="lp-hero-content__sub"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 8 }}
          transition={{ duration: 0.6, delay: 0.35, ease: EASE_OUT }}
        >
          Chart your course toward financial freedom.
        </motion.p>

      </div>

      {/* Scroll indicator — pinned to viewport bottom */}
      <motion.div
        className="lp-hero-content__scroll"
        initial={{ opacity: 0 }}
        animate={{ opacity: visible ? 0.45 : 0 }}
        transition={{ duration: 0.6, delay: 0.55, ease: EASE_OUT }}
      >
        <motion.span
          className="lp-hero-content__scroll-label"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          ↓ Begin Your Journey
        </motion.span>
      </motion.div>

    </motion.div>
  )
}
