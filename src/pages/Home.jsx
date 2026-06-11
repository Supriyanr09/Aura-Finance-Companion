// ═══════════════════════════════════════════════════════════════
// Home.jsx — Aura Finance Home Page
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowUpRight, ArrowRight, ArrowDown,
  Eye, EyeSlash,
  Bank, CreditCard, CurrencyDollar,
  ChartBar, TrendUp, Receipt, Sparkle,
  ForkKnife, PaperPlaneTilt,
  ShieldCheck,
} from '@phosphor-icons/react'

import './Home.css'
import { Card, CardBody } from '../components/ui/Card'
import { ProgressBar, SectionOverline } from '../components/ui/primitives'
import { useGreeting } from '../hooks/useGreeting'
import {
  SNAPSHOT, BANKING_CARDS, BRIEFING,
  QUICK_ACTIONS, HEALTH, FMT, FMT_COMPACT,
} from '../data/mockData'

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 28 } },
}
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
}

const ICON_MAP = {
  Bank, CreditCard, CurrencyDollar,
  ChartBar, TrendUp, Receipt, Sparkle,
  ForkKnife, PaperPlaneTilt, ShieldCheck,
}

/* ── Score band ───────────────────────────────────────────── */
function getScoreBand(score) {
  if (score >= 90) return { band: 'success', cssColor: 'var(--color-success)',        label: 'Excellent'  }
  if (score >= 75) return { band: 'teal',    cssColor: 'var(--color-stability-teal)', label: 'Strong'     }
  if (score >= 60) return { band: 'info',    cssColor: 'var(--color-info)',           label: 'Good'       }
  if (score >= 40) return { band: 'warning', cssColor: 'var(--color-warning)',        label: 'Fair'       }
  return               { band: 'danger',  cssColor: 'var(--color-danger)',           label: 'Needs Work' }
}

/* ═══════════════════════════════════════════════════════════
   SECTION 1 — Greeting Hero
═══════════════════════════════════════════════════════════ */
function GreetingHero() {
  const { greeting, icon, context, insight, dateStr } = useGreeting()
  return (
    <motion.section className="greeting-hero" variants={fadeUp} aria-label="Aura greeting">
      <div className="greeting-hero__wash" aria-hidden />
      <div className="greeting-hero__mascot-col">
        <motion.div
          className="greeting-hero__mascot-wrap"
          animate={{ y: [0, -7, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <motion.div
            className="greeting-hero__orbit"
            animate={{ rotate: 360 }}
            transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
          >
            <div className="greeting-hero__orbit-dot" />
          </motion.div>
          <img className="greeting-hero__mascot-img" src="/Mascot - Aura.svg" alt="Aura" draggable={false} />
        </motion.div>
      </div>
      <div className="greeting-hero__body">
        <h1 className="greeting-hero__headline">{greeting}</h1>
        <p className="greeting-hero__context">{context}</p>
        <div className="greeting-hero__insight">
          <span className="greeting-hero__live-dot" aria-hidden />
          {insight}
        </div>
      </div>
      <div className="greeting-hero__date">{dateStr}</div>
    </motion.section>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION 2 — Financial Snapshot
═══════════════════════════════════════════════════════════ */
function StabilityScoreCard() {
  const { stabilityScore: s } = SNAPSHOT
  const { band, cssColor, label } = getScoreBand(s.value)

  return (
    <div className="snapshot-card stability-card" aria-label="Stability Score">
      <div className="snapshot-card__label">Stability Score</div>

      <div className="snapshot-card__value">
        <span style={{ color: cssColor }}>{s.value}</span>
        <span className="stability__score-denom">/ {s.max}</span>
      </div>

      {/* <div className="stability__score-meta"> */}
        {/* <span className={`stability__band-label stability__band-label--${band}`}>{label}</span> */}
        <div className="snapshot-card__trend snapshot-card__trend--up">
          {s.trendDir === 'up' ? <ArrowUpRight size={11} weight="bold" /> : <ArrowDown size={11} weight="bold" />}
          {s.trendDir === 'up' ? '+' : '-'}{Math.abs(s.trend)} this month
        </div>
      {/* </div> */}

      {/* <div className="stability__attention-block"> */}
        {/* <div className="stability__list-label stability__list-label--attention">Needs attention</div> */}
        {/* <div className="stability__list-items"> */}
          {s.attention.map(item => (
            <div key={item} className="snapshot-card__aura-note">
              {/* <div className="stability__list-dot stability__list-dot--attention" aria-hidden /> */}
              Steady financial progress this month
            </div>
          ))}
        {/* </div> */}
      {/* </div> */}

      {/* <button className={`stability__action stability__action--${s.nextAction.variant}`}>
        {s.nextAction.label}
        <ArrowRight size={12} />
      </button> */}
    </div>
  )
}

function FinancialSnapshot() {
  const { netWorth, cashAvailable, savingsRate } = SNAPSHOT
  return (
    <motion.div variants={fadeUp} className="snapshot-grid">
      <div className="snapshot-card">
        <div className="snapshot-card__label">Net Worth</div>
        <div className="snapshot-card__value snapshot-card__value--gradient">{FMT_COMPACT(netWorth.value)}</div>
        <div className={`snapshot-card__trend snapshot-card__trend--${netWorth.trendDir}`}>
          <ArrowUpRight size={13} weight="bold" />{netWorth.trend} since January
        </div>
        <div className="snapshot-card__aura-note">{netWorth.auraNote}</div>
      </div>

      <div className="snapshot-card">
        <div className="snapshot-card__label">Cash Available</div>
        <div className="snapshot-card__value">{FMT_COMPACT(cashAvailable.value)}</div>
        <div className="snapshot-card__trend snapshot-card__trend--up">
          <ShieldCheck size={13} weight="bold" />{cashAvailable.monthsCover} months covered
        </div>
        <div className="snapshot-card__aura-note">{cashAvailable.auraNote}</div>
      </div>

      <div className="snapshot-card">
        <div className="snapshot-card__label">Savings Rate</div>
        <div className="snapshot-card__value">{savingsRate.value}%</div>
        <div className="snapshot-card__trend snapshot-card__trend--up">
          <ArrowUpRight size={13} weight="bold" />Up from {savingsRate.prevMonth}% last month
        </div>
        <div className="snapshot-card__aura-note">{savingsRate.auraNote}</div>
      </div>

      <StabilityScoreCard />
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION 3 — Banking Cards Strip
═══════════════════════════════════════════════════════════ */
function BankingStrip() {
  const [visible, setVisible] = useState({})
  const toggle = (id) => setVisible(v => ({ ...v, [id]: !v[id] }))

  return (
    <motion.div variants={fadeUp} className="banking-strip">
      {BANKING_CARDS.map(card => {
        const Icon      = ICON_MAP[card.icon] || CreditCard
        const isVisible = visible[card.id]
        return (
          <motion.div key={card.id} className="banking-card" whileTap={{ scale: 0.985 }}>
            <div className="banking-card__top">
              <div className={`banking-card__icon banking-card__icon--${card.variant}`}>
                <Icon size={17} weight="duotone" />
              </div>
              {card.outstanding && <div className="banking-card__due">Due {card.dueDate}</div>}
            </div>
            <div>
              <div className="banking-card__label">{card.label}</div>
              <div className="banking-card__type">{card.type}</div>
            </div>
            <div className="banking-card__balance-row">
              <div className={`banking-card__balance ${isVisible ? '' : 'banking-card__balance--hidden'}`}>
                {isVisible ? FMT(card.balance) : '••••••'}
              </div>
              <motion.button
                className="banking-card__eye-btn"
                onClick={() => toggle(card.id)}
                whileTap={{ scale: 0.85 }}
                aria-label={isVisible ? 'Hide balance' : 'Show balance'}
              >
                {isVisible ? <EyeSlash size={12} /> : <Eye size={12} />}
              </motion.button>
            </div>
            <div className="banking-card__number">{card.number}</div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION 4 — Aura's Daily Briefing
═══════════════════════════════════════════════════════════ */
function DailyBriefing() {
  return (
    <motion.div variants={fadeUp}>
      <div className="briefing-header">
        <Sparkle size={18} className="icon--brand" weight="fill" />
        <span className="briefing-header__title">Aura's Daily Briefing</span>
        <span className="briefing-header__subtitle">3 things worth knowing today</span>
      </div>
      <div className="briefing-grid">
        {BRIEFING.map(item => {
          const Icon = ICON_MAP[item.icon] || Sparkle
          return (
            <motion.div
              key={item.id}
              className={`briefing-card briefing-card--${item.variant}`}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.985 }}
            >
              <div className={`briefing-card__icon briefing-card__icon--${item.variant}`}>
                <Icon size={18} weight="duotone" />
              </div>
              <div className="briefing-card__title">{item.title}</div>
              <div className="briefing-card__message">{item.message}</div>
              <button className="briefing-card__cta">
                {item.cta} <ArrowRight size={13} />
              </button>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION 5 — Quick Actions
═══════════════════════════════════════════════════════════ */
function QuickActionsSection() {
  return (
    <motion.div variants={fadeUp}>
      <Card>
        <CardBody size="sm">
          <SectionOverline>Quick Actions</SectionOverline>
          <div className="quick-actions__grid">
            {QUICK_ACTIONS.map(({ id, label, icon }) => {
              const Icon = ICON_MAP[icon] || Sparkle
              return (
                <motion.button
                  key={id}
                  className={`quick-action-btn quick-action-btn--${id}`}
                  whileTap={{ scale: 0.93 }}
                  aria-label={label}
                >
                  <div className={`quick-action-icon quick-action-icon--${id}`}>
                    <Icon size={19} className="qa-icon" weight="duotone" />
                  </div>
                  <span className="quick-action-btn__label">{label}</span>
                </motion.button>
              )
            })}
          </div>
        </CardBody>
      </Card>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   SECTION 6 — Financial Health Breakdown
═══════════════════════════════════════════════════════════ */
function HealthRing({ score, max, size = 148 }) {
  const strokeWidth   = 9
  const radius        = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const filled        = (score / max) * circumference
  const dash          = `${filled} ${circumference}`
  const scoreColor    = score >= 75 ? 'var(--color-success)'
                      : score >= 55 ? 'var(--color-warning)'
                      :               'var(--color-danger)'
  return (
    <div className="health-score__ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle cx={size/2} cy={size/2} r={radius} stroke="var(--color-border)" strokeWidth={strokeWidth} fill="none" />
        <motion.circle
          cx={size/2} cy={size/2} r={radius}
          stroke={scoreColor} strokeWidth={strokeWidth} fill="none"
          strokeLinecap="round"
          strokeDasharray={`0 ${circumference}`}
          animate={{ strokeDasharray: dash }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
          transform={`rotate(-90 ${size/2} ${size/2})`}
        />
      </svg>
      <div className="health-score__center">
        <span className="health-score__num">{score}</span>
        <span className="health-score__denom">/ {max}</span>
      </div>
    </div>
  )
}

function FinancialHealthBreakdown() {
  return (
    <motion.div variants={fadeUp}>
      <Card>
        <CardBody>
          <div className="health-grid">
            <div className="health-score-col">
              <div className="health-score__label">Financial Health Score</div>
              <HealthRing score={HEALTH.score} max={HEALTH.max} />
              <div className="health-aura-note">
                <Sparkle size={13} className="icon--brand" weight="fill" />
                {' '}{HEALTH.auraWeakest}
              </div>
            </div>
            <div className="health-pillars">
              {HEALTH.pillars.map(p => (
                <div key={p.id} className="health-pillar">
                  <div className="health-pillar__top">
                    <span className="health-pillar__label">{p.label}</span>
                    <span className={`health-pillar__score health-pillar__score--${p.variant}`}>{p.score}</span>
                  </div>
                  <ProgressBar pct={p.score} variant={p.variant} thin />
                </div>
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════════
   Page
═══════════════════════════════════════════════════════════ */
export default function Home() {
  return (
    <div className="page-content">
      <motion.div className="page-sections" variants={stagger} initial="hidden" animate="show">
        <GreetingHero />
        <FinancialSnapshot />
        <BankingStrip />
        <DailyBriefing />
        <QuickActionsSection />
        <FinancialHealthBreakdown />
      </motion.div>
    </div>
  )
}
