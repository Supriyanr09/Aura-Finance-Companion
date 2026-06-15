// ═══════════════════════════════════════════════════════════════
// IconButton.jsx — Reusable icon button primitive
// Props:
//   icon        — Phosphor icon component (required)
//   onClick     — click handler
//   label       — aria-label (required for accessibility)
//   variant     — 'default' | 'danger'
//   active      — boolean, applies active state
//   badge       — number, renders a notification badge
//   size        — icon size in px (default 18)
//   iconWeight  — Phosphor weight, overrides active logic if passed
// All styles via tokens in IconButton.css. Zero hardcoded values.
// ═══════════════════════════════════════════════════════════════
import { motion } from 'framer-motion'
import './IconButton.css'

export default function IconButton({
  icon: Icon,
  onClick,
  label,
  variant = 'default',
  active  = false,
  badge,
  size    = 18,
  iconWeight,
  className = '',
  ...rest
}) {
  const classes = [
    'icon-btn',
    variant === 'danger' ? 'icon-btn--danger' : '',
    active                ? 'icon-btn--active' : '',
    className,
  ].filter(Boolean).join(' ')

  const weight = iconWeight ?? (active ? 'fill' : 'regular')

  return (
    <motion.button
      className={classes}
      onClick={onClick}
      whileTap={{ scale: 0.88 }}
      aria-label={label}
      aria-pressed={active}
      {...rest}
    >
      <Icon size={size} weight={weight} />
      {badge != null && badge > 0 && (
        <span className="icon-btn__badge" aria-label={`${badge} unread`}>
          {badge}
        </span>
      )}
    </motion.button>
  )
}
