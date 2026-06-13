// LoginPage.jsx — route: "/login"
// Styles: src/styles/login.css (.lgn- namespace)
//
// Architecture:
//   · Split-screen: left = vertical 3D cylinder carousel, right = auth card
//   · Tab order: Mobile OTP (default) | Customer ID | MPIN (mobile only)
//   · Tabs: AuraTabs — spring-animated platinum line indicator
//   · All text actions: .lgn__ghost-link — one consistent style
//   · Primary CTAs: AuraPlatinumButton
//   · Inputs: platinum shimmer underline on focus — brand standard

import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate }    from 'react-router-dom'
import AuraPlatinumButton from '../components/ui/AuraPlatinumButton'
import AuraTabs           from '../components/ui/AuraTabs'

// ─── Card data ────────────────────────────────────────────────
const CARDS = [
  { id: 'platinum',  name: 'Aura Platinum',  member: 'Member Since 2026', pattern: 'circles', number: '•••• •••• •••• 4821' },
  { id: 'signature', name: 'Aura Signature', member: 'Member Since 2026', pattern: 'lines',   number: '•••• •••• •••• 7634' },
  { id: 'wealth',    name: 'Aura Wealth',    member: 'Member Since 2026', pattern: 'grid',    number: '•••• •••• •••• 2901' },
  { id: 'business',  name: 'Aura Business',  member: 'Member Since 2026', pattern: 'dots',    number: '•••• •••• •••• 5513' },
  { id: 'infinite',  name: 'Aura Infinite',  member: 'Member Since 2026', pattern: 'arc',     number: '•••• •••• •••• 0001' },
  { id: 'travel',    name: 'Aura Travel',    member: 'Member Since 2026', pattern: 'circles', number: '•••• •••• •••• 3347' },
  { id: 'rewards',   name: 'Aura Rewards',   member: 'Member Since 2026', pattern: 'lines',   number: '•••• •••• •••• 8820' },
  { id: 'reserve',   name: 'Aura Reserve',   member: 'Member Since 2026', pattern: 'grid',    number: '•••• •••• •••• 6614' },
  { id: 'edge',      name: 'Aura Edge',      member: 'Member Since 2026', pattern: 'arc',     number: '•••• •••• •••• 1192' },
  { id: 'freedom',   name: 'Aura Freedom',   member: 'Member Since 2026', pattern: 'dots',    number: '•••• •••• •••• 9900' },
]

// ─── Tab definitions ──────────────────────────────────────────
const TABS_DESKTOP = [
  { id: 'otp',      label: 'Mobile OTP'  },
  { id: 'password', label: 'Customer ID' },
]

const TABS_MOBILE = [
  { id: 'otp',      label: 'Mobile OTP'  },
  { id: 'password', label: 'Customer ID' },
  { id: 'mpin',     label: 'MPIN'        },
]

// ─── Mobile detection ─────────────────────────────────────────
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler, { passive: true })
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

// ─── Vertical cylinder carousel ───────────────────────────────
function useVerticalCarousel(count) {
  const cylinderRef = useRef(null)
  const stageRef    = useRef(null)
  const angleRef    = useRef(0)
  const velRef      = useRef(0.15)
  const mouseRef    = useRef({ x: 0.5, y: 0.5 })
  const tiltRef     = useRef({ x: 0, y: 0 })
  const rafRef      = useRef(null)
  const RADIUS = 400, INERTIA = 0.055

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const onMove = (e) => {
      const r = stage.getBoundingClientRect()
      mouseRef.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }
    }
    stage.addEventListener('mousemove', onMove, { passive: true })
    return () => stage.removeEventListener('mousemove', onMove)
  }, [])

  useEffect(() => {
    const step = 360 / count
    const tick = () => {
      angleRef.current += velRef.current
      const targetTiltY = (mouseRef.current.x - 0.5) * 10
      const targetTiltX = (mouseRef.current.y - 0.5) * -4
      tiltRef.current.x += (targetTiltX - tiltRef.current.x) * INERTIA
      tiltRef.current.y += (targetTiltY - tiltRef.current.y) * INERTIA
      const cyl = cylinderRef.current
      if (cyl) {
        cyl.style.transform =
          `rotateY(${tiltRef.current.y.toFixed(2)}deg) ` +
          `rotateX(${(angleRef.current + tiltRef.current.x).toFixed(2)}deg)`
      }
      cyl?.querySelectorAll('.lgn__card').forEach((card, i) => {
        card.style.transform = `rotateX(${step * i}deg) translateZ(${RADIUS}px)`
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [count])

  return { cylinderRef, stageRef }
}

// ─── SVG card patterns ────────────────────────────────────────
function CardPattern({ type }) {
  if (type === 'circles') return (
    <svg className="lgn__card-pattern" viewBox="0 0 300 185" fill="none" aria-hidden="true">
      <circle cx="220" cy="92" r="90" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
      <circle cx="220" cy="92" r="60" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <circle cx="260" cy="40" r="50" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      <circle cx="260" cy="150" r="40" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
    </svg>
  )
  if (type === 'lines') return (
    <svg className="lgn__card-pattern" viewBox="0 0 300 185" fill="none" aria-hidden="true">
      {[0,1,2,3,4,5,6,7,8].map(i => <line key={i} x1={160+i*22} y1="0" x2={80+i*22} y2="185" stroke="rgba(255,255,255,0.055)" strokeWidth="1" />)}
    </svg>
  )
  if (type === 'grid') return (
    <svg className="lgn__card-pattern" viewBox="0 0 300 185" fill="none" aria-hidden="true">
      {[0,1,2,3,4,5,6].map(i => <line key={`h${i}`} x1="120" y1={i*30} x2="300" y2={i*30} stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" />)}
      {[0,1,2,3,4,5].map(i => <line key={`v${i}`} x1={150+i*30} y1="0" x2={150+i*30} y2="185" stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" />)}
    </svg>
  )
  if (type === 'arc') return (
    <svg className="lgn__card-pattern" viewBox="0 0 300 185" fill="none" aria-hidden="true">
      <path d="M 300 185 Q 180 0 60 185" stroke="rgba(255,255,255,0.07)" strokeWidth="1" fill="none" />
      <path d="M 300 185 Q 200 20 80 185" stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none" />
      <path d="M 300 185 Q 220 40 100 185" stroke="rgba(255,255,255,0.04)" strokeWidth="1" fill="none" />
    </svg>
  )
  if (type === 'dots') return (
    <svg className="lgn__card-pattern" viewBox="0 0 300 185" fill="none" aria-hidden="true">
      {[0,1,2,3,4,5,6,7,8].map(col =>
        [0,1,2,3,4].map(row => <circle key={`${col}-${row}`} cx={150+col*20} cy={20+row*36} r="1.5" fill="rgba(255,255,255,0.1)" />)
      )}
    </svg>
  )
  return null
}

// ─── Premium card ─────────────────────────────────────────────
function AuraCard({ card, isMobileHero }) {
  return (
    <div className={`lgn__card lgn__card--${card.id}${isMobileHero ? ' lgn__card--hero' : ''}`}>
      <div className="lgn__card-face">
        <CardPattern type={card.pattern} />
        <div className="lgn__card-header">
          <div className="lgn__card-brand-row"><span className="lgn__card-logo-text">AURA</span></div>
          <div className="lgn__card-chip"><div className="lgn__card-chip-inner" /></div>
        </div>
        <div className="lgn__card-mid" />
        <div className="lgn__card-footer">
          <div className="lgn__card-footer-left">
            <span className="lgn__card-number">{card.number}</span>
            <span className="lgn__card-member">{card.member}</span>
          </div>
          <span className="lgn__card-name">{card.name}</span>
        </div>
        <div className="lgn__card-reflection" />
        <div className="lgn__card-edge" />
      </div>
      <div className="lgn__card-back">
        <div className="lgn__card-back-stripe" />
        <div className="lgn__card-back-logo">AURA</div>
        <CardPattern type={card.pattern} />
        <div className="lgn__card-reflection" />
        <div className="lgn__card-edge" />
      </div>
    </div>
  )
}

// ─── Icons ────────────────────────────────────────────────────
function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

// ─── Tab: Mobile OTP ─────────────────────────────────────────
function TabMobileOTP({ onSuccess }) {
  const [mobile,  setMobile]  = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp,     setOtp]     = useState(['','','','','',''])
  const [timer,   setTimer]   = useState(30)
  const [loading, setLoading] = useState(false)
  const otpRefs = useRef([])

  useEffect(() => {
    if (!otpSent) return
    const id = setInterval(() => setTimer(t => Math.max(0, t - 1)), 1000)
    return () => clearInterval(id)
  }, [otpSent])

  const handleSend = async (e) => {
    e.preventDefault()
    if (mobile.length < 10) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 900))
    setLoading(false)
    setOtpSent(true)
    setTimer(30)
    setTimeout(() => otpRefs.current[0]?.focus(), 80)
  }

  const handleChange = (idx, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]; next[idx] = val; setOtp(next)
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus()
  }

  const handleKey = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus()
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    if (otp.some(d => !d)) return
    setLoading(true)
    await new Promise(r => setTimeout(r, 1000))
    setLoading(false)
    onSuccess()
  }

  if (!otpSent) return (
    <form className="lgn__tab-content" onSubmit={handleSend}>
      <div className="lgn__field">
        <label className="lgn__field-label">Mobile Number</label>
        <div className="lgn__field-wrapper">
          <input
            className="lgn__input"
            type="tel"
            placeholder="+91 98765 43210"
            value={mobile}
            onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
            autoComplete="tel"
          />
          <div className="lgn__field-underline" aria-hidden="true" />
        </div>
      </div>
      <AuraPlatinumButton type="submit" size="md" loading={loading} showArrow={!loading}>
        Send OTP
      </AuraPlatinumButton>
    </form>
  )

  return (
    <form className="lgn__tab-content" onSubmit={handleVerify}>
      <p className="lgn__otp-sent-hint">✓ OTP sent to +91 {mobile.slice(0, 5)}•••••</p>
      <div className="lgn__field">
        <label className="lgn__field-label">Enter OTP</label>
        <div className="lgn__otp-row">
          {otp.map((d, i) => (
            <input
              key={i}
              ref={el => { otpRefs.current[i] = el }}
              className={`lgn__otp-input${d ? ' lgn__otp-input--filled' : ''}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={e => handleChange(i, e.target.value)}
              onKeyDown={e => handleKey(i, e)}
            />
          ))}
        </div>
      </div>
      <div className="lgn__resend-row">
        {timer > 0
          ? <span>Resend in {timer}s</span>
          : <button type="button" className="lgn__ghost-link"
              onClick={() => { setOtpSent(false); setOtp(['','','','','','']); setTimer(30) }}>
              Resend OTP
            </button>
        }
      </div>
      <AuraPlatinumButton type="submit" size="md" loading={loading} showArrow={!loading}>
        Verify &amp; Continue
      </AuraPlatinumButton>
      <button
        type="button"
        className="lgn__cta--secondary"
        onClick={() => { setOtpSent(false); setOtp(['','','','','','']) }}
      >
        Change Number
      </button>
    </form>
  )
}

// ─── Tab: Customer ID ─────────────────────────────────────────
function TabCustomerID({ onSuccess, onSwitchToOTP }) {
  const [id,       setId]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!id.trim() || !password.trim()) { setError('Please fill in all fields.'); return }
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    setLoading(false)
    onSuccess()
  }

  return (
    <form className="lgn__tab-content" onSubmit={handleSubmit}>
      <div className="lgn__field">
        <label className="lgn__field-label">Customer ID</label>
        <div className="lgn__field-wrapper">
          <input
            className={`lgn__input${error ? ' lgn__input--error' : ''}`}
            type="text"
            placeholder="e.g. AURA2841064"
            value={id}
            onChange={e => { setId(e.target.value); setError('') }}
            autoComplete="username"
          />
          <div className="lgn__field-underline" aria-hidden="true" />
        </div>
      </div>

      <div className="lgn__field">
        <label className="lgn__field-label">Password</label>
        <div className="lgn__field-wrapper">
          <input
            className={`lgn__input lgn__input--has-action${error ? ' lgn__input--error' : ''}`}
            type={showPass ? 'text' : 'password'}
            placeholder="Your password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            autoComplete="current-password"
          />
          <button
            type="button"
            className="lgn__field-action"
            onClick={() => setShowPass(p => !p)}
            aria-label={showPass ? 'Hide password' : 'Show password'}
          >
            <EyeIcon open={showPass} />
          </button>
          <div className="lgn__field-underline" aria-hidden="true" />
        </div>
        {error && <span className="lgn__field-error">{error}</span>}
      </div>

      <div className="lgn__options-row">
        <label className="lgn__checkbox-label">
          <input
            className="lgn__checkbox"
            type="checkbox"
            checked={remember}
            onChange={e => setRemember(e.target.checked)}
          />
          Remember me
        </label>
        <button type="button" className="lgn__ghost-link">Forgot password?</button>
      </div>

      <AuraPlatinumButton type="submit" size="md" loading={loading} showArrow={!loading}>
        Sign In
      </AuraPlatinumButton>

      <button type="button" className="lgn__ghost-link lgn__ghost-link--block" onClick={onSwitchToOTP}>
        Continue with Mobile OTP <ArrowIcon />
      </button>
    </form>
  )
}

// ─── Tab: MPIN (mobile only) ──────────────────────────────────
function TabMPIN({ onSuccess }) {
  const [pin,     setPin]     = useState([])
  const [loading, setLoading] = useState(false)
  const PIN_LEN = 6
  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','del']

  const handleKey = useCallback(async (val) => {
    if (val === 'del') { setPin(p => p.slice(0, -1)); return }
    if (pin.length >= PIN_LEN) return
    const next = [...pin, val]
    setPin(next)
    if (next.length === PIN_LEN) {
      setLoading(true)
      await new Promise(r => setTimeout(r, 900))
      setLoading(false)
      onSuccess()
    }
  }, [pin, onSuccess])

  return (
    <div className="lgn__tab-content">
      <div className="lgn__mpin-display">
        {Array.from({ length: PIN_LEN }).map((_, i) => (
          <span key={i} className={`lgn__mpin-dot${i < pin.length ? ' lgn__mpin-dot--filled' : ''}`} />
        ))}
      </div>
      <div className="lgn__mpin-keypad">
        {KEYS.map((k, i) => {
          if (k === '') return <span key={i} className="lgn__mpin-key lgn__mpin-key--empty" />
          return (
            <button
              key={i}
              type="button"
              className={`lgn__mpin-key${k === 'del' ? ' lgn__mpin-key--delete' : ''}`}
              onClick={() => handleKey(k)}
              disabled={loading}
              aria-label={k === 'del' ? 'Delete' : k}
            >
              {k === 'del' ? '⌫' : k}
            </button>
          )
        })}
      </div>
      {loading && (
        <div className="lgn__mpin-loading">
          <AuraPlatinumButton size="md" loading={true} showArrow={false}>Verifying</AuraPlatinumButton>
        </div>
      )}
      <div className="lgn__biometric">
        <div className="lgn__biometric-row">
          <button type="button" className="lgn__biometric-btn" aria-label="Face ID">⬡</button>
          <button type="button" className="lgn__biometric-btn" aria-label="Fingerprint">◈</button>
        </div>
        <span className="lgn__biometric-label">or use biometrics</span>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────
export default function LoginPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const tabs = isMobile ? TABS_MOBILE : TABS_DESKTOP
  const [activeTabId, setActiveTabId] = useState('otp')

  const { cylinderRef, stageRef } = useVerticalCarousel(CARDS.length)

  useEffect(() => {
    const ids = tabs.map(t => t.id)
    if (!ids.includes(activeTabId)) setActiveTabId('otp')
  }, [isMobile])

  useEffect(() => {
    const prev = document.documentElement.getAttribute('data-theme')
    document.documentElement.setAttribute('data-theme', 'dark')
    document.body.style.overflow = 'hidden'
    return () => {
      if (prev) document.documentElement.setAttribute('data-theme', prev)
      document.body.style.overflow = ''
    }
  }, [])

  const handleSuccess = () => navigate('/app')

  return (
    <div className="lgn">

      {/* ── LEFT: Carousel — no panel label ── */}
      <div className="lgn__carousel-panel">
        <div className="lgn__carousel-stage" ref={stageRef}>
          <div className="lgn__cylinder" ref={cylinderRef}>
            {CARDS.map(card => <AuraCard key={card.id} card={card} />)}
          </div>
        </div>
        <div className="lgn__mobile-hero">
          <AuraCard card={CARDS[0]} isMobileHero />
        </div>
      </div>

      {/* ── RIGHT: Auth panel ── */}
      <div className="lgn__auth-panel">
        <div className="lgn__auth-card">

          {/* Brand */}
          <div className="lgn__brand">
            <div className="lgn__brand-lockup">
              <img
                src="/Logo1.svg"
                alt="Aura Finance"
                className="lgn__brand-logo"
                onError={e => {
                  e.currentTarget.style.display = 'none'
                  e.currentTarget.nextElementSibling.removeAttribute('hidden')
                }}
              />
              <div className="lgn__brand-logo-fallback" hidden>A</div>
              <div className="lgn__brand-wordmark-stack">
                <span className="lgn__brand-wordmark-name">AURA</span>
              </div>
            </div>
            <p className="lgn__brand-tagline">Explore. Navigate. Prosper.</p>
          </div>

          {/* Heading */}
          <div className="lgn__heading-block">
            <h1 className="lgn__heading-title">Continue Your Journey</h1>
            <p className="lgn__heading-sub">Sign in to access your financial universe.</p>
          </div>

          {/* AuraTabs */}
          <AuraTabs
            tabs={tabs}
            activeId={activeTabId}
            onChange={setActiveTabId}
            full
          />

          {/* Tab panels */}
          {activeTabId === 'otp'      && <TabMobileOTP onSuccess={handleSuccess} />}
          {activeTabId === 'password' && (
            <TabCustomerID
              onSuccess={handleSuccess}
              onSwitchToOTP={() => setActiveTabId('otp')}
            />
          )}
          {activeTabId === 'mpin' && isMobile && <TabMPIN onSuccess={handleSuccess} />}

          {/* Footer */}
          <div className="lgn__auth-footer">
            <button className="lgn__ghost-link">Create Account</button>
            <span className="lgn__auth-footer-sep">·</span>
            <button className="lgn__ghost-link">Need Help?</button>
            <span className="lgn__auth-footer-sep">·</span>
            <button className="lgn__ghost-link">Contact Support</button>
          </div>

          {/* Security */}
          <div className="lgn__security">
            <div className="lgn__security-inner">
              <div className="lgn__security-icon-wrap"><ShieldIcon /></div>
              <div className="lgn__security-copy">
                <span className="lgn__security-title">Bank-Grade Security</span>
                <span className="lgn__security-detail">256-bit Encryption · Secure Infrastructure</span>
                <span className="lgn__security-detail">Your data is always protected.</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
