// ═══════════════════════════════════════════════════════════════
// AskAura.jsx — Global floating AI companion
// Draggable, snaps to edge, resets to bottom-right on refresh.
// Mounts once in App.jsx, persists across all screens.
// ═══════════════════════════════════════════════════════════════
import { useState, useRef, useEffect, useCallback } from 'react'
import './AskAura.css'

// ── Anthropic API call ────────────────────────────────────────
async function callAura(messages) {
  const systemPrompt = `You are Aura, a friendly and financially intelligent AI companion for the Aura Finance app by Neural Nexus FinTech.

Your personality:
- Warm, approachable, and encouraging — never judgmental
- Financially smart but never corporate or stiff
- Speak like a knowledgeable friend, not a bank teller
- Proactive: spot opportunities and risks before the user asks
- Keep responses concise and conversational (2–4 sentences max unless asked for detail)

Examples of your tone:
- Instead of "Your spending increased by 18%." say "I noticed your spending was a little higher this month — want me to break down what's driving it?"
- Instead of "Credit card payment due." say "Just a heads-up — your credit card payment is coming up soon. Let's make sure you avoid any late fees."

You can help with: spending analysis, budgeting, credit scores, investment insights, savings goals, transaction search, and general financial questions.

Always end with a helpful follow-up offer when relevant.`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  })

  if (!response.ok) throw new Error('API error')
  const data = await response.json()
  return data.content.map(b => b.text || '').join('')
}

// ── Snap to nearest edge ──────────────────────────────────────
// SNAP_MARGIN = how far from the viewport edge Aura rests after snap.
// Matches the intentional breathing room of the default position.
const BTN_SIZE   = 72
const SNAP_MARGIN = 28   // edge gap after snapping — premium, not pinned
const DRAG_MARGIN = 12   // minimum gap while dragging

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
  'Where did I spend the most this month?',
  'How much can I safely save this month?',
  'Show subscriptions I can cancel.',
  'Why did my Aura Score change?',
  'When is my next credit card due?',
]

// ═══════════════════════════════════════════════════════════════
export default function AskAura() {

  // Default: bottom-right with intentional breathing room — not pinned to corner
  const defaultPos = useCallback(() => ({
    x: window.innerWidth  - BTN_SIZE - 32,
    y: window.innerHeight - BTN_SIZE - 40,
  }), [])

  const [pos,         setPos]        = useState(defaultPos)
  const [isDragging,  setIsDragging] = useState(false)
  const [hasMoved,    setHasMoved]   = useState(false)
  const [open,        setOpen]       = useState(false)
  const [messages,    setMessages]   = useState([
    { role: 'assistant', content: "Hey! I'm Aura 👋 Your personal finance companion. Ask me anything about your money." }
  ])
  const [input,       setInput]      = useState('')
  const [status,      setStatus]     = useState('idle') // idle | thinking | responding | listening
  const [isListening, setIsListening] = useState(false)

  const dragRef        = useRef({ startX: 0, startY: 0 })
  const btnRef         = useRef(null)
  const chatEndRef     = useRef(null)
  const inputRef       = useRef(null)
  const recognitionRef = useRef(null)

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, status])

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150)
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
      const reply = await callAura(next.map(m => ({ role: m.role, content: m.content })))
      setStatus('responding')
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
      setTimeout(() => setStatus('idle'), 800)
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having a little trouble connecting right now. Try again in a moment!" }])
      setStatus('idle')
    }
  }, [input, messages])

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  // ── Voice input ───────────────────────────────────────────
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
    rec.lang = 'en-US'
    rec.interimResults = false
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setInput(transcript)
      setIsListening(false)
      setStatus('idle')
      send(transcript)
    }
    rec.onerror = () => { setIsListening(false); setStatus('idle') }
    rec.onend   = () => { setIsListening(false); setStatus('idle') }
    recognitionRef.current = rec
    rec.start()
    setIsListening(true)
    setStatus('listening')
  }, [isListening, send])

  // ── Panel positioning ─────────────────────────────────────
  const panelSide  = pos.x > window.innerWidth / 2 ? 'left' : 'right'
  const stateClass = isDragging       ? 'dragging'
    : isListening                     ? 'listening'
    : status === 'thinking'           ? 'thinking'
    : status === 'responding'         ? 'responding'
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

        {/* Mascot SVG */}
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
              <img
                src="/Mascot - Aura.svg"
                alt="Aura"
                className="aura-panel__mascot"
                draggable={false}
              />
            </div>
            <div>
              <div className="aura-panel__name">Aura</div>
              <div className={`aura-panel__status aura-panel__status--${stateClass}`}>
                {status === 'thinking'   ? 'Thinking…'
               : status === 'responding' ? 'Responding…'
               : isListening             ? 'Listening…'
               : 'Online'}
              </div>
            </div>
            <button className="aura-panel__close" onClick={() => setOpen(false)}>✕</button>
          </div>

          {/* Messages */}
          <div className="aura-panel__messages">
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
          </div>

          {/* Suggestions — only on opening message */}
          {messages.length === 1 && (
            <div className="aura-panel__suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="aura-suggestion" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div className="aura-panel__input-row">
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
          </div>
        </div>
      )}
    </>
  )
}
