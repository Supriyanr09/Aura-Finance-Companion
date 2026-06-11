// ═══════════════════════════════════════════════════════════════
// Dashboard.jsx — route: "/app"
// Thin page wrapper that renders the authenticated app layout.
// All existing dashboard content lives inside AppLayout.
// ═══════════════════════════════════════════════════════════════
import AppLayout from '../layouts/AppLayout'

export default function Dashboard() {
  return <AppLayout />
}
