// ═══════════════════════════════════════════════════════════════
// AuraTabs.jsx — Premium tab component — Aura Finance design system.
//
// Fix: on first render / refresh, getBoundingClientRect returns 0
// because the parent is still animating in (opacity: 0 → 1).
// Solution: measure via ResizeObserver on the track, re-measure
// on every resize, and also on a 300ms delay after mount to catch
// parent animation completing.
// ═══════════════════════════════════════════════════════════════
import { useRef, useState, useLayoutEffect, useEffect } from 'react'
import { motion } from 'framer-motion'
import './AuraTabs.css'

const LINE_SPRING = {
  type:      'spring',
  stiffness: 320,
  damping:   28,
  mass:      1,
}

export default function AuraTabs({
  tabs      = [],
  activeId,
  onChange,
  full      = false,
  size      = 'default',
  className = '',
}) {
  const trackRef               = useRef(null)
  const tabRefs                = useRef([])
  const [line, setLine]        = useState({ left: 0, width: 0 })
  const [measured, setMeasured] = useState(false)
  const [sweeping, setSweeping] = useState(false)
  const sweepTimer             = useRef(null)

  const activeIdx = tabs.findIndex(t => t.id === activeId)

  // ── Core measurement function ─────────────────────────────────
  const measure = () => {
    const btn   = tabRefs.current[activeIdx]
    const track = trackRef.current
    if (!btn || !track) return

    const btnRect   = btn.getBoundingClientRect()
    const trackRect = track.getBoundingClientRect()

    // Guard: if track has no width yet (hidden / animating in), bail
    if (trackRect.width === 0) return

    setLine({
      left:  btnRect.left - trackRect.left,
      width: btnRect.width,
    })
    setMeasured(true)
  }

  // ── Re-measure when activeIdx changes ─────────────────────────
  useLayoutEffect(() => {
    measure()

    // Sweep animation on tab change (not on initial mount)
    if (measured) {
      setSweeping(false)
      clearTimeout(sweepTimer.current)
      sweepTimer.current = setTimeout(() => setSweeping(true), 16)
    }

    return () => clearTimeout(sweepTimer.current)
  }, [activeIdx]) // eslint-disable-line

  // ── Re-measure after mount delay — catches parent fade-in ─────
  // The parent .lgn__auth-card has animation: lgn-card-enter 500ms 300ms
  // so getBoundingClientRect returns 0 until ~800ms after mount.
  useEffect(() => {
    // Try at 100ms, 400ms, 900ms — belt and braces
    const t1 = setTimeout(measure, 100)
    const t2 = setTimeout(measure, 400)
    const t3 = setTimeout(measure, 900)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [activeIdx]) // eslint-disable-line

  // ── ResizeObserver — re-measure on any layout change ─────────
  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    const ro = new ResizeObserver(() => measure())
    ro.observe(track)
    return () => ro.disconnect()
  }, [activeIdx]) // eslint-disable-line

  // ── Keyboard navigation ───────────────────────────────────────
  const handleKeyDown = (e, idx) => {
    let next = idx
    if      (e.key === 'ArrowRight') next = (idx + 1) % tabs.length
    else if (e.key === 'ArrowLeft')  next = (idx - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home')       next = 0
    else if (e.key === 'End')        next = tabs.length - 1
    else return
    e.preventDefault()
    tabRefs.current[next]?.focus()
    onChange?.(tabs[next].id)
  }

  const containerCls = [
    'atb',
    full          ? 'atb--full' : '',
    size === 'lg' ? 'atb--lg'   : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div
      className={containerCls}
      role="tablist"
      aria-orientation="horizontal"
    >
      <div className="atb__track" ref={trackRef}>

        {/* Platinum line — only render once measured to avoid flash at 0,0 */}
        {measured && (
          <motion.div
            className={`atb__line${sweeping ? ' atb__line--sweep' : ''}`}
            animate={{ left: line.left, width: line.width }}
            transition={LINE_SPRING}
            aria-hidden="true"
          />
        )}

        {tabs.map((tab, idx) => {
          const isActive = tab.id === activeId
          return (
            <button
              key={tab.id}
              ref={el => { tabRefs.current[idx] = el }}
              id={`atb-tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`atb-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              className={`atb__tab${isActive ? ' atb__tab--active' : ''}`}
              onClick={() => !isActive && onChange?.(tab.id)}
              onKeyDown={e => handleKeyDown(e, idx)}
            >
              {tab.icon && (
                <span className="atb__icon" aria-hidden="true">{tab.icon}</span>
              )}
              <span className="atb__label">{tab.label}</span>
              {tab.badge !== undefined && tab.badge !== null && (
                <span className="atb__badge" aria-label={`${tab.badge} items`}>
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Base rail — separate DOM element, not a CSS border */}
      <div className="atb__rail" aria-hidden="true" />
    </div>
  )
}

export function AuraTabPanel({ tabId, activeId, children, className = '' }) {
  return (
    <div
      id={`atb-panel-${tabId}`}
      role="tabpanel"
      aria-labelledby={`atb-tab-${tabId}`}
      hidden={tabId !== activeId}
      className={className}
    >
      {tabId === activeId && children}
    </div>
  )
}
