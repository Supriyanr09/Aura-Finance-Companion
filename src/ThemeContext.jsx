// ═══════════════════════════════════════════════
// ThemeContext.jsx
// Default: light. Optional: dark.
// Sets data-theme on <html> so CSS vars cascade.
// ═══════════════════════════════════════════════
import { createContext, useContext, useState, useEffect } from 'react'

const ThemeCtx = createContext(null)

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(false) // LIGHT is default

  useEffect(() => {
    document.documentElement.setAttribute(
      'data-theme',
      dark ? 'dark' : 'light'
    )
  }, [dark])

  // Set light on first mount (belt-and-suspenders)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light')
  }, [])

  return (
    <ThemeCtx.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      {children}
    </ThemeCtx.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeCtx)
}
