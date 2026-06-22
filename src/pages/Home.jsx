// ═══════════════════════════════════════════════════════════════
// Home.jsx — Aura Finance Home Page
// Full personality-driven home. User-aware via UserContext.
// 7 zones per the Aura design spec.
// ═══════════════════════════════════════════════════════════════
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowUpRight, ArrowDownRight, ArrowRight,
  Bank, CreditCard, CurrencyDollar,
  TrendUp, TrendDown,
  Sparkle, ShieldCheck,
  ForkKnife, Warning, ChartBar, HandCoins,
  ShieldWarning, CheckCircle, X, Info,
} from '@phosphor-icons/react'

import './Home.css'
import { useUser }        from '../context/UserContext'
import { useGreeting }    from '../hooks/useGreeting'
import { useCountUp }     from '../hooks/useCountUp'
import { useInView }      from '../hooks/useInView'
import { useMarketTicker } from '../hooks/useMarketTicker'
import { FMT, FMT_COMPACT, FMT_USD, calcDisposable, calcMonthlySpend, calcCreditIQ, calcFinancialNetwork, getSnapshot } from '../data/mockData'
import LottiePlayer       from '../components/ui/LottiePlayer'
import FraudSlideOut      from '../components/ui/FraudSlideOut'
import Button             from '../components/ui/Button'
import lottieParticles    from '../assets/lottie/lottie-particles.json'

// ── Animation presets ──────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 50 },
  show:   { opacity: 1, y: 0,  transition: { type: 'spring', stiffness: 240, damping: 28 } },
}
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.16, delayChildren: 0.05 } },
}

// ── Icon map ───────────────────────────────────────────────────
const ICON_MAP = {
  Bank, CreditCard, CurrencyDollar,
  TrendUp, TrendDown, ChartBar,
  Sparkle, ShieldCheck,
  ForkKnife, Warning,
}

// ── Health state → hero ambient class ─────────────────────────
const STATE_CLASS = {
  healthy:  'hm-hero--healthy',
  watchful: 'hm-hero--watchful',
  critical: 'hm-hero--critical',
}

// ── KPI background-icon layout toggle ──────────────────────────
// Two options being compared per Supriya's request:
//   'bleed'  — large icon, very faint, positioned to spill past
//              the card's visible edge (clipped at the boundary
//              since .hm-kpi uses overflow:hidden elsewhere)
//   'center' — medium icon, faint, centered behind the value text
// Flip this one constant to switch all three KPI cards at once.
const KPI_BG_LAYOUT = 'bleed' // 'bleed' | 'center'

// ── What Aura Would Do layout toggle ────────────────
// Per Supriya's request: design options to compare, none
// replacing the original by default. Flip this one constant.
//   'original' — the existing 3-equal-width-cards layout
//   'flow'     — connected horizontal timeline with a running
//                before/after balance trail across the 3 steps
//                (only renders the trail for steps that have a
//                real step.amount — degrades gracefully when not)
//   'stacked'  — vertical priority stack, decreasing visual
//                weight top-to-bottom, with a left-side
//                proportional allocation bar per step
//   'split'    — a single horizontal bar divided into segments
//                sized exactly to each step's share of the total
//                (the split itself IS the answer, legible before
//                reading any text), with the existing step cards
//                kept below for supporting detail. Steps without
//                step.amount don't get a segment — the bar only
//                ever represents real allocations and an explicit
//                "unallocated" remainder, never a guessed split.
const AWD_LAYOUT = 'split' // 'original' | 'flow' | 'stacked' | 'split'

/* ═══════════════════════════════════════════════════════════
   ZONE 1 — Aura Hero
   Two-column: left (greeting + KPI) · centre (Aura insight)
   Lottie animation lives as absolute background on right half
═══════════════════════════════════════════════════════════ */
function AuraHero({ user }) {
  const { greeting } = useGreeting(user)
  const stateClass   = STATE_CLASS[user.healthState] || ''
  const isAlert      = user.healthState === 'critical'
  const disposable   = calcDisposable(user)
  const totalSpend   = calcMonthlySpend(user.transactions)
  const spendPct     = Math.min(100, Math.round((totalSpend / user.income) * 100))

  // Counter starts after the hero's own entrance spring has mostly
  // settled (~500ms) so it doesn't race the fade/slide-up motion.
  const countedDisposable = useCountUp(disposable, { duration: 1200, delay: 500 })

  return (
    <motion.section
      className={`hm-hero ${stateClass}`}
      variants={fadeUp}
      aria-label="Aura greeting"
    >
      {/* Ambient state wash */}
      <div className="hm-hero__wash" aria-hidden />
      {isAlert && <div className="hm-hero__alert-pulse" aria-hidden />}

      {/* Left divider only */}
      <div className="hm-hero__divider hm-hero__divider--left" aria-hidden />

      {/* Lottie — absolute background, right half, behind content */}
      <div className="hm-hero__lottie-bg" aria-hidden>
        <LottiePlayer src={lottieParticles} width={420} height={420} />
      </div>

      {/* ── Left: greeting + KPI ── */}
      <div className="hm-hero__left">
        <h1 className="hm-hero__headline">{greeting}</h1>
        <div className="hm-hero__rule" aria-hidden />
        <div>
          <div className="hm-hero__kpi-label">Available to spend this month</div>
          <div className={`hm-hero__kpi-value${disposable < 20000 ? ' hm-hero__kpi-value--danger' : ''}`}>
            {FMT(countedDisposable)}
          </div>
          <div className="hm-hero__kpi-bar">
            <div className="hm-hero__kpi-bar-fill" style={{ width: `${spendPct}%` }} />
          </div>
        </div>
      </div>

      {/* ── Centre: Aura insight ── */}
      <div className="hm-hero__centre">
        <div className="hm-hero__insight-label">Aura Insight</div>
        <p className="hm-hero__insight-text">{user.auraGreeting.nudge}</p>
        <p className="hm-hero__insight-sub">
          You've spent {FMT_COMPACT(totalSpend)} this month — {Math.round((totalSpend / user.income) * 100)}% of your income.
        </p>
        <Button icon={ArrowRight}>
          Review Plan
        </Button>
      </div>
    </motion.section>
  )
}

/* ═══════════════════════════════════════════════════════════
   Fraud Alert Banner
   Renders between hero and KPIs.
   Only shows unresolved alerts. Dismissible.
═══════════════════════════════════════════════════════════ */

// Compute protection window from alert date string
// Alert date format: '13 Jun 2:04 AM'
function getProtectionWindow(dateStr) {
  const now         = new Date()
  // Parse '13 Jun 2:04 AM' against current year
  const parsed      = new Date(`${dateStr} ${now.getFullYear()}`)
  const hoursElapsed = isNaN(parsed) ? 0 : (now - parsed) / 36e5
  const hoursLeft72  = Math.max(0, 72 - hoursElapsed)
  const hoursLeft24  = Math.max(0, 24 - hoursElapsed)

  if (hoursElapsed < 24) {
    return {
      status:  'strong',
      label:   'Strong Protection Window',
      desc:    'Reported within 24 hours. Chances of successful investigation and recovery are highest.',
      time:    null,
      dot:     'green',
    }
  } else if (hoursElapsed < 72) {
    const daysLeft = Math.floor(hoursLeft72 / 24)
    const hrsLeft  = Math.round(hoursLeft72 % 24)
    return {
      status: 'active',
      label:  'Protection Window Active',
      desc:   "You still qualify for RBI's preferred reporting timeline.",
      time:   `${daysLeft}d ${hrsLeft}h remaining to report`,
      dot:    'yellow',
    }
  } else {
    return {
      status: 'expired',
      label:  'Delayed Reporting',
      desc:   'The preferred reporting window has passed. A dispute can still be raised, but investigation outcomes may vary.',
      time:   null,
      dot:    'red',
    }
  }
}

function FraudAlertBanner({ user }) {
  const [dismissed,  setDismissed]  = useState({})
  const [disputing,  setDisputing]  = useState({})
  const [slideAlert, setSlideAlert] = useState(null)
  const active = (user.fraudAlerts || []).filter(a => !a.resolved && !dismissed[a.id])
  if (active.length === 0 && !slideAlert) return null

  return (
    <>
      <motion.div variants={fadeUp}>
        {active.map(alert => {
          const win         = getProtectionWindow(alert.date)
          const isDisputing = disputing[alert.id]

          return (
            <motion.div
              key={alert.id}
              className="hm-fraud"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="hm-fraud__icon-wrap hm-fraud__icon-wrap--pulse">
                <ShieldWarning size={18} weight="fill" />
              </div>

              <div className="hm-fraud__body">
                <div className="hm-fraud__label">FraudShield AI · {alert.date}</div>
                <div className="hm-fraud__title">{alert.title}</div>
                <div className="hm-fraud__desc">{alert.body}</div>

                <AnimatePresence>
                  {isDisputing && (
                    <motion.div
                      key="window"
                      className={`hm-fraud__window hm-fraud__window--${win.status}`}
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginTop: 'var(--space-3)' }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div className="hm-fraud__window-top">
                        <span className={`hm-fraud__window-dot hm-fraud__window-dot--${win.dot}`} />
                        <span className="hm-fraud__window-label">{win.label}</span>
                      </div>
                      <p className="hm-fraud__window-desc">{win.desc}</p>
                      {win.time && (
                        <div className="hm-fraud__window-time">
                          <Warning size={11} weight="fill" /> {win.time}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="hm-fraud__actions">
                <Button
                  icon={CheckCircle}
                  onClick={() => setDismissed(d => ({ ...d, [alert.id]: true }))}
                >
                  Yes, this was me
                </Button>
                <Button
                  variant="destructive"
                  icon={Warning}
                  onClick={() => setSlideAlert(alert)}
                >
                  I don't recognise this
                </Button>
              </div>

              <motion.button
                className="hm-fraud__close"
                onClick={() => setDismissed(d => ({ ...d, [alert.id]: true }))}
                aria-label="Dismiss"
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.85 }}
                transition={{ duration: 0.18 }}
              >
                <X size={13} />
              </motion.button>
            </motion.div>
          )
        })}
      </motion.div>

      {slideAlert && (
        <FraudSlideOut
          alert={slideAlert}
          onClose={() => setSlideAlert(null)}
        />
      )}
    </>
  )
}

/* ═══════════════════════════════════════════════════════════
   ZONE 2 — Three KPI cards
═══════════════════════════════════════════════════════════ */
function KpiStrip({ user }) {
  const snapshot = getSnapshot(user)
  const isDown   = (dir) => dir === 'down'
  const creditIQ = calcCreditIQ(user)

  const savingsDelta   = snapshot.savingsRate.value - snapshot.savingsRate.prevMonth
  const savingsTrend   = savingsDelta > 0 ? 'up' : (savingsDelta <= -10 ? 'down-severe' : 'down')

  return (
    <motion.div className="hm-kpi-strip" variants={fadeUp}>
      <div className={`hm-kpi hm-kpi--wealth hm-kpi--bg-${KPI_BG_LAYOUT}`}>
        <img src="/Wealth.svg" alt="" className="hm-kpi__bg-icon" aria-hidden />
        <div className="hm-kpi__accent" />
        <div className="hm-kpi__label">Total wealth</div>
        <div className="hm-kpi__value hm-kpi__value--gradient">
          {FMT_COMPACT(snapshot.netWorth.value)}
        </div>
        <div className={`hm-kpi__trend hm-kpi__trend--${snapshot.netWorth.trendDir}`}>
          {isDown(snapshot.netWorth.trendDir)
            ? <ArrowDownRight size={13} weight="bold" />
            : <ArrowUpRight   size={13} weight="bold" />
          }
          {snapshot.netWorth.trend} since January
        </div>
      </div>

      <div className={`hm-kpi hm-kpi--savings hm-kpi--savings-${savingsTrend} hm-kpi--bg-${KPI_BG_LAYOUT}`}>
        <img src="/Savings.svg" alt="" className="hm-kpi__bg-icon" aria-hidden />
        <div className="hm-kpi__accent" />
        <div className="hm-kpi__label">Savings rate</div>
        <div className="hm-kpi__value">{snapshot.savingsRate.value}%</div>
        <div className={`hm-kpi__trend hm-kpi__trend--${savingsDelta > 0 ? 'up' : 'savings-' + savingsTrend}`}>
          {savingsDelta > 0
            ? <ArrowUpRight size={13} weight="bold" />
            : <ArrowDownRight size={13} weight="bold" />
          }
          From {snapshot.savingsRate.prevMonth}% last month
        </div>
      </div>

      <div className={`hm-kpi hm-kpi--crediq hm-kpi--crediq-${creditIQ.insight.direction} hm-kpi--bg-${KPI_BG_LAYOUT}`}>
        <img src="/Credit.svg" alt="" className="hm-kpi__bg-icon" aria-hidden />
        <div className="hm-kpi__accent" />
        <div className="hm-kpi__label">CreditIQ</div>
        <div className="hm-kpi__value">{creditIQ.score}<span className="hm-kpi__value-denom">/100</span></div>
        <div className={`hm-kpi__trend hm-kpi__trend--crediq-${creditIQ.insight.direction}`}>
          {creditIQ.insight.text}
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   ZONE 3 — Financial Network
   4 category aggregates. Each card shows icon+label in one row
   (vertically centered), a due-date badge top-right when
   applicable, and a "Details" button that opens a floating
   popover (not inline expansion) with the per-account drill-down.
   Banking card has an eye/mask toggle on its total balance.
═══════════════════════════════════════════════════════════ */
function FinancialNetworkStrip({ user }) {
  const network = calcFinancialNetwork(user)
  const [openCard, setOpenCard] = useState(null) // which popover is open

  const toggle = (key) => setOpenCard(open => open === key ? null : key)

  return (
    <motion.div variants={fadeUp}>
      <div className="hm-section-header">
        <span className="hm-section-label">Financial Network</span>
      </div>
      <div className="hm-fn-grid">

        {/* ── Banking ── */}
        <div className="hm-fn-card">
          <div className="hm-fn-card__top">
            <div className="hm-fn-card__icon"><Bank size={16} weight="duotone" /></div>
            <div className="hm-fn-card__label">Banking</div>
          </div>

          {network.banking ? (
            <>
              <div className="hm-fn-card__value">{FMT_COMPACT(network.banking.total)}</div>
              <div className="hm-fn-card__meta">
                {network.banking.count} {network.banking.count === 1 ? 'Account' : 'Accounts'}
              </div>
              <button className="hm-fn-card__details-btn" onClick={() => toggle('banking')}>
                Details
              </button>
              {openCard === 'banking' && (
                <FnPopover onClose={() => setOpenCard(null)}>
                  {network.banking.accounts.map(a => (
                    <div key={a.id} className="hm-fn-card__drill-row">
                      <span>
                        {a.label}
                        {a.label === network.banking.primary && (
                          <span className="hm-fn-card__primary-tag">Primary</span>
                        )}
                      </span>
                      <span>{FMT(a.balance)}</span>
                    </div>
                  ))}
                </FnPopover>
              )}
            </>
          ) : (
            <div className="hm-fn-card__empty">No linked accounts</div>
          )}
        </div>

        {/* ── Credit ── */}
        <div className="hm-fn-card">
          <div className="hm-fn-card__top">
            <div className="hm-fn-card__icon"><CreditCard size={16} weight="duotone" /></div>
            <div className="hm-fn-card__label">Credit</div>
            {network.credit?.nearestDue && (
              <span className="hm-fn-card__due-badge hm-fn-card__due-badge--warning">Due {network.credit.nearestDue.dueDate}</span>
            )}
          </div>

          {network.credit ? (
            <>
              <div className="hm-fn-card__value">{FMT(network.credit.total)}</div>
              <div className="hm-fn-card__meta">
                {network.credit.count} {network.credit.count === 1 ? 'Card' : 'Cards'}
              </div>
              <button className="hm-fn-card__details-btn" onClick={() => toggle('credit')}>
                Details
              </button>
              {openCard === 'credit' && (
                <FnPopover onClose={() => setOpenCard(null)}>
                  {network.credit.cards.map(c => (
                    <div key={c.id} className="hm-fn-card__drill-row hm-fn-card__drill-row--stacked">
                      <span className="hm-fn-card__drill-label">{c.label}</span>
                      <span className="hm-fn-card__drill-value">
                        {FMT(c.balance)}{c.dueDate ? ` · Due ${c.dueDate}` : ''}
                      </span>
                    </div>
                  ))}
                </FnPopover>
              )}
            </>
          ) : (
            <div className="hm-fn-card__empty">No credit cards linked</div>
          )}
        </div>

        {/* ── Loans ── */}
        <div className="hm-fn-card">
          <div className="hm-fn-card__top">
            <div className="hm-fn-card__icon"><HandCoins size={16} weight="duotone" /></div>
            <div className="hm-fn-card__label">Loans</div>
            {network.loans?.nextDue && (
              <span className="hm-fn-card__due-badge hm-fn-card__due-badge--neutral">Due {network.loans.nextDue.nextDue}</span>
            )}
          </div>

          {network.loans ? (
            <>
              <div className="hm-fn-card__value">
                {FMT(network.loans.totalEMI)}<span className="hm-fn-card__value-suffix">/mo</span>
              </div>
              <div className="hm-fn-card__meta">
                {network.loans.count} Active {network.loans.count === 1 ? 'Loan' : 'Loans'}
              </div>
              <button className="hm-fn-card__details-btn" onClick={() => toggle('loans')}>
                Details
              </button>
              {openCard === 'loans' && (
                <FnPopover onClose={() => setOpenCard(null)}>
                  {network.loans.loans.map(l => (
                    <div key={l.id} className="hm-fn-card__drill-row">
                      <span>{l.label}</span>
                      <span>EMI {FMT(l.emi)}</span>
                    </div>
                  ))}
                </FnPopover>
              )}
            </>
          ) : (
            <>
              <div className="hm-fn-card__empty">No Active Loans</div>
              <div className="hm-fn-card__empty-sub">You're debt free</div>
            </>
          )}
        </div>

        {/* ── Global ── */}
        <div className="hm-fn-card">
          <div className="hm-fn-card__top">
            <div className="hm-fn-card__icon"><CurrencyDollar size={16} weight="duotone" /></div>
            <div className="hm-fn-card__label">Global</div>
          </div>

          {network.global ? (
            <>
              <div className="hm-fn-card__value">{FMT_USD(network.global.total)}</div>
              <div className="hm-fn-card__meta">
                {network.global.count} Forex {network.global.count === 1 ? 'Card' : 'Cards'}
              </div>
              <button className="hm-fn-card__details-btn" onClick={() => toggle('global')}>
                Details
              </button>
              {openCard === 'global' && (
                <FnPopover onClose={() => setOpenCard(null)}>
                  {network.global.cards.map(c => (
                    <div key={c.id} className="hm-fn-card__drill-row">
                      <span>{c.label}</span>
                      <span>{FMT_USD(c.balance)}</span>
                    </div>
                  ))}
                </FnPopover>
              )}
            </>
          ) : (
            <div className="hm-fn-card__empty">No global balance</div>
          )}
        </div>

      </div>
    </motion.div>
  )
}

// Floating popover for Financial Network drill-down. Positioned
// absolutely within its parent .hm-fn-card (which is position:relative),
// rendered above card content rather than reflowing the grid.
// Click-outside-to-close via a full-viewport invisible backdrop.
function FnPopover({ children, onClose }) {
  return (
    <>
      <div className="hm-fn-popover-backdrop" onClick={onClose} />
      <motion.div
        className="hm-fn-popover"
        initial={{ opacity: 0, y: 6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </>
  )
}

// Info icon + tooltip showing a step's own body text. Originally
// this held a separate jargon-term definition (mockData's
// jargonTerm/jargonDef fields), but per explicit feedback the
// tooltip should show the SAME content already on the card (the
// step's body prose), not a separate definition. mockData's
// jargonTerm/jargonDef fields are unused by this component now —
// left in place rather than deleted in case a future jargon-
// explainer feature wants them back, but nothing currently reads them.
//
// Positioning: the tooltip is position:fixed with coordinates read
// from the trigger's own getBoundingClientRect() on open, NOT
// position:absolute relative to a CSS ancestor. This was the actual
// bug behind "tooltip never appears" inside the AwdSplit bar —
// .hm-awd-split__bar has overflow:hidden (needed for its own
// rounded-corner segmented look), and ANY absolutely-positioned
// descendant trying to render outside that bar's box gets silently
// clipped to invisible, even though the open state was correctly
// true the whole time. Fixed positioning escapes that ancestor's
// clipping entirely since it's computed relative to the viewport.
// Tooltip box dimensions, used for collision math BEFORE the box
// itself has rendered (so its real size can't be measured yet).
// Matches .hm-jargon__tooltip's CSS width; height is a conservative
// estimate covering the longest real body text in mockData.js at
// that width — if a future step's body is much longer, this may
// under-estimate and the box could still slightly clip on the flip
// side. Margin is the gap kept from any viewport edge.
const TOOLTIP_W = 240
const TOOLTIP_H = 140
const EDGE_MARGIN = 12

function StepInfoTooltip({ title, body }) {
  const [open, setOpen]     = useState(false)
  const [pos, setPos]       = useState(null) // { top, left, placement }
  const triggerRef = useRef(null)
  if (!body) return null

  // Full 4-direction collision check against the trigger's real
  // screen position. Vertically: prefer below, flip above if the
  // viewport doesn't have TOOLTIP_H + margin of room beneath the
  // trigger. Horizontally: prefer centered on the trigger, but
  // clamp left/right so the box never crosses either viewport edge
  // — this is what was missing before (only "below, centered" was
  // ever computed, so a trigger near the bottom or a side edge had
  // nowhere safe to render and got silently clipped).
  const openAt = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (!rect) { setOpen(true); return }

    const vw = window.innerWidth
    const vh = window.innerHeight

    const spaceBelow = vh - rect.bottom
    const spaceAbove = rect.top
    const placeBelow = spaceBelow >= TOOLTIP_H + EDGE_MARGIN || spaceBelow >= spaceAbove
    const top = placeBelow ? rect.bottom + 8 : rect.top - 8 - TOOLTIP_H

    let left = rect.left + rect.width / 2 - TOOLTIP_W / 2
    left = Math.max(EDGE_MARGIN, Math.min(left, vw - TOOLTIP_W - EDGE_MARGIN))

    setPos({ top: Math.max(EDGE_MARGIN, top), left, placement: placeBelow ? 'below' : 'above' })
    setOpen(true)
  }

  return (
    <span
      className="hm-jargon"
      onMouseEnter={openAt}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        ref={triggerRef}
        className="hm-jargon__trigger"
        onClick={() => (open ? setOpen(false) : openAt())}
        aria-label={`More about ${title}`}
      >
        <Info size={13} weight="bold" />
      </button>
      {open && pos && (
        <div
          className={`hm-jargon__tooltip hm-jargon__tooltip--${pos.placement}`}
          role="tooltip"
          style={{ position: 'fixed', top: pos.top, left: pos.left }}
        >
          <span className="hm-jargon__term">{title}</span>
          <span className="hm-jargon__def">{body}</span>
        </div>
      )}
    </span>
  )
}

/* ═══════════════════════════════════════════════════════════
   ZONE 4 — Portfolio + Health score (side by side)
═══════════════════════════════════════════════════════════ */
// startWhen gates BOTH the ring's stroke-fill animation and the
// center number's count-up, so they stay in sync — the donut
// filling while the number sits frozen (or vice versa) would read
// as broken even though each piece works independently. Previously
// this fired unconditionally on mount (Framer Motion's `animate`
// prop runs as soon as the component exists), which meant the ring
// finished filling before the user ever scrolled down to the
// Financial Health card — same root issue already fixed for the
// WealthPilot total and the hero's disposable-income counter.
function HealthRing({ score, max, band, startWhen = true }) {
  const size      = 120
  const stroke    = 8
  const r         = (size - stroke) / 2
  const circ      = 2 * Math.PI * r
  const COLOR_MAP = { success: 'var(--color-success)', warning: 'var(--color-warning)', danger: 'var(--color-danger)' }
  const ringColor = COLOR_MAP[band] || 'var(--color-warning)'

  // Counts 0 -> score, only once startWhen flips true. Same hook
  // used for the hero/WealthPilot reveals — see useCountUp.js for
  // why it deliberately has no ref-based "already started" guard.
  const countedScore = useCountUp(score, { duration: 1400, delay: 400, startWhen })
  const filled = (countedScore / max) * circ

  return (
    <div className="hm-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--color-border)" strokeWidth={stroke} fill="none" />
        <circle
          cx={size/2} cy={size/2} r={r}
          stroke={ringColor} strokeWidth={stroke} fill="none"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circ}`}
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </svg>
      <div className="hm-ring__center">
        <span className="hm-ring__num">{Math.round(countedScore)}</span>
        <span className="hm-ring__denom">/{max}</span>
      </div>
    </div>
  )
}

function PortfolioAndHealth({ user }) {
  const portfolioTotal = user.portfolio.breakdown.reduce((s, i) => s + i.value, 0)

  // Count-up only starts once the WealthPilot card has actually
  // scrolled into view, rather than on page mount. Without this,
  // a card below the fold finishes its 0→total animation before
  // the user ever scrolls down to see it — by the time they
  // arrive, the number's just sitting there static, defeating the
  // whole point of the reveal. threshold/rootMargin defaults from
  // useInView (20% visible, slightly inset from the bottom edge)
  // are used as-is; this card doesn't need different tuning.
  const [portfolioRef, portfolioInView] = useInView()

  // Counts up 0 → portfolioTotal once in view, same hook/easing
  // convention as the hero's "Available to spend" figure. Delay is
  // shorter than the hero's (300ms vs 500ms) — there's no entrance
  // spring to wait out here, just a short beat after the card
  // becomes visible before the count starts.
  const countedPortfolioTotal = useCountUp(portfolioTotal, { duration: 1200, delay: 300, startWhen: portfolioInView })

  // Portfolio insight — computed from real breakdown data, not a
  // hardcoded sentence. Surfaces concentration risk (top 2 holdings'
  // combined share) since that's information the header's "+₹14.0K
  // today" figure doesn't already convey. Sorted by value descending
  // so this works regardless of how breakdown[] is ordered in mock data.
  const sortedHoldings = [...user.portfolio.breakdown].sort((a, b) => b.value - a.value)
  const top2           = sortedHoldings.slice(0, 2)
  const top2Pct        = top2.reduce((s, h) => s + h.pct, 0)
  const portfolioInsight = top2.length === 2
    ? `${top2[0].label} and ${top2[1].label} make up ${top2Pct}% of your portfolio — ${top2Pct >= 70 ? "that's concentrated, worth knowing if either turns" : 'a reasonably balanced split for now'}.`
    : null

  return (
    <motion.div className="hm-pnh-grid" variants={fadeUp}>
      <div className="hm-card hm-card--portfolio" ref={portfolioRef}>
        <div className="hm-card__header">
          <span className="hm-card__title">WealthPilot</span>
          <div className={`hm-card__gain hm-card__gain--${user.portfolio.todayDir}`}>
            {user.portfolio.todayDir === 'up'
              ? <ArrowUpRight size={13} weight="bold" />
              : <ArrowDownRight size={13} weight="bold" />
            }
            {FMT_COMPACT(Math.abs(user.portfolio.todayGain))} today
          </div>
        </div>
        <div className="hm-portfolio__total">{FMT_COMPACT(countedPortfolioTotal)}</div>
        <div className="hm-portfolio__bars">
          {user.portfolio.breakdown.map(item => (
            <div key={item.id} className="hm-portfolio__row">
              <div className="hm-portfolio__row-top">
                <span className="hm-portfolio__item-line">
                  <span className="hm-portfolio__item-label">{item.label}</span>
                  <span className="hm-portfolio__item-detail-inline"> : {item.detail}</span>
                </span>
                <span className={`hm-portfolio__item-trend hm-portfolio__item-trend--${item.trendDir}`}>
                  {item.trend}
                </span>
              </div>
              <div className="hm-portfolio__bar-track">
                <motion.div
                  className={`hm-portfolio__bar-fill hm-portfolio__bar-fill--${item.variant}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${item.pct}%` }}
                  transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                />
              </div>
            </div>
          ))}
        </div>
        {portfolioInsight && (
          <div className="hm-health__aura-note hm-portfolio__aura-note">
            <Sparkle size={13} weight="fill" className="hm-health__note-icon" />
            {portfolioInsight}
          </div>
        )}
      </div>

      <div className={`hm-card hm-card--health hm-card--health-${user.health.band}`}>
        <div className="hm-card__header">
          <span className="hm-card__title">Financial Health</span>
          <span className={`hm-health__band-pill hm-health__band-pill--${user.health.band}`}>
            {user.health.bandLabel}
          </span>
        </div>
        <div className="hm-health__top">
          <HealthRing score={user.health.score} max={user.health.max} band={user.health.band} startWhen={portfolioInView} />
          <div className="hm-health__pillars">
            {user.health.pillars.map(p => (
              <div key={p.id} className="hm-health__pillar">
                <div className="hm-health__pillar-top">
                  <span className="hm-health__pillar-label">{p.label}</span>
                  <span className={`hm-health__pillar-score hm-health__pillar-score--${p.variant}`}>{p.score}</span>
                </div>
                <div className="hm-health__pillar-track">
                  <motion.div
                    className={`hm-health__pillar-fill hm-health__pillar-fill--${p.variant}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${p.score}%` }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="hm-health__aura-note">
          <Sparkle size={13} weight="fill" className="hm-health__note-icon" />
          {user.health.auraNote}
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   ZONE 5 — Recent transactions + Markets
   Markets list ticks live via useMarketTicker — see that hook for
   the fluctuation logic. Each row briefly flashes on value change
   (up = green flash, down = red flash) so the tick reads as a
   real update, not a silent re-render of the same-looking text.
═══════════════════════════════════════════════════════════ */
function TransactionsAndMarkets({ user }) {
  const liveMarkets = useMarketTicker(user.markets)

  // Tracks each instrument's previous tick value to detect a real
  // change (not just a re-render) and trigger a one-shot flash
  // class. Plain ref + plain object, not state — this doesn't need
  // to itself trigger a re-render; it only needs to remember
  // "what did I show last time" across the renders the ticker
  // already causes.
  const prevValuesRef = useRef({})
  const [flashIds, setFlashIds] = useState({})

  // Detect changes on every render (not in an effect) so the flash
  // class is present in the SAME render the new value appears —
  // an effect-based detection would apply the class one render
  // late, after the number had already changed with no flash.
  liveMarkets.forEach(m => {
    const prev = prevValuesRef.current[m.id]
    if (prev !== undefined && prev !== m.value && !flashIds[m.id]) {
      // Schedule the flash class + its own removal. Using a
      // microtask-free setTimeout here (not inside the render body
      // directly setting state) to avoid a setState-during-render
      // warning — this still fires essentially immediately.
      setTimeout(() => {
        setFlashIds(f => ({ ...f, [m.id]: m.dir }))
        setTimeout(() => {
          setFlashIds(f => { const next = { ...f }; delete next[m.id]; return next })
        }, 600)
      }, 0)
    }
    prevValuesRef.current[m.id] = m.value
  })

  return (
    <motion.div className="hm-tm-grid" variants={fadeUp}>
      <div className="hm-card">
        <div className="hm-card__header">
          <span className="hm-card__title">SpendPulse</span>
          <button className="hm-see-all">See all <ArrowRight size={12} /></button>
        </div>
        <div className="hm-txns">
          {user.transactions.filter(t => t.month === 'Jun').slice(0, 4).map((txn, i) => (
            <motion.div
              key={txn.id}
              className="hm-txn"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className={`hm-txn__icon hm-txn__icon--${txn.dir}`}>
                {txn.dir === 'in' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              </div>
              <div className="hm-txn__body">
                <span className="hm-txn__merchant">{txn.merchant}</span>
                <span className="hm-txn__meta">{txn.category} · {txn.date}</span>
              </div>
              <span className={`hm-txn__amount hm-txn__amount--${txn.dir}`}>
                {txn.dir === 'in' ? '+' : '-'}{FMT(Math.abs(txn.amount))}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="hm-card">
        <div className="hm-card__header">
          <span className="hm-card__title">Markets today</span>
          <span className="hm-card__subtitle">Live</span>
        </div>
        <div className="hm-markets">
          {liveMarkets.map(m => (
            <div key={m.id} className={`hm-market-row${flashIds[m.id] ? ` hm-market-row--flash-${flashIds[m.id]}` : ''}`}>
              <span className="hm-market__label">{m.label}</span>
              <div className="hm-market__right">
                <span className="hm-market__value">{m.value}</span>
                <span className={`hm-market__change hm-market__change--${m.dir}`}>
                  {m.dir === 'up' ? <ArrowUpRight size={11} weight="bold" /> : <ArrowDownRight size={11} weight="bold" />}
                  {m.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   ZONE 6 — What Aura would do with ₹X
   Dispatcher — see AWD_LAYOUT toggle above. Implementations
   below it; only one renders depending on the flag.
═══════════════════════════════════════════════════════════ */
function AuraWouldDo({ user }) {
  if (AWD_LAYOUT === 'flow')    return <AwdFlow    user={user} />
  if (AWD_LAYOUT === 'stacked') return <AwdStacked user={user} />
  if (AWD_LAYOUT === 'split')   return <AwdSplit   user={user} />
  return <AwdOriginal user={user} />
}

// ── Original: 3 equal-width cards ───────────────────
function AwdOriginal({ user }) {
  const { auraWouldDo } = user
  return (
    <motion.div variants={fadeUp} className="hm-awd">
      <div className="hm-awd__header">
        <Sparkle size={18} weight="fill" className="hm-awd__icon" />
        <span className="hm-awd__title">
          What Aura would do with {FMT_COMPACT(auraWouldDo.undeployed)}
        </span>
      </div>
      <div className="hm-awd__steps">
        {auraWouldDo.steps.map(step => {
          const Icon = ICON_MAP[step.icon] || Sparkle
          return (
            <div key={step.step} className={`hm-awd__step hm-awd__step--${step.variant}`}>
              <div className="hm-awd__step-meta">Step {step.step} of {step.of}</div>
              <div className={`hm-awd__step-icon hm-awd__step-icon--${step.variant}`}>
                <Icon size={18} weight="duotone" />
              </div>
              <div className="hm-awd__step-title-row">
                <span className="hm-awd__step-title">{step.title}</span>
                <StepInfoTooltip title={step.title} body={step.body} />
              </div>
              <div className="hm-awd__step-body">{step.body}</div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ── Option A — Flow: connected timeline with running balance ──
// Each step shows a before→after mini math strip ABOVE the title,
// so the depletion of the undeployed total is visible as numbers
// before any sentence is read. Steps are joined by a horizontal
// connector to read as one sequence, not three islands. Steps
// missing step.amount (e.g. Anand's steps 2/3) skip the math strip
// and show a plain label instead — see mockData.js comments on
// why those are intentionally amount-less.
function AwdFlow({ user }) {
  const { auraWouldDo } = user
  let running = auraWouldDo.undeployed

  return (
    <motion.div variants={fadeUp} className="hm-awd">
      <div className="hm-awd__header">
        <Sparkle size={18} weight="fill" className="hm-awd__icon" />
        <span className="hm-awd__title">
          What Aura would do with {FMT_COMPACT(auraWouldDo.undeployed)}
        </span>
      </div>
      <div className="hm-awd-flow">
        {auraWouldDo.steps.map((step, i) => {
          const Icon = ICON_MAP[step.icon] || Sparkle
          const hasAmount = typeof step.amount === 'number'
          const before = running
          if (hasAmount) running = Math.max(0, running - step.amount)
          const after = hasAmount ? running : null
          const isLast = i === auraWouldDo.steps.length - 1

          return (
            <div key={step.step} className="hm-awd-flow__item">
              <div className={`hm-awd-flow__card hm-awd-flow__card--${step.variant}`}>
                <div className="hm-awd-flow__step-num">{step.step}</div>
                {hasAmount ? (
                  <div className="hm-awd-flow__math">
                    <span className="hm-awd-flow__math-before">{FMT_COMPACT(before)}</span>
                    <ArrowRight size={11} weight="bold" className="hm-awd-flow__math-arrow" />
                    <span className="hm-awd-flow__math-after">{FMT_COMPACT(after)}</span>
                  </div>
                ) : (
                  <div className="hm-awd-flow__math hm-awd-flow__math--none">No direct allocation</div>
                )}
                <div className={`hm-awd-flow__icon hm-awd-flow__icon--${step.variant}`}>
                  <Icon size={16} weight="duotone" />
                </div>
                <div className="hm-awd-flow__title">{step.title}</div>
                <div className="hm-awd-flow__body">{step.body}</div>
              </div>
              {!isLast && <div className="hm-awd-flow__connector" aria-hidden><ArrowRight size={14} weight="bold" /></div>}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ── Option B — Stacked: priority list, decreasing visual weight ──
// Step 1 is largest/boldest (full-bleed urgency border), each
// subsequent step shrinks slightly — so "most important first" is
// legible from size alone before reading a word. A left-side bar
// shows each step's amount as a proportion of the undeployed total
// (steps without an amount get a thin neutral marker instead of a
// proportional bar — there's nothing honest to size it against).
function AwdStacked({ user }) {
  const { auraWouldDo } = user
  const total = auraWouldDo.undeployed

  return (
    <motion.div variants={fadeUp} className="hm-awd">
      <div className="hm-awd__header">
        <Sparkle size={18} weight="fill" className="hm-awd__icon" />
        <span className="hm-awd__title">
          What Aura would do with {FMT_COMPACT(auraWouldDo.undeployed)}
        </span>
      </div>
      <div className="hm-awd-stack">
        {auraWouldDo.steps.map(step => {
          const Icon = ICON_MAP[step.icon] || Sparkle
          const hasAmount = typeof step.amount === 'number'
          const pct = hasAmount ? Math.round((step.amount / total) * 100) : null
          return (
            <div
              key={step.step}
              className={`hm-awd-stack__row hm-awd-stack__row--${step.step} hm-awd-stack__row--${step.variant}`}
            >
              <div className="hm-awd-stack__rail">
                {hasAmount ? (
                  <div className="hm-awd-stack__rail-fill" style={{ height: `${pct}%` }} />
                ) : (
                  <div className="hm-awd-stack__rail-marker" />
                )}
              </div>
              <div className="hm-awd-stack__content">
                <div className="hm-awd-stack__top">
                  <div className={`hm-awd-stack__icon hm-awd-stack__icon--${step.variant}`}>
                    <Icon size={step.step === 1 ? 20 : 16} weight="duotone" />
                  </div>
                  <span className="hm-awd-stack__meta">Step {step.step} of {step.of}</span>
                  {hasAmount && <span className="hm-awd-stack__amount">{FMT_COMPACT(step.amount)} · {pct}%</span>}
                </div>
                <div className="hm-awd-stack__title">{step.title}</div>
                <div className="hm-awd-stack__body">{step.body}</div>
              </div>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

// ── Option C — Split: one bar, segmented exactly to the allocation ──
// The bar IS the answer: ₹20K/₹10K/₹20K renders as 3 segments at
// 40%/20%/40% width, legible in one glance before any text. Step
// cards stay below for supporting detail but are no longer where
// the split itself lives. Steps without step.amount (Anand's
// steps 2/3) get no segment; any leftover total not covered by
// real allocations renders as an explicit neutral "unallocated"
// segment, so the bar always honestly sums to 100% of the total —
// never a fabricated split for steps that aren't real allocations.
function AwdSplit({ user }) {
  const { auraWouldDo } = user
  const total = auraWouldDo.undeployed
  const allocated = auraWouldDo.steps.reduce((s, st) => s + (typeof st.amount === 'number' ? st.amount : 0), 0)
  const unallocated = Math.max(0, total - allocated)

  return (
    <motion.div variants={fadeUp} className="hm-awd">
      <div className="hm-awd__header">
        <Sparkle size={18} weight="fill" className="hm-awd__icon" />
        <span className="hm-awd__title">
          What Aura would do with {FMT_COMPACT(auraWouldDo.undeployed)}
        </span>
      </div>

      <div className="hm-awd-split__bar">
        {auraWouldDo.steps.filter(s => typeof s.amount === 'number').map(step => {
          const pct = Math.round((step.amount / total) * 100)
          return (
            <div
              key={step.step}
              className={`hm-awd-split__seg hm-awd-split__seg--${step.step}`}
              style={{ width: `${pct}%` }}
            >
              <div className="hm-awd-split__seg-content">
                <span className="hm-awd-split__seg-amount">{FMT_COMPACT(step.amount)}</span>
                <span className="hm-awd-split__seg-title-row">
                  <span className="hm-awd-split__seg-title">{step.title}</span>
                  <StepInfoTooltip title={step.title} body={step.body} />
                </span>
                <span className="hm-awd-split__seg-pct">{pct}%</span>
              </div>
            </div>
          )
        })}
        {unallocated > 0 && (
          <div className="hm-awd-split__seg hm-awd-split__seg--neutral" style={{ width: `${Math.round((unallocated / total) * 100)}%` }}>
            <div className="hm-awd-split__seg-content">
              <span className="hm-awd-split__seg-amount">{FMT_COMPACT(unallocated)}</span>
              <span className="hm-awd-split__seg-title">Unallocated</span>
              <span className="hm-awd-split__seg-pct">{Math.round((unallocated / total) * 100)}%</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Page root
═══════════════════════════════════════════════════════════ */
export default function Home() {
  const { user } = useUser()

  return (
    <div className="page-content">
      <motion.div
        className="page-sections"
        variants={stagger}
        initial="hidden"
        animate="show"
      >
        <AuraHero               user={user} />
        <FraudAlertBanner       user={user} />
        <KpiStrip               user={user} />
        <FinancialNetworkStrip  user={user} />
        <PortfolioAndHealth     user={user} />
        <TransactionsAndMarkets user={user} />
        <AuraWouldDo            user={user} />
      </motion.div>
    </div>
  )
}
