import { createBrowserRouter } from 'react-router-dom'

import MarketingLayout   from '../layouts/MarketingLayout'
import AppLayout         from '../layouts/AppLayout'
import LandingPage       from '../pages/LandingPage'
import Dashboard         from '../pages/Dashboard'
import RollingDigitLab   from '../components/landing/RollingDigitLab'

const router = createBrowserRouter([
  {
    element: <MarketingLayout />,
    children: [
      { path: '/',    element: <LandingPage /> },
      // ── Temp lab route — remove after animation is approved ──
      { path: '/lab', element: <RollingDigitLab /> },
    ],
  },
  {
    path: '/app',
    element: <AppLayout />,
  },
])

export default router
