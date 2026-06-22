// ═══════════════════════════════════════════════════════════════
// AuraPlatinumButton.jsx
// Primary button component — Aura Finance design system.
//
// Design: Platinum outline · Transparent fill · Premium restraint
// Variants: lg (56px landing CTA) · md (48px login CTA) · sm (40px)
//
// Usage:
//   <AuraPlatinumButton onClick={fn}>Begin your journey</AuraPlatinumButton>
//   <AuraPlatinumButton size="md" loading={isLoading}>Sign In</AuraPlatinumButton>
//   <AuraPlatinumButton showMark={false} size="sm">Continue</AuraPlatinumButton>
//
// Props:
//   children   — button label (required)
//   size       — 'lg' | 'md' | 'sm'  (default: 'md')
//   onClick    — click handler
//   disabled   — boolean
//   loading    — boolean, shows spinner instead of label
//   showMark   — boolean, show Aura logo mark (default: true for lg, false for md/sm)
//   showArrow  — boolean, show trailing arrow (default: true)
//   type       — 'button' | 'submit'  (default: 'button')
//   className  — additional class string (layout only — no design overrides)
//
// Styling: AuraPlatinumButton.css — .apb- namespace
// All visual values via CSS classes. Zero inline styles.
// ═══════════════════════════════════════════════════════════════
import './AuraPlatinumButton.css'

export default function AuraPlatinumButton({
  children,
  size      = 'md',
  onClick,
  disabled  = false,
  loading   = false,
  showMark,        // explicit override — if not provided, defaults by size
  showArrow = true,
  type      = 'button',
  className = '',
}) {
  // Default mark visibility: show on large CTAs (landing page), hide on medium/small
  const displayMark = showMark !== undefined ? showMark : size === 'lg'

  const cls = [
    'apb',
    `apb--${size}`,
    loading       ? 'apb--loading'  : '',
    !displayMark  ? 'apb--no-mark'  : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <button
      className={cls}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
    >
      {/* Continuous platinum border loop — visual only, aria-hidden */}
      <span className="apb__loop" aria-hidden="true" />

      {/* Shine sweep overlay — visual only, aria-hidden */}
      <span className="apb__shine" aria-hidden="true" />

      {/* Aura mark — large CTA only by default */}
      {displayMark && !loading && (
        <span className="apb__mark" aria-hidden="true">
          {/* <img
            src="/Logo.svg"
            alt=""
            onError={e => {
              e.currentTarget.style.display = 'none'
              e.currentTarget.nextElementSibling?.removeAttribute('hidden')
            }}
          /> */}
          {/* <span className="apb__mark-fallback" hidden>A</span> */}
        </span>
      )}

      {/* Content: spinner while loading, label otherwise */}
      {loading
        ? <span className="apb__spinner" aria-hidden="true" />
        : <span className="apb__label">{children}</span>
      }

      {/* Trailing arrow — hidden while loading */}
      {showArrow && !loading && (
        <span className="apb__arrow" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3 8h10M9 4l4 4-4 4"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </button>
  )
}
