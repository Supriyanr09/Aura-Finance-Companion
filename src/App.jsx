// ═══════════════════════════════════════════════════════════════
// App.jsx — Application root
// Responsibility: wrap ThemeProvider + RouterProvider only.
// All layout/route logic lives in router/index.jsx and layouts/.
// ═══════════════════════════════════════════════════════════════
import { RouterProvider } from 'react-router-dom'
import { ThemeProvider }  from './ThemeContext'
import router             from './router/index.jsx'

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider router={router} />
    </ThemeProvider>
  )
}
