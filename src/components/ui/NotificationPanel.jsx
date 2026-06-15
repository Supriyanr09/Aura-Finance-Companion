// ═══════════════════════════════════════════════════════════════
// NotificationPanel.jsx — Bell slideout
// Namespace: .np-
// Self-contained with mock data. Wire MOCK_NOTIFICATIONS to a
// real context / API when the backend is ready.
// ═══════════════════════════════════════════════════════════════
import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Funnel, Trash, Check, ChartBar, TrendUp,
  ShieldCheck, ArrowsClockwise, Target, Receipt,
  CalendarBlank, Circle, CheckCircle,
} from '@phosphor-icons/react'
import './NotificationPanel.css'

// ── Category config ────────────────────────────────────────────
const CATEGORY_META = {
  'Expense Tracking':  { icon: ChartBar,        color: 'var(--np-cat-expense)'    },
  'Wealth Pilot':      { icon: TrendUp,          color: 'var(--np-cat-wealth)'     },
  'Tax Copilot':       { icon: Receipt,          color: 'var(--np-cat-tax)'        },
  'Credit Scoring':    { icon: ArrowsClockwise,  color: 'var(--np-cat-credit)'     },
  'FraudShield AI':    { icon: ShieldCheck,      color: 'var(--np-cat-fraud)'      },
  'Goals':             { icon: Target,           color: 'var(--np-cat-goals)'      },
}

// ── Mock data ──────────────────────────────────────────────────
// Replace with context/API data. Each item: { id, category, summary, read, ts }
// ts = ISO 8601 string
const NOW = new Date()
function daysAgo(n) {
  const d = new Date(NOW)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

const MOCK_NOTIFICATIONS = [
  {
    id: 'n1',
    category: 'FraudShield AI',
    summary: '₹15,000 UPI transfer at 2:04AM is outside your usual pattern.',
    read: false,
    ts: daysAgo(0),
  },
  {
    id: 'n2',
    category: 'Expense Tracking',
    summary: 'Dining spend hit ₹28,400 — 9.4% of income. Average is ₹19K.',
    read: false,
    ts: daysAgo(0),
  },
  {
    id: 'n3',
    category: 'Tax Copilot',
    summary: 'ITR filing deadline is 31 July. You have 3 documents missing.',
    read: false,
    ts: daysAgo(1),
  },
  {
    id: 'n4',
    category: 'Wealth Pilot',
    summary: 'PPFAS Flexi Cap is up 3.2% this week. SIP auto-triggered ₹10K.',
    read: true,
    ts: daysAgo(2),
  },
  {
    id: 'n5',
    category: 'Goals',
    summary: 'Goa trip fund is at 80% — ₹4,000 away from target.',
    read: true,
    ts: daysAgo(3),
  },
  {
    id: 'n6',
    category: 'Credit Scoring',
    summary: 'Your CIBIL score improved by 12 points to 764 this month.',
    read: true,
    ts: daysAgo(6),
  },
  {
    id: 'n7',
    category: 'Tax Copilot',
    summary: 'HRA exemption not yet claimed. Potential saving: ₹42,000.',
    read: true,
    ts: daysAgo(8),
  },
  {
    id: 'n8',
    category: 'Expense Tracking',
    summary: 'Weekend spend averaged ₹4,800 over last 3 Fridays.',
    read: true,
    ts: daysAgo(9),
  },
  {
    id: 'n9',
    category: 'Wealth Pilot',
    summary: 'Zomato holding is down 12%. Unrealised loss: ₹22,400.',
    read: true,
    ts: daysAgo(14),
  },
  {
    id: 'n10',
    category: 'FraudShield AI',
    summary: 'New login detected from an unrecognised device in Pune.',
    read: true,
    ts: daysAgo(16),
  },
  {
    id: 'n11',
    category: 'Credit Scoring',
    summary: 'Credit utilisation crossed 35%. Consider paying down the Axis card.',
    read: true,
    ts: daysAgo(22),
  },
  {
    id: 'n12',
    category: 'Goals',
    summary: 'Emergency fund at 1.2 months. Target is 6.',
    read: true,
    ts: daysAgo(28),
  },
]

// ── Time grouping ──────────────────────────────────────────────
function getGroup(ts) {
  const date = new Date(ts)
  const diff  = Math.floor((NOW - date) / (1000 * 60 * 60 * 24))
  if (diff === 0)  return 'Today'
  if (diff <= 7)   return 'Last 7 days'
  if (diff <= 15)  return 'Last 15 days'
  if (diff <= 30)  return 'Last 30 days'
  return 'Older'
}

const GROUP_ORDER = ['Today', 'Last 7 days', 'Last 15 days', 'Last 30 days', 'Older']

function formatTime(ts) {
  const d = new Date(ts)
  const diff = Math.floor((NOW - d) / (1000 * 60 * 60 * 24))
  if (diff === 0) {
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  }
  if (diff < 7) {
    return d.toLocaleDateString('en-IN', { weekday: 'short' })
  }
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// ── Main component ─────────────────────────────────────────────
export default function NotificationPanel({ onClose }) {
  const [items, setItems]         = useState(MOCK_NOTIFICATIONS)
  const [readFilter, setReadFilter] = useState('all')   // 'all' | 'unread' | 'read'
  const [catFilter, setCatFilter]  = useState('all')
  const [showFilter, setShowFilter] = useState(false)
  const [dateFrom, setDateFrom]     = useState('')
  const [dateTo, setDateTo]         = useState('')
  const filterRef = useRef(null)

  // Close filter flyout on outside click
  useEffect(() => {
    if (!showFilter) return
    function onDoc(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilter(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [showFilter])

  const unreadCount = useMemo(() => items.filter(n => !n.read).length, [items])
  const categories  = useMemo(() => ['all', ...Object.keys(CATEGORY_META)], [])

  const filtered = useMemo(() => {
    return items.filter(n => {
      if (readFilter === 'unread' && n.read)   return false
      if (readFilter === 'read'   && !n.read)  return false
      if (catFilter !== 'all' && n.category !== catFilter) return false
      if (dateFrom) {
        const from = new Date(dateFrom)
        if (new Date(n.ts) < from) return false
      }
      if (dateTo) {
        const to = new Date(dateTo)
        to.setHours(23, 59, 59)
        if (new Date(n.ts) > to) return false
      }
      return true
    })
  }, [items, readFilter, catFilter, dateFrom, dateTo])

  // Group by timeline
  const grouped = useMemo(() => {
    const map = {}
    for (const n of filtered) {
      const g = getGroup(n.ts)
      if (!map[g]) map[g] = []
      map[g].push(n)
    }
    return map
  }, [filtered])

  function markRead(id) {
    setItems(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  function clearAll() {
    setItems([])
  }

  const hasActiveFilter = readFilter !== 'all' || catFilter !== 'all' || dateFrom || dateTo

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className="np__backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        className="np__panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        role="dialog"
        aria-label="Notifications"
      >

        {/* Header */}
        <div className="np__header">
          <div className="np__header-left">
            <span className="np__title">Notifications</span>
            {unreadCount > 0 && (
              <span className="np__unread-badge">{unreadCount}</span>
            )}
          </div>
          <div className="np__header-actions">

            {/* Filter button */}
            <div className="np__filter-wrap" ref={filterRef}>
              <button
                className={`np__icon-btn${hasActiveFilter ? ' np__icon-btn--active' : ''}`}
                onClick={() => setShowFilter(p => !p)}
                aria-label="Filter notifications"
                title="Filter"
              >
                <Funnel size={15} weight={hasActiveFilter ? 'fill' : 'regular'} />
              </button>

              {/* Filter flyout */}
              <AnimatePresence>
                {showFilter && (
                  <motion.div
                    className="np__filter-flyout"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                  >
                    {/* Read/Unread toggle */}
                    <div className="np__filter-section">
                      <div className="np__filter-label">Status</div>
                      <div className="np__filter-pills">
                        {['all', 'unread', 'read'].map(v => (
                          <button
                            key={v}
                            className={`np__pill${readFilter === v ? ' np__pill--active' : ''}`}
                            onClick={() => setReadFilter(v)}
                          >
                            {v === 'all' ? 'All' : v === 'unread' ? 'Unread' : 'Read'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Category filter */}
                    <div className="np__filter-section">
                      <div className="np__filter-label">Category</div>
                      <div className="np__filter-cat-list">
                        {categories.map(c => {
                          const meta = CATEGORY_META[c]
                          const Icon = meta?.icon
                          return (
                            <button
                              key={c}
                              className={`np__cat-option${catFilter === c ? ' np__cat-option--active' : ''}`}
                              onClick={() => setCatFilter(c)}
                            >
                              {Icon && <Icon size={12} />}
                              {c === 'all' ? 'All categories' : c}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* Date range */}
                    <div className="np__filter-section">
                      <div className="np__filter-label">Date range</div>
                      <div className="np__date-row">
                        <div className="np__date-field">
                          <CalendarBlank size={11} />
                          <input
                            type="date"
                            className="np__date-input"
                            value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                            placeholder="From"
                          />
                        </div>
                        <span className="np__date-sep">—</span>
                        <div className="np__date-field">
                          <CalendarBlank size={11} />
                          <input
                            type="date"
                            className="np__date-input"
                            value={dateTo}
                            onChange={e => setDateTo(e.target.value)}
                            placeholder="To"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Reset */}
                    {hasActiveFilter && (
                      <button
                        className="np__filter-reset"
                        onClick={() => {
                          setReadFilter('all')
                          setCatFilter('all')
                          setDateFrom('')
                          setDateTo('')
                        }}
                      >
                        Reset filters
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Clear all */}
            {items.length > 0 && (
              <button
                className="np__icon-btn np__icon-btn--danger"
                onClick={clearAll}
                aria-label="Clear all notifications"
                title="Clear all"
              >
                <Trash size={15} />
              </button>
            )}

            {/* Close */}
            <button
              className="np__icon-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="np__body">
          {filtered.length === 0 ? (
            <div className="np__empty">
              <CheckCircle size={28} weight="light" />
              <span>All clear</span>
            </div>
          ) : (
            GROUP_ORDER.filter(g => grouped[g]).map(group => (
              <div key={group} className="np__group">
                <div className="np__group-label">{group}</div>
                {grouped[group].map(n => {
                  const meta = CATEGORY_META[n.category] || {}
                  const Icon = meta.icon || Circle
                  return (
                    <motion.div
                      key={n.id}
                      className={`np__item${n.read ? ' np__item--read' : ''}`}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.18 }}
                    >
                      {/* Unread dot */}
                      <div className="np__item-dot-col">
                        {!n.read && <span className="np__item-dot" />}
                      </div>

                      {/* Category icon */}
                      <div
                        className="np__item-icon"
                        style={{ '--np-icon-color': meta.color || 'rgba(255,255,255,0.3)' }}
                      >
                        <Icon size={13} weight="duotone" />
                      </div>

                      {/* Content */}
                      <div className="np__item-body">
                        <div className="np__item-cat">{n.category}</div>
                        <div className="np__item-summary">{n.summary}</div>
                      </div>

                      {/* Time + mark-read */}
                      <div className="np__item-meta">
                        <span className="np__item-time">{formatTime(n.ts)}</span>
                        {!n.read && (
                          <button
                            className="np__item-check"
                            onClick={() => markRead(n.id)}
                            aria-label="Mark as read"
                            title="Mark as read"
                          >
                            <Check size={11} />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </motion.div>
    </>
  )
}
