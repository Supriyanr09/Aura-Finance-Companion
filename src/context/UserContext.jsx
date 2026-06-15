// ═══════════════════════════════════════════════════════════════
// UserContext.jsx — Active user state across the app
// Set on login, read everywhere.
// ═══════════════════════════════════════════════════════════════
import { createContext, useContext, useState } from 'react'
import { USER_YATHIKA, USERS } from '../data/mockData'

const UserContext = createContext(null)

export function UserProvider({ children }) {
  const [activeUser, setActiveUser] = useState(USER_YATHIKA)

  function loginUser(customerId) {
    const user = USERS[customerId.toUpperCase()]
    if (user) setActiveUser(user)
  }

  return (
    <UserContext.Provider value={{ user: activeUser, loginUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used inside UserProvider')
  return ctx
}
