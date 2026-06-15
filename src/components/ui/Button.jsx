// ═══════════════════════════════════════════════════════════════
// Button.jsx — Aura Finance base button component
// Props:
//   variant  — 'secondary' | 'destructive'  (default: 'secondary')
//   icon     — Phosphor icon component (optional, renders left of label)
//   onClick  — click handler
//   disabled — boolean
//   type     — 'button' | 'submit'
//   children — label
// ═══════════════════════════════════════════════════════════════
import { motion } from 'framer-motion'
import './Button.css'

export default function Button({
  variant  = 'secondary',
  icon: Icon,
  onClick,
  disabled = false,
  type     = 'button',
  children,
  className = '',
}) {
  return (
    <motion.button
      type={type}
      className={`btn btn--${variant}${className ? ' ' + className : ''}`}
      onClick={onClick}
      disabled={disabled}
      whileTap={disabled ? {} : { scale: 0.97 }}
    >
      {Icon && <Icon size={15} weight="fill" />}
      {children}
    </motion.button>
  )
}
