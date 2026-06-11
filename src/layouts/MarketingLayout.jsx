// ═══════════════════════════════════════════════════════════════
// MarketingLayout.jsx
// Wrapper for all public/marketing routes (/, /signin, /signup, etc.)
// No sidebar, no topbar — pure marketing shell.
// ═══════════════════════════════════════════════════════════════
import { Outlet } from 'react-router-dom'

export default function MarketingLayout() {
  return (
    <div className="marketing-shell">
      <Outlet />
    </div>
  )
}
