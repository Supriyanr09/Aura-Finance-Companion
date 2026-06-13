// LoginReveal.jsx — final stage of the landing journey
// Replaces the inline login form with a pure CTA moment.
// Clicking "Begin Your Journey" navigates to /login.
// Styles: src/styles/landing.css (.lp-login__ + .lp-cta__ namespaces)

import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

const EASE_OUT = [0.16, 1, 0.3, 1]

export default function LoginReveal({ visible }) {
  const navigate = useNavigate()

  return (
    <motion.div
      className="lp-login"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.9, ease: EASE_OUT }}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
    >
      <motion.div
        className="lp-cta"
        initial={{ y: 28, scale: 0.96 }}
        animate={{ y: visible ? 0 : 28, scale: visible ? 1 : 0.96 }}
        transition={{ duration: 0.75, ease: EASE_OUT }}
      >
        {/* Aura branding */}
        <div className="lp-cta__brand">
          <img
            src="/Logo.svg"
            alt="Aura"
            className="lp-cta__logo"
            onError={e => { e.currentTarget.style.display = 'none' }}
          />
          <span className="lp-cta__wordmark">AURA</span>
        </div>

        {/* Tagline */}
        <p className="lp-cta__tagline">Explore. Navigate. Prosper.</p>

        {/* Primary CTA */}
        <button
          className="lp-cta__btn"
          onClick={() => navigate('/login')}
        >
          Begin Your Journey
        </button>

        {/* Sub-copy */}
        <p className="lp-cta__sub">Your financial cockpit awaits.</p>
      </motion.div>
    </motion.div>
  )
}
