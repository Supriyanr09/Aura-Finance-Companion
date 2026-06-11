// ═══════════════════════════════════════════════
// TopBar.jsx — Layout component
// All styles in TopBar.css. No inline styles.
// ═══════════════════════════════════════════════
import { useState } from 'react'
import { motion } from 'framer-motion'
import { MagnifyingGlass, Bell, Sun, Moon } from '@phosphor-icons/react'
import './TopBar.css'
import { useTheme } from '../../ThemeContext'

export default function TopBar({ breadcrumb = 'Home' }) {
  const { dark, toggle } = useTheme()
  const [search, setSearch]   = useState('')
  const [focused, setFocused] = useState(false)

  return (
    <header className="topbar">

      {/* Breadcrumb */}
      <div className="topbar__breadcrumb">{breadcrumb}</div>

      {/* Search */}
      <div className={`topbar__search${focused ? ' topbar__search--focused' : ''}`}>
        <MagnifyingGlass size={16} color="var(--color-text-tertiary)" />
        <input
          className="topbar__search-input"
          value={search}
          onChange={e => setSearch(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Ask Aura anything…"
          aria-label="Search"
        />
      </div>

      {/* Actions */}
      <div className="topbar__actions">

        {/* Notifications */}
        <motion.button
          className="topbar__icon-btn"
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.93 }}
          aria-label="Notifications"
        >
          <Bell size={18} />
          <span className="topbar__notif-badge" aria-label="3 unread">3</span>
        </motion.button>

        {/* Theme toggle */}
        <motion.button
          className="topbar__icon-btn"
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.93 }}
          onClick={toggle}
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </motion.button>

      </div>
    </header>
  )
}
