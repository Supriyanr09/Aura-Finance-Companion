// IconTextButton.jsx — Aura Finance design system
// Borderless icon + label button. Ghost, no background, no border.
// variant: 'default' | 'subtle' | 'danger'
// size: 'sm' | 'md'

import './IconTextButton.css'

export default function IconTextButton({
  icon,
  children,
  onClick,
  variant  = 'default',
  size     = 'sm',
  type     = 'button',
  disabled = false,
  className = '',
}) {
  const cls = [
    'itb',
    `itb--${variant}`,
    `itb--${size}`,
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      className={cls}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className="itb__icon" aria-hidden="true">{icon}</span>}
      {children && <span className="itb__label">{children}</span>}
    </button>
  )
}
