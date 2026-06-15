// ═══════════════════════════════════════════════
// Sidebar.jsx — Permanent, always-expanded nav
// ═══════════════════════════════════════════════
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  House, Bank, Target,
  ChartBar, ArrowsClockwise, ShieldCheck, TrendUp,
  Receipt,
  Gear, SignOut, CaretUp,
} from '@phosphor-icons/react'
import './Sidebar.css'
import { Avatar } from '../ui/primitives'
import { useUser } from '../../context/UserContext'
import IconButton from '../ui/IconButton'

const NAV_MAIN = [
  { id: 'home',    Icon: House,   label: 'Home'    },
  { id: 'banking', Icon: Bank,    label: 'Banking' },
  { id: 'goals',   Icon: Target,  label: 'Goals'   },
]

const NAV_INTELLIGENCE = [
  { id: 'spendpulse',   Icon: ChartBar,        label: 'Spend Pulse', sub: 'Expense Tracking'    },
  { id: 'wealthpilot',  Icon: TrendUp,         label: 'WealthPilot',   sub: 'AI Investments'   },
  { id: 'fraud-shield', Icon: ShieldCheck,     label: 'FraudShield AI',  sub: 'Fraud Detection', dot: true },
  { id: 'creditiq',     Icon: ArrowsClockwise, label: 'CreditIQ',   sub: 'Credit Scoring'      },
  { id: 'budgetbuddy',  Icon: Target,          label: 'BudgetBuddy AI',     sub: 'Budget Coach'},
  { id: 'taxcopilot',   Icon: Receipt,         label: 'Tax Copilot',        sub: 'Tax Assistant'  },
]

function NavGroup({ label, items, active, onSelect }) {
  return (
    <div className="sidebar__nav-group">
      {label && (
        <div className="sidebar__nav-group-label">{label}</div>
      )}
      {items.map(({ id, Icon, label: itemLabel, sub, badge, dot }) => {
        const isActive = active === id
        return (
          <motion.button
            key={id}
            className={`nav-item${isActive ? ' nav-item--active' : ''}`}
            onClick={() => onSelect(id)}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}
          >
            <Icon className="nav-item__icon" size={20} weight={isActive ? 'fill' : 'regular'} />
            <div className="nav-item__label-wrap">
              <span className="nav-item__label">{itemLabel}</span>
              {sub && <span className="nav-item__sub">{sub}</span>}
            </div>
            {badge && typeof badge === 'number' && (
              <span className="nav-item__badge">{badge}</span>
            )}
            {badge && typeof badge === 'string' && (
              <span className="nav-item__pill">{badge}</span>
            )}
            {dot && <span className="nav-item__status-dot" />}
            {isActive && <span className="nav-item__dot" />}
          </motion.button>
        )
      })}
    </div>
  )
}

export default function Sidebar() {
  const [active,         setActive]         = useState('home')
  const [profileOpen,    setProfileOpen]    = useState(false)
  const navigate = useNavigate()
  const { user } = useUser()

  function handleLogout() {
    navigate('/login')
  }

  return (
    <aside className="sidebar">

      {/* Logo */}
      <div className="sidebar__logo">
        <img
          src="/Logo1.svg"
          alt="Aura Finance"
          className="sidebar__logo-img"
        />
        <div className="sidebar__logo-wordmark">
          <span className="sidebar__logo-aura">AURA</span>
          <span className="sidebar__logo-finance">Finance</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar__nav">
        <NavGroup
          items={NAV_MAIN}
          active={active}
          onSelect={setActive}
        />
        <NavGroup
          label="Intelligence"
          items={NAV_INTELLIGENCE}
          active={active}
          onSelect={setActive}
        />
      </nav>

      {/* Bottom — user row with inline profile panel */}
      <div className="sidebar__bottom">

        {/* Profile flyout — above user row */}
        <AnimatePresence>
          {profileOpen && (
            <motion.div
              className="sidebar__profile-panel"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            >
              <div className="sidebar__profile-avatar-row">
                <Avatar initials={user.initials} size="md" />
                <div>
                  <div className="sidebar__profile-name">{user.full}</div>
                  <div className="sidebar__profile-meta">{user.city} · Aura Pro</div>
                </div>
              </div>
              <div className="sidebar__profile-divider" />
              <div className="sidebar__profile-details">
                <div className="sidebar__profile-row">
                  <span className="sidebar__profile-key">Customer ID</span>
                  <span className="sidebar__profile-val">{user.customerId}</span>
                </div>
                <div className="sidebar__profile-row">
                  <span className="sidebar__profile-key">Health score</span>
                  <span className={`sidebar__profile-val sidebar__profile-val--${user.health.band}`}>
                    {user.healthScore} / 100
                  </span>
                </div>
                <div className="sidebar__profile-row">
                  <span className="sidebar__profile-key">Plan</span>
                  <span className="sidebar__profile-val">Aura Pro</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User row + Settings + Logout in one strip */}
        <div className="sidebar__user-strip">

          {/* Avatar + name — clicking opens profile */}
          <motion.button
            className="sidebar__user-btn"
            onClick={() => setProfileOpen(p => !p)}
            whileTap={{ scale: 0.97 }}
            aria-expanded={profileOpen}
            aria-label="Toggle profile"
          >
            <Avatar initials={user.initials} size="sm" />
            <div className="sidebar__user-info">
              <div className="sidebar__user-name">{user.full}</div>
              <div className="sidebar__user-meta">{user.city} · Aura Pro</div>
            </div>
            <motion.span
              className="sidebar__user-caret"
              animate={{ rotate: profileOpen ? 0 : 180 }}
              transition={{ duration: 0.2 }}
            >
              <CaretUp size={13} weight="bold" />
            </motion.span>
          </motion.button>

          {/* Settings icon */}
          <IconButton
            icon={Gear}
            label="Settings"
            active={active === 'settings'}
            onClick={() => setActive('settings')}
          />

          {/* Logout icon */}
          <IconButton
            icon={SignOut}
            label="Log out"
            variant="danger"
            onClick={handleLogout}
            iconWeight="regular"
          />

        </div>
      </div>
    </aside>
  )
}
