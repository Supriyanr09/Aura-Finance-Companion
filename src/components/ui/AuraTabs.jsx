// AuraTabs.jsx — Aura Finance design system
//
// Standalone tab component. Zero dependency on data-theme or CSS vars.
// All colours are hardcoded per variant.
//
// Props:
//   tabs     — array of { id, label, icon?, badge? }
//   activeId — controlled active tab id
//   onChange — (id) => void
//   full     — stretch to parent width (default false)
//   variant  — 'light' (default, dashboard) | 'dark' (login, dark surfaces)

import { useRef, useState, useLayoutEffect, useEffect } from 'react'
import './AuraTabs.css'

export default function AuraTabs({
  tabs      = [],
  activeId,
  onChange,
  full      = false,
  variant   = 'light',
  className = '',
}) {
  const trackRef = useRef(null)
  const tabRefs  = useRef([])
  const [line, setLine] = useState({ left: 0, width: 0, ready: false })

  const activeIdx = tabs.findIndex(t => t.id === activeId)
  const idx = activeIdx === -1 ? 0 : activeIdx

  const measure = () => {
    const btn   = tabRefs.current[idx]
    const track = trackRef.current
    if (!btn || !track) return
    const b = btn.getBoundingClientRect()
    const t = track.getBoundingClientRect()
    if (t.width === 0) return
    setLine({ left: b.left - t.left, width: b.width, ready: true })
  }

  useLayoutEffect(() => { measure() }, [idx]) // eslint-disable-line

  useEffect(() => {
    const t1 = setTimeout(measure, 80)
    const t2 = setTimeout(measure, 380)
    const t3 = setTimeout(measure, 900)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [idx]) // eslint-disable-line

  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const ro = new ResizeObserver(measure)
    ro.observe(track)
    return () => ro.disconnect()
  }, []) // eslint-disable-line

  const handleKeyDown = (e, i) => {
    let next = i
    if      (e.key === 'ArrowRight') next = (i + 1) % tabs.length
    else if (e.key === 'ArrowLeft')  next = (i - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home')       next = 0
    else if (e.key === 'End')        next = tabs.length - 1
    else return
    e.preventDefault()
    tabRefs.current[next]?.focus()
    onChange?.(tabs[next].id)
  }

  const cls = [
    'atb',
    `atb--${variant}`,
    full ? 'atb--full' : '',
    className,
  ].filter(Boolean).join(' ')

  return (
    <div className={cls} role="tablist" aria-orientation="horizontal">
      <div className="atb__track" ref={trackRef}>

        {line.ready && (
          <span
            className="atb__line"
            style={{ left: line.left, width: line.width }}
            aria-hidden="true"
          />
        )}

        {tabs.map((tab, i) => {
          const isActive = tab.id === activeId
          return (
            <button
              key={tab.id}
              ref={el => { tabRefs.current[i] = el }}
              id={`atb-tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`atb-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              className={`atb__tab${isActive ? ' atb__tab--active' : ''}`}
              onClick={() => !isActive && onChange?.(tab.id)}
              onKeyDown={e => handleKeyDown(e, i)}
            >
              {tab.icon && <span className="atb__icon" aria-hidden="true">{tab.icon}</span>}
              <span className="atb__label">{tab.label}</span>
              {tab.badge != null && (
                <span className="atb__badge">
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

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
