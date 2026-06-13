import { createBrowserRouter } from 'react-router-dom'

import MarketingLayout   from '../layouts/MarketingLayout'
import AppLayout         from '../layouts/AppLayout'
import LandingPage       from '../pages/LandingPage'
import LoginPage         from '../pages/LoginPage'
import Dashboard         from '../pages/Dashboard'
import RollingDigitLab   from '../components/landing/RollingDigitLab'

const router = createBrowserRouter([
  {
    element: <MarketingLayout />,
    children: [
      { path: '/',      element: <LandingPage /> },
      { path: '/login', element: <LoginPage /> },
      // ── Temp lab route — remove after animation is approved ──
      { path: '/lab',   element: <RollingDigitLab /> },
    ],
  },
  {
    path: '/app',
    element: <AppLayout />,
  },
])

export default router
