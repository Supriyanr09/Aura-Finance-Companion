// ═══════════════════════════════════════════════════════════════
// App.jsx — Application root
// ═══════════════════════════════════════════════════════════════
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider }  from './ThemeContext'
import { UserProvider }   from './context/UserContext'
import router             from './router/index.jsx'

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <RouterProvider router={router} />
      </UserProvider>
    </ThemeProvider>
  )
}
