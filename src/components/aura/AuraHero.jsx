// ═══════════════════════════════════════════════
// AuraHero.jsx — Mascot hero section
// Styles in AuraHero.css. Framer Motion for animation only.
// ═══════════════════════════════════════════════
import { motion } from 'framer-motion'
import './AuraHero.css'

const PROMPTS = [
  { icon: '✈️', text: 'Can I afford a vacation?'          },
  { icon: '💹', text: 'Help me invest ₹10,000'            },
  { icon: '🐷', text: 'Improve my savings'                },
  { icon: '📊', text: 'How much did I spend this month?'  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 26 } },
}

export default function AuraHero({ onPrompt }) {
  return (
    <motion.div className="aura-hero" variants={fadeUp}>

      {/* Ambient wash */}
      <div className="aura-hero__wash" aria-hidden />

      {/* Mascot */}
      <motion.div
        className="aura-hero__mascot"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Orbit ring */}
        {/* <motion.div
          className="aura-hero__orbit"
          animate={{ rotate: 360 }}
          transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
        >
          <div className="aura-hero__orbit-dot" />
        </motion.div> */}

        <img
          className="aura-hero__mascot-img"
          src="/Mascot - Aura.svg"
          alt="Aura — your AI financial companion"
          draggable={false}
        />
      </motion.div>

      {/* Copy */}
      <div className="aura-hero__body">
        <div className="aura-hero__eyebrow">Your Personal CFO</div>
        <h2 className="aura-hero__headline">
          What would you like help with today?
        </h2>
        <div className="aura-hero__prompts">
          {PROMPTS.map((p) => (
            <motion.button
              key={p.text}
              className="aura-prompt-chip"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onPrompt?.(p.text)}
            >
              <span className="aura-prompt-chip__icon" aria-hidden>{p.icon}</span>
              {p.text}
            </motion.button>
          ))}
        </div>
      </div>

    </motion.div>
  )
}
