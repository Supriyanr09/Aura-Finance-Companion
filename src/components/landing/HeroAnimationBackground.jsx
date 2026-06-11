// ═══════════════════════════════════════════════════════════════
// HeroAnimationBackground.jsx
//
// Jitter Animated Repeater–style kinetic typography grid.
//
// DESIGN MODEL:
//   A sparse 2D field of currency values. Every value is a column
//   of vertically cycling digits. The stagger delay is a function
//   of (col + row) so the animation ripples diagonally across the
//   field — the Jitter "repeater wave" effect.
//
// TYPOGRAPHY — identical everywhere:
//   Font:    Space Grotesk 700
//   Size:    48px
//   Color:   #FFFFFF
//   Opacity: 0.11 (single value, no layering)
//
// MOTION — vertical only:
//   Each digit column cycles 0→9 in a CSS keyframe loop.
//   Phase offset = -(col × A + row × B) seconds.
//   No horizontal movement. No scrolling. No marquee.
//
// SPACING — generous:
//   Columns: ~220px apart
//   Rows:    ~140px apart
//   Grid is wider than viewport so edges are always populated.
//   Center zone: ~500×320px area left clear by vignette.
// ═══════════════════════════════════════════════════════════════
import CurrencyCell from './CurrencyCell'

// ── Grid parameters ───────────────────────────────────────────
const FONT_SIZE_PX   = 48      // single consistent size
const LINE_HEIGHT_PX = 52      // digitH — slightly more than font size
const OPACITY        = 0.11    // single consistent opacity
const COL_GAP        = 224     // px between cell left edges
const ROW_GAP        = 148     // px between row top edges
const GRID_COLS      = 8       // enough to overflow viewport width
const GRID_ROWS      = 8       // enough to overflow viewport height

// Stagger: how many seconds of phase shift per column and per row.
// The diagonal wave comes from combining both.
const STAGGER_COL    = 0.38    // s per column step
const STAGGER_ROW    = 0.55    // s per row step

// Base cycle duration for one digit column (seconds for 0→9)
const CYCLE_DURATION = 2.8

// Column stagger within a single cell's digits
const COL_STAGGER    = 0.14

// Currency symbol pool — assigned deterministically by cell position
const SYMBOLS = ['₹', '$', '€', '¥', '£']

// Digit string pool — varied lengths for visual rhythm
// These are starting seeds; the rolling means the actual displayed
// digit is always moving, so the seed only affects initial phase.
const DIGIT_SEEDS = [
  '12543', '4382',  '91200',
  '803200','2185',  '87340',
  '31090', '5670',  '124500',
  '8820',  '3291',  '99400',
  '22780', '54300', '14230',
  '71500', '18440', '6115',
  '55820', '24600', '44870',
]

function getSymbol(col, row) {
  return SYMBOLS[(col * 3 + row * 2) % SYMBOLS.length]
}

function getDigits(col, row) {
  return DIGIT_SEEDS[(col + row * GRID_COLS) % DIGIT_SEEDS.length]
}

// ── Grid offset so it's centered on the viewport ─────────────
// Total grid width  ≈ GRID_COLS × COL_GAP
// Total grid height ≈ GRID_ROWS × ROW_GAP
// We start the grid at a negative offset so it overhangs both
// sides of the viewport, ensuring no visible edges.
const GRID_START_X = -((GRID_COLS * COL_GAP - window.innerWidth)  / 2) - COL_GAP
const GRID_START_Y = -((GRID_ROWS * ROW_GAP - window.innerHeight) / 2) - ROW_GAP / 2

export default function HeroAnimationBackground() {
  // Build flat cell list
  const cells = []
  for (let row = 0; row < GRID_ROWS; row++) {
    for (let col = 0; col < GRID_COLS; col++) {
      // Phase offset: diagonal wave — later cols and later rows start later
      const phaseDelay = col * STAGGER_COL + row * STAGGER_ROW

      cells.push({
        key:   `${col}-${row}`,
        x:     GRID_START_X + col * COL_GAP,
        y:     GRID_START_Y + row * ROW_GAP,
        symbol: getSymbol(col, row),
        digits: getDigits(col, row),
        baseDelay: phaseDelay,
      })
    }
  }

  return (
    <div
      aria-hidden="true"
      style={{
        position:      'absolute',
        inset:          0,
        overflow:      'hidden',
        pointerEvents: 'none',
        background:    '#060818',
        zIndex:         0,
      }}
    >
      {/* ── Typography grid ───────────────────────────────── */}
      <div
        style={{
          position:  'absolute',
          top:        0,
          left:       0,
          width:     '100%',
          height:    '100%',
          color:     '#FFFFFF',
          fontSize:  `${FONT_SIZE_PX}px`,
          opacity:    OPACITY,
        }}
      >
        {cells.map((cell) => (
          <div
            key={cell.key}
            style={{
              position: 'absolute',
              left:     `${cell.x}px`,
              top:      `${cell.y}px`,
            }}
          >
            <CurrencyCell
              symbol={cell.symbol}
              digits={cell.digits}
              baseDelay={cell.baseDelay}
              colStagger={COL_STAGGER}
              cycleDuration={CYCLE_DURATION}
              digitH={LINE_HEIGHT_PX}
            />
          </div>
        ))}
      </div>

      {/* ── Center vignette — clears the hero content zone ── */}
      {/* Smooth dark ellipse that erases ~500×320px center  */}
      <div
        style={{
          position: 'absolute',
          inset:    0,
          background: `
            radial-gradient(
              ellipse 44% 38% at 50% 50%,
              #060818        0%,
              rgba(6,8,24,.93) 22%,
              rgba(6,8,24,.72) 42%,
              rgba(6,8,24,.32) 62%,
              transparent    82%
            )
          `,
          zIndex: 1,
        }}
      />

      {/* ── Edge fades — hard borders feel cheap ─────────── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '12%',
        background: 'linear-gradient(to bottom, #060818, transparent)',
        zIndex: 1,
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '12%',
        background: 'linear-gradient(to top, #060818, transparent)',
        zIndex: 1,
      }} />
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: '6%',
        background: 'linear-gradient(to right, #060818, transparent)',
        zIndex: 1,
      }} />
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: '6%',
        background: 'linear-gradient(to left, #060818, transparent)',
        zIndex: 1,
      }} />

      {/* ── Ambient brand glow at center ─────────────────── */}
      <div
        style={{
          position:  'absolute',
          top:       '50%',
          left:      '50%',
          transform: 'translate(-50%, -50%)',
          width:     '560px',
          height:    '320px',
          background:'radial-gradient(ellipse, rgba(109,93,252,0.07) 0%, transparent 70%)',
          zIndex:     1,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
