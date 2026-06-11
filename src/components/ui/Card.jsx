// ═══════════════════════════════════════════════
// Card.jsx — Reusable card primitive
// ═══════════════════════════════════════════════
import './Card.css'
import { ArrowRight } from '@phosphor-icons/react'

export function Card({ children, variant = 'default', accentTop, className = '', ...props }) {
  const classes = [
    'card',
    variant === 'raised' ? 'card--raised' : '',
    variant === 'ghost'  ? 'card--ghost'  : '',
    accentTop === 'brand'  ? 'card--accent-top'  : '',
    accentTop === 'wealth' ? 'card--wealth-top'  : '',
    className,
  ].filter(Boolean).join(' ')

  return <div className={classes} {...props}>{children}</div>
}

export function CardHeader({ title, action, onAction }) {
  return (
    <div className="card__header">
      <span className="card__title">{title}</span>
      {action && (
        <button className="card__action" onClick={onAction}>
          {action} <ArrowRight size={12} />
        </button>
      )}
    </div>
  )
}

export function CardBody({ children, size = 'default' }) {
  return (
    <div className={size === 'sm' ? 'card__body card__body--sm' : 'card__body'}>
      {children}
    </div>
  )
}

export function CardFooter({ children, tinted = false }) {
  return (
    <div className={['card__footer', tinted ? 'card__footer--tinted' : ''].filter(Boolean).join(' ')}>
      {children}
    </div>
  )
}

export function CardRow({ children, interactive = false, className = '' }) {
  const classes = [
    'card__row',
    interactive ? 'card__row--interactive' : '',
    className,
  ].filter(Boolean).join(' ')
  return <div className={classes}>{children}</div>
}

export function CardInset({ children }) {
  return <div className="card__inset">{children}</div>
}
