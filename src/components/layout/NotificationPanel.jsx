// ═══════════════════════════════════════════════════════
// NotificationPanel.jsx — Slide-out notification drawer
// BEM namespace: .np-
// All values reference design tokens or component locals.
// ═══════════════════════════════════════════════════════
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, FunnelSimple, CheckCircle, Trash, CalendarBlank,
  ChartBar, TrendUp, ShieldCheck, ArrowsClockwise,
  Scales, Receipt, Wallet, BellSimpleSlash,
} from '@phosphor-icons/react'
import './NotificationPanel.css'

// ── Category meta ──────────────────────────────────────
const CATEGORY_META = {
  'expense':  { label: 'Spend Pulse', Icon: ChartBar        },
  'wealth':   { label: 'WealthPilot', Icon: TrendUp         },
  'tax':      { label: 'Tax Copilot', Icon: Receipt         },
  'credit':   { label: 'CreditIQ',    Icon: ArrowsClockwise },
  'fraud':    { label: 'FraudShield', Icon: ShieldCheck     },
  'budget':   { label: 'BudgetBuddy', Icon: Scales          },
  'banking':  { label: 'Banking',     Icon: Wallet          },
}

// ── Mock notifications ─────────────────────────────────
const NOW = new Date()
function daysAgo(n) {
  const d = new Date(NOW)
  d.setDate(d.getDate() - n)
  return d.toISOString()
}

const MOCK_NOTIFICATIONS = [
  { id: 'n1',  category: 'fraud',   summary: 'Unusual ₹15,000 UPI transfer at 2:04 AM — verify if this was you.',              read: false, ts: daysAgo(0)  },
  { id: 'n2',  category: 'expense', summary: 'Dining hit ₹28,400 this month — 9.4% of income. Running above your 6-month avg.', read: false, ts: daysAgo(0)  },
  { id: 'n3',  category: 'tax',     summary: 'Advance tax Q1 due July 15. Based on last year, estimated liability: ₹18,200.',    read: false, ts: daysAgo(1)  },
  { id: 'n4',  category: 'wealth',  summary: 'PPFAS Flexicap NAV up 2.3% today. Portfolio gained ₹14,200 since yesterday.',     read: true,  ts: daysAgo(2)  },
  { id: 'n5',  category: 'credit',  summary: 'CIBIL score improved by 11 points to 768. On-time payment streak: 14 months.',    read: true,  ts: daysAgo(3)  },
  { id: 'n6',  category: 'budget',  summary: 'Weekend spend averaged ₹4,800 — up ₹1,200 from last month. Soft cap available.',   read: false, ts: daysAgo(5)  },
  { id: 'n7',  category: 'banking', summary: 'HDFC FD of ₹1,20,000 matures in 14 days (July 22). Rollover or redeploy?',        read: true,  ts: daysAgo(6)  },
  { id: 'n8',  category: 'expense', summary: 'Subscriptions renewed: ₹2,847 across 4 services this month.',                     read: true,  ts: daysAgo(8)  },
  { id: 'n9',  category: 'tax',     summary: 'HRA exemption documents pending for FY 2025-26. Upload before July 31.',           read: false, ts: daysAgo(10) },
  { id: 'n10', category: 'wealth',  summary: 'SIP of ₹10,000 debited — NIFTY 50 Index Fund. Units allotted at ₹243.18.',        read: true,  ts: daysAgo(13) },
  { id: 'n11', category: 'fraud',   summary: 'New device login detected from Mumbai. If this was you, no action needed.',        read: true,  ts: daysAgo(16) },
  { id: 'n12', category: 'credit',  summary: 'Credit utilization at 28% — within healthy range. No action required.',            read: true,  ts: daysAgo(22) },
  { id: 'n13', category: 'budget',  summary: 'Monthly savings rate hit 40.5% — highest in 8 months.',                            read: true,  ts: daysAgo(28) },
  { id: 'n14', category: 'banking', summary: 'Salary credited: ₹3,02,000 on the 1st.',                                           read: true,  ts: daysAgo(30) },
]

// ── Simulate last login (1+ month ago for demo of grouping)
const LAST_LOGIN = daysAgo(32)

// ── Timeline grouping ──────────────────────────────────
function getTimeBucket(ts, lastLogin) {
  const msAgo    = NOW - new Date(ts)
  const daysAgoN = msAgo / 86400000
  const longAbsence = (NOW - new Date(lastLogin)) > 30 * 86400000

  if (!longAbsence) {
    if (daysAgoN < 1)  return 'Today'
    if (daysAgoN < 7)  return 'This week'
    if (daysAgoN < 15) return 'Last 2 weeks'
    return 'Older'
  } else {
    if (daysAgoN < 1)  return 'Today'
    if (daysAgoN < 7)  return 'Last 7 days'
    if (daysAgoN < 15) return 'Last 15 days'
    if (daysAgoN < 30) return 'Last month'
    return 'Older'
  }
}

function groupNotifications(notifications, lastLogin) {
  const buckets = {}
  notifications.forEach(n => {
    const b = getTimeBucket(n.ts, lastLogin)
    if (!buckets[b]) buckets[b] = []
    buckets[b].push(n)
  })
  const order = ['Today', 'This week', 'Last 7 days', 'Last 2 weeks', 'Last 15 days', 'Last month', 'Older']
  return order.filter(k => buckets[k]).map(k => ({ label: k, items: buckets[k] }))
}

// ── Date range filter helper ───────────────────────────
function inDateRange(ts, from, to) {
  const t = new Date(ts)
  if (from && t < new Date(from)) return false
  if (to && t > new Date(to + 'T23:59:59')) return false
  return true
}

// ── Component ──────────────────────────────────────────
export default function NotificationPanel({ open, onClose, lastLogin = LAST_LOGIN }) {
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)
  const [filterRead,    setFilterRead]    = useState('all')
  const [filterCat,     setFilterCat]     = useState('all')
  const [showFilters,   setShowFilters]   = useState(false)
  const [dateFrom,      setDateFrom]      = useState('')
  const [dateTo,        setDateTo]        = useState('')
  const panelRef = useRef(null)

  useEffect(() => {
    if (!open) return
    function handler(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    function handler(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  const markRead   = useCallback((id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }, [])

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const filtered = notifications.filter(n => {
    if (filterRead === 'unread' && n.read)               return false
    if (filterRead === 'read'   && !n.read)              return false
    if (filterCat !== 'all' && n.category !== filterCat) return false
    if (!inDateRange(n.ts, dateFrom, dateTo))            return false
    return true
  })

  const groups      = groupNotifications(filtered, lastLogin)
  const unreadCount = notifications.filter(n => !n.read).length
  const cats        = Object.keys(CATEGORY_META)

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="np__backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />

          <motion.div
            ref={panelRef}
            className="np"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
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
                {unreadCount > 0 && (
                  <button className="np__icon-btn" onClick={markAllRead} title="Mark all as read" aria-label="Mark all as read">
                    <CheckCircle size={17} weight="regular" />
                  </button>
                )}
                <button
                  className={`np__icon-btn${showFilters ? ' np__icon-btn--active' : ''}`}
                  onClick={() => setShowFilters(p => !p)}
                  title="Filter"
                  aria-label="Toggle filters"
                >
                  <FunnelSimple size={17} weight={showFilters ? 'fill' : 'regular'} />
                </button>
                {notifications.length > 0 && (
                  <button className="np__icon-btn np__icon-btn--danger" onClick={clearAll} title="Clear all" aria-label="Clear all notifications">
                    <Trash size={17} weight="regular" />
                  </button>
                )}
                <button className="np__icon-btn" onClick={onClose} title="Close" aria-label="Close notifications">
                  <X size={17} weight="regular" />
                </button>
              </div>
            </div>

            {/* Filter bar */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  className="np__filters"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                  <div className="np__filter-row">
                    {['all', 'unread', 'read'].map(v => (
                      <button
                        key={v}
                        className={`np__pill${filterRead === v ? ' np__pill--active' : ''}`}
                        onClick={() => setFilterRead(v)}
                      >
                        {v === 'all' ? 'All' : v === 'unread' ? 'Unread' : 'Read'}
                      </button>
                    ))}
                  </div>

                  <div className="np__filter-row np__filter-row--cats">
                    <button
                      className={`np__pill${filterCat === 'all' ? ' np__pill--active' : ''}`}
                      onClick={() => setFilterCat('all')}
                    >
                      All
                    </button>
                    {cats.map(c => {
                      const { label, Icon } = CATEGORY_META[c]
                      return (
                        <button
                          key={c}
                          className={`np__pill np__pill--cat${filterCat === c ? ' np__pill--active' : ''}`}
                          onClick={() => setFilterCat(c)}
                          title={label}
                          aria-label={label}
                        >
                          <Icon size={13} />
                        </button>
                      )
                    })}
                  </div>

                  <div className="np__filter-row np__filter-row--dates">
                    <CalendarBlank size={13} className="np__date-icon" />
                    <input type="date" className="np__date-input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} aria-label="From date" />
                    <span className="np__date-sep">—</span>
                    <input type="date" className="np__date-input" value={dateTo} onChange={e => setDateTo(e.target.value)} aria-label="To date" />
                    {(dateFrom || dateTo) && (
                      <button className="np__icon-btn np__icon-btn--xs" onClick={() => { setDateFrom(''); setDateTo('') }} title="Clear date filter">
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Body */}
            <div className="np__body">
              {filtered.length === 0 ? (
                <div className="np__empty">
                  <BellSimpleSlash size={32} className="np__empty-icon" />
                  <span>No notifications</span>
                </div>
              ) : (
                groups.map(group => (
                  <div key={group.label} className="np__group">
                    <div className="np__group-label">{group.label}</div>
                    {group.items.map(n => {
                      const meta    = CATEGORY_META[n.category] || {}
                      const CatIcon = meta.Icon
                      return (
                        <button
                          key={n.id}
                          className={`np__item${n.read ? ' np__item--read' : ''}`}
                          onClick={() => markRead(n.id)}
                        >
                          <div className="np__item-icon">
                            {CatIcon && <CatIcon size={14} weight="regular" />}
                          </div>
                          <div className="np__item-content">
                            <div className="np__item-cat">{meta.label}</div>
                            <div className="np__item-summary">{n.summary}</div>
                          </div>
                          {!n.read && <span className="np__item-dot" />}
                        </button>
                      )
                    })}
                  </div>
                ))
              )}
            </div>

          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
