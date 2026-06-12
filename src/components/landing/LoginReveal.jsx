// LoginReveal.jsx — inline login, final stage of the journey
// Styles: src/styles/landing.css (.lp-login__)
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const EASE_OUT = [0.16, 1, 0.3, 1]

export default function LoginReveal({ visible }) {
  const [email, setEmail]   = useState('')
  const [password, setPass] = useState('')
  const navigate            = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    navigate('/app')
  }

  return (
    <motion.div
      className="lp-login"
      initial={{ opacity: 0 }}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.9, ease: EASE_OUT }}
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
    >
      <motion.div
        className="lp-login__card"
        initial={{ y: 24, scale: 0.97 }}
        animate={{ y: visible ? 0 : 24, scale: visible ? 1 : 0.97 }}
        transition={{ duration: 0.75, ease: EASE_OUT }}
      >
        {/* Header */}
        <div className="lp-login__header">
          <img
            src="/Logo.svg"
            alt="Aura"
            className="lp-login__logo"
            onError={e => { e.target.style.display = 'none' }}
          />
          <h2 className="lp-login__title">Welcome back</h2>
          <p className="lp-login__subtitle">Sign in to continue your journey</p>
        </div>

        {/* Form */}
        <form className="lp-login__form" onSubmit={handleSubmit}>
          <input
            className="lp-login__input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <input
            className="lp-login__input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPass(e.target.value)}
          />
          <button type="submit" className="lp-login__submit">
            Enter Aura
          </button>
        </form>

        {/* Footer */}
        <div className="lp-login__footer">
          <span className="lp-login__footer-link">Create account</span>
          <span className="lp-login__footer-sep">·</span>
          <span className="lp-login__footer-link">Forgot password</span>
        </div>

      </motion.div>
    </motion.div>
  )
}
