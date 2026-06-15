// ═══════════════════════════════════════════════════════════════
// AskAura.jsx — Global floating AI companion
// Draggable, snaps to edge, resets to bottom-right on refresh.
// Mounts once in App.jsx, persists across all screens.
// v2 — Full personality spec, expression PNGs, TTS output
// ═══════════════════════════════════════════════════════════════
import { useState, useRef, useEffect, useCallback } from 'react'
import './AskAura.css'
import { useUser }        from '../../context/UserContext'
import { FMT, FMT_COMPACT, calcMonthlySpend, calcSpendByCategory, getSnapshot } from '../../data/mockData'

// ── Expression assets ────────────────────────────────────────
// Maps interaction/health state → PNG in /public
const EXPRESSIONS = {
  happy:     '/Aura-Happy.png',
  listening: '/Aura-Listening.png',
  thinking:  '/Aura-Thinking.png',
  cautious:  '/Aura-Cautious.png',
  alert:     '/Aura-Alert.png',
}

// Derive which expression to show given current state
function resolveExpression(status, isListening, healthScore) {
  if (isListening)              return 'listening'
  if (status === 'thinking')    return 'thinking'
  if (status === 'happy')       return 'happy'
  if (healthScore < 50)         return 'alert'
  if (healthScore < 75)         return 'cautious'
  return 'listening' // healthy idle
}

// ── Build financial context from real user data ──────────────
function buildFinancialContext(user) {
  const snapshot      = getSnapshot(user)
  const spendBycat    = calcSpendByCategory(user.transactions)
  const portfolioTotal = user.portfolio.breakdown.reduce((s, i) => s + i.value, 0)
  const savingsAccounts = user.accounts.filter(a => a.type === 'Savings Account')
  const creditCards     = user.accounts.filter(a => a.type === 'Credit Card')
  const liquidBalance   = savingsAccounts.reduce((s, a) => s + a.balance, 0)

  const categoryLines = Object.entries(spendBycat)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, amt]) => `  - ${cat}: ${FMT(amt)}`)
    .join('\n')

  const accountLines = user.accounts
    .map(a => `  - ${a.label} (${a.type}): ${FMT(a.balance)}${a.outstanding ? ` — due ${a.dueDate}` : ''}`)
    .join('\n')

  const portfolioLines = user.portfolio.breakdown
    .map(p => `  - ${p.label}: ${FMT(p.value)} (${p.pct}%) — ${p.trend}`)
    .join('\n')

  const holdingLines = user.portfolio.breakdown
    .flatMap(p => (p.holdings || []).map(h => `  - ${h.name}: ${FMT(h.value)} ${h.returns ? `(${h.returns})` : h.rate ? `@ ${h.rate}% p.a., matures ${h.maturity}` : ''}`))
    .join('\n')

  const goalLines = user.goals
    .map(g => `  - ${g.label}: ${FMT(g.saved)} saved of ${FMT(g.target)} target (${Math.round((g.saved/g.target)*100)}%) — deadline ${g.deadline}`)
    .join('\n')

  const creditCardLines = creditCards.length
    ? creditCards.map(c => `  - ${c.label} (${c.number}): ${FMT(c.balance)} outstanding${c.dueDate ? `, due ${c.dueDate}` : ''}${c.limit ? `, limit ${FMT(c.limit)}` : ''}`).join('\n')
    : '  - None'

  const healthPillarLines = user.health.pillars
    .map(p => `  - ${p.label}: ${p.score}/100`)
    .join('\n')

  const fraudLines = (user.fraudAlerts || []).filter(a => !a.resolved)
    .map(a => `  - ${a.title}: ${a.body} (${a.date})`)
    .join('\n') || '  - None'

  const emergencyMonthsTarget = 6
  const monthlyExpenses = snapshot.monthlySpend.value
  const emergencyCover  = liquidBalance / monthlyExpenses

  return `
CURRENT USER: ${user.full}
EMPLOYER: ${user.employer} — ${user.designation}
CITY: ${user.city}
CIBIL SCORE: ${user.cibilScore}
DATE: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

INCOME & SPEND:
- Monthly income: ${FMT(user.income)}
- This month's spending: ${FMT(snapshot.monthlySpend.value)} (${snapshot.monthlySpend.pctIncome}% of income)
- Last month's spending: ${FMT(snapshot.monthlySpend.prevMonth)}
- Savings rate this month: ${snapshot.savingsRate.value}% (last month: ${snapshot.savingsRate.prevMonth}%)

SPEND BY CATEGORY (June):
${categoryLines}

BANK ACCOUNTS:
${accountLines}

CREDIT CARDS:
${creditCardLines}

EMERGENCY FUND:
- Liquid balance: ${FMT(liquidBalance)}
- Emergency cover: ${emergencyCover.toFixed(1)} months of expenses
- Target: ${emergencyMonthsTarget} months
- Status: ${emergencyCover < 1 ? 'CRITICAL' : emergencyCover < 3 ? 'Low' : emergencyCover < 6 ? 'Building' : 'Healthy'}

PORTFOLIO (total: ${FMT(portfolioTotal)}):
${portfolioLines}

INDIVIDUAL HOLDINGS:
${holdingLines}

COMMITTED MONTHLY OUTFLOWS:
- SIP: ${FMT(user.commitments.sip)}/month
- RD: ${FMT(user.commitments.rd)}/month
- Credit card bills: ${FMT(user.commitments.creditCardBills)}

FINANCIAL GOALS:
${goalLines}

FINANCIAL HEALTH SCORE: ${user.health.score}/100 (${user.health.bandLabel})
PILLARS:
${healthPillarLines}
Aura's assessment: ${user.health.auraNote}

ACTIVE FRAUD / SECURITY ALERTS:
${fraudLines}

NET WORTH: ${FMT_COMPACT(snapshot.netWorth.value)} (${snapshot.netWorth.trend} since January)
`
}

// ── Aura response engine ─────────────────────────────────────
async function callAura(messages, user) {
  const last = messages[messages.length - 1].content.toLowerCase()
  const snapshot    = getSnapshot(user)
  const spendByCat  = calcSpendByCategory(user.transactions)
  const topCat      = Object.entries(spendByCat).sort((a,b) => b[1]-a[1])[0]
  const liquid      = user.accounts.filter(a => a.type === 'Savings Account').reduce((s,a) => s+a.balance, 0)
  const creditCards = user.accounts.filter(a => a.type === 'Credit Card')
  const goaGoal     = user.goals.find(g => g.label.toLowerCase().includes('goa'))
  const emergencyMonths = (liquid / snapshot.monthlySpend.value).toFixed(1)

  await new Promise(r => setTimeout(r, 950))

  if (/gift|birthday|present|shopping|buy|purchase|iphone|laptop|gadget|sept|august/.test(last)) {
    return `I think you can.\n\nYour finances are in a comfortable position right now, and a one-off purchase like this won't disrupt your savings trajectory.\n\nI'd pay it outright if you can, or use a genuine no-cost EMI. Either way, you're in good shape for it.`
  }

  if (/goa|trip|travel|vacation|holiday|flight|afford/.test(last)) {
    if (goaGoal) {
      const pct = Math.round((goaGoal.saved / goaGoal.target) * 100)
      if (pct >= 80) return `You're almost there.\n\nThe Goa fund is at ${pct}% — you're building good momentum and the deadline is well within reach.\n\nI'd stay the course and avoid dipping into it for anything else this month.`
      return `I think it's doable, with a little focus.\n\nYou're ${pct}% of the way to your Goa fund. A modest nudge to discretionary spend this month would get you there comfortably.\n\nYou're closer than it might feel.`
    }
    return `I'd feel comfortable with a short trip.\n\nYour current financial position supports it without affecting your bigger goals.\n\nBudget the flights and stay upfront — that's usually where trips go over.`
  }

  if (/doing|this month|spend|spending|budget|expense|how am/.test(last)) {
    const isOnTrack = snapshot.savingsRate.value >= 38
    return `${isOnTrack ? "You're tracking well this month." : "It's been a slightly heavy month — nothing to worry about."}\n\n${topCat ? `${topCat[0]} has been your biggest outflow, which is worth keeping an eye on.` : ''} Your savings rate is holding at ${snapshot.savingsRate.value}%.\n\n${isOnTrack ? "Stay consistent and you'll close the month strong." : "A few mindful days before month-end will get you back on track."}`
  }

  if (/invest|portfolio|mutual fund|stock|sip|wealth|market|return|fund/.test(last)) {
    return `Your portfolio is in a healthy position.\n\nThe SIP is running on schedule, which is the most important thing — consistency here compounds quietly but meaningfully.\n\nI wouldn't make any changes right now. You're building well.`
  }

  if (/credit card|due|bill|payment|outstanding/.test(last)) {
    if (creditCards.length) {
      const next = creditCards.find(c => c.dueDate)
      return `${next ? `Your ${next.label} payment of ${FMT(next.balance)} is due ${next.dueDate}.` : `You have an upcoming credit card payment.`}\n\nYou're well-positioned to clear it in full — I'd do that rather than carry a balance.\n\nPaying in full every cycle is one of the quietest ways to protect your financial health.`
    }
    return `No upcoming credit card dues right now. You're clear.`
  }

  if (/emergency|safety|cushion|liquid|rainy day/.test(last)) {
    const isLow = parseFloat(emergencyMonths) < 3
    return `${isLow ? "Your emergency cover is something I'd prioritise." : "Your emergency position is reasonable."}\n\nYou're at ${emergencyMonths} months of expenses covered. The ideal is 6 months, and you're building towards it.\n\n${isLow ? `Even moving ₹15,000–₹20,000 into a liquid fund this month would make a real difference.` : `Keep it parked somewhere accessible — a liquid fund works well for this.`}`
  }

  if (/goal|target|saving for|plan|progress/.test(last)) {
    const closest = [...user.goals].sort((a,b) => (b.saved/b.target) - (a.saved/a.target))[0]
    const pct = closest ? Math.round((closest.saved / closest.target) * 100) : 0
    return `You're making solid progress.\n\n${closest ? `${closest.label} is your most advanced goal at ${pct}% — you're closer than a lot of people get.` : 'Your goals are all moving in the right direction.'}\n\nI'd stay focused and avoid redirecting these funds for short-term things. The consistency is working.`
  }

  if (/fraud|suspicious|unusual|security|alert|upi|transfer|transaction/.test(last)) {
    const alert = (user.fraudAlerts || []).find(a => !a.resolved)
    if (alert) return `There's a transaction worth reviewing.\n\n${alert.body}\n\nI'd take a moment to verify this. If it wasn't you, raise a dispute through your bank app — better to act quickly on these.`
    return `Everything looks normal from where I'm sitting.\n\nYour recent transactions are within your usual pattern — nothing that stands out as a concern.\n\nI'll flag it immediately if anything unusual comes through.`
  }

  if (/net worth|overall|big picture|financial health|score/.test(last)) {
    return `You're in a stronger position than you might think.\n\nNet worth is at ${FMT_COMPACT(snapshot.netWorth.value)}, and your portfolio is the biggest driver of that growth.\n\nKeep the SIP running, build the emergency fund a little more, and you'll be in an excellent place by year end.`
  }

  if (/subscription|cancel|streaming|netflix|spotify|ott|recurring/.test(last)) {
    return `Worth a quick review.\n\nRecurring subscriptions have a way of adding up quietly. A 10-minute audit of last month's debits usually surfaces one or two things you've forgotten about.\n\nCancelling even two unused ones typically frees up ₹800–₹1,500 a month.`
  }

  return `I've looked at your full picture, and things are in reasonable shape.\n\n${user.health.auraNote}\n\nAsk me anything — spending, goals, investments, your next big purchase. I'm here.`
}
// ── Text-to-speech ───────────────────────────────────────────
function speak(text) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()

  const utt = new SpeechSynthesisUtterance(text)
  utt.lang  = 'en-US'
  utt.rate  = 0.92
  utt.pitch = 1.1

  const trySpeak = () => {
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v => v.name === 'Moira')
    || voices.find(v => v.lang.startsWith('en-US'))
    if (preferred) utt.voice = preferred
    window.speechSynthesis.speak(utt)
  }

  // Voices may not be loaded yet on first call
  if (window.speechSynthesis.getVoices().length) {
    trySpeak()
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null
      trySpeak()
    }
  }
}

// ── Snap to nearest edge ──────────────────────────────────────
const BTN_SIZE    = 72
const SNAP_MARGIN = 28
const DRAG_MARGIN = 12

function snapToEdge(x, y) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const cx = x + BTN_SIZE / 2
  const cy = y + BTN_SIZE / 2

  const distLeft   = cx
  const distRight  = vw - cx
  const distTop    = cy
  const distBottom = vh - cy

  const minDist = Math.min(distLeft, distRight, distTop, distBottom)
  const clampY  = (v) => Math.max(SNAP_MARGIN, Math.min(v, vh - BTN_SIZE - SNAP_MARGIN))
  const clampX  = (v) => Math.max(SNAP_MARGIN, Math.min(v, vw - BTN_SIZE - SNAP_MARGIN))

  if (minDist === distRight)  return { x: vw - BTN_SIZE - SNAP_MARGIN, y: clampY(y) }
  if (minDist === distLeft)   return { x: SNAP_MARGIN,                  y: clampY(y) }
  if (minDist === distBottom) return { x: clampX(x), y: vh - BTN_SIZE - SNAP_MARGIN  }
  return                             { x: clampX(x), y: SNAP_MARGIN                  }
}

// ── Suggested prompts ─────────────────────────────────────────
const SUGGESTIONS = [
  'How am I doing this month?',
  'Can I afford the Goa trip in August?',
  'When is my next credit card due?',
]

// ═══════════════════════════════════════════════════════════════
export default function AskAura() {
  const { user } = useUser()

  const defaultPos = useCallback(() => ({
    x: window.innerWidth  - BTN_SIZE - 32,
    y: window.innerHeight - BTN_SIZE - 40,
  }), [])

  const INITIAL_MESSAGE = {
    role: 'assistant',
    content: "Your emergency cover is at 1.2 months right now. Want to look at how to improve it?"
  }

  const HISTORY_CHATS = [
    {
      id: 'h1',
      title: 'Goa Trip Planning',
      preview: 'You\'re 63% of the way to your Goa fund…',
      time: 'Yesterday, 9:42 AM',
      messages: [
        { role: 'assistant', content: "Emergency cover is at 1.2 months — that's the main drag on your score right now. You have ₹48,200 liquid. Parking ₹20K in a liquid fund this week would get you to 2.2 months and move your score meaningfully. What would you like to look at?" },
        { role: 'user',      content: 'Can I afford the Goa trip in August?' },
        { role: 'assistant', content: "I think it's doable, with a little focus.\n\nYou're 63% of the way to your Goa fund. A modest nudge to discretionary spend this month would get you there comfortably.\n\nYou're closer than it might feel." },
        { role: 'user',      content: 'What should I cut back on?' },
        { role: 'assistant', content: "Dining has been your biggest outflow this month — worth keeping an eye on.\n\nEven trimming one or two weekend outings would move the needle meaningfully.\n\nYou're building good momentum. Stay consistent." },
      ]
    },
    {
      id: 'h2',
      title: 'Investment Check-in',
      preview: 'Your portfolio is in a healthy position…',
      time: 'Mon, 10:15 AM',
      messages: [
        { role: 'assistant', content: "Emergency cover is at 1.2 months — that's the main drag on your score right now. You have ₹48,200 liquid. Parking ₹20K in a liquid fund this week would get you to 2.2 months and move your score meaningfully. What would you like to look at?" },
        { role: 'user',      content: 'How are my investments doing?' },
        { role: 'assistant', content: "Your portfolio is in a healthy position.\n\nThe SIP is running on schedule — consistency here compounds quietly but meaningfully.\n\nI wouldn't make any changes right now. You're building well." },
        { role: 'user',      content: 'Should I increase my SIP amount?' },
        { role: 'assistant', content: "I think increasing your SIP is reasonable.\n\nYour cash flow remains healthy, and this is one of the few decisions that benefits your future self immediately.\n\nEven a ₹1,000–₹2,000 step-up makes a meaningful difference over time." },
      ]
    },
  ]

  const [pos,          setPos]         = useState(defaultPos)
  const [isDragging,   setIsDragging]  = useState(false)
  const [hasMoved,     setHasMoved]    = useState(false)
  const [open,         setOpen]        = useState(false)
  const [view,         setView]        = useState('chat')
  const [history,      setHistory]     = useState(HISTORY_CHATS)
  const [activeChat,   setActiveChat]  = useState('new')
  const [messages,     setMessages]    = useState([INITIAL_MESSAGE])
  const [input,        setInput]       = useState('')
  const [status,       setStatus]      = useState('idle')
  const [isListening,  setIsListening] = useState(false)
  const [ttsEnabled,   setTtsEnabled]  = useState(false)
  const [expression,   setExpression]  = useState(
    user.health.score < 50 ? 'alert' : user.health.score < 75 ? 'cautious' : 'listening'
  )
  const [prevExpr,     setPrevExpr]    = useState(null)

  const dragRef        = useRef({ startX: 0, startY: 0 })
  const btnRef         = useRef(null)
  const chatEndRef     = useRef(null)
  const inputRef       = useRef(null)
  const recognitionRef = useRef(null)
  const happyTimerRef  = useRef(null)

  const HEALTH_SCORE = user.health.score

  // ── Expression management ─────────────────────────────────
  const setExpressionWithCrossfade = useCallback((next) => {
    setExpression(prev => {
      if (prev === next) return prev
      setPrevExpr(prev)
      setTimeout(() => setPrevExpr(null), 220)
      return next
    })
  }, [])

  useEffect(() => {
    const next = resolveExpression(status, isListening, HEALTH_SCORE)
    setExpressionWithCrossfade(next)
  }, [status, isListening, setExpressionWithCrossfade])

  // Burst happy for 4s on a milestone keyword in response
  const triggerHappy = useCallback((text) => {
    const milestoneWords = ['goal', 'target hit', 'savings rate', 'improved', 'cleared', 'achieved', 'milestone']
    const isPositive = milestoneWords.some(w => text.toLowerCase().includes(w))
    if (!isPositive) return
    clearTimeout(happyTimerRef.current)
    setExpressionWithCrossfade('happy')
    happyTimerRef.current = setTimeout(() => {
      setExpressionWithCrossfade(user.health.score < 50 ? 'alert' : user.health.score < 75 ? 'cautious' : 'listening')
    }, 4000)
  }, [setExpressionWithCrossfade, user.health.score])

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, status])

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150)
  }, [open])

  // Cancel TTS when panel closes
  useEffect(() => {
    if (!open && 'speechSynthesis' in window) window.speechSynthesis.cancel()
  }, [open])

  // ── Dragging ──────────────────────────────────────────────
  const onPointerDown = useCallback((e) => {
    if (open) return
    e.preventDefault()
    setIsDragging(true)
    setHasMoved(false)
    dragRef.current = {
      startX: e.clientX - pos.x,
      startY: e.clientY - pos.y,
    }
    btnRef.current?.setPointerCapture(e.pointerId)
  }, [open, pos])

  const onPointerMove = useCallback((e) => {
    if (!isDragging) return
    const vw = window.innerWidth
    const vh = window.innerHeight
    setPos({
      x: Math.max(DRAG_MARGIN, Math.min(e.clientX - dragRef.current.startX, vw - BTN_SIZE - DRAG_MARGIN)),
      y: Math.max(DRAG_MARGIN, Math.min(e.clientY - dragRef.current.startY, vh - BTN_SIZE - DRAG_MARGIN)),
    })
    setHasMoved(true)
  }, [isDragging])

  const onPointerUp = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)
    if (hasMoved) {
      setPos(prev => snapToEdge(prev.x, prev.y))
    } else {
      setOpen(true)
    }
  }, [isDragging, hasMoved])

  // ── Send message ──────────────────────────────────────────
  const send = useCallback(async (text) => {
    const trimmed = (text || input).trim()
    if (!trimmed) return
    setInput('')
    const userMsg = { role: 'user', content: trimmed }
    const next = [...messages, userMsg]
    setMessages(next)
    setStatus('thinking')

    try {
      const reply = await callAura(next.map(m => ({ role: m.role, content: m.content })), user)
      setStatus('responding')
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      triggerHappy(reply)
      if (ttsEnabled) speak(reply)
      setTimeout(() => setStatus('idle'), 800)
    } catch (err) {
      console.error('Aura error:', err)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Something went wrong: ${err.message}. Try again in a moment.`
      }])
      setStatus('idle')
    }
  }, [input, messages, ttsEnabled, triggerHappy])

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  // ── Voice input ───────────────────────────────────────────
  // Voice-triggered send — always speaks the reply
  const sendWithVoice = useCallback(async (text) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setInput('')
    const next = [...messages, { role: 'user', content: trimmed }]
    setMessages(next)
    setStatus('thinking')
    try {
      const reply = await callAura(next.map(m => ({ role: m.role, content: m.content })), user)
      setStatus('responding')
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      triggerHappy(reply)
      speak(reply)
      setTimeout(() => setStatus('idle'), 800)
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Try again.' }])
      setStatus('idle')
    }
  }, [messages, triggerHappy, user])

  const toggleVoice = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice input isn't supported in this browser. Try Chrome.")
      return
    }
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      setStatus('idle')
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'en-IN'
    rec.interimResults = false
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setInput(transcript)
      setIsListening(false)
      setStatus('idle')
      setTtsEnabled(true)
      // Call send with forceSpeak=true to bypass stale closure
      sendWithVoice(transcript)
    }
    rec.onerror = () => { setIsListening(false); setStatus('idle') }
    rec.onend   = () => { setIsListening(false); setStatus('idle') }
    recognitionRef.current = rec
    rec.start()
    setIsListening(true)
    setStatus('listening')
  }, [isListening, sendWithVoice])

  // ── TTS toggle ────────────────────────────────────────────
  const toggleTts = useCallback(() => {
    if (ttsEnabled) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel()
      setTtsEnabled(false)
    } else {
      setTtsEnabled(true)
      const lastAura = [...messages].reverse().find(m => m.role === 'assistant')
      if (lastAura) speak(lastAura.content)
    }
  }, [ttsEnabled, messages])

  // ── History actions ──────────────────────────────────────
  const loadChat = useCallback((chat) => {
    setMessages(chat.messages)
    setActiveChat(chat.id)
    setView('chat')
  }, [])

  const deleteChat = useCallback((id) => {
    setHistory(prev => prev.filter(c => c.id !== id))
    if (activeChat === id) {
      setMessages([INITIAL_MESSAGE])
      setActiveChat('new')
    }
  }, [activeChat])

  const startNewChat = useCallback(() => {
    setMessages([INITIAL_MESSAGE])
    setActiveChat('new')
    setView('chat')
  }, [])

  // ── Panel positioning ─────────────────────────────────────
  const panelSide  = pos.x > window.innerWidth / 2 ? 'left' : 'right'
  const stateClass = isDragging     ? 'dragging'
    : isListening                   ? 'listening'
    : status === 'thinking'         ? 'thinking'
    : status === 'responding'       ? 'responding'
    : 'idle'

  return (
    <>
      {/* ── Floating mascot button ───────────────────────── */}
      <div
        ref={btnRef}
        className={`ask-aura-btn ask-aura-btn--${stateClass}${open ? ' ask-aura-btn--open' : ''}`}
        style={{
          left:   pos.x,
          top:    pos.y,
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        title="Ask Aura"
      >
        {/* Ambient glow rings */}
        <span className="aura-ring aura-ring--1" />
        <span className="aura-ring aura-ring--2" />

        {/* Mascot — static SVG */}
        <div className="aura-mascot-wrap">
          <img
            src="/Mascot - Aura.svg"
            alt="Aura"
            className="aura-mascot-img"
            draggable={false}
          />
          {(stateClass === 'listening' || stateClass === 'thinking') && (
            <div className={`aura-mascot-state aura-mascot-state--${stateClass}`} />
          )}
        </div>

        {/* Close badge when chat is open */}
        {open && (
          <button
            className="aura-close-btn"
            onClick={(e) => { e.stopPropagation(); setOpen(false) }}
            title="Close"
          >✕</button>
        )}
      </div>

      {/* ── Chat panel ──────────────────────────────────── */}
      {open && (
        <div
          className={`ask-aura-panel ask-aura-panel--${panelSide}`}
          style={{
            [panelSide === 'left' ? 'right' : 'left']: `${window.innerWidth - pos.x - BTN_SIZE}px`,
            bottom: `${window.innerHeight - pos.y + 12}px`,
          }}
        >
          {/* Header */}
          <div className="aura-panel__header">
            <div className="aura-panel__avatar">
              <img src="/Mascot - Aura.svg" alt="Aura" className="aura-panel__mascot" draggable={false} />
            </div>
            <div className="aura-panel__identity">
              <div className="aura-panel__name">
                Aura AI Assistant
                <span className="aura-panel__online-dot" />
              </div>
              <div className={`aura-panel__status aura-panel__status--${stateClass}`}>
                {status === 'thinking'   ? 'Thinking…'
               : status === 'responding' ? 'Responding…'
               : isListening             ? 'Listening…'
               : null}
              </div>
            </div>
            <div className="aura-panel__actions">
              <button
                className={`aura-panel__icon-btn${ttsEnabled ? ' aura-panel__icon-btn--active' : ''}`}
                onClick={toggleTts}
                title={ttsEnabled ? 'Mute voice' : 'Enable voice'}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                  {ttsEnabled && <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>}
                  {!ttsEnabled && <line x1="23" y1="9" x2="17" y2="15"/>}
                  {!ttsEnabled && <line x1="17" y1="9" x2="23" y2="15"/>}
                </svg>
              </button>
              <button
                className={`aura-panel__icon-btn${view === 'history' ? ' aura-panel__icon-btn--active' : ''}`}
                onClick={() => setView(v => v === 'history' ? 'chat' : 'history')}
                title="Chat history"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="6"  x2="21" y2="6"/>
                  <line x1="3" y1="12" x2="21" y2="12"/>
                  <line x1="3" y1="18" x2="21" y2="18"/>
                </svg>
              </button>
              <button
                className={`aura-panel__icon-btn${activeChat === 'new' && view === 'chat' ? ' aura-panel__icon-btn--active' : ''}`}
                onClick={startNewChat}
                title="New chat"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </button>
              <button className="aura-panel__icon-btn" onClick={() => setOpen(false)} title="Close">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          {/* History view */}
          {view === 'history' && (
            <div className="aura-panel__history">
              {history.length === 0 ? (
                <p className="aura-panel__history-empty">No past conversations yet.</p>
              ) : history.map(chat => (
                <div key={chat.id} className="aura-history-item">
                  <button className="aura-history-item__body" onClick={() => loadChat(chat)}>
                    <span className="aura-history-item__title">{chat.title}</span>
                    <span className="aura-history-item__preview">{chat.preview}</span>
                    <span className="aura-history-item__time">{chat.time}</span>
                  </button>
                  <button
                    className="aura-history-item__delete"
                    onClick={() => deleteChat(chat.id)}
                    title="Delete"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14H6L5 6"/>
                      <path d="M10 11v6M14 11v6M9 6V4h6v2"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Messages */}
          {view === 'chat' && <div className="aura-panel__messages">
            {messages.map((m, i) => (
              <div key={i} className={`aura-msg aura-msg--${m.role}`}>
                {m.role === 'assistant' && (
                  <img
                    src="/Mascot - Aura.svg"
                    alt="Aura"
                    className="aura-msg__avatar"
                    draggable={false}
                  />
                )}
                <div className="aura-msg__bubble">{m.content}</div>
              </div>
            ))}

            {/* Typing indicator */}
            {status === 'thinking' && (
              <div className="aura-msg aura-msg--assistant">
                <img
                  src="/Mascot - Aura.svg"
                  alt="Aura"
                  className="aura-msg__avatar"
                  draggable={false}
                />
                <div className="aura-msg__bubble aura-msg__bubble--typing">
                  <span /><span /><span />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>}

          {/* Suggestions — only on fresh chat */}
          {view === 'chat' && messages.length === 1 && (
            <div className="aura-panel__suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="aura-suggestion" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          )}

          {/* Input bar — chat view only */}
          {view === 'chat' && <div className="aura-panel__input-row">
            <textarea
              ref={inputRef}
              className="aura-panel__input"
              placeholder="Ask Aura anything…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
            />
            <button
              className={`aura-panel__mic${isListening ? ' aura-panel__mic--active' : ''}`}
              onClick={toggleVoice}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
            <button
              className="aura-panel__send"
              onClick={() => send()}
              disabled={!input.trim() || status === 'thinking'}
              title="Send"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>}
        </div>
      )}
    </>
  )
}
