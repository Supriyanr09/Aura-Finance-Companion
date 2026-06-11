// ═══════════════════════════════════════════════════════════════
// mockData.js — Aura Finance
// No raw hex colors. Variant strings map to CSS design tokens.
// ═══════════════════════════════════════════════════════════════

export const USER = {
  name:     'Yathika',
  full:     'Yathika R.',
  city:     'Bengaluru',
  initials: 'YR',
}

// ── Section 1: Aura greeting + single insight ─────────────────
export const AURA_GREETING = {
  contextLine: "I checked your finances while you slept.",
  insight:     "You're saving 40% of your income this month — your personal best.",
}

// ── Section 2: Financial Snapshot — 4 life-outcome KPIs ───────
export const SNAPSHOT = {
  netWorth: {
    value:    1842500,
    trend:    '+12%',
    trendDir: 'up',
    auraNote: 'Up 12% since January.',
  },
  cashAvailable: {
    value:       280000,
    monthsCover: 3.4,
    auraNote:    'Enough for 3.4 months of expenses.',
  },
  savingsRate: {
    value:     40.5,
    prevMonth: 35.2,
    auraNote:  'Stronger than last month.',
    variant:   'success',
  },
  stabilityScore: {
    value:      76,
    max:        100,
    trend:      4,
    trendDir:   'up',
    bandLabel:  'Strong',
    helping:   ['Consistent SIPs', 'Low credit utilisation'],
    attention: ['Emergency fund below target'],
    nextAction: { label: 'Build Emergency Fund', variant: 'warning' },
  },
}

// ── Section 3: Banking cards strip ────────────────────────────
export const BANKING_CARDS = [
  {
    id:      'savings',
    type:    'Savings Account',
    label:   'HDFC Savings',
    number:  '••••  4821',
    balance:  124850,
    variant: 'info',
    icon:    'Bank',
  },
  {
    id:      'debit',
    type:    'Debit Card',
    label:   'HDFC Platinum',
    number:  '••••  6032',
    balance:  124850,
    variant: 'brand',
    icon:    'CreditCard',
  },
  {
    id:      'forex',
    type:    'Forex Card',
    label:   'Niyo Global',
    number:  '••••  9214',
    balance:  18500,
    variant: 'warning',
    icon:    'CurrencyDollar',   // Globe is not in @phosphor-icons/react — using CurrencyDollar for forex
  },
  {
    id:          'credit',
    type:        'Credit Card',
    label:       'HDFC Regalia',
    number:      '••••  7741',
    balance:      14200,
    variant:     'danger',
    icon:        'CreditCard',
    outstanding: true,
    dueDate:     'Jun 25',
    daysLeft:    14,
  },
]

// ── Section 4: Aura Daily Briefing — max 3 cards ──────────────
export const BRIEFING = [
  {
    id:      1,
    variant: 'warning',
    title:   'Weekend spending is climbing',
    message: "Friday nights have become your most expensive day. Last week was 34% above your weekday average.",
    cta:     'Show Details',
    icon:    'ForkKnife',
  },
  {
    id:      2,
    variant: 'success',
    title:   'Goa trip is fully funded',
    message: "You already have ₹42,000 set aside — that covers flights, stay, and spending money.",
    cta:     'Plan Budget',
    icon:    'PaperPlaneTilt',   // Airplane not in this version — using PaperPlaneTilt
  },
  {
    id:      3,
    variant: 'info',             // changed from 'brand' — briefing-card--brand had no CSS
    title:   '₹40,000 is sitting idle',
    message: "I found money in your savings that could be earning better returns in a liquid fund.",
    cta:     'Show Options',
    icon:    'TrendUp',
  },
]

// ── Section 5: Quick Actions — max 5 ──────────────────────────
export const QUICK_ACTIONS = [
  { id: 'budget',       label: 'Check Budget',       icon: 'ChartBar'   },
  { id: 'paycard',      label: 'Pay Credit Card',    icon: 'CreditCard' },
  { id: 'investments',  label: 'Review Investments', icon: 'TrendUp'    },
  { id: 'transactions', label: 'View Transactions',  icon: 'Receipt'    },
  { id: 'askaura',      label: 'Ask Aura',           icon: 'Sparkle'    },
]

// ── Section 6: Financial Health Breakdown ─────────────────────
export const HEALTH = {
  score:       72,
  max:         100,
  auraWeakest: "Building a larger emergency cushion would improve your score the fastest.",
  pillars: [
    { id: 'savings',       label: 'Savings Discipline',      score: 85, variant: 'success' },
    { id: 'investments',   label: 'Investment Consistency',  score: 78, variant: 'success' },
    { id: 'emergency',     label: 'Emergency Fund',          score: 42, variant: 'danger'  },
    { id: 'debt',          label: 'Debt Management',         score: 71, variant: 'warning' },
    { id: 'subscriptions', label: 'Subscription Efficiency', score: 63, variant: 'warning' },
  ],
}

// ── Helpers ────────────────────────────────────────────────────
export const FMT = (n) =>
  '₹' + Math.abs(n).toLocaleString('en-IN')

export const FMT_COMPACT = (n) => {
  if (n >= 10000000) return '₹' + (n / 10000000).toFixed(1) + 'Cr'
  if (n >= 100000)   return '₹' + (n / 100000).toFixed(1) + 'L'
  if (n >= 1000)     return '₹' + (n / 1000).toFixed(1) + 'K'
  return '₹' + n.toLocaleString('en-IN')
}
