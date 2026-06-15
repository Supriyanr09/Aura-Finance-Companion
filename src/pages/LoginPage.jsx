// LoginPage.jsx — route: "/login"
// Styles: src/styles/login.css (.lgn- namespace)
//
// Hover (this session):
//   No translateZ, no scale change, no rotateX/Y on hover.
//   Hover = CSS class toggle only -> filter brightness + animation speed.
//   Each card has its own unique ambient SVG animation identity.

import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate }    from 'react-router-dom'
import AuraPlatinumButton from '../components/ui/AuraPlatinumButton'
import AuraTabs           from '../components/ui/AuraTabs'
import IconTextButton     from '../components/ui/IconTextButton'
import { useUser }        from '../context/UserContext'
import { USERS }          from '../data/mockData'

const CARDS = [
  { id: 'platinum',  name: 'Aura Platinum',  member: 'Member Since 2026', number: '•••• •••• •••• 4821' },
  { id: 'signature', name: 'Aura Signature', member: 'Member Since 2026', number: '•••• •••• •••• 7634' },
  { id: 'wealth',    name: 'Aura Wealth',    member: 'Member Since 2026', number: '•••• •••• •••• 2901' },
  { id: 'business',  name: 'Aura Business',  member: 'Member Since 2026', number: '•••• •••• •••• 5513' },
  { id: 'infinite',  name: 'Aura Infinite',  member: 'Member Since 2026', number: '•••• •••• •••• 0001' },
  { id: 'travel',    name: 'Aura Travel',    member: 'Member Since 2026', number: '•••• •••• •••• 3347' },
  { id: 'rewards',   name: 'Aura Rewards',   member: 'Member Since 2026', number: '•••• •••• •••• 8820' },
  { id: 'reserve',   name: 'Aura Reserve',   member: 'Member Since 2026', number: '•••• •••• •••• 6614' },
  { id: 'edge',      name: 'Aura Edge',      member: 'Member Since 2026', number: '•••• •••• •••• 1192' },
  { id: 'freedom',   name: 'Aura Freedom',   member: 'Member Since 2026', number: '•••• •••• •••• 9900' },
]

const TABS_DESKTOP = [
  { id: 'otp',      label: 'Mobile OTP'  },
  { id: 'password', label: 'Customer ID' },
]

const TABS_MOBILE = [
  { id: 'otp',      label: 'Mobile OTP'  },
  { id: 'password', label: 'Customer ID' },
  { id: 'mpin',     label: 'MPIN'        },
]

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handler, { passive: true })
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

// Vertical conveyor carousel.
// No hover transforms. Carousel position only.
// Hover = .lgn__card--hovered class toggle -> CSS handles the rest.
function useVerticalCarousel(count) {
  const containerRef  = useRef(null)
  const stageRef      = useRef(null)
  const progressRef   = useRef(0)
  const velRef        = useRef(0.012)
  const panelMouseRef = useRef({ x: 0.5, y: 0.5 })
  const panelTiltYRef = useRef(0)
  const hoveredIdxRef = useRef(-1)
  const rafRef        = useRef(null)

  const SLOT_HEIGHT    = 160
  const FADE_THRESHOLD = 1.6
  const FADE_START     = 0.85
  const INERTIA        = 0.06

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return
    const onMove = (e) => {
      const r = stage.getBoundingClientRect()
      panelMouseRef.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }
    }
    stage.addEventListener('mousemove', onMove, { passive: true })
    return () => stage.removeEventListener('mousemove', onMove)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const cards = Array.from(container.querySelectorAll('.lgn__card'))
    const handlers = cards.map((card, i) => {
      const onEnter = () => { hoveredIdxRef.current = i }
      const onLeave = () => { if (hoveredIdxRef.current === i) hoveredIdxRef.current = -1 }
      card.addEventListener('mouseenter', onEnter)
      card.addEventListener('mouseleave', onLeave)
      return { card, onEnter, onLeave }
    })
    return () => handlers.forEach(({ card, onEnter, onLeave }) => {
      card.removeEventListener('mouseenter', onEnter)
      card.removeEventListener('mouseleave', onLeave)
    })
  }, []) // eslint-disable-line

  useEffect(() => {
    const tick = () => {
      progressRef.current += velRef.current
      const targetTilt = (panelMouseRef.current.x - 0.5) * 4
      panelTiltYRef.current += (targetTilt - panelTiltYRef.current) * INERTIA
      const rotY = panelTiltYRef.current.toFixed(2)

      const container = containerRef.current
      if (!container) { rafRef.current = requestAnimationFrame(tick); return }

      container.querySelectorAll('.lgn__card').forEach((card, i) => {
        let offset = i - (progressRef.current % count)
        const half = count / 2
        while (offset >  half) offset -= count
        while (offset < -half) offset += count
        const absOffset = Math.abs(offset)

        if (absOffset > FADE_THRESHOLD) {
          card.style.visibility    = 'hidden'
          card.style.opacity       = '0'
          card.style.pointerEvents = 'none'
          card.classList.remove('lgn__card--hovered')
          return
        }

        card.style.visibility = 'visible'
        const y     = offset * SLOT_HEIGHT
        const scale = Math.max(0.72, 1 - absOffset * 0.14)
        let opacity = 1
        if (absOffset > FADE_START) {
          opacity = 1 - Math.min(1, (absOffset - FADE_START) / (FADE_THRESHOLD - FADE_START))
        }

        // Carousel transform only -- no hover lift/tilt/translateZ
        card.style.transform     = `translateY(${y.toFixed(1)}px) scale(${scale.toFixed(3)}) rotateY(${rotY}deg)`
        card.style.opacity       = opacity.toFixed(3)
        card.style.zIndex        = String(100 - Math.round(absOffset * 10))
        card.style.pointerEvents = opacity < 0.05 ? 'none' : 'auto'
        card.classList.toggle('lgn__card--hovered', hoveredIdxRef.current === i)
      })

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [count]) // eslint-disable-line

  return { cylinderRef: containerRef, stageRef }
}

// Per-card unique ambient SVG animations.
// Each card has its own visual identity. All CSS keyframes in login.css.
// CSS custom property --anim-dur controls speed; halved on .lgn__card--hovered.
function CardAmbient({ id }) {
  if (id === 'platinum') return (
    <svg className="lgn__card-ambient" viewBox="0 0 226 140" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="plat-sweep" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="rgba(255,255,255,0)" />
          <stop offset="48%"  stopColor="rgba(255,255,255,0.08)" />
          <stop offset="50%"  stopColor="rgba(255,255,255,0.16)" />
          <stop offset="52%"  stopColor="rgba(255,255,255,0.08)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>
      <rect className="lgn-anim-plat-sweep" x="-226" y="0" width="226" height="140" fill="url(#plat-sweep)" />
    </svg>
  )
  if (id === 'signature') return (
    <svg className="lgn__card-ambient" viewBox="0 0 226 140" fill="none" aria-hidden="true">
      <line className="lgn-anim-sig-line1" x1="-40" y1="0" x2="40" y2="140" stroke="rgba(255,255,255,0.09)" strokeWidth="16" />
      <line className="lgn-anim-sig-line2" x1="-20" y1="0" x2="60" y2="140" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
    </svg>
  )
  if (id === 'wealth') return (
    <svg className="lgn__card-ambient" viewBox="0 0 226 140" fill="none" aria-hidden="true">
      <path className="lgn-anim-wealth-c1" d="M0 90 Q56 40 113 70 Q170 100 226 50" stroke="rgba(110,231,183,0.11)" strokeWidth="1.2" fill="none" />
      <path className="lgn-anim-wealth-c2" d="M0 110 Q56 60 113 90 Q170 120 226 70" stroke="rgba(110,231,183,0.07)" strokeWidth="1" fill="none" />
      <path className="lgn-anim-wealth-c3" d="M0 70 Q56 20 113 50 Q170 80 226 30" stroke="rgba(110,231,183,0.05)" strokeWidth="0.8" fill="none" />
    </svg>
  )
  if (id === 'business') return (
    <svg className="lgn__card-ambient" viewBox="0 0 226 140" fill="none" aria-hidden="true">
      <rect x="90" y="0" width="136" height="140" fill="none" stroke="rgba(253,211,77,0.05)" strokeWidth="0.8" />
      <rect x="90" y="35" width="136" height="70" fill="rgba(253,211,77,0.02)" stroke="rgba(253,211,77,0.05)" strokeWidth="0.8" />
      <line x1="118" y1="0" x2="118" y2="140" stroke="rgba(253,211,77,0.04)" strokeWidth="0.8" />
      <line x1="146" y1="0" x2="146" y2="140" stroke="rgba(253,211,77,0.04)" strokeWidth="0.8" />
      <line x1="174" y1="0" x2="174" y2="140" stroke="rgba(253,211,77,0.03)" strokeWidth="0.8" />
      <rect className="lgn-anim-biz-pulse" x="90" y="0" width="136" height="140" fill="none" stroke="rgba(253,211,77,0.12)" strokeWidth="1" />
    </svg>
  )
  if (id === 'infinite') return (
    <svg className="lgn__card-ambient" viewBox="0 0 226 140" fill="none" aria-hidden="true">
      <circle className="lgn-anim-inf-r1" cx="113" cy="70" r="18" stroke="rgba(255,255,255,0.11)" strokeWidth="1" fill="none" />
      <circle className="lgn-anim-inf-r2" cx="113" cy="70" r="18" stroke="rgba(255,255,255,0.07)" strokeWidth="1" fill="none" />
      <circle className="lgn-anim-inf-r3" cx="113" cy="70" r="18" stroke="rgba(255,255,255,0.04)" strokeWidth="1" fill="none" />
    </svg>
  )
  if (id === 'travel') return (
    <svg className="lgn__card-ambient" viewBox="0 0 226 140" fill="none" aria-hidden="true">
      <g className="lgn-anim-travel-orbit" style={{ transformOrigin: '113px 70px' }}>
        <ellipse cx="113" cy="70" rx="78" ry="28" stroke="rgba(125,211,252,0.09)" strokeWidth="1" fill="none" />
        <ellipse cx="113" cy="70" rx="52" ry="18" stroke="rgba(125,211,252,0.06)" strokeWidth="0.8" fill="none" />
        <circle cx="191" cy="70" r="3" fill="rgba(125,211,252,0.16)" />
      </g>
    </svg>
  )
  if (id === 'rewards') return (
    <svg className="lgn__card-ambient" viewBox="0 0 226 140" fill="none" aria-hidden="true">
      <line x1="90" y1="35"  x2="136" y2="70" stroke="rgba(167,139,250,0.09)" strokeWidth="0.8" />
      <line x1="136" y1="70" x2="90"  y2="105" stroke="rgba(167,139,250,0.09)" strokeWidth="0.8" />
      <line x1="136" y1="70" x2="190" y2="48"  stroke="rgba(167,139,250,0.07)" strokeWidth="0.8" />
      <line x1="136" y1="70" x2="190" y2="96"  stroke="rgba(167,139,250,0.07)" strokeWidth="0.8" />
      <circle className="lgn-anim-rew-n1" cx="136" cy="70"  r="4" fill="rgba(167,139,250,0.17)" />
      <circle className="lgn-anim-rew-n2" cx="90"  cy="35"  r="3" fill="rgba(167,139,250,0.11)" />
      <circle className="lgn-anim-rew-n3" cx="90"  cy="105" r="3" fill="rgba(167,139,250,0.11)" />
      <circle cx="190" cy="48" r="2.5" fill="rgba(167,139,250,0.08)" />
      <circle cx="190" cy="96" r="2.5" fill="rgba(167,139,250,0.08)" />
    </svg>
  )
  if (id === 'reserve') return (
    <svg className="lgn__card-ambient" viewBox="0 0 226 140" fill="none" aria-hidden="true">
      <circle className="lgn-anim-res-p1" cx="140" cy="45"  r="2"   fill="rgba(255,255,255,0.17)" />
      <circle className="lgn-anim-res-p2" cx="172" cy="82"  r="1.5" fill="rgba(255,255,255,0.11)" />
      <circle className="lgn-anim-res-p3" cx="155" cy="112" r="1.5" fill="rgba(255,255,255,0.09)" />
      <circle className="lgn-anim-res-p4" cx="196" cy="55"  r="1"   fill="rgba(255,255,255,0.13)" />
      <circle className="lgn-anim-res-p5" cx="112" cy="95"  r="1"   fill="rgba(255,255,255,0.09)" />
      <circle className="lgn-anim-res-p6" cx="186" cy="102" r="1.5" fill="rgba(255,255,255,0.07)" />
    </svg>
  )
  if (id === 'edge') return (
    <svg className="lgn__card-ambient" viewBox="0 0 226 140" fill="none" aria-hidden="true">
      <rect className="lgn-anim-edge-trace" x="2" y="2" width="222" height="136" rx="10"
        stroke="rgba(255,255,255,0.14)" strokeWidth="1.2" fill="none"
        strokeDasharray="716" strokeDashoffset="716" />
    </svg>
  )
  if (id === 'freedom') return (
    <svg className="lgn__card-ambient" viewBox="0 0 226 140" fill="none" aria-hidden="true">
      <path className="lgn-anim-free-w1" d="M0 80 Q28 65 56 80 Q84 95 113 80 Q141 65 169 80 Q197 95 226 80" stroke="rgba(110,231,183,0.09)" strokeWidth="1.2" fill="none" />
      <path className="lgn-anim-free-w2" d="M0 95 Q28 80 56 95 Q84 110 113 95 Q141 80 169 95 Q197 110 226 95" stroke="rgba(110,231,183,0.06)" strokeWidth="1" fill="none" />
      <path className="lgn-anim-free-w3" d="M0 65 Q28 50 56 65 Q84 80 113 65 Q141 50 169 65 Q197 80 226 65" stroke="rgba(110,231,183,0.04)" strokeWidth="0.8" fill="none" />
    </svg>
  )
  return null
}

function AuraCard({ card, isMobileHero }) {
  return (
    <div className={`lgn__card lgn__card--${card.id}${isMobileHero ? ' lgn__card--hero' : ''}`}>
      <div className="lgn__card-face">
        <CardAmbient id={card.id} />
        <div className="lgn__card-reflection" aria-hidden="true" />

        <div className="lgn__card-header">
          <span className="lgn__card-logo-text">AURA</span>
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

        <div className="lgn__card-edge" />
      </div>
    </div>
  )
}

function EyeIcon({ open }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="M9 12l2 2 4-4"/>
    </svg>
  )
}

function ArrowIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  )
}

function TabMobileOTP({ onSuccess }) {
  const [mobile,  setMobile]  = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otp,     setOtp]     = useState(['','','','','',''])
  const [timer,   setTimer]   = useState(30)
  const [loading, setLoading] = useState(false)
  const [agreed,  setAgreed]  = useState(false)
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
    setLoading(false); setOtpSent(true); setTimer(30)
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
    setLoading(false); onSuccess()
  }

  if (!otpSent) return (
    <form className="lgn__tab-content" onSubmit={handleSend}>
      <div className="lgn__field">
        <label className="lgn__field-label">Mobile Number</label>
        <div className="lgn__field-wrapper">
          <input className="lgn__input" type="tel" placeholder="+91 98765 43210"
            value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))} autoComplete="tel" />
          <div className="lgn__field-underline" aria-hidden="true" />
        </div>
      </div>
      <label className="lgn__agree">
        <input type="checkbox" className="lgn__agree-checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
        <span className="lgn__agree-box" aria-hidden="true" />
        <span className="lgn__agree-text">
          I agree to the <button type="button" className="lgn__agree-link">Terms &amp; Conditions</button> and <button type="button" className="lgn__agree-link">Privacy Policy</button>
        </span>
      </label>
      <AuraPlatinumButton type="submit" size="md" loading={loading} showArrow={!loading} disabled={!agreed}>Send OTP</AuraPlatinumButton>
    </form>
  )

  return (
    <form className="lgn__tab-content" onSubmit={handleVerify}>
      <div className="lgn__otp-sent-row">
        <span className="lgn__otp-sent-hint">OTP sent to +91 {mobile.slice(0, 5)}•••••</span>
        <IconTextButton
          variant="default"
          size="sm"
          onClick={() => { setOtpSent(false); setOtp(['','','','','','']) }}
          icon={
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
            </svg>
          }
        >
          Edit
        </IconTextButton>
      </div>
      <div className="lgn__field">
        <label className="lgn__field-label">Enter OTP</label>
        <div className="lgn__otp-row">
          {otp.map((d, i) => (
            <input key={i} ref={el => { otpRefs.current[i] = el }}
              className={`lgn__otp-input${d ? ' lgn__otp-input--filled' : ''}`}
              type="text" inputMode="numeric" maxLength={1} value={d}
              onChange={e => handleChange(i, e.target.value)} onKeyDown={e => handleKey(i, e)} />
          ))}
        </div>
      </div>
      <div className="lgn__resend-row">
        {timer > 0 ? <span>Resend in {timer}s</span>
          : <button type="button" className="lgn__ghost-link"
              onClick={() => { setOtpSent(false); setOtp(['','','','','','']); setTimer(30) }}>Resend OTP</button>}
      </div>
      <AuraPlatinumButton type="submit" size="md" loading={loading} showArrow={!loading}>Verify &amp; Continue</AuraPlatinumButton>
      <button type="button" className="lgn__cta--secondary" onClick={() => { setOtpSent(false); setOtp(['','','','','','']) }}>
        Change Number
      </button>
    </form>
  )
}

function TabCustomerID({ onSuccess, onSwitchToOTP }) {
  const [id,       setId]       = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [agreed,   setAgreed]   = useState(false)
  const { loginUser } = useUser()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!id.trim() || !password.trim()) { setError('Please fill in all fields.'); return }
    const matchedUser = USERS[id.toUpperCase()]
    if (!matchedUser || matchedUser.mpin !== password) {
      setError('Invalid Customer ID or password.')
      return
    }
    setError(''); setLoading(true)
    await new Promise(r => setTimeout(r, 1200))
    loginUser(id)
    setLoading(false); onSuccess()
  }

  return (
    <form className="lgn__tab-content" onSubmit={handleSubmit}>
      <div className="lgn__field">
        <label className="lgn__field-label">Customer ID</label>
        <div className="lgn__field-wrapper">
          <input className={`lgn__input${error ? ' lgn__input--error' : ''}`} type="text" placeholder="e.g. AURA2841064"
            value={id} onChange={e => { setId(e.target.value); setError('') }} autoComplete="username" />
          <div className="lgn__field-underline" aria-hidden="true" />
        </div>
      </div>
      <div className="lgn__field">
        <label className="lgn__field-label">Password</label>
        <div className="lgn__field-wrapper">
          <input className={`lgn__input lgn__input--has-action${error ? ' lgn__input--error' : ''}`}
            type={showPass ? 'text' : 'password'} placeholder="Your password"
            value={password} onChange={e => { setPassword(e.target.value); setError('') }} autoComplete="current-password" />
          <button type="button" className="lgn__field-action" onClick={() => setShowPass(p => !p)}
            aria-label={showPass ? 'Hide password' : 'Show password'}><EyeIcon open={showPass} /></button>
          <div className="lgn__field-underline" aria-hidden="true" />
        </div>
        {error && <span className="lgn__field-error">{error}</span>}
      </div>
      <div className="lgn__options-row">
        <label className="lgn__checkbox-label">
          <input className="lgn__checkbox" type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
          Remember me
        </label>
        <button type="button" className="lgn__ghost-link">Forgot password?</button>
      </div>
      <label className="lgn__agree">
        <input type="checkbox" className="lgn__agree-checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
        <span className="lgn__agree-box" aria-hidden="true" />
        <span className="lgn__agree-text">
          I agree to the <button type="button" className="lgn__agree-link">Terms &amp; Conditions</button> and <button type="button" className="lgn__agree-link">Privacy Policy</button>
        </span>
      </label>
      <AuraPlatinumButton type="submit" size="md" loading={loading} showArrow={!loading} disabled={!agreed}>Sign In</AuraPlatinumButton>
      <button type="button" className="lgn__ghost-link lgn__ghost-link--block" onClick={onSwitchToOTP}>
        Continue with Mobile OTP <ArrowIcon />
      </button>
    </form>
  )
}

function TabMPIN({ onSuccess }) {
  const [pin,     setPin]     = useState([])
  const [loading, setLoading] = useState(false)
  const PIN_LEN = 6
  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','del']

  const handleKey = useCallback(async (val) => {
    if (val === 'del') { setPin(p => p.slice(0, -1)); return }
    if (pin.length >= PIN_LEN) return
    const next = [...pin, val]; setPin(next)
    if (next.length === PIN_LEN) {
      setLoading(true)
      await new Promise(r => setTimeout(r, 900))
      setLoading(false); onSuccess()
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
            <button key={i} type="button"
              className={`lgn__mpin-key${k === 'del' ? ' lgn__mpin-key--delete' : ''}`}
              onClick={() => handleKey(k)} disabled={loading} aria-label={k === 'del' ? 'Delete' : k}>
              {k === 'del' ? '\u232B' : k}
            </button>
          )
        })}
      </div>
      {loading && <div className="lgn__mpin-loading"><AuraPlatinumButton size="md" loading={true} showArrow={false}>Verifying</AuraPlatinumButton></div>}
      <div className="lgn__biometric">
        <div className="lgn__biometric-row">
          <button type="button" className="lgn__biometric-btn" aria-label="Face ID">Face</button>
          <button type="button" className="lgn__biometric-btn" aria-label="Fingerprint">Touch</button>
        </div>
        <span className="lgn__biometric-label">or use biometrics</span>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const navigate  = useNavigate()
  const isMobile  = useIsMobile()
  const tabs      = isMobile ? TABS_MOBILE : TABS_DESKTOP
  const [activeTabId, setActiveTabId] = useState('otp')
  const { cylinderRef, stageRef } = useVerticalCarousel(CARDS.length)

  useEffect(() => {
    const ids = tabs.map(t => t.id)
    if (!ids.includes(activeTabId)) setActiveTabId('otp')
  }, [isMobile]) // eslint-disable-line

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

      <div className="lgn__auth-panel">
        <div className="lgn__auth-card">
          <div className="lgn__brand">
            <div className="lgn__brand-lockup">
              <img src="/Logo1.svg" alt="Aura Finance" className="lgn__brand-logo"
                onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling.removeAttribute('hidden') }} />
              <div className="lgn__brand-logo-fallback" hidden>A</div>
              <div className="lgn__brand-wordmark-stack">
                <span className="lgn__brand-wordmark-name">AURA</span>
              </div>
            </div>
            <p className="lgn__brand-tagline">Explore. Navigate. Prosper.</p>
          </div>

          <div className="lgn__heading-block">
            <h1 className="lgn__heading-title">Continue Your Journey</h1>
            <p className="lgn__heading-sub">Sign in to access your financial universe.</p>
          </div>

          <AuraTabs tabs={tabs} activeId={activeTabId} onChange={setActiveTabId} full variant="dark" />

          {activeTabId === 'otp'      && <TabMobileOTP onSuccess={handleSuccess} />}
          {activeTabId === 'password' && <TabCustomerID onSuccess={handleSuccess} onSwitchToOTP={() => setActiveTabId('otp')} />}
          {activeTabId === 'mpin' && isMobile && <TabMPIN onSuccess={handleSuccess} />}

          <div className="lgn__auth-footer">
            <button className="lgn__ghost-link">Create Account</button>
            <span className="lgn__auth-footer-sep">.</span>
            <button className="lgn__ghost-link">Need Help?</button>
            <span className="lgn__auth-footer-sep">.</span>
            <button className="lgn__ghost-link">Contact Support</button>
          </div>

          <div className="lgn__security">
            <div className="lgn__security-inner">
              <div className="lgn__security-icon-wrap"><ShieldIcon /></div>
              <div className="lgn__security-copy">
                <span className="lgn__security-title">Bank-Grade Security</span>
                <span className="lgn__security-detail">256-bit Encryption</span>
                <span className="lgn__security-detail">Your data is always protected.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
