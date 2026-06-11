// ═══════════════════════════════════════════════
// primitives.jsx
// Zero inline styles. All visual values via CSS classes.
// The only style prop used: --progress-pct custom property
// on ProgressBar, which is a data value not a design decision.
// ═══════════════════════════════════════════════
import './primitives.css'

/* ── Badge ──────────────────────────────────────────────────── */
export function Badge({ children, variant = 'neutral' }) {
  return <span className={`badge badge--${variant}`}>{children}</span>
}

/* ── Button ─────────────────────────────────────────────────── */
export function Button({
  children, variant = 'ghost', size = 'md',
  full = false, icon, onClick, disabled, className = '', ...props
}) {
  const cls = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    full ? 'btn--full' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button className={cls} onClick={onClick} disabled={disabled} {...props}>
      {icon}
      {children}
    </button>
  )
}

/* ── Avatar ─────────────────────────────────────────────────── */
export function Avatar({ initials, size = 'md' }) {
  return (
    <div className={`avatar avatar--${size}`}>{initials}</div>
  )
}

/* ── IconBox ─────────────────────────────────────────────────── */
export function IconBox({ children, variant = 'neutral', size = 'md' }) {
  return (
    <div className={`icon-box icon-box--${size} icon-box--${variant}`}>
      {children}
    </div>
  )
}

/* ── MetricCell ─────────────────────────────────────────────── */
export function MetricCell({ label, value, sub, valueVariant = '' }) {
  const valueCls = [
    'metric-cell__value',
    valueVariant ? `metric-cell__value--${valueVariant}` : '',
  ].filter(Boolean).join(' ')

  return (
    <div className="metric-cell">
      <div className="metric-cell__label">{label}</div>
      <div className={valueCls}>{value}</div>
      {sub && <div className="metric-cell__sub">{sub}</div>}
    </div>
  )
}

/* ── ProgressBar ─────────────────────────────────────────────
   --progress-pct is a CSS custom property carrying a computed
   data value (percentage). It is not a design token — it is
   equivalent to setting an attribute. The fill color comes
   entirely from the variant modifier class.
─────────────────────────────────────────────────────────────── */
export function ProgressBar({ pct, variant = 'brand', thin = false }) {
  const trackCls = ['progress-bar', thin ? 'progress-bar--thin' : ''].filter(Boolean).join(' ')
  const fillCls  = `progress-bar__fill progress-bar__fill--${variant}`

  return (
    <div className={trackCls}>
      <div
        className={fillCls}
        style={{ '--progress-pct': `${pct}%` }}
      />
    </div>
  )
}

/* ── UtilBar — threshold variant resolved in component ───────── */
export function UtilBar({ pct }) {
  const fillVariant = pct < 20 ? 'util-low' : pct < 35 ? 'util-medium' : 'util-high'
  return (
    <div className="progress-bar progress-bar--thin">
      <div
        className={`progress-bar__fill progress-bar__fill--${fillVariant}`}
        style={{ '--progress-pct': `${pct}%` }}
      />
    </div>
  )
}

/* ── InsightStrip ────────────────────────────────────────────── */
export function InsightStrip({ children, variant = 'brand' }) {
  return (
    <div className={`insight-strip insight-strip--${variant}`}>
      <div className="insight-strip__dot" />
      <span>{children}</span>
    </div>
  )
}

/* ── SectionOverline ─────────────────────────────────────────── */
export function SectionOverline({ children }) {
  return <div className="section-overline">{children}</div>
}
