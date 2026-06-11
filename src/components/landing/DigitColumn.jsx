// ═══════════════════════════════════════════════════════════════
// DigitColumn.jsx
//
// A single digit position that continuously cycles through 0–9
// by translating a vertical strip upward in a seamless loop.
//
// This is PURE CSS animation — zero JS state, zero React updates
// after mount. The digit strip loops forever via CSS keyframes.
//
// The animation phase offset (delay) is what creates the stagger
// wave across the grid. Each column in a cell gets a different
// delay; each cell in the grid gets a different base delay.
// ═══════════════════════════════════════════════════════════════

const DIGITS = '0123456789'

/**
 * @param {number} props.delay      – negative animation-delay (s) to offset phase
 * @param {number} props.duration   – seconds for one full 0→9 cycle
 * @param {number} props.digitH     – height of one digit in px (= font-size × line-height)
 */
export default function DigitColumn({ delay = 0, duration = 3, digitH = 52 }) {
  const totalH = digitH * 10

  // We use a unique ID per component instance so keyframe names don't collide
  // when many instances render. A stable key derived from props is fine here
  // since delay+duration uniquely identify the animation behaviour we want.
  // We encode to integers to keep the CSS selector valid.
  const keyName = `dc_${Math.round(delay * 1000)}_${Math.round(duration * 1000)}`

  return (
    <>
      <style>{`
        @keyframes ${keyName} {
          from { transform: translateY(0); }
          to   { transform: translateY(-${totalH}px); }
        }
      `}</style>

      <span
        style={{
          display:   'inline-block',
          height:    `${digitH}px`,
          overflow:  'hidden',
          verticalAlign: 'top',
        }}
      >
        {/* The strip: digits 0–9 then 0 again for seamless wrap */}
        <span
          style={{
            display:        'flex',
            flexDirection:  'column',
            lineHeight:     `${digitH}px`,
            animation:      `${keyName} ${duration}s linear infinite`,
            animationDelay: `${delay}s`,
            willChange:     'transform',
          }}
        >
          {(DIGITS + '0').split('').map((d, i) => (
            <span
              key={i}
              style={{
                display:    'block',
                height:     `${digitH}px`,
                lineHeight: `${digitH}px`,
                textAlign:  'center',
              }}
            >
              {d}
            </span>
          ))}
        </span>
      </span>
    </>
  )
}
