// ═══════════════════════════════════════════════════════════════
// CurrencyCell.jsx
//
// One currency value rendered as: SYMBOL · D · D · D · , · D · D · D
// Each numeric character is a DigitColumn — animating vertically
// in a seamless loop. Comma and symbol are static.
//
// The `baseDelay` prop offsets every column's phase, creating the
// spatial wave across the full grid when cells have different delays.
//
// Typography is FIXED everywhere:
//   font-family: Space Grotesk
//   font-weight: 700
//   font-size:   determined by parent grid
//   color:       #FFFFFF at fixed opacity
// ═══════════════════════════════════════════════════════════════
import DigitColumn from './DigitColumn'

// Spacing between digit columns within one number (em)
const CHAR_GAP = '0.01em'

/**
 * @param {string} props.symbol      – '₹' | '$' | '€' | '¥' | '£'
 * @param {string} props.digits      – digit string without commas, e.g. '123456'
 * @param {number} props.baseDelay   – seconds: phase offset for this whole cell
 * @param {number} props.colStagger  – seconds added per digit column within cell
 * @param {number} props.cycleDuration – seconds per full digit cycle
 * @param {number} props.digitH      – px height of one digit row
 */
export default function CurrencyCell({
  symbol    = '₹',
  digits    = '123456',
  baseDelay = 0,
  colStagger = 0.18,
  cycleDuration = 3.2,
  digitH    = 52,
}) {
  // Build character array: insert comma every 3 digits from right
  const formatted = insertCommas(digits)

  let digitIdx = 0 // tracks position among numeric chars only

  return (
    <span
      style={{
        display:        'inline-flex',
        alignItems:     'flex-start',
        gap:            CHAR_GAP,
        fontFamily:     'var(--font-display)',
        fontWeight:     700,
        lineHeight:     `${digitH}px`,
        userSelect:     'none',
        pointerEvents:  'none',
        whiteSpace:     'nowrap',
      }}
    >
      {/* Currency symbol — static, no rolling */}
      <span style={{ height: `${digitH}px`, lineHeight: `${digitH}px` }}>
        {symbol}
      </span>

      {formatted.map((char, i) => {
        if (char === ',') {
          return (
            <span
              key={`comma-${i}`}
              style={{ height: `${digitH}px`, lineHeight: `${digitH}px` }}
            >
              ,
            </span>
          )
        }

        // Each numeric column gets a staggered delay
        const colDelay = baseDelay + digitIdx * colStagger
        digitIdx++

        return (
          <DigitColumn
            key={`d-${i}`}
            delay={-colDelay} // negative = start mid-cycle (not from zero)
            duration={cycleDuration}
            digitH={digitH}
          />
        )
      })}
    </span>
  )
}

// ── Helper ────────────────────────────────────────────────────
function insertCommas(numStr) {
  const chars = []
  for (let i = 0; i < numStr.length; i++) {
    const fromRight = numStr.length - 1 - i
    chars.push(numStr[i])
    if (fromRight > 0 && fromRight % 3 === 0) chars.push(',')
  }
  return chars
}
