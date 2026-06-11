// ═══════════════════════════════════════════════
// Sidebar.jsx — Permanent, always-expanded nav
// ═══════════════════════════════════════════════
import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  House, Bank, TrendUp, Target,
  ChartBar, ArrowsClockwise, ShieldCheck,
  Gear, UserCircle,
} from '@phosphor-icons/react'
import './Sidebar.css'
import { Avatar } from '../ui/primitives'
import { USER } from '../../data/mockData'

// ── Ask Aura removed from nav — it lives as the global floating companion only

const NAV_MAIN = [
  { id: 'home',        Icon: House,   label: 'Home'        },
  { id: 'banking',     Icon: Bank,    label: 'Banking'     },
  { id: 'investments', Icon: TrendUp, label: 'Investments' },
  { id: 'goals',       Icon: Target,  label: 'Goals'       },
]

const NAV_INTELLIGENCE = [
  { id: 'insights',      Icon: ChartBar,        label: 'Insights'      },
  { id: 'subscriptions', Icon: ArrowsClockwise, label: 'Subscriptions' },
  { id: 'fraud-shield',  Icon: ShieldCheck,     label: 'Fraud Shield', dot: true },
]

function NavGroup({ label, items, active, onSelect }) {
  return (
    <div className="sidebar__nav-group">
      {label && (
        <div className="sidebar__nav-group-label">{label}</div>
      )}
      {items.map(({ id, Icon, label: itemLabel, badge, dot }) => {
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
            <span className="nav-item__label">{itemLabel}</span>
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
  const [active, setActive] = useState('home')

  return (
    <aside className="sidebar">

      {/* Logo */}
      <div className="sidebar__logo">
        <img
          src="/Logo.svg"
          alt="Aura Finance"
          className="sidebar__logo-img"
        />
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

      {/* Bottom — Settings, Profile as standalone items + user row */}
      <div className="sidebar__bottom">

        <motion.button
          className={`nav-item${active === 'settings' ? ' nav-item--active' : ''}`}
          onClick={() => setActive('settings')}
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.97 }}
        >
          <Gear className="nav-item__icon" size={20} weight={active === 'settings' ? 'fill' : 'regular'} />
          <span className="nav-item__label">Settings</span>
        </motion.button>

        <motion.button
          className={`nav-item${active === 'profile' ? ' nav-item--active' : ''}`}
          onClick={() => setActive('profile')}
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.97 }}
        >
          <UserCircle className="nav-item__icon" size={20} weight={active === 'profile' ? 'fill' : 'regular'} />
          <span className="nav-item__label">Profile</span>
        </motion.button>

        <div className="sidebar__user">
          <Avatar initials={USER.initials} size="sm" />
          <div className="sidebar__user-info">
            <div className="sidebar__user-name">{USER.full}</div>
            <div className="sidebar__user-meta">{USER.city} · Aura Pro</div>
          </div>
        </div>

      </div>
    </aside>
  )
}
