// ═══════════════════════════════════════════════════════════════
// FraudSlideOut.jsx — FraudShield AI dispute flow
// Stages 4 → 8. Slide-out panel, no navigation.
// All icons from @phosphor-icons/react only.
// ═══════════════════════════════════════════════════════════════
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ShieldWarning, Warning,
  DeviceMobile, UserCircle, Alien,
  ArrowRight, ArrowLeft,
  CheckCircle, CheckSquare,
  ShieldCheck, Lock, SignOut, Prohibit,
  CopySimple, Checks,
} from '@phosphor-icons/react'
import './FraudSlideOut.css'
import { FMT } from '../../data/mockData'
import Button from './Button'

// ── Data ───────────────────────────────────────────────────────
const ASSESSMENT_OPTIONS = [
  { id: 'not_me',     icon: Warning,       label: "I didn't make this payment"      },
  { id: 'lost_phone', icon: DeviceMobile,  label: 'My phone is lost or stolen'      },
  { id: 'pin_exposed',icon: Lock,          label: 'Someone may know my UPI PIN'     },
  { id: 'scam',       icon: UserCircle,    label: 'I was tricked into sending money' },
  { id: 'other',      icon: Alien,         label: 'Other'                            },
]

const PROTECTION_ACTIONS = {
  not_me:     [
    { id: 'disable_upi',    icon: Prohibit,    label: 'Disable UPI temporarily'    },
    { id: 'block_bene',     icon: ShieldCheck, label: 'Block this beneficiary'      },
    { id: 'logout_all',     icon: SignOut,     label: 'Logout all devices'          },
    { id: 'reset_creds',    icon: Lock,        label: 'Reset UPI PIN'               },
  ],
  lost_phone: [
    { id: 'disable_access', icon: Prohibit,    label: 'Disable banking access'      },
    { id: 'freeze_pay',     icon: ShieldCheck, label: 'Freeze payment methods'      },
    { id: 'secure_device',  icon: DeviceMobile,label: 'Secure linked devices'       },
  ],
  pin_exposed:[
    { id: 'disable_upi',    icon: Prohibit,    label: 'Disable UPI temporarily'     },
    { id: 'reset_creds',    icon: Lock,        label: 'Reset UPI PIN immediately'   },
    { id: 'logout_all',     icon: SignOut,     label: 'Logout all devices'          },
  ],
  scam:       [
    { id: 'raise_dispute',  icon: ShieldCheck, label: 'Raise dispute'               },
    { id: 'cyber_complaint',icon: Warning,     label: 'File cybercrime complaint'   },
    { id: 'evidence',       icon: CopySimple,  label: 'Generate evidence report'    },
  ],
  other:      [
    { id: 'raise_dispute',  icon: ShieldCheck, label: 'Raise dispute'               },
    { id: 'block_bene',     icon: Prohibit,    label: 'Block this beneficiary'      },
  ],
}

const TIMELINE_STEPS = [
  { id: 'reported',   label: 'Reported',           done: true,  time: 'Just now'              },
  { id: 'review',     label: 'Under Review',        done: true,  time: 'In progress'           },
  { id: 'bank',       label: 'Bank Investigation',  done: false, time: 'Expected within 24h'   },
  { id: 'resolution', label: 'Resolution Pending',  done: false, time: 'Expected within 7 days'},
  { id: 'closed',     label: 'Closed',              done: false, time: 'After resolution'      },
]

function generateCaseId() {
  const date = new Date().toISOString().slice(0,10).replace(/-/g,'')
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `FS-${date}-${rand}`
}

function getProtectionStatus(dateStr) {
  const now          = new Date()
  const parsed       = new Date(`${dateStr} ${now.getFullYear()}`)
  const hoursElapsed = isNaN(parsed) ? 0 : (now - parsed) / 36e5
  const hoursLeft72  = Math.max(0, 72 - hoursElapsed)

  if (hoursElapsed < 24) {
    return { dot: 'green', label: 'Strong Protection Window', time: null }
  } else if (hoursElapsed < 72) {
    const d = Math.floor(hoursLeft72 / 24)
    const h = Math.round(hoursLeft72 % 24)
    return { dot: 'yellow', label: 'Protection Window Active', time: `${d}d ${h}h remaining` }
  }
  return { dot: 'red', label: 'Delayed Reporting', time: null }
}

// ── Stage 4 — Assessment ───────────────────────────────────────
function StageAssessment({ onSelect }) {
  return (
    <div className="fsd__stage">
      <div className="fsd__stage-title">Help me understand what happened.</div>
      <p className="fsd__stage-sub">This helps Aura route your case and recommend the right actions.</p>
      <div className="fsd__options">
        {ASSESSMENT_OPTIONS.map(opt => {
          const Icon = opt.icon
          return (
            <motion.button
              key={opt.id}
              className="fsd__option"
              onClick={() => onSelect(opt)}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="fsd__option-icon">
                <Icon size={17} weight="duotone" />
              </div>
              <span className="fsd__option-label">{opt.label}</span>
              <ArrowRight size={13} className="fsd__option-arrow" />
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// ── Stage 5 — Protection ───────────────────────────────────────
function StageProtection({ actions, onToggle, onNext }) {
  const done    = actions.filter(a => a.done).length
  const anyDone = done > 0

  return (
    <div className="fsd__stage">
      <div className="fsd__stage-title">Secure your account now.</div>
      <p className="fsd__stage-sub">
        Complete each step. Aura will confirm once your account is protected.
      </p>
      <div className="fsd__actions-list">
        {actions.map(action => (
          <motion.button
            key={action.id}
            className={`fsd__action-item${action.done ? ' fsd__action-item--done' : ''}`}
            onClick={() => onToggle(action.id)}
            whileTap={{ scale: 0.97 }}
          >
            <div className={`fsd__action-check${action.done ? ' fsd__action-check--done' : ''}`}>
              {action.done && <CheckCircle size={13} weight="fill" />}
            </div>
            <span className="fsd__action-label">{action.label}</span>
          </motion.button>
        ))}
      </div>
      <Button
        onClick={anyDone ? onNext : undefined}
        disabled={!anyDone}
      >
        Continue to dispute
      </Button>
    </div>
  )
}

// ── Stage 6+7+8 — Case + Timeline ─────────────────────────────
function StageCase({ alert, caseId, protectionStatus, onClose }) {
  const [copied, setCopied] = useState(false)

  function copyCase() {
    navigator.clipboard.writeText(caseId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fsd__stage">
      <div className="fsd__stage-title">Your case has been filed.</div>
      <p className="fsd__stage-sub">
        The bank has 10 working days to investigate under RBI guidelines.
        Aura will track this and notify you of any updates.
      </p>

      {/* Case ID card — identity of the dispute */}
      <div className="fsd__case-card">
        <div className="fsd__case-header">
          <div>
            <div className="fsd__case-id">{caseId}</div>
            <div className="fsd__case-label">Fraud Case ID</div>
          </div>
          <button className="fsd__case-copy" onClick={copyCase} aria-label="Copy case ID">
            {copied
              ? <CheckCircle size={14} weight="fill" style={{ color: 'var(--color-text-primary)' }} />
              : <CopySimple size={14} />
            }
          </button>
        </div>
        <div className="fsd__case-details">
          <div className="fsd__case-row">
            <span className="fsd__case-key">Transaction</span>
            <span className="fsd__case-val">{FMT(alert.amount)}</span>
          </div>
          <div className="fsd__case-row">
            <span className="fsd__case-key">Date & Time</span>
            <span className="fsd__case-val">{alert.date}</span>
          </div>
          <div className="fsd__case-row">
            <span className="fsd__case-key">Type</span>
            <span className="fsd__case-val">{alert.title}</span>
          </div>
          <div className="fsd__case-row">
            <span className="fsd__case-key">Status</span>
            <span className="fsd__case-val">Under Review</span>
          </div>
        </div>
      </div>

      {/* Timeline — what happens next */}
      <div className="fsd__timeline">
        <div className="fsd__timeline-label">Investigation timeline</div>
        {TIMELINE_STEPS.map((step, i) => (
          <div key={step.id} className={`fsd__step${step.done ? ' fsd__step--done' : ''}`}>
            <div className="fsd__step-track">
              <div className={`fsd__step-dot${step.done ? ' fsd__step-dot--done' : ''}`} />
              {i < TIMELINE_STEPS.length - 1 && (
                <div className={`fsd__step-line${step.done ? ' fsd__step-line--done' : ''}`} />
              )}
            </div>
            <div className="fsd__step-body">
              <div className="fsd__step-label">{step.label}</div>
              <div className="fsd__step-time">{step.time}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Protection window — secondary info */}
      <div className="fsd__protect-row">
        <span className={`fsd__protect-dot fsd__protect-dot--${protectionStatus.dot}`} />
        <span className="fsd__protect-label">{protectionStatus.label}</span>
        {protectionStatus.time && (
          <span className="fsd__protect-time">{protectionStatus.time}</span>
        )}
      </div>

      <Button onClick={onClose}>I'm okay, close this</Button>
    </div>
  )
}

// ── Main ───────────────────────────────────────────────────────
export default function FraudSlideOut({ alert, onClose }) {
  const [stage,    setStage]    = useState('assessment')
  const [selection,setSelection]= useState(null)
  const [actions,  setActions]  = useState([])
  const [caseId]                = useState(generateCaseId)
  const protStatus              = getProtectionStatus(alert.date)

  function handleAssessment(opt) {
    const acts = (PROTECTION_ACTIONS[opt.id] || []).map(a => ({ ...a, done: false }))
    setSelection(opt)
    setActions(acts)
    setStage('protection')
  }

  function toggleAction(id) {
    setActions(prev => prev.map(a => a.id === id ? { ...a, done: !a.done } : a))
  }

  const TITLES = {
    assessment: 'FraudShield AI',
    protection: 'Secure your account',
    case:       'Case Filed',
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fsd__backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fsd__panel"
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      >
        {/* Header */}
        <div className="fsd__header">
          <div className="fsd__header-left">
            {stage !== 'assessment' && (
              <motion.button
                className="fsd__back"
                onClick={() => setStage(stage === 'case' ? 'protection' : 'assessment')}
                whileTap={{ scale: 0.9 }}
                aria-label="Back"
              >
                <ArrowLeft size={15} />
              </motion.button>
            )}
            <div className="fsd__header-title">{TITLES[stage]}</div>
          </div>
          <motion.button
            className="fsd__close"
            onClick={onClose}
            whileTap={{ scale: 0.88 }}
            aria-label="Close"
          >
            <X size={15} />
          </motion.button>
        </div>

        {/* Alert strip — always visible */}
        <div className="fsd__alert-strip">
          <div className="fsd__strip-icon-wrap">
            <ShieldWarning size={18} weight="fill" />
          </div>
          <div className="fsd__strip-body">
            <span className="fsd__strip-title">{alert.title}</span>
            <span className="fsd__strip-meta">
              {alert.amount ? FMT(alert.amount) + ' · ' : ''}{alert.date}
            </span>
          </div>
        </div>

        {/* Stage content */}
        <div className="fsd__content">
          <AnimatePresence mode="wait">
            {stage === 'assessment' && (
              <motion.div key="assessment"
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.16 }}
              >
                <StageAssessment onSelect={handleAssessment} />
              </motion.div>
            )}
            {stage === 'protection' && (
              <motion.div key="protection"
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.16 }}
              >
                <StageProtection
                  actions={actions}
                  onToggle={toggleAction}
                  onNext={() => setStage('case')}
                />
              </motion.div>
            )}
            {stage === 'case' && (
              <motion.div key="case"
                initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.16 }}
              >
                <StageCase
                  alert={alert}
                  caseId={caseId}
                  protectionStatus={protStatus}
                  onClose={onClose}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
