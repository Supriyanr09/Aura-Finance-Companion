// ═══════════════════════════════════════════════
// TopBar.jsx — Layout component
// All styles in TopBar.css. No inline styles.
// ═══════════════════════════════════════════════
import { useState, useRef, useCallback, useEffect } from 'react'
import { MagnifyingGlass, Bell, Sun, Moon } from '@phosphor-icons/react'
import './TopBar.css'
import { useTheme } from '../../ThemeContext'
import { useUser }  from '../../context/UserContext'
import IconButton   from '../ui/IconButton'
import NotificationPanel from './NotificationPanel'
import { FMT, FMT_COMPACT, calcSpendByCategory, getSnapshot } from '../../data/mockData'

// ── Aura response engine (mirrors AskAura) ────────────────────
function getAuraResponse(query, user) {
  const last = query.toLowerCase()
  const snapshot       = getSnapshot(user)
  const spendByCat     = calcSpendByCategory(user.transactions)
  const topCat         = Object.entries(spendByCat).sort((a,b) => b[1]-a[1])[0]
  const liquid         = user.accounts.filter(a => a.type === 'Savings Account').reduce((s,a) => s+a.balance, 0)
  const creditCards    = user.accounts.filter(a => a.type === 'Credit Card')
  const goaGoal        = user.goals.find(g => g.label.toLowerCase().includes('goa'))
  const emergencyMonths = (liquid / snapshot.monthlySpend.value).toFixed(1)

  if (/gift|birthday|present|shopping|buy|purchase|iphone|laptop|gadget/.test(last))
    return `I think you can. Your finances are in a comfortable position right now, and a one-off purchase like this won't disrupt your savings trajectory. I'd pay it outright or use a genuine no-cost EMI.`

  if (/goa|trip|travel|vacation|holiday|flight|afford/.test(last)) {
    if (goaGoal) {
      const pct = Math.round((goaGoal.saved / goaGoal.target) * 100)
      return pct >= 80
        ? `You're almost there. The Goa fund is at ${pct}% — stay the course and avoid dipping into it this month.`
        : `I think it's doable, with a little focus. You're ${pct}% of the way to your Goa fund. A modest nudge to discretionary spend this month would get you there.`
    }
    return `I'd feel comfortable with a short trip. Your current position supports it without affecting your bigger goals.`
  }

  if (/doing|this month|spend|spending|budget|expense|how am/.test(last)) {
    const isOnTrack = snapshot.savingsRate.value >= 38
    return `${isOnTrack ? "You're tracking well this month." : "It's been a slightly heavy month — nothing to worry about."} ${topCat ? `${topCat[0]} has been your biggest outflow.` : ''} Savings rate is at ${snapshot.savingsRate.value}%.`
  }

  if (/invest|portfolio|mutual fund|stock|sip|wealth|market|return|fund/.test(last))
    return `Your portfolio is in a healthy position. The SIP is running on schedule — consistency here compounds quietly but meaningfully. I wouldn't make any changes right now.`

  if (/credit card|due|bill|payment|outstanding/.test(last)) {
    if (creditCards.length) {
      const next = creditCards.find(c => c.dueDate)
      return next
        ? `Your ${next.label} payment of ${FMT(next.balance)} is due ${next.dueDate}. You're well-positioned to clear it in full.`
        : `You have an upcoming credit card payment. Clear it in full to protect your financial health.`
    }
    return `No upcoming credit card dues right now. You're clear.`
  }

  if (/emergency|safety|cushion|liquid|rainy day/.test(last)) {
    const isLow = parseFloat(emergencyMonths) < 3
    return `${isLow ? "Your emergency cover is something I'd prioritise." : "Your emergency position is reasonable."} You're at ${emergencyMonths} months covered — target is 6.`
  }

  if (/goal|target|saving for|plan|progress/.test(last)) {
    const closest = [...user.goals].sort((a,b) => (b.saved/b.target) - (a.saved/a.target))[0]
    const pct = closest ? Math.round((closest.saved / closest.target) * 100) : 0
    return `You're making solid progress. ${closest ? `${closest.label} is your most advanced goal at ${pct}%.` : ''} Stay consistent.`
  }

  if (/fraud|suspicious|unusual|security|alert|upi|transfer|transaction/.test(last)) {
    const alert = (user.fraudAlerts || []).find(a => !a.resolved)
    return alert
      ? `There's a transaction worth reviewing. ${alert.body} If it wasn't you, raise a dispute through your bank app.`
      : `Everything looks normal. Your recent transactions are within your usual pattern.`
  }

  if (/net worth|overall|big picture|financial health|score/.test(last))
    return `You're in a stronger position than you might think. Net worth is at ${FMT_COMPACT(snapshot.netWorth.value)} — portfolio is the biggest driver of that growth.`

  if (/subscription|cancel|streaming|netflix|spotify|ott|recurring/.test(last))
    return `Worth a quick review. Recurring subscriptions add up quietly — a 10-minute audit usually surfaces one or two things you've forgotten about.`

  return `${user.health.auraNote} Ask me about your spending, goals, investments, or next big purchase.`
}

// ── TTS ───────────────────────────────────────────────────────
function speakWithState(text, setIsSpeaking) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang    = 'en-US'
  utt.rate    = 0.92
  utt.pitch   = 1.1
  utt.onstart = () => setIsSpeaking(true)
  utt.onend   = () => setIsSpeaking(false)
  utt.onerror = () => setIsSpeaking(false)
  const trySpeak = () => {
    const voices = window.speechSynthesis.getVoices()
    const preferred = voices.find(v => v.name === 'Moira') || voices.find(v => v.lang.startsWith('en-US'))
    if (preferred) utt.voice = preferred
    window.speechSynthesis.speak(utt)
  }
  if (window.speechSynthesis.getVoices().length) trySpeak()
  else { window.speechSynthesis.onvoiceschanged = () => { window.speechSynthesis.onvoiceschanged = null; trySpeak() } }
}

export default function TopBar({ breadcrumb = 'Home' }) {
  const { dark, toggle } = useTheme()
  const { user }         = useUser()

  const [search,      setSearch]      = useState('')
  const [focused,     setFocused]     = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [answer,      setAnswer]      = useState(null)
  const [isTyping,    setIsTyping]    = useState(false)
  const [isSpeaking,  setIsSpeaking]  = useState(false)
  const [notifOpen,   setNotifOpen]   = useState(false)

  const recognitionRef = useRef(null)
  const wrapRef        = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setAnswer(null)
        setFocused(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // Handle text submit
  const handleSubmit = useCallback((query) => {
    const q = (query || search).trim()
    if (!q) return
    setSearch(q)
    setIsTyping(true)
    if ('speechSynthesis' in window) window.speechSynthesis.cancel()
    setIsSpeaking(false)
    setTimeout(() => {
      const response = getAuraResponse(q, user)
      setAnswer({ text: response, query: q })
      setIsTyping(false)
      speakWithState(response, setIsSpeaking)
    }, 700)
  }, [search, user])

  const onKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSubmit() }
    if (e.key === 'Escape') { setAnswer(null); setSearch('') }
  }

  // Voice input
  const toggleVoice = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice input requires Chrome.")
      return
    }
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const rec = new SR()
    rec.lang = 'en-IN'
    rec.interimResults = false
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setSearch(transcript)
      setIsListening(false)
      setIsTyping(true)
      setTimeout(() => {
        const response = getAuraResponse(transcript, user)
        setAnswer({ text: response, query: transcript })
        setIsTyping(false)
        speakWithState(response, setIsSpeaking)
      }, 700)
    }
    rec.onerror = () => setIsListening(false)
    rec.onend   = () => setIsListening(false)
    recognitionRef.current = rec
    rec.start()
    setIsListening(true)
    setAnswer(null)
  }, [isListening, user])

  const showDropdown = focused || isTyping || isSpeaking || !!answer

  return (
    <>
      <header className="topbar">
        <div className="topbar__breadcrumb">{breadcrumb}</div>

        <div className="topbar__search-wrap" ref={wrapRef}>
          <div className={`topbar__search${focused ? ' topbar__search--focused' : ''}${isListening ? ' topbar__search--listening' : ''}`}>
            <MagnifyingGlass size={16} color="var(--color-text-tertiary)" />
            <input
              className="topbar__search-input"
              value={search}
              onChange={e => { setSearch(e.target.value); setAnswer(null) }}
              onFocus={() => setFocused(true)}
              onKeyDown={onKeyDown}
              placeholder={isListening ? 'Listening…' : 'Ask Aura anything…'}
              aria-label="Search"
            />
            <button
              className={`topbar__mic${isListening ? ' topbar__mic--active' : ''}`}
              onClick={toggleVoice}
              title={isListening ? 'Stop listening' : 'Ask by voice'}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
          </div>

          {/* Answer dropdown */}
          {showDropdown && (
            <div className="topbar__answer">
              {isTyping ? (
                <div className="topbar__answer-typing">
                  <span /><span /><span />
                </div>
              ) : answer ? (
                <>
                  <div className="topbar__answer-query">{answer.query}</div>
                  <div className="topbar__answer-text">{answer.text}</div>
                  <div className="topbar__answer-controls">
                    {isSpeaking && (
                      <button
                        className="topbar__answer-mute"
                        onClick={() => { window.speechSynthesis.cancel(); setIsSpeaking(false) }}
                        title="Stop audio"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                          <line x1="23" y1="9" x2="17" y2="15"/>
                          <line x1="17" y1="9" x2="23" y2="15"/>
                        </svg>
                        Stop audio
                      </button>
                    )}
                    <button
                      className="topbar__answer-close"
                      onClick={() => { window.speechSynthesis.cancel(); setIsSpeaking(false); setAnswer(null); setSearch(''); setFocused(false) }}
                      title="Dismiss"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </div>

        <div className="topbar__actions">
          <IconButton
            icon={Bell}
            label="Notifications"
            badge={3}
            onClick={() => setNotifOpen(true)}
          />
          <IconButton
            icon={dark ? Sun : Moon}
            label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={toggle}
          />
        </div>
      </header>

      {/* Notification slide-out */}
      <NotificationPanel
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
      />
    </>
  )
}
