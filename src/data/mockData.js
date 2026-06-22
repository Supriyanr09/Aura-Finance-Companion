// ═══════════════════════════════════════════════════════════════
// mockData.js — Aura Finance
// Single source of truth for all financial data.
// Every derived number (spend total, savings rate, net worth)
// is COMPUTED from raw data — never hardcoded separately.
//
// Credentials:  Yathika → YAT2024 / 1234   (Watchful — score 72)
//               Anand   → AND2024 / 5678   (Critical — score 31)
// ═══════════════════════════════════════════════════════════════

// ── Formatters (used everywhere) ──────────────────────────────
export const FMT = (n) =>
  '₹' + Math.abs(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export const FMT_COMPACT = (n) => {
  const abs = Math.abs(n)
  if (abs >= 10000000) return '₹' + (abs / 10000000).toFixed(1) + 'Cr'
  if (abs >= 100000)   return '₹' + (abs / 100000).toFixed(1) + 'L'
  if (abs >= 1000)     return '₹' + (abs / 1000).toFixed(1) + 'K'
  return '₹' + abs.toLocaleString('en-IN')
}

// Rough INR -> USD conversion for forex card display only. Not a
// live rate, not used anywhere else in the app. If this drifts from
// real market rates, update the constant — don't hardcode USD
// values directly on any account record.
export const INR_TO_USD_RATE = 83
export const FMT_USD = (inrAmount) =>
  '$' + Math.round(inrAmount / INR_TO_USD_RATE).toLocaleString('en-US')

// ── Derivation helpers ─────────────────────────────────────────
export function calcMonthlySpend(transactions) {
  return transactions
    .filter(t => t.dir === 'out' && t.month === 'Jun')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
}

export function calcCategorySpend(transactions, category) {
  return transactions
    .filter(t => t.dir === 'out' && t.category === category && t.month === 'Jun')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
}

export function calcSavingsRate(income, totalSpend) {
  return Math.round(((income - totalSpend) / income) * 1000) / 10
}

export function calcNetWorth(portfolio, accounts) {
  const investmentTotal = portfolio.breakdown.reduce((s, i) => s + i.value, 0)
  const liquidTotal = accounts
    .filter(a => a.type === 'Savings Account')
    .reduce((s, a) => s + a.balance, 0)
  return investmentTotal + liquidTotal
}

export function calcDisposable(user) {
  const c            = user.commitments
  const totalSpend   = calcMonthlySpend(user.transactions)
  return user.income - c.sip - c.rd - c.creditCardBills - c.emergencyTopUp - (c.loanEMI || 0) - totalSpend
}

export function calcSpendByCategory(transactions) {
  const result = {}
  transactions
    .filter(t => t.dir === 'out' && t.month === 'Jun')
    .forEach(t => {
      result[t.category] = (result[t.category] || 0) + Math.abs(t.amount)
    })
  return result
}

// ── Financial Network (Banking / Credit / Loans / Global) ─────────
// Per Aura_Financial_Network_Section.md. Replaces the old flat
// Accounts list with 4 category aggregates, each computed from
// the real accounts[]/loans[] arrays — never hardcoded. Each
// returns null when the category has no underlying accounts, so
// the UI can render an honest empty state instead of a fake zero.
function nearestDueDate(items, dueKey) {
  // Picks the earliest-looking due string for the summary line.
  // Dates are display strings ('Jun 25'), not real Date objects,
  // so this is a simple "first one found" rather than true sort —
  // acceptable since each persona has at most 2-3 items per category.
  const withDue = items.filter(i => i[dueKey])
  return withDue.length ? withDue[0] : null
}

export function calcFinancialNetwork(user) {
  const accounts = user.accounts || []
  const loans    = user.loans    || []

  // ── Banking ── Savings/Salary/Current accounts only (per doc,
  // debit cards are not shown as separate entries here — they're
  // just an access method, not a balance).
  const bankAccounts = accounts.filter(a => a.type === 'Savings Account')
  const banking = bankAccounts.length ? {
    total:    bankAccounts.reduce((s, a) => s + a.balance, 0),
    count:    bankAccounts.length,
    primary:  bankAccounts[0].label,
    accounts: bankAccounts,
  } : null

  // ── Credit ── all credit cards, outstanding balance + nearest due
  const creditCards = accounts.filter(a => a.type === 'Credit Card')
  const credit = creditCards.length ? {
    total:      creditCards.reduce((s, a) => s + a.balance, 0),
    count:      creditCards.length,
    nearestDue: nearestDueDate(creditCards, 'dueDate'),
    cards:      creditCards,
  } : null

  // ── Loans ── sum of EMIs, not outstanding principal (per doc's
  // own worked example, the headline number is "Monthly EMI")
  const loanSection = loans.length ? {
    totalEMI: loans.reduce((s, l) => s + l.emi, 0),
    count:    loans.length,
    nextDue:  nearestDueDate(loans, 'nextDue'),
    loans:    loans,
  } : null

  // ── Global ── forex cards, displayed in USD via FMT_USD.
  const forexCards = accounts.filter(a => a.type === 'Forex Card')
  const global = forexCards.length ? {
    total:    forexCards.reduce((s, a) => s + a.balance, 0),
    count:    forexCards.length,
    cards:    forexCards,
  } : null

  return { banking, credit, loans: loanSection, global }
}

// ── CreditIQ ─────────────────────────────────────────────────
// Aura's proprietary credit-health score. NOT the official CIBIL
// score — see USER.cibilScore for that (refresh-on-request, static
// between refreshes). CreditIQ is computed fresh from live mock
// data every render.
//
// Weights (per Aura-CreditIQ-KPI-Replacement.md):
//   Credit Utilisation   30%  — balance/limit across credit cards
//   Payment Reliability  25%  — no payment-history data exists in
//                                mock data; reuses Debt Management
//                                pillar score as the closest real
//                                proxy. Intentionally overlaps with
//                                Debt Burden below — flagged, not
//                                hidden.
//   Debt Burden          20%  — health.pillars 'debt' score
//   Financial Stability  15%  — health.pillars 'savings' +
//                                'investments', averaged
//   Savings Buffer        10%  — emergencyMonths, scaled to /100
//                                against a 6-month target
export function calcCreditUtilisation(accounts) {
  const cards = accounts.filter(a => a.type === 'Credit Card' && a.limit)
  if (cards.length === 0) return 100
  const totalBalance = cards.reduce((s, a) => s + a.balance, 0)
  const totalLimit   = cards.reduce((s, a) => s + a.limit, 0)
  const utilPct      = (totalBalance / totalLimit) * 100
  // Lower utilisation = better. 0% util -> 100 score, 100% util -> 0 score.
  return Math.max(0, Math.round(100 - utilPct))
}

export function calcSavingsBufferScore(emergencyMonths) {
  // 6 months is the standard target used elsewhere in this app
  // (see goals.emergency-fund). Scaled linearly, capped at 100.
  return Math.min(100, Math.round((emergencyMonths / 6) * 100))
}

export function calcCreditIQ(user) {
  const utilisationScore = calcCreditUtilisation(user.accounts)
  const debtScore        = user.health.pillars.find(p => p.id === 'debt')?.score ?? 50
  const reliabilityScore = debtScore // reused per product decision — see comment above
  const savingsScore     = user.health.pillars.find(p => p.id === 'savings')?.score ?? 50
  const investScore      = user.health.pillars.find(p => p.id === 'investments')?.score ?? 50
  const stabilityScore   = Math.round((savingsScore + investScore) / 2)
  const bufferScore      = calcSavingsBufferScore(user.emergencyMonths)

  const weighted =
    utilisationScore * 0.30 +
    reliabilityScore * 0.25 +
    debtScore        * 0.20 +
    stabilityScore   * 0.15 +
    bufferScore       * 0.10

  const score = Math.round(weighted)

  let band, bandLabel
  if (score >= 80)      { band = 'success'; bandLabel = 'Excellent' }
  else if (score >= 60)  { band = 'info';    bandLabel = 'Good'      }
  else if (score >= 40)  { band = 'warning'; bandLabel = 'Fair'      }
  else                    { band = 'danger';  bandLabel = 'Needs Work' }

  const drivers = {
    utilisation: utilisationScore,
    reliability: reliabilityScore,
    debt:        debtScore,
    stability:   stabilityScore,
    buffer:      bufferScore,
  }

  return {
    score,
    band,
    bandLabel,
    drivers,
    insight: calcCreditIQInsight(drivers, band),
  }
}

// Rule-based insight line — NOT a real month-over-month diff.
// There is no stored prior-month CreditIQ/driver data in mockData,
// so this can't honestly claim a trend. Per product decision, it
// uses the doc's exact "this month" phrasing anyway for visual
// consistency with Total Wealth / Savings Rate (which ARE real
// diffs against May data). Flagged here, not hidden: if real
// historical CreditIQ tracking is added later, this function is
// the one that needs to change from "pick worst/best current
// driver" to "diff against last month's actual values."
const CREDITIQ_MESSAGES = {
  improving: {
    utilisation: '↑ Lower credit utilisation this month',
    reliability: '↑ Payment reliability improved',
    debt:        '↑ Debt burden reduced',
    buffer:      '↑ Emergency buffer strengthened',
    stability:   '↑ Financial stability improved',
  },
  stable: {
    default: '✓ Credit profile remains healthy',
  },
  declining: {
    utilisation: '↓ Credit utilisation increased',
    reliability: '↓ Upcoming dues require attention',
    debt:        '↓ Higher debt obligations detected',
    buffer:      '↓ Reduced savings buffer',
    stability:   '↓ Financial stability needs attention',
  },
}

export function calcCreditIQInsight(drivers, band) {
  const entries = Object.entries(drivers)
  const weakest = entries.reduce((min, e) => e[1] < min[1] ? e : min, entries[0])
  const strongest = entries.reduce((max, e) => e[1] > max[1] ? e : max, entries[0])

  // Strong overall score -> lead with what's driving it.
  if (band === 'success' || band === 'info') {
    // Still flag a weak driver if one is dragging well below the rest.
    if (weakest[1] < 50) {
      return { text: CREDITIQ_MESSAGES.declining[weakest[0]] || CREDITIQ_MESSAGES.stable.default, direction: 'declining' }
    }
    return { text: CREDITIQ_MESSAGES.improving[strongest[0]] || CREDITIQ_MESSAGES.stable.default, direction: 'improving' }
  }

  // Weak overall score -> always lead with the worst driver.
  return { text: CREDITIQ_MESSAGES.declining[weakest[0]] || CREDITIQ_MESSAGES.stable.default, direction: 'declining' }
}

// ══════════════════════════════════════════════════════════════
// USER 1 — YATHIKA RAO
// Income: ₹3,00,000/month (Zepto, Senior Product Manager)
// ══════════════════════════════════════════════════════════════
export const USER_YATHIKA = {
  id:             'yathika',
  customerId:     'YAT2024',
  mpin:           '1234',
  name:           'Yathika',
  full:           'Yathika R.',
  city:           'Bengaluru',
  initials:       'YR',
  avatar:         '/User-Yathika.png',
  healthScore:    72,
  healthState:    'watchful',
  auraExpression: 'cautious',
  income:         300000,
  employer:       'Zepto',
  designation:    'Senior Product Manager',
  cibilScore:     768,
  emergencyMonths: 1.2,

  // ── Committed monthly outflows ─────────────────────────────
  commitments: {
    sip:             10000,  // Nifty 50 SIP — auto-debit 5th
    rd:               7000,  // Post Office RD — auto-debit 7th
    creditCardBills: 28400,  // HDFC Regalia outstanding due Jun 25
    emergencyTopUp:  20000,  // Recommended: build emergency cover to 3 months
    loanEMI:         42500,  // Home loan 31,000 + Car loan 11,500 — see loans[]
  },

  // ── Active loans ────────────────────────────────────────────
  // Per Aura_Financial_Network_Section.md — fabricated for the
  // Financial Network rebuild since neither persona had loan data
  // previously. Sized against Yathika's ₹3L income; loanEMI above
  // is the sum of these and is included in calcDisposable().
  loans: [
    { id: 'home-loan', type: 'Home Loan', label: 'HDFC Home Loan', emi: 31000, outstanding: 4200000, nextDue: 'Jul 10', rate: 8.5, tenureLeft: '14 years' },
    { id: 'car-loan',  type: 'Car Loan',  label: 'Axis Car Loan',  emi: 11500, outstanding: 380000,  nextDue: 'Jul 10', rate: 9.2, tenureLeft: '2 years'  },
  ],

  // ── Full transaction history ───────────────────────────────
  // month field: 'Jun' | 'May' | 'Apr' — for monthly aggregations
  // All amounts positive; dir determines sign for display
  transactions: [
    // ── JUNE INCOME ──
    { id: 'j01', merchant: 'Salary — Zepto',      category: 'Income',        date: '1 Jun 10:02 AM',  month: 'Jun', amount: 300000, dir: 'in',  icon: 'Briefcase'     },

    // ── JUNE FIXED EXPENSES (sum: ₹35,000) ──
    { id: 'j02', merchant: 'Rent — Koramangala',  category: 'Rent',          date: '1 Jun 9:00 AM',   month: 'Jun', amount:  35000, dir: 'out', icon: 'House'         },

    // ── JUNE FOOD & DINING (sum: ₹28,400) ──
    { id: 'j03', merchant: 'Swiggy',              category: 'Food',          date: '13 Jun 11:45 PM', month: 'Jun', amount:    820, dir: 'out', icon: 'ForkKnife'     },
    { id: 'j04', merchant: 'Zomato',              category: 'Food',          date: '12 Jun 8:30 PM',  month: 'Jun', amount:   1240, dir: 'out', icon: 'ForkKnife'     },
    { id: 'j05', merchant: 'Starbucks',           category: 'Food',          date: '11 Jun 9:15 AM',  month: 'Jun', amount:    640, dir: 'out', icon: 'Coffee'        },
    { id: 'j06', merchant: 'Swiggy',              category: 'Food',          date: '10 Jun 1:20 PM',  month: 'Jun', amount:    560, dir: 'out', icon: 'ForkKnife'     },
    { id: 'j07', merchant: 'Meghana Foods',       category: 'Food',          date: '9 Jun 2:00 PM',   month: 'Jun', amount:   1800, dir: 'out', icon: 'ForkKnife'     },
    { id: 'j08', merchant: 'Zomato',              category: 'Food',          date: '8 Jun 8:00 PM',   month: 'Jun', amount:    980, dir: 'out', icon: 'ForkKnife'     },
    { id: 'j09', merchant: 'Third Wave Coffee',   category: 'Food',          date: '7 Jun 8:45 AM',   month: 'Jun', amount:    560, dir: 'out', icon: 'Coffee'        },
    { id: 'j10', merchant: 'Swiggy',              category: 'Food',          date: '6 Jun 12:30 PM',  month: 'Jun', amount:    740, dir: 'out', icon: 'ForkKnife'     },
    { id: 'j11', merchant: 'Truffles',            category: 'Food',          date: '5 Jun 7:30 PM',   month: 'Jun', amount:   2200, dir: 'out', icon: 'ForkKnife'     },
    { id: 'j12', merchant: 'Swiggy',              category: 'Food',          date: '4 Jun 1:00 PM',   month: 'Jun', amount:    660, dir: 'out', icon: 'ForkKnife'     },
    { id: 'j13', merchant: 'Chai Point',          category: 'Food',          date: '3 Jun 9:00 AM',   month: 'Jun', amount:    200, dir: 'out', icon: 'Coffee'        },
    { id: 'j14', merchant: 'Zomato',              category: 'Food',          date: '2 Jun 7:45 PM',   month: 'Jun', amount:   1460, dir: 'out', icon: 'ForkKnife'     },
    { id: 'j15', merchant: 'Swiggy',              category: 'Food',          date: '1 Jun 12:00 PM',  month: 'Jun', amount:    540, dir: 'out', icon: 'ForkKnife'     },
    { id: 'j16', merchant: 'The Fatty Bao',       category: 'Food',          date: '8 Jun 8:30 PM',   month: 'Jun', amount:   3800, dir: 'out', icon: 'ForkKnife'     },
    { id: 'j17', merchant: 'Windmills Craftworks', category: 'Food',         date: '5 Jun 8:00 PM',   month: 'Jun', amount:   4200, dir: 'out', icon: 'ForkKnife'     },
    { id: 'j18', merchant: 'Indian Accent Pop-up', category: 'Food',         date: '3 Jun 8:00 PM',   month: 'Jun', amount:   5200, dir: 'out', icon: 'ForkKnife'     },
    { id: 'j19', merchant: 'Café Coffee Day',      category: 'Food',         date: '2 Jun 4:00 PM',   month: 'Jun', amount:    800, dir: 'out', icon: 'Coffee'        },
    { id: 'j20', merchant: 'Swiggy Instamart',     category: 'Food',         date: '10 Jun 6:00 PM',  month: 'Jun', amount:   2000, dir: 'out', icon: 'ForkKnife'     },

    // ── JUNE NIGHTLIFE (sum: ₹14,600) ──
    { id: 'j21', merchant: 'Toit Brewpub',        category: 'Nightlife',     date: '13 Jun 10:45 PM', month: 'Jun', amount:   3200, dir: 'out', icon: 'MartiniGlass'  },
    { id: 'j22', merchant: 'The Humming Tree',    category: 'Nightlife',     date: '13 Jun 11:30 PM', month: 'Jun', amount:   2100, dir: 'out', icon: 'MartiniGlass'  },
    { id: 'j23', merchant: 'Social — Koramangala',category: 'Nightlife',     date: '7 Jun 10:00 PM',  month: 'Jun', amount:   2800, dir: 'out', icon: 'MartiniGlass'  },
    { id: 'j24', merchant: 'Arbor Brewing Co.',   category: 'Nightlife',     date: '7 Jun 11:00 PM',  month: 'Jun', amount:   1900, dir: 'out', icon: 'MartiniGlass'  },
    { id: 'j25', merchant: 'Skyye Bar',           category: 'Nightlife',     date: '1 Jun 9:30 PM',   month: 'Jun', amount:   4600, dir: 'out', icon: 'MartiniGlass'  },

    // ── JUNE TRAVEL (sum: ₹18,400) ──
    { id: 'j26', merchant: 'IndiGo — BLR→GOA',   category: 'Travel',        date: '1 Jun 6:00 AM',   month: 'Jun', amount:   8400, dir: 'out', icon: 'Airplane'      },
    { id: 'j27', merchant: 'Uber',                category: 'Travel',        date: '13 Jun 9:30 AM',  month: 'Jun', amount:    380, dir: 'out', icon: 'Car'           },
    { id: 'j28', merchant: 'Rapido',              category: 'Travel',        date: '12 Jun 8:00 AM',  month: 'Jun', amount:    180, dir: 'out', icon: 'Car'           },
    { id: 'j29', merchant: 'Uber',                category: 'Travel',        date: '11 Jun 7:00 PM',  month: 'Jun', amount:    520, dir: 'out', icon: 'Car'           },
    { id: 'j30', merchant: 'Uber',                category: 'Travel',        date: '9 Jun 9:00 AM',   month: 'Jun', amount:    340, dir: 'out', icon: 'Car'           },
    { id: 'j31', merchant: 'Rapido',              category: 'Travel',        date: '8 Jun 8:30 AM',   month: 'Jun', amount:    160, dir: 'out', icon: 'Car'           },
    { id: 'j32', merchant: 'Uber',                category: 'Travel',        date: '6 Jun 10:00 PM',  month: 'Jun', amount:    620, dir: 'out', icon: 'Car'           },
    { id: 'j33', merchant: 'MakeMyTrip — Hotel',  category: 'Travel',        date: '2 Jun 11:00 AM',  month: 'Jun', amount:   7800, dir: 'out', icon: 'Airplane'      },

    // ── JUNE SHOPPING (sum: ₹9,200) ──
    { id: 'j34', merchant: 'Amazon',              category: 'Shopping',      date: '10 Jun 3:00 PM',  month: 'Jun', amount:   3200, dir: 'out', icon: 'ShoppingBag'   },
    { id: 'j35', merchant: 'Nykaa',               category: 'Shopping',      date: '8 Jun 12:00 PM',  month: 'Jun', amount:   2800, dir: 'out', icon: 'ShoppingBag'   },
    { id: 'j36', merchant: 'Myntra',              category: 'Shopping',      date: '4 Jun 6:00 PM',   month: 'Jun', amount:   3200, dir: 'out', icon: 'ShoppingBag'   },

    // ── JUNE SUBSCRIPTIONS (sum: ₹3,800) ──
    { id: 'j37', merchant: 'Netflix',             category: 'Subscriptions', date: '5 Jun 12:00 AM',  month: 'Jun', amount:    649, dir: 'out', icon: 'Television'    },
    { id: 'j38', merchant: 'Spotify',             category: 'Subscriptions', date: '5 Jun 12:00 AM',  month: 'Jun', amount:    119, dir: 'out', icon: 'MusicNote'     },
    { id: 'j39', merchant: 'Swiggy One',          category: 'Subscriptions', date: '5 Jun 12:00 AM',  month: 'Jun', amount:    349, dir: 'out', icon: 'Star'          },
    { id: 'j40', merchant: 'Amazon Prime',        category: 'Subscriptions', date: '5 Jun 12:00 AM',  month: 'Jun', amount:    299, dir: 'out', icon: 'Television'    },
    { id: 'j41', merchant: 'iCloud Storage',      category: 'Subscriptions', date: '5 Jun 12:00 AM',  month: 'Jun', amount:    219, dir: 'out', icon: 'Cloud'         },
    { id: 'j42', merchant: 'Zepto Pass',          category: 'Subscriptions', date: '5 Jun 12:00 AM',  month: 'Jun', amount:    149, dir: 'out', icon: 'Star'          },
    { id: 'j43', merchant: 'Hotstar',             category: 'Subscriptions', date: '5 Jun 12:00 AM',  month: 'Jun', amount:    499, dir: 'out', icon: 'Television'    },
    { id: 'j44', merchant: 'YouTube Premium',     category: 'Subscriptions', date: '5 Jun 12:00 AM',  month: 'Jun', amount:    189, dir: 'out', icon: 'YoutubeLogo'   },
    { id: 'j45', merchant: 'Notion',              category: 'Subscriptions', date: '5 Jun 12:00 AM',  month: 'Jun', amount:    329, dir: 'out', icon: 'Note'          },
    { id: 'j46', merchant: 'LinkedIn Premium',    category: 'Subscriptions', date: '5 Jun 12:00 AM',  month: 'Jun', amount:   1000, dir: 'out', icon: 'LinkedinLogo'  },

    // ── JUNE UTILITIES (sum: ₹5,000) ──
    { id: 'j47', merchant: 'BESCOM',              category: 'Utilities',     date: '3 Jun 10:00 AM',  month: 'Jun', amount:   2200, dir: 'out', icon: 'Lightning'     },
    { id: 'j48', merchant: 'Airtel Postpaid',     category: 'Utilities',     date: '3 Jun 10:00 AM',  month: 'Jun', amount:   1299, dir: 'out', icon: 'Phone'         },
    { id: 'j49', merchant: 'ACT Fibernet',        category: 'Utilities',     date: '3 Jun 10:00 AM',  month: 'Jun', amount:   1499, dir: 'out', icon: 'WifiHigh'      },

    // ── JUNE MISCELLANEOUS (sum: ₹4,000) ──
    { id: 'j50', merchant: 'PharmEasy',           category: 'Health',        date: '11 Jun 3:00 PM',  month: 'Jun', amount:    840, dir: 'out', icon: 'FirstAid'      },
    { id: 'j51', merchant: 'Cult.fit',            category: 'Health',        date: '1 Jun 12:00 AM',  month: 'Jun', amount:   2499, dir: 'out', icon: 'Barbell'       },
    { id: 'j52', merchant: 'Big Bazaar',          category: 'Groceries',     date: '9 Jun 5:00 PM',   month: 'Jun', amount:    661, dir: 'out', icon: 'ShoppingCart'  },

    // ── MAY TRANSACTIONS (for trend comparison) ──
    { id: 'm01', merchant: 'Salary — Zepto',      category: 'Income',        date: '1 May 10:02 AM',  month: 'May', amount: 300000, dir: 'in',  icon: 'Briefcase'     },
    { id: 'm02', merchant: 'Rent — Koramangala',  category: 'Rent',          date: '1 May 9:00 AM',   month: 'May', amount:  35000, dir: 'out', icon: 'House'         },
    { id: 'm03', merchant: 'Swiggy',              category: 'Food',          date: '28 May 8:00 PM',  month: 'May', amount:   1100, dir: 'out', icon: 'ForkKnife'     },
    { id: 'm04', merchant: 'Zomato',              category: 'Food',          date: '25 May 7:30 PM',  month: 'May', amount:   1800, dir: 'out', icon: 'ForkKnife'     },
    { id: 'm05', merchant: 'Toit Brewpub',        category: 'Nightlife',     date: '24 May 10:00 PM', month: 'May', amount:   2800, dir: 'out', icon: 'MartiniGlass'  },
    { id: 'm06', merchant: 'Amazon',              category: 'Shopping',      date: '20 May 2:00 PM',  month: 'May', amount:   4200, dir: 'out', icon: 'ShoppingBag'   },
    { id: 'm07', merchant: 'Netflix',             category: 'Subscriptions', date: '5 May 12:00 AM',  month: 'May', amount:    649, dir: 'out', icon: 'Television'    },
    { id: 'm08', merchant: 'Spotify',             category: 'Subscriptions', date: '5 May 12:00 AM',  month: 'May', amount:    119, dir: 'out', icon: 'MusicNote'     },
    { id: 'm09', merchant: 'BESCOM',              category: 'Utilities',     date: '3 May 10:00 AM',  month: 'May', amount:   1900, dir: 'out', icon: 'Lightning'     },
    { id: 'm10', merchant: 'Airtel Postpaid',     category: 'Utilities',     date: '3 May 10:00 AM',  month: 'May', amount:   1299, dir: 'out', icon: 'Phone'         },
    { id: 'm11', merchant: 'Swiggy',              category: 'Food',          date: '15 May 1:00 PM',  month: 'May', amount:    620, dir: 'out', icon: 'ForkKnife'     },
    { id: 'm12', merchant: 'Uber',                category: 'Travel',        date: '18 May 9:00 AM',  month: 'May', amount:    420, dir: 'out', icon: 'Car'           },
    { id: 'm13', merchant: 'Cult.fit',            category: 'Health',        date: '1 May 12:00 AM',  month: 'May', amount:   2499, dir: 'out', icon: 'Barbell'       },
    { id: 'm14', merchant: 'Zomato',              category: 'Food',          date: '10 May 7:00 PM',  month: 'May', amount:  22000, dir: 'out', icon: 'ForkKnife'     },
    { id: 'm15', merchant: 'Social',              category: 'Nightlife',     date: '17 May 9:00 PM',  month: 'May', amount:   8000, dir: 'out', icon: 'MartiniGlass'  },
    { id: 'm16', merchant: 'Myntra',              category: 'Shopping',      date: '12 May 3:00 PM',  month: 'May', amount:   4000, dir: 'out', icon: 'ShoppingBag'   },
    { id: 'm17', merchant: 'ACT Fibernet',        category: 'Utilities',     date: '3 May 10:00 AM',  month: 'May', amount:   1499, dir: 'out', icon: 'WifiHigh'      },
    { id: 'm18', merchant: 'Amazon Prime',        category: 'Subscriptions', date: '5 May 12:00 AM',  month: 'May', amount:    299, dir: 'out', icon: 'Television'    },
    { id: 'm19', merchant: 'LinkedIn Premium',    category: 'Subscriptions', date: '5 May 12:00 AM',  month: 'May', amount:   1000, dir: 'out', icon: 'LinkedinLogo'  },
    { id: 'm20', merchant: 'PharmEasy',           category: 'Health',        date: '22 May 2:00 PM',  month: 'May', amount:    300, dir: 'out', icon: 'FirstAid'      },
    { id: 'm21', merchant: 'Big Bazaar',          category: 'Groceries',     date: '8 May 4:00 PM',   month: 'May', amount:   1200, dir: 'out', icon: 'ShoppingCart'  },
    { id: 'm22', merchant: 'Swiggy One',          category: 'Subscriptions', date: '5 May 12:00 AM',  month: 'May', amount:    349, dir: 'out', icon: 'Star'          },
    { id: 'm23', merchant: 'iCloud Storage',      category: 'Subscriptions', date: '5 May 12:00 AM',  month: 'May', amount:    219, dir: 'out', icon: 'Cloud'         },
    { id: 'm24', merchant: 'Zepto Pass',          category: 'Subscriptions', date: '5 May 12:00 AM',  month: 'May', amount:    149, dir: 'out', icon: 'Star'          },
    { id: 'm25', merchant: 'Hotstar',             category: 'Subscriptions', date: '5 May 12:00 AM',  month: 'May', amount:    499, dir: 'out', icon: 'Television'    },
    { id: 'm26', merchant: 'YouTube Premium',     category: 'Subscriptions', date: '5 May 12:00 AM',  month: 'May', amount:    189, dir: 'out', icon: 'YoutubeLogo'   },
    { id: 'm27', merchant: 'Notion',              category: 'Subscriptions', date: '5 May 12:00 AM',  month: 'May', amount:    329, dir: 'out', icon: 'Note'          },
    { id: 'm28', merchant: 'Rapido',              category: 'Travel',        date: '20 May 8:00 AM',  month: 'May', amount:   2000, dir: 'out', icon: 'Car'           },
    { id: 'm29', merchant: 'Nykaa',               category: 'Shopping',      date: '14 May 1:00 PM',  month: 'May', amount:   3200, dir: 'out', icon: 'ShoppingBag'   },
    { id: 'm30', merchant: 'Starbucks',           category: 'Food',          date: '7 May 9:00 AM',   month: 'May', amount:   5400, dir: 'out', icon: 'Coffee'        },
    { id: 'm31', merchant: 'Third Wave Coffee',   category: 'Food',          date: '21 May 9:00 AM',  month: 'May', amount:   2400, dir: 'out', icon: 'Coffee'        },
    { id: 'm32', merchant: 'Zepto',               category: 'Groceries',     date: '16 May 7:00 PM',  month: 'May', amount:   3561, dir: 'out', icon: 'ShoppingCart'  },

    // ── APRIL TRANSACTIONS (abbreviated for sparklines) ──
    { id: 'a01', merchant: 'Salary — Zepto',      category: 'Income',        date: '14 Apr 10:02 AM', month: 'Apr', amount: 300000, dir: 'in',  icon: 'Briefcase'     },
    { id: 'a02', merchant: 'Rent — Koramangala',  category: 'Rent',          date: '1 Apr 9:00 AM',   month: 'Apr', amount:  35000, dir: 'out', icon: 'House'         },
    { id: 'a03', merchant: 'Various',             category: 'Food',          date: '30 Apr',          month: 'Apr', amount:  24000, dir: 'out', icon: 'ForkKnife'     },
    { id: 'a04', merchant: 'Various',             category: 'Nightlife',     date: '30 Apr',          month: 'Apr', amount:   9000, dir: 'out', icon: 'MartiniGlass'  },
    { id: 'a05', merchant: 'Various',             category: 'Shopping',      date: '30 Apr',          month: 'Apr', amount:  12000, dir: 'out', icon: 'ShoppingBag'   },
    { id: 'a06', merchant: 'Various',             category: 'Subscriptions', date: '5 Apr',           month: 'Apr', amount:   3801, dir: 'out', icon: 'Star'          },
    { id: 'a07', merchant: 'Various',             category: 'Utilities',     date: '3 Apr',           month: 'Apr', amount:   5000, dir: 'out', icon: 'Lightning'     },
    { id: 'a08', merchant: 'Various',             category: 'Travel',        date: '30 Apr',          month: 'Apr', amount:   4000, dir: 'out', icon: 'Airplane'      },
    { id: 'a09', merchant: 'Various',             category: 'Health',        date: '30 Apr',          month: 'Apr', amount:   3500, dir: 'out', icon: 'FirstAid'      },
  ],

  // ── Bank accounts ──────────────────────────────────────────
  // Per Aura_Financial_Network_Section.md — expanded with a 2nd
  // bank account and 2 more credit cards so the Financial Network
  // section has real multi-account content to aggregate. New cards
  // sized to be healthy/low-utilisation (she's "Watchful," not in
  // credit crisis) per explicit product decision.
  accounts: [
    { id: 'hdfc-savings', type: 'Savings Account', label: 'HDFC Bank',       number: '••4821', balance: 240000, variant: 'info',    icon: 'Bank',          interestRate: 3.0  },
    { id: 'axis-savings', type: 'Savings Account', label: 'Axis Bank',       number: '••1187', balance: 45000,  variant: 'info',    icon: 'Bank',          interestRate: 3.5  },
    { id: 'hdfc-credit',  type: 'Credit Card',     label: 'HDFC Regalia',    number: '••7741', balance: 28400,  variant: 'danger',  icon: 'CreditCard',    dueDate: 'Jun 25', outstanding: true, limit: 500000, minDue: 2840 },
    { id: 'icici-credit', type: 'Credit Card',     label: 'ICICI Amazon Pay',number: '••3352', balance: 4200,   variant: 'info',    icon: 'CreditCard',    dueDate: 'Jul 2',  outstanding: true, limit: 80000,  minDue: 420  },
    { id: 'axis-atlas',   type: 'Credit Card',     label: 'Axis Atlas',      number: '••5590', balance: 12000,  variant: 'info',    icon: 'CreditCard',    dueDate: 'Jul 8',  outstanding: true, limit: 300000, minDue: 1200 },
    { id: 'niyo-forex',   type: 'Forex Card',      label: 'Niyo Global',     number: '••9214', balance: 18500,  variant: 'warning', icon: 'CurrencyDollar' },
    { id: 'hdfc-debit',   type: 'Debit Card',      label: 'HDFC Platinum',   number: '••6032', balance: 240000, variant: 'brand',   icon: 'CreditCard'     },
  ],

  // ── Investment portfolio ───────────────────────────────────
  // Total: 18,42,500
  // + Savings: 2,40,000
  // Net worth: 20,82,500
  portfolio: {
    todayGain: 14000,
    todayDir:  'up',
    breakdown: [
      {
        id: 'mf', label: 'Mutual Funds', value: 720000, pct: 39,
        variant: 'brand', trend: '+1.6%', trendDir: 'up',
        detail: 'PPFAS ₹3.6L · Nifty 50 ₹2.4L · Nasdaq ₹1.2L',
        holdings: [
          { name: 'PPFAS Flexi Cap',    value: 360000, units: 842,  nav: 427.56, returns: '+18.2%', type: 'Equity' },
          { name: 'Nifty 50 Index',     value: 240000, units: 1240, nav: 193.55, returns: '+14.1%', type: 'Equity' },
          { name: 'Nasdaq Fund of Fund',value: 120000, units: 620,  nav: 193.55, returns: '+22.4%', type: 'Equity' },
        ],
        sipAmount: 10000,
        sipDate:   5,
      },
      {
        id: 'stocks', label: 'Direct Stocks', value: 684000, pct: 37,
        variant: 'info', trend: '+2.1%', trendDir: 'up',
        detail: 'Zomato ₹2.8L · Infosys ₹2.1L · HDFC ₹1.9L',
        holdings: [
          { name: 'Zomato',   ticker: 'ZOMATO', qty: 1228, avgCost: 182, cmp: 228,   value: 280000, returns: '+25.2%' },
          { name: 'Infosys',  ticker: 'INFY',   qty: 128,  avgCost: 1480, cmp: 1641, value: 210000, returns: '+10.9%' },
          { name: 'HDFC Bank',ticker: 'HDFCBANK',qty: 110, avgCost: 1580, cmp: 1724, value: 194000, returns: '+9.1%'  },
        ],
      },
      {
        id: 'fd', label: 'Fixed Deposits', value: 250000, pct: 14,
        variant: 'warning', trend: '7.1% p.a.', trendDir: 'up',
        detail: "HDFC FD ₹1.5L · SBI FD ₹1L · matures Sep '25",
        holdings: [
          { name: 'HDFC Bank FD', value: 150000, rate: 7.1, maturity: 'Sep 2025', tenure: '1 year'  },
          { name: 'SBI FD',       value: 100000, rate: 7.0, maturity: 'Dec 2025', tenure: '18 months' },
        ],
      },
      {
        id: 'rd', label: 'Recurring Deposit', value: 84000, pct: 5,
        variant: 'success', trend: '6.5% p.a.', trendDir: 'up',
        detail: '₹7,000/mo · Post Office RD · 12 months left',
        holdings: [
          { name: 'Post Office RD', value: 84000, monthlyAmount: 7000, rate: 6.5, maturity: 'Jun 2026', monthsLeft: 12 },
        ],
      },
      {
        id: 'other', label: 'Others', value: 104500, pct: 6,
        variant: 'brand', trend: '+0.8%', trendDir: 'up',
        detail: 'Gold ETF ₹47K · Crypto ₹57K',
        holdings: [
          { name: 'Gold ETF',  value: 47000, returns: '+8.2%'  },
          { name: 'Bitcoin',   value: 38000, returns: '+12.4%' },
          { name: 'Ethereum',  value: 19500, returns: '-3.1%'  },
        ],
      },
    ],
  },

  // ── Financial health ───────────────────────────────────────
  health: {
    score:     72,
    max:       100,
    band:      'warning',
    bandLabel: 'Watchful',
    auraNote:  'Lifestyle spend and a thin emergency fund are dragging your score. Fixing emergency cover alone would move you to 81.',
    pillars: [
      { id: 'savings',     label: 'Savings Discipline',     score: 85, variant: 'success' },
      { id: 'investments', label: 'Investment Consistency', score: 78, variant: 'success' },
      { id: 'emergency',   label: 'Emergency Cover',        score: 28, variant: 'danger'  },
      { id: 'debt',        label: 'Debt Management',        score: 71, variant: 'warning' },
      { id: 'lifestyle',   label: 'Lifestyle Spend',        score: 52, variant: 'warning' },
    ],
  },

  // ── Goals ──────────────────────────────────────────────────
  goals: [
    {
      id: 'goa-trip',
      label:    'Goa Trip',
      icon:     'Airplane',
      target:   45000,
      saved:    22000,
      deadline: 'Aug 2025',
      monthlyRequired: 7667,
      variant:  'info',
      auraNote: 'On track. Save ₹7,667/month and you hit this in August.',
    },
    {
      id: 'emergency-fund',
      label:    'Emergency Fund',
      icon:     'ShieldCheck',
      target:   1800000,
      saved:    240000,
      deadline: 'Dec 2026',
      monthlyRequired: 20000,
      variant:  'danger',
      auraNote: 'Critical gap. At ₹20K/month, you reach 6 months cover by Dec 2026.',
    },
    {
      id: 'macbook',
      label:    'MacBook Pro',
      icon:     'Laptop',
      target:   200000,
      saved:    80000,
      deadline: 'Oct 2025',
      monthlyRequired: 24000,
      variant:  'warning',
      auraNote: 'Tight. You need ₹24K/month to buy in October. Consider extending to Dec.',
    },
    {
      id: 'home-down',
      label:    'Home Down Payment',
      icon:     'House',
      target:   3000000,
      saved:    600000,
      deadline: 'Dec 2027',
      monthlyRequired: 62500,
      variant:  'brand',
      auraNote: 'Long runway. Keep SIP going — at 12% CAGR your MFs alone could cover 40% of this.',
    },
  ],

  // ── Budget limits ──────────────────────────────────────────
  budgets: [
    { category: 'Food',          limit: 20000, spent: 28400, variant: 'danger'  },
    { category: 'Nightlife',     limit: 10000, spent: 14600, variant: 'danger'  },
    { category: 'Travel',        limit: 15000, spent: 18400, variant: 'danger'  },
    { category: 'Shopping',      limit: 8000,  spent: 9200,  variant: 'warning' },
    { category: 'Subscriptions', limit: 4000,  spent: 3801,  variant: 'success' },
    { category: 'Utilities',     limit: 6000,  spent: 5000,  variant: 'success' },
    { category: 'Health',        limit: 5000,  spent: 3339,  variant: 'success' },
    { category: 'Rent',          limit: 35000, spent: 35000, variant: 'warning' },
  ],

  // ── Aura greeting (computed contextLine is dynamic) ───────
  auraGreeting: {
    nudge:       "Your last 3 Friday nights averaged ₹4,800 — Toit and Social are the culprits. Set a ₹3,000 soft cap this weekend and you'd save ₹7,200 this month.",
    nudgeVariant:'warning',
  },

  // ── Aura would do ─────────────────────────────────────────
  // amount added per step — the rupee figure each step actually
  // allocates, pulled from the existing body copy (₹20,000 /
  // ₹10,000 / ₹20,000) rather than invented. Used to render a
  // running-balance trail across the undeployed ₹50,000 in the
  // alternate UI layouts — never re-derive this from parsing body
  // text, it's the source of truth for the math now.
  // NOTE: undeployed corrected 40000→50000 to match the sum of
  // step amounts (20k+10k+20k); the original 40000 didn't
  // reconcile with either the step amounts or step 2's own body
  // text ("~₹11,600 remains"). Step 2's body text still has that
  // unreconciled math — left as-is per explicit product decision,
  // not fixed silently.
  auraWouldDo: {
    undeployed: 50000,
    // jargonTerm/jargonDef power the info-icon tooltip on each step
    // card — explains the one financial term in that step's body
    // most likely to need defining. Plain-language only, no jargon
    // inside the definition itself.
    steps: [
      { step: 1, of: 3, icon: 'ShieldCheck', title: 'Patch your emergency gap first',  body: 'You have 1.2 months of cover. You need 6. Park ₹20,000 into a liquid fund — it earns ~6.5% and you can pull it in 24 hours. Non-negotiable.', variant: 'danger',  amount: 20000, jargonTerm: 'Liquid fund', jargonDef: 'A type of mutual fund that invests in very short-term, low-risk instruments. You can withdraw your money within 24 hours, making it a safer parking spot than a savings account but still earning a bit more interest.' },
      { step: 2, of: 3, icon: 'TrendUp',     title: 'Step up your SIP by ₹10K',        body: 'After the liquid fund, ~₹11,600 remains. Add ₹10,000/month to Nifty 50. Compounded over 10 years at 12% CAGR adds ₹20.6L.',                  variant: 'info',    amount: 10000, jargonTerm: 'CAGR', jargonDef: 'Compound Annual Growth Rate — the average yearly return an investment would need to grow from its starting value to its ending value, assuming profits are reinvested each year rather than withdrawn.' },
      { step: 3, of: 3, icon: 'Bank',        title: 'Lock ₹20K in a short FD',         body: 'SBI is offering 7.4% on 1-year FDs right now. ₹20K locked earns ₹1,480 risk-free. Do this after the SIP step.',                              variant: 'warning', amount: 20000, jargonTerm: 'FD', jargonDef: 'Fixed Deposit — you lock a sum of money with a bank for a set period at a fixed interest rate. You earn more than a regular savings account, but can\'t access the money early without a penalty.' },
    ],
  },

  // ── Markets (same for both users) ─────────────────────────
  // base = the live numeric price/index value the ticker math
  // runs against. value/change/dir below are just the INITIAL
  // render before the ticker hook (useMarketTicker) takes over and
  // starts nudging base on an interval — see that hook for the
  // actual fluctuation logic. prefix/decimals control display
  // formatting per instrument type (indices: no ₹, whole numbers;
  // stocks: ₹-prefixed, often whole rupees but Zomato-style small-
  // cap prices could go to paise — kept at 0 decimals here since
  // none of the seed prices need finer precision to look real).
  markets: [
    { id: 'nifty',    label: 'Nifty 50', base: 24531, prefix: '',  decimals: 0, value: '24,531', change: '+0.82%', dir: 'up'   },
    { id: 'sensex',   label: 'Sensex',   base: 80822, prefix: '',  decimals: 0, value: '80,822', change: '+0.64%', dir: 'up'   },
    { id: 'zomato',   label: 'Zomato',   base: 228,   prefix: '₹', decimals: 0, value: '₹228',   change: '+2.1%',  dir: 'up'   },
    { id: 'infy',     label: 'INFY',     base: 1641,  prefix: '₹', decimals: 0, value: '₹1,641', change: '-0.5%',  dir: 'down' },
    { id: 'reliance', label: 'Reliance', base: 2941,  prefix: '₹', decimals: 0, value: '₹2,941', change: '+1.2%',  dir: 'up'   },
    { id: 'hdfc',     label: 'HDFC',     base: 1724,  prefix: '₹', decimals: 0, value: '₹1,724', change: '+1.1%',  dir: 'up'   },
  ],

  // ── FraudShield alerts ────────────────────────────────────
  fraudAlerts: [
    {
      id:       'fa1',
      type:     'suspicious',
      title:    'Unusual UPI transfer',
      body:     'A ₹15,000 UPI transfer at 2:04 AM to an unknown account. Outside your normal pattern.',
      amount:   15000,
      date:     '13 Jun 2:04 AM',
      resolved: false,
    },
    {
      id:       'fa2',
      type:     'info',
      title:    'New device login',
      body:     'Your account was accessed from a new device in Hyderabad on 10 Jun.',
      amount:   null,
      date:     '10 Jun 11:22 AM',
      resolved: true,
    },
  ],
}

// ══════════════════════════════════════════════════════════════
// USER 2 — ANAND B.
// Income: ₹1,50,000/month (TCS, Software Engineer)
// Negative scenario: 92% spend ratio, no savings, 2 overdue CCs
// ══════════════════════════════════════════════════════════════
export const USER_ANAND = {
  id:             'anand',
  customerId:     'AND2024',
  mpin:           '5678',
  name:           'Anand',
  full:           'Anand B.',
  city:           'Mumbai',
  initials:       'AB',
  avatar:         '/User-Anand.png',
  healthScore:    31,
  healthState:    'critical',
  auraExpression: 'alert',
  income:         150000,
  employer:       'TCS',
  designation:    'Software Engineer',
  cibilScore:     642,
  emergencyMonths: 0.3,

  commitments: {
    sip:             0,
    rd:              0,
    creditCardBills: 6080,  // Axis min ₹4,370 + HDFC min ₹1,710
    emergencyTopUp:  0,
    loanEMI:         4200,  // Car loan only — see loans[]. Kept small
                             // since he's already at 92% spend ratio;
                             // a home loan would be unrealistic for
                             // this persona's crisis-level finances.
  },

  // ── Active loans ────────────────────────────────────────────
  // Single small car loan only — see commitments.loanEMI comment.
  loans: [
    { id: 'car-loan', type: 'Car Loan', label: 'HDFC Car Loan', emi: 4200, outstanding: 95000, nextDue: 'Jul 5', rate: 10.5, tenureLeft: '8 months' },
  ],

  transactions: [
    { id: 'aj01', merchant: 'Salary — TCS',       category: 'Income',        date: '30 May 11:45 PM', month: 'Jun', amount: 150000, dir: 'in',  icon: 'Briefcase'   },
    { id: 'aj02', merchant: 'Rent — Powai',        category: 'Rent',          date: '1 Jun 9:00 AM',   month: 'Jun', amount:  28000, dir: 'out', icon: 'House'       },
    { id: 'aj03', merchant: 'Axis Magnus Bill',    category: 'Credit Card',   date: '13 Jun 8:00 AM',  month: 'Jun', amount:  87400, dir: 'out', icon: 'CreditCard'  },
    { id: 'aj04', merchant: 'Zomato',              category: 'Food',          date: '13 Jun 9:30 PM',  month: 'Jun', amount:   1240, dir: 'out', icon: 'ForkKnife'   },
    { id: 'aj05', merchant: 'Swiggy',              category: 'Food',          date: '12 Jun 1:00 PM',  month: 'Jun', amount:    680, dir: 'out', icon: 'ForkKnife'   },
    { id: 'aj06', merchant: 'Netflix',             category: 'Subscriptions', date: '5 Jun 12:00 AM',  month: 'Jun', amount:    649, dir: 'out', icon: 'Television'  },
    { id: 'aj07', merchant: 'Amazon',              category: 'Shopping',      date: '10 Jun 4:00 PM',  month: 'Jun', amount:   4299, dir: 'out', icon: 'ShoppingBag' },
    { id: 'aj08', merchant: 'Uber',                category: 'Travel',        date: '11 Jun 9:00 AM',  month: 'Jun', amount:    380, dir: 'out', icon: 'Car'         },
    { id: 'aj09', merchant: 'Tata Power',          category: 'Utilities',     date: '3 Jun 10:00 AM',  month: 'Jun', amount:   1800, dir: 'out', icon: 'Lightning'   },
    { id: 'aj10', merchant: 'Jio Postpaid',        category: 'Utilities',     date: '3 Jun 10:00 AM',  month: 'Jun', amount:    799, dir: 'out', icon: 'Phone'       },
    { id: 'aj11', merchant: 'Zomato',              category: 'Food',          date: '8 Jun 8:00 PM',   month: 'Jun', amount:    980, dir: 'out', icon: 'ForkKnife'   },
    { id: 'aj12', merchant: 'D-Mart',              category: 'Groceries',     date: '7 Jun 5:00 PM',   month: 'Jun', amount:   2800, dir: 'out', icon: 'ShoppingCart'},
    { id: 'aj13', merchant: 'Swiggy',              category: 'Food',          date: '4 Jun 1:00 PM',   month: 'Jun', amount:    540, dir: 'out', icon: 'ForkKnife'   },
    { id: 'aj14', merchant: 'Myntra',              category: 'Shopping',      date: '6 Jun 3:00 PM',   month: 'Jun', amount:   3200, dir: 'out', icon: 'ShoppingBag' },
    { id: 'aj15', merchant: 'McDonald\'s',         category: 'Food',          date: '2 Jun 7:00 PM',   month: 'Jun', amount:    480, dir: 'out', icon: 'ForkKnife'   },
    { id: 'aj16', merchant: 'Rapido',              category: 'Travel',        date: '9 Jun 8:00 AM',   month: 'Jun', amount:    180, dir: 'out', icon: 'Car'         },
    { id: 'aj17', merchant: 'Zepto',               category: 'Groceries',     date: '5 Jun 7:00 PM',   month: 'Jun', amount:    940, dir: 'out', icon: 'ShoppingCart'},
    { id: 'aj18', merchant: 'Bar Stock Exchange',  category: 'Nightlife',     date: '7 Jun 10:00 PM',  month: 'Jun', amount:   2800, dir: 'out', icon: 'MartiniGlass'},
    { id: 'aj19', merchant: 'Spotify',             category: 'Subscriptions', date: '5 Jun 12:00 AM',  month: 'Jun', amount:    119, dir: 'out', icon: 'MusicNote'   },
    { id: 'aj20', merchant: 'Amazon Prime',        category: 'Subscriptions', date: '5 Jun 12:00 AM',  month: 'Jun', amount:    299, dir: 'out', icon: 'Television'  },
  ],

  accounts: [
    { id: 'sbi-savings', type: 'Savings Account', label: 'SBI Bank',      number: '••3310', balance: 12000,  variant: 'danger',  icon: 'Bank',       interestRate: 2.7 },
    { id: 'axis-credit', type: 'Credit Card',     label: 'Axis Magnus',   number: '••4421', balance: 87400,  variant: 'danger',  icon: 'CreditCard', dueDate: 'Jun 18', outstanding: true, limit: 200000, minDue: 4370  },
    { id: 'hdfc-credit', type: 'Credit Card',     label: 'HDFC Millenia', number: '••9910', balance: 34200,  variant: 'warning', icon: 'CreditCard', dueDate: 'Jun 22', outstanding: true, limit: 100000, minDue: 1710  },
  ],

  portfolio: {
    todayGain: -3200,
    todayDir:  'down',
    breakdown: [
      { id: 'fd',     label: 'Fixed Deposits', value: 150000, pct: 53, variant: 'warning', trend: '6.8% p.a.', trendDir: 'up',   detail: "HDFC FD ₹1.5L · matures Dec '25",
        holdings: [{ name: 'HDFC Bank FD', value: 150000, rate: 6.8, maturity: 'Dec 2025', tenure: '1 year' }] },
      { id: 'stocks', label: 'Direct Stocks',  value: 92000,  pct: 32, variant: 'danger',  trend: '-3.4%',     trendDir: 'down', detail: 'Paytm ₹45K · Adani ₹47K',
        holdings: [
          { name: 'Paytm',    ticker: 'PAYTM',   qty: 109,  avgCost: 550, cmp: 412,  value: 45000,  returns: '-25.1%' },
          { name: 'Adani Ent',ticker: 'ADANIENT', qty: 16,   avgCost: 3200, cmp: 2841, value: 47000, returns: '-11.2%' },
        ] },
      { id: 'other',  label: 'Others',         value: 42000,  pct: 15, variant: 'info',    trend: '7.1% p.a.', trendDir: 'up',   detail: 'PPF ₹42K',
        holdings: [{ name: 'PPF Account', value: 42000, rate: 7.1, maturity: 'Mar 2031', tenure: '15 years' }] },
    ],
  },

  health: {
    score:     31,
    max:       100,
    band:      'danger',
    bandLabel: 'Critical',
    auraNote:  'You are spending 92% of income with zero emergency cover and two overdue credit cards. The fastest fix: pay the Axis minimum today, freeze discretionary spend this week.',
    pillars: [
      { id: 'savings',     label: 'Savings Discipline',     score: 12, variant: 'danger'  },
      { id: 'emergency',   label: 'Emergency Cover',        score: 4,  variant: 'danger'  },
      { id: 'debt',        label: 'Debt Management',        score: 22, variant: 'danger'  },
      { id: 'investments', label: 'Investment Consistency', score: 48, variant: 'warning' },
      { id: 'lifestyle',   label: 'Lifestyle Spend',        score: 8,  variant: 'danger'  },
    ],
  },

  goals: [
    {
      id: 'emergency-fund',
      label:    'Emergency Fund',
      icon:     'ShieldCheck',
      target:   450000,
      saved:    12000,
      deadline: 'Dec 2026',
      monthlyRequired: 18000,
      variant:  'danger',
      auraNote: 'This is your most critical goal right now. Start with ₹5K/month once CC is cleared.',
    },
    {
      id: 'cc-payoff',
      label:    'Clear Credit Card Debt',
      icon:     'CreditCard',
      target:   121600,
      saved:    0,
      deadline: 'Dec 2025',
      monthlyRequired: 20267,
      variant:  'danger',
      auraNote: 'Pay Axis first (higher rate). After clearing, redirect to emergency fund.',
    },
  ],

  budgets: [
    { category: 'Rent',          limit: 28000,  spent: 28000,  variant: 'warning' },
    { category: 'Food',          limit: 8000,   spent: 4160,   variant: 'success' },
    { category: 'Nightlife',     limit: 0,      spent: 2800,   variant: 'danger'  },
    { category: 'Shopping',      limit: 2000,   spent: 7499,   variant: 'danger'  },
    { category: 'Subscriptions', limit: 1000,   spent: 1067,   variant: 'warning' },
    { category: 'Utilities',     limit: 3000,   spent: 2599,   variant: 'success' },
    { category: 'Travel',        limit: 1500,   spent: 560,    variant: 'success' },
    { category: 'Groceries',     limit: 4000,   spent: 3740,   variant: 'success' },
  ],

  auraGreeting: {
    nudge:       'You spent ₹1,38,000 last month on ₹1,50,000 income — 92% of what you earn. One unplanned expense right now would leave you in debt. This needs fixing this week, Anand.',
    nudgeVariant:'danger',
  },

  // amount only set where the step genuinely allocates a slice of
  // the undeployed total. Step 1 pays the Axis minimum from the
  // ₹12K — a real allocation. Steps 2 and 3 (freeze spend, start a
  // future SIP) aren't deployments of THIS month's ₹12K, so they
  // intentionally have no amount — the running-balance UI must
  // handle that (stop the trail, don't show a fake ₹0).
  auraWouldDo: {
    undeployed: 12000,
    steps: [
      { step: 1, of: 3, icon: 'CreditCard', title: 'Clear the Axis minimum today',   body: 'Axis Magnus minimum due is ₹4,370 by Jun 18. Missing it adds a 3.5% penalty and hurts your CIBIL score. Pay this first from your ₹12K.',                   variant: 'danger',  amount: 4370, jargonTerm: 'CIBIL score', jargonDef: 'A three-digit number (300–900) that represents your creditworthiness in India. Lenders check it before approving loans or cards — missed payments and high credit card balances pull it down.' },
      { step: 2, of: 3, icon: 'Warning',    title: 'Freeze all discretionary spend', body: "No dining out, no subscriptions, no UPI impulse buys until you've saved ₹30,000. Every rupee counts this month.",                                           variant: 'warning' },
      { step: 3, of: 3, icon: 'TrendUp',    title: 'Start a ₹5,000 SIP next month',  body: 'Once the Axis card is cleared, redirect ₹5,000/month into a Nifty 50 index fund. The lowest-effort way to start building something real.',                  variant: 'info',    jargonTerm: 'SIP', jargonDef: 'Systematic Investment Plan — a fixed amount auto-invested into a mutual fund every month, rather than investing one lump sum. Spreads your buying price out over time instead of betting on a single entry point.' },
    ],
  },

  markets: [
    { id: 'nifty',  label: 'Nifty 50',  base: 24531, prefix: '',  decimals: 0, value: '24,531', change: '+0.82%', dir: 'up'   },
    { id: 'sensex', label: 'Sensex',    base: 80822, prefix: '',  decimals: 0, value: '80,822', change: '+0.64%', dir: 'up'   },
    { id: 'paytm',  label: 'Paytm',     base: 412,   prefix: '₹', decimals: 0, value: '₹412',   change: '-1.8%',  dir: 'down' },
    { id: 'adani',  label: 'Adani Ent', base: 2841,  prefix: '₹', decimals: 0, value: '₹2,841', change: '-2.3%',  dir: 'down' },
    { id: 'sbi',    label: 'SBI',       base: 812,   prefix: '₹', decimals: 0, value: '₹812',   change: '+0.4%',  dir: 'up'   },
  ],

  fraudAlerts: [
    {
      id:       'fa1',
      type:     'suspicious',
      title:    'High credit utilisation',
      body:     'Your Axis Magnus is at 87% utilisation. This is hurting your CIBIL score every month.',
      amount:   null,
      date:     '13 Jun',
      resolved: false,
    },
  ],
}

// ── Lookup ─────────────────────────────────────────────────────
export const USERS = {
  YAT2024: USER_YATHIKA,
  AND2024: USER_ANAND,
}

// ── Snapshot derivations (used by Home, SpendPulse, etc.) ─────
export function getSnapshot(user) {
  const junSpend   = calcMonthlySpend(user.transactions)
  const maySpend   = user.transactions
    .filter(t => t.dir === 'out' && t.month === 'May')
    .reduce((s, t) => s + t.amount, 0)
  const portfolioTotal = user.portfolio.breakdown.reduce((s, i) => s + i.value, 0)
  const savingsBalance = user.accounts
    .filter(a => a.type === 'Savings Account')
    .reduce((s, a) => s + a.balance, 0)

  return {
    netWorth:     { value: portfolioTotal + savingsBalance, trend: '+12%', trendDir: 'up' },
    savingsRate:  {
      value:     calcSavingsRate(user.income, junSpend),
      prevMonth: calcSavingsRate(user.income, maySpend),
    },
    monthlySpend: {
      value:      junSpend,
      prevMonth:  maySpend,
      pctIncome:  Math.round((junSpend / user.income) * 100),
    },
    spendByCategory: calcSpendByCategory(user.transactions),
  }
}

// ── Legacy shims ───────────────────────────────────────────────
export const USER          = USER_YATHIKA
export const SNAPSHOT      = getSnapshot(USER_YATHIKA)
export const BANKING_CARDS = USER_YATHIKA.accounts
export const HEALTH        = USER_YATHIKA.health
export const AURA_GREETING = USER_YATHIKA.auraGreeting
export const BRIEFING      = []
export const QUICK_ACTIONS = []
