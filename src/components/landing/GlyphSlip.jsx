// GlyphSlip.jsx
//
// One character position in the typographic field.
// Holds a glyph — digit, symbol, or punctuation.
// Occasionally "slips" upward by one character height, then
// instantly resets to show the next glyph from its sequence.
//
// This is a departures-board slip, not a counter roll.
// The glyph changes. The change is not the point.
// The slip is a texture event, not a data update.
//
// Motion: CSS transition on translateY only.
// No JS animation loop. No state polling.
// The interval fires infrequently — ~50% of glyphs never slip
// during any given viewport session.

import { useEffect, useRef, useState, useCallback } from 'react'

// Characters that populate the field.
// Mix of digits, currency symbols, commas, separators.
// Treated as glyphs, not values.
const GLYPH_POOL = [
  '0','1','2','3','4','5','6','7','8','9',
  '₹','$','€','¥','£',
  '0','1','2','3','4','5','6','7','8','9', // weighted toward digits
  '0','1','2','3','4','5','6','7','8','9',
  ',','.',
]

function pickGlyph(seed) {
  return GLYPH_POOL[seed % GLYPH_POOL.length]
}

/**
 * @param {number} props.seed        – deterministic seed for initial glyph
 * @param {number} props.slipDelay   – ms before first slip (phase offset)
 * @param {number} props.slipInterval– ms between slips
 * @param {number} props.charH       – px height of one character slot
 * @param {boolean} props.active     – if false, this glyph never slips
 */
export default function GlyphSlip({
  seed         = 0,
  slipDelay    = 0,
  slipInterval = 4000,
  charH        = 56,
  active       = true,
}) {
  // Two glyphs in the strip: current (visible) and next (below, hidden)
  const [glyphs, setGlyphs]   = useState(() => [pickGlyph(seed), pickGlyph(seed + 7)])
  const [slipped, setSlipped] = useState(false)
  const seedRef = useRef(seed + 14)

  const doSlip = useCallback(() => {
    // Advance strip upward — reveals next glyph
    setSlipped(true)

    // After transition completes, snap reset and prepare new next glyph
    setTimeout(() => {
      setGlyphs(prev => {
        const next = pickGlyph(seedRef.current)
        seedRef.current += 11
        return [prev[1], next]
      })
      setSlipped(false)
    }, 420) // matches transition duration below
  }, [])

  useEffect(() => {
    if (!active) return
    const initial = setTimeout(() => {
      doSlip()
      const timer = setInterval(doSlip, slipInterval)
      return () => clearInterval(timer)
    }, slipDelay)
    return () => clearTimeout(initial)
  }, [active, slipDelay, slipInterval, doSlip])

  return (
    <span
      style={{
        display:    'inline-block',
        height:     `${charH}px`,
        overflow:   'hidden',
        verticalAlign: 'top',
        lineHeight: `${charH}px`,
      }}
    >
      <span
        style={{
          display:   'flex',
          flexDirection: 'column',
          transform: slipped ? `translateY(-${charH}px)` : 'translateY(0)',
          transition: slipped
            ? `transform 380ms cubic-bezier(0.4, 0, 0.2, 1)`
            : 'none',
          willChange: 'transform',
        }}
      >
        {glyphs.map((g, i) => (
          <span
            key={i}
            style={{
              display:    'block',
              height:     `${charH}px`,
              lineHeight: `${charH}px`,
              textAlign:  'center',
            }}
          >
            {g}
          </span>
        ))}
      </span>
    </span>
  )
}
