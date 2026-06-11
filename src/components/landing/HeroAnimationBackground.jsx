// HeroAnimationBackground.jsx
//
// A sparse typographic field for the Aura Finance landing page.
//
// MENTAL MODEL:
//   This is not a grid of currency values.
//   This is not a data visualization.
//   This is a field of characters distributed across space.
//   Some characters occasionally slip — a single quiet vertical
//   movement, like a departures board updating one entry.
//   The slips are infrequent, non-synchronized, non-sequential.
//   The eye perceives aliveness, not counting.
//
// COMPOSITION:
//   ~50 glyph positions scattered across the viewport.
//   Roughly half are active (can slip). Half are static.
//   Center zone is clear — reserved for brand content.
//   Positions are distributed to avoid obvious row/column reads.
//   No two adjacent glyphs share the same slip interval.
//
// TYPOGRAPHY: uniform everywhere.
//   Space Grotesk 700 · 44px · #FFFFFF · opacity 0.10
//
// MOTION: vertical only. Slip = translateY one slot, then reset.
//   Duration: 380ms. Easing: standard ease. No bounce.
//   Intervals: 3.5s – 9s range. Varied per glyph.
//   ~50% of active glyphs slip at any given moment across the field.

import GlyphSlip from './GlyphSlip'

const CHAR_H  = 52   // px — one character slot height
const FS      = 44   // font-size px
const OPACITY = 0.10 // single opacity across entire field

// ── Glyph field definition ────────────────────────────────────
//
// Positions are expressed as percentage of viewport (vw, vh).
// They are intentionally offset — no clean row or column lines.
// The center zone (roughly 38vw–62vw × 36vh–64vh) is avoided
// so the brand content area stays clear.
//
// active: whether this glyph ever slips
// delay:  ms before first slip (phase offset)
// every:  ms between slips (slip interval)
// seed:   which glyph to start with

const GLYPHS = [
  // ── top band ────────────────────────────────────────────────
  { id:  0, x:  3,   y:  5,  active: false, delay: 0,    every: 0,    seed:  0 },
  { id:  1, x: 14,   y:  3,  active: true,  delay: 1200, every: 7200, seed:  3 },
  { id:  2, x: 26,   y:  7,  active: false, delay: 0,    every: 0,    seed:  6 },
  { id:  3, x: 42,   y:  2,  active: true,  delay: 3800, every: 8500, seed:  9 },
  { id:  4, x: 58,   y:  6,  active: false, delay: 0,    every: 0,    seed: 12 },
  { id:  5, x: 73,   y:  3,  active: true,  delay: 900,  every: 6100, seed: 15 },
  { id:  6, x: 86,   y:  7,  active: false, delay: 0,    every: 0,    seed: 18 },
  { id:  7, x: 96,   y:  4,  active: true,  delay: 2400, every: 7800, seed: 21 },

  // ── upper quarter ───────────────────────────────────────────
  { id:  8, x:  7,   y: 16,  active: true,  delay: 600,  every: 5400, seed: 24 },
  { id:  9, x: 19,   y: 14,  active: false, delay: 0,    every: 0,    seed: 27 },
  { id: 10, x: 31,   y: 18,  active: true,  delay: 4200, every: 8800, seed: 30 },
  { id: 11, x: 71,   y: 15,  active: true,  delay: 1700, every: 6600, seed: 33 },
  { id: 12, x: 83,   y: 19,  active: false, delay: 0,    every: 0,    seed: 36 },
  { id: 13, x: 93,   y: 13,  active: true,  delay: 3100, every: 7400, seed: 39 },

  // ── upper-mid band ──────────────────────────────────────────
  { id: 14, x:  2,   y: 27,  active: false, delay: 0,    every: 0,    seed: 42 },
  { id: 15, x: 11,   y: 29,  active: true,  delay: 2900, every: 9000, seed: 45 },
  { id: 16, x: 23,   y: 25,  active: true,  delay: 500,  every: 5800, seed: 48 },
  { id: 17, x: 34,   y: 28,  active: false, delay: 0,    every: 0,    seed: 51 },
  // center gap 38–62 x, 26–30 y
  { id: 18, x: 65,   y: 27,  active: false, delay: 0,    every: 0,    seed: 54 },
  { id: 19, x: 76,   y: 25,  active: true,  delay: 3600, every: 6800, seed: 57 },
  { id: 20, x: 88,   y: 29,  active: true,  delay: 1100, every: 8200, seed: 60 },
  { id: 21, x: 97,   y: 26,  active: false, delay: 0,    every: 0,    seed: 63 },

  // ── mid flanks (center kept clear) ──────────────────────────
  { id: 22, x:  4,   y: 39,  active: true,  delay: 4500, every: 7000, seed: 66 },
  { id: 23, x: 14,   y: 42,  active: false, delay: 0,    every: 0,    seed: 69 },
  { id: 24, x: 25,   y: 38,  active: true,  delay: 800,  every: 5200, seed: 72 },
  { id: 25, x: 35,   y: 44,  active: false, delay: 0,    every: 0,    seed: 75 },
  // center gap: 36–64 x, 36–64 y — completely empty
  { id: 26, x: 64,   y: 40,  active: false, delay: 0,    every: 0,    seed: 78 },
  { id: 27, x: 74,   y: 43,  active: true,  delay: 2200, every: 6400, seed: 81 },
  { id: 28, x: 85,   y: 38,  active: false, delay: 0,    every: 0,    seed: 84 },
  { id: 29, x: 95,   y: 41,  active: true,  delay: 3300, every: 8600, seed: 87 },

  { id: 30, x:  6,   y: 52,  active: false, delay: 0,    every: 0,    seed: 90 },
  { id: 31, x: 16,   y: 55,  active: true,  delay: 1500, every: 7600, seed: 93 },
  { id: 32, x: 27,   y: 50,  active: true,  delay: 4000, every: 5600, seed: 96 },
  { id: 33, x: 36,   y: 54,  active: false, delay: 0,    every: 0,    seed: 99 },
  // center gap continues
  { id: 34, x: 63,   y: 51,  active: true,  delay: 700,  every: 9200, seed:102 },
  { id: 35, x: 73,   y: 55,  active: false, delay: 0,    every: 0,    seed:105 },
  { id: 36, x: 84,   y: 50,  active: true,  delay: 2700, every: 6200, seed:108 },
  { id: 37, x: 94,   y: 53,  active: false, delay: 0,    every: 0,    seed:111 },

  // ── lower-mid band ──────────────────────────────────────────
  { id: 38, x:  3,   y: 64,  active: true,  delay: 1900, every: 8000, seed:114 },
  { id: 39, x: 13,   y: 67,  active: false, delay: 0,    every: 0,    seed:117 },
  { id: 40, x: 24,   y: 63,  active: true,  delay: 3500, every: 5000, seed:120 },
  { id: 41, x: 35,   y: 66,  active: false, delay: 0,    every: 0,    seed:123 },
  { id: 42, x: 64,   y: 64,  active: false, delay: 0,    every: 0,    seed:126 },
  { id: 43, x: 75,   y: 67,  active: true,  delay: 600,  every: 7300, seed:129 },
  { id: 44, x: 87,   y: 63,  active: true,  delay: 4100, every: 8900, seed:132 },
  { id: 45, x: 96,   y: 66,  active: false, delay: 0,    every: 0,    seed:135 },

  // ── lower quarter ───────────────────────────────────────────
  { id: 46, x:  8,   y: 77,  active: false, delay: 0,    every: 0,    seed:138 },
  { id: 47, x: 20,   y: 75,  active: true,  delay: 2100, every: 6700, seed:141 },
  { id: 48, x: 32,   y: 79,  active: false, delay: 0,    every: 0,    seed:144 },
  { id: 49, x: 69,   y: 76,  active: true,  delay: 1300, every: 5900, seed:147 },
  { id: 50, x: 81,   y: 80,  active: false, delay: 0,    every: 0,    seed:150 },
  { id: 51, x: 91,   y: 75,  active: true,  delay: 3900, every: 7100, seed:153 },

  // ── bottom band ─────────────────────────────────────────────
  { id: 52, x:  5,   y: 88,  active: true,  delay: 1000, every: 8300, seed:156 },
  { id: 53, x: 17,   y: 91,  active: false, delay: 0,    every: 0,    seed:159 },
  { id: 54, x: 29,   y: 87,  active: false, delay: 0,    every: 0,    seed:162 },
  { id: 55, x: 44,   y: 92,  active: true,  delay: 4400, every: 6900, seed:165 },
  { id: 56, x: 59,   y: 88,  active: false, delay: 0,    every: 0,    seed:168 },
  { id: 57, x: 72,   y: 91,  active: true,  delay: 2500, every: 5500, seed:171 },
  { id: 58, x: 84,   y: 87,  active: false, delay: 0,    every: 0,    seed:174 },
  { id: 59, x: 95,   y: 92,  active: true,  delay: 700,  every: 8700, seed:177 },
]

export default function HeroAnimationBackground() {
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
      {/* ── Glyph field ───────────────────────────────────── */}
      {GLYPHS.map((g) => (
        <div
          key={g.id}
          style={{
            position:   'absolute',
            left:       `${g.x}vw`,
            top:        `${g.y}vh`,
            fontFamily: 'var(--font-display)',
            fontWeight:  700,
            fontSize:   `${FS}px`,
            color:      '#FFFFFF',
            opacity:     OPACITY,
            lineHeight: `${CHAR_H}px`,
            userSelect: 'none',
          }}
        >
          <GlyphSlip
            seed={g.seed}
            slipDelay={g.delay}
            slipInterval={g.every}
            charH={CHAR_H}
            active={g.active}
          />
        </div>
      ))}

      {/* ── Center vignette — clears brand content zone ───── */}
      <div
        style={{
          position: 'absolute',
          inset:    0,
          background: `radial-gradient(
            ellipse 46% 40% at 50% 50%,
            #060818          0%,
            rgba(6,8,24,.95) 18%,
            rgba(6,8,24,.78) 36%,
            rgba(6,8,24,.35) 58%,
            transparent      80%
          )`,
          zIndex: 1,
        }}
      />

      {/* ── Edge fades ────────────────────────────────────── */}
      <div style={{ position:'absolute', inset:0, background:
        'linear-gradient(to bottom, #060818 0%, transparent 10%, transparent 90%, #060818 100%)',
        zIndex: 1 }} />
      <div style={{ position:'absolute', inset:0, background:
        'linear-gradient(to right, #060818 0%, transparent 5%, transparent 95%, #060818 100%)',
        zIndex: 1 }} />

      {/* ── Ambient brand glow ────────────────────────────── */}
      <div
        style={{
          position:  'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width:     '520px',
          height:    '300px',
          background:'radial-gradient(ellipse, rgba(109,93,252,0.06) 0%, transparent 70%)',
          zIndex:     1,
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
