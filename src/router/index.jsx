// ═══════════════════════════════════════════════════════════════
// router/index.jsx
// Central route registry for Aura Finance.
//
// Route map:
//   /               → Landing page (marketing)
//   /app            → Dashboard (authenticated app)
//
// Scalable slots (add as needed):
//   /signin         → Sign In
//   /signup         → Sign Up
//   /forgot         → Forgot Password
//   /onboarding     → Onboarding flow
//   /app/settings   → Settings screen
//   /app/profile    → Profile screen
// ═══════════════════════════════════════════════════════════════
import { createBrowserRouter } from 'react-router-dom'

import MarketingLayout from '../layouts/MarketingLayout'
import AppLayout       from '../layouts/AppLayout'
import LandingPage     from '../pages/LandingPage'
import Dashboard       from '../pages/Dashboard'

const router = createBrowserRouter([
  // ── Marketing routes — no app chrome ──────────────────────
  {
    element: <MarketingLayout />,
    children: [
      {
        path: '/',
        element: <LandingPage />,
      },
      // Future:
      // { path: '/signin',  element: <SignIn /> },
      // { path: '/signup',  element: <SignUp /> },
      // { path: '/forgot',  element: <ForgotPassword /> },
      // { path: '/onboarding', element: <Onboarding /> },
    ],
  },

  // ── Authenticated app routes — full app chrome ─────────────
  {
    path: '/app',
    element: <AppLayout />,
    // Future screen routes mount here as children with <Outlet />:
    // children: [
    //   { index: true,           element: <Dashboard /> },
    //   { path: 'settings',      element: <Settings /> },
    //   { path: 'profile',       element: <Profile /> },
    // ]
  },
])

export default router
