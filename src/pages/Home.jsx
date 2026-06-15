// ═══════════════════════════════════════════════════════════════
// Home.jsx — Aura Finance Home Page
// Full personality-driven home. User-aware via UserContext.
// 7 zones per the Aura design spec.
// ═══════════════════════════════════════════════════════════════
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowUpRight, ArrowDownRight, ArrowRight,
  Eye, EyeSlash,
  Bank, CreditCard, CurrencyDollar,
  TrendUp, TrendDown,
  Sparkle, ShieldCheck,
  ForkKnife, Warning, ChartBar,
  ShieldWarning, CheckCircle, X,
} from '@phosphor-icons/react'

import './Home.css'
import { useUser }        from '../context/UserContext'
import { useGreeting }    from '../hooks/useGreeting'
import { FMT, FMT_COMPACT, calcDisposable, calcMonthlySpend, getSnapshot } from '../data/mockData'
import LottiePlayer       from '../components/ui/LottiePlayer'
import FraudSlideOut      from '../components/ui/FraudSlideOut'
import Button             from '../components/ui/Button'
import lottieParticles    from '../assets/lottie/lottie-particles.json'

// ── Animation presets ──────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show:   { opacity: 1, y: 0,  transition: { type: 'spring', stiffness: 280, damping: 26 } },
}
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07, delayChildren: 0.02 } },
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
            {FMT(disposable)}
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
            <div key={alert.id} className="hm-fraud">
              <div className="hm-fraud__icon-wrap">
                <ShieldWarning size={18} weight="fill" />
              </div>

              <div className="hm-fraud__body">
                <div className="hm-fraud__label">FraudShield AI · {alert.date}</div>
                <div className="hm-fraud__title">{alert.title}</div>
                <div className="hm-fraud__desc">{alert.body}</div>

                {isDisputing && (
                  <div className={`hm-fraud__window hm-fraud__window--${win.status}`}>
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
                  </div>
                )}
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

              <button
                className="hm-fraud__close"
                onClick={() => setDismissed(d => ({ ...d, [alert.id]: true }))}
                aria-label="Dismiss"
              >
                <X size={13} />
              </button>
            </div>
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

  return (
    <motion.div className="hm-kpi-strip" variants={fadeUp}>
      <div className="hm-kpi hm-kpi--wealth">
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

      <div className="hm-kpi hm-kpi--savings">
        <div className="hm-kpi__accent" />
        <div className="hm-kpi__label">Savings rate</div>
        <div className="hm-kpi__value">{snapshot.savingsRate.value}%</div>
        <div className={`hm-kpi__trend hm-kpi__trend--${snapshot.savingsRate.value > snapshot.savingsRate.prevMonth ? 'up' : 'down'}`}>
          {snapshot.savingsRate.value > snapshot.savingsRate.prevMonth
            ? <ArrowUpRight size={13} weight="bold" />
            : <ArrowDownRight size={13} weight="bold" />
          }
          From {snapshot.savingsRate.prevMonth}% last month
        </div>
      </div>

      <div className={`hm-kpi hm-kpi--spend hm-kpi--spend-${snapshot.monthlySpend.pctIncome > 80 ? 'danger' : snapshot.monthlySpend.pctIncome > 60 ? 'warning' : 'ok'}`}>
        <div className="hm-kpi__accent" />
        <div className="hm-kpi__label">Monthly spend</div>
        <div className="hm-kpi__value">{FMT_COMPACT(snapshot.monthlySpend.value)}</div>
        <div className="hm-kpi__trend hm-kpi__trend--meta">
          {snapshot.monthlySpend.pctIncome}% of income
        </div>
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   ZONE 3 — Accounts strip
═══════════════════════════════════════════════════════════ */
function AccountsStrip({ user }) {
  const [visible, setVisible] = useState({})
  const toggle = (id) => setVisible(v => ({ ...v, [id]: !v[id] }))
  const shown  = user.accounts.slice(0, 4)

  return (
    <motion.div variants={fadeUp}>
      <div className="hm-section-header">
        <span className="hm-section-label">Your accounts</span>
        {user.accounts.length > 4 && (
          <button className="hm-see-all">See all {user.accounts.length} <ArrowRight size={12} /></button>
        )}
      </div>
      <div className="hm-accounts">
        {shown.map(acc => {
          const Icon = ICON_MAP[acc.icon] || CreditCard
          const show = visible[acc.id]
          return (
            <motion.div
              key={acc.id}
              className={`hm-account hm-account--${acc.variant}`}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="hm-account__top">
                <div className={`hm-account__icon hm-account__icon--${acc.variant}`}>
                  <Icon size={16} weight="duotone" />
                </div>
                {acc.outstanding && (
                  <span className="hm-account__due">Due {acc.dueDate}</span>
                )}
              </div>
              <div className="hm-account__label">{acc.label}</div>
              <div className="hm-account__type">{acc.type}</div>
              <div className="hm-account__balance-row">
                <span className={`hm-account__balance${show ? '' : ' hm-account__balance--hidden'}`}>
                  {show ? FMT(acc.balance) : '••••••'}
                </span>
                <motion.button
                  className="hm-account__eye"
                  onClick={() => toggle(acc.id)}
                  whileTap={{ scale: 0.85 }}
                  aria-label={show ? 'Hide balance' : 'Show balance'}
                >
                  {show ? <EyeSlash size={12} /> : <Eye size={12} />}
                </motion.button>
              </div>
              <div className="hm-account__number">{acc.number}</div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   ZONE 4 — Portfolio + Health score (side by side)
═══════════════════════════════════════════════════════════ */
function HealthRing({ score, max, band }) {
  const size      = 120
  const stroke    = 8
  const r         = (size - stroke) / 2
  const circ      = 2 * Math.PI * r
  const filled    = (score / max) * circ
  const COLOR_MAP = { success: 'var(--color-success)', warning: 'var(--color-warning)', danger: 'var(--color-danger)' }
  const ringColor = COLOR_MAP[band] || 'var(--color-warning)'

  return (
    <div className="hm-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size/2} cy={size/2} r={r} stroke="var(--color-border)" strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size/2} cy={size/2} r={r}
          stroke={ringColor} strokeWidth={stroke} fill="none"
          strokeLinecap="round"
          strokeDasharray={`0 ${circ}`}
          animate={{ strokeDasharray: `${filled} ${circ}` }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </svg>
      <div className="hm-ring__center">
        <span className="hm-ring__num">{score}</span>
        <span className="hm-ring__denom">/{max}</span>
      </div>
    </div>
  )
}

function PortfolioAndHealth({ user }) {
  const portfolioTotal = user.portfolio.breakdown.reduce((s, i) => s + i.value, 0)
  return (
    <motion.div className="hm-pnh-grid" variants={fadeUp}>
      <div className="hm-card hm-card--portfolio">
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
        <div className="hm-portfolio__total">{FMT_COMPACT(portfolioTotal)}</div>
        <div className="hm-portfolio__bars">
          {user.portfolio.breakdown.map(item => (
            <div key={item.id} className="hm-portfolio__row">
              <div className="hm-portfolio__row-top">
                <span className="hm-portfolio__item-label">{item.label}</span>
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
              <div className="hm-portfolio__item-detail">{item.detail}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={`hm-card hm-card--health hm-card--health-${user.health.band}`}>
        <div className="hm-card__header">
          <span className="hm-card__title">Financial Health</span>
          <span className={`hm-health__band-pill hm-health__band-pill--${user.health.band}`}>
            {user.health.bandLabel}
          </span>
        </div>
        <div className="hm-health__top">
          <HealthRing score={user.health.score} max={user.health.max} band={user.health.band} />
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
═══════════════════════════════════════════════════════════ */
function TransactionsAndMarkets({ user }) {
  return (
    <motion.div className="hm-tm-grid" variants={fadeUp}>
      <div className="hm-card">
        <div className="hm-card__header">
          <span className="hm-card__title">SpendPulse</span>
          <button className="hm-see-all">See all <ArrowRight size={12} /></button>
        </div>
        <div className="hm-txns">
          {user.transactions.filter(t => t.month === 'Jun').slice(0, 5).map((txn, i) => (
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
          {user.markets.map(m => (
            <div key={m.id} className="hm-market-row">
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
═══════════════════════════════════════════════════════════ */
function AuraWouldDo({ user }) {
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
              <div className="hm-awd__step-title">{step.title}</div>
              <div className="hm-awd__step-body">{step.body}</div>
            </div>
          )
        })}
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
        <AccountsStrip          user={user} />
        <PortfolioAndHealth     user={user} />
        <TransactionsAndMarkets user={user} />
        <AuraWouldDo            user={user} />
      </motion.div>
    </div>
  )
}
