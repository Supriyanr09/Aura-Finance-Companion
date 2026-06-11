// ═══════════════════════════════════════════════════════════════
// AppLayout.jsx
// Authenticated application shell.
// Wraps sidebar + topbar + main content for all /app/* routes.
// ═══════════════════════════════════════════════════════════════
import { Outlet } from 'react-router-dom'
import Sidebar  from '../components/layout/Sidebar'
import TopBar   from '../components/layout/TopBar'
import AskAura  from '../components/aura/AskAura'
import Home     from '../pages/Home'

export default function AppLayout() {
  return (
    <>
      <div className="app-shell">
        <Sidebar />
        <div className="app-main">
          <TopBar breadcrumb="Home" />
          <main className="app-scroll">
            {/* Home renders directly — router expands this to <Outlet /> once
                individual screen routes are wired under /app/:screen */}
            <Home />
          </main>
        </div>
      </div>

      {/* Global floating AI companion — persists across all /app routes */}
      <AskAura />
    </>
  )
}
