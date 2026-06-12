// RollingDigitLab.jsx — Step 3
//
// Five columns forming a single 5-digit number.
// Each column animates independently — different speed, different phase.
// The number is not a counter. It is kinetic typography.

import { motion } from 'framer-motion'

const DIGIT_H   = 80
const FONT_SIZE = 72
const DIGITS    = [0,1,2,3,4,5,6,7,8,9,0]

// Tighter gap — columns read as one number, not five separate elements
const COL_GAP = 4

const COLUMNS = [
  { id: 0, duration: 1.6,  startAt: -0.3  },
  { id: 1, duration: 2.4,  startAt: -1.1  },
  { id: 2, duration: 1.1,  startAt: -0.7  },
  { id: 3, duration: 2.9,  startAt: -0.5  },
  { id: 4, duration: 1.85, startAt: -1.6  },
]

function Column({ duration, startAt }) {
  return (
    <div style={{
      width:    `${FONT_SIZE * 0.62}px`,
      height:   `${DIGIT_H}px`,
      overflow: 'hidden',
    }}>
      <motion.div
        style={{ display: 'flex', flexDirection: 'column', willChange: 'transform' }}
        animate={{ y: ['0px', `-${DIGIT_H * 10}px`] }}
        transition={{
          duration,
          delay:      startAt,
          ease:       'linear',
          repeat:     Infinity,
          repeatType: 'loop',
        }}
      >
        {DIGITS.map((d, i) => (
          <span key={i} style={{
            display:    'block',
            height:     `${DIGIT_H}px`,
            lineHeight: `${DIGIT_H}px`,
            textAlign:  'center',
            fontFamily: 'var(--font-display)',
            fontWeight:  700,
            fontSize:   `${FONT_SIZE}px`,
            color:      '#FFFFFF',
            userSelect: 'none',
          }}>
            {d}
          </span>
        ))}
      </motion.div>
    </div>
  )
}

export default function RollingDigitLab() {
  return (
    <div style={{
      minHeight:      '100svh',
      background:     '#060818',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
    }}>
      <div style={{ display: 'flex', gap: `${COL_GAP}px`, alignItems: 'flex-start' }}>
        {COLUMNS.map(col => (
          <Column key={col.id} duration={col.duration} startAt={col.startAt} />
        ))}
      </div>
    </div>
  )
}
