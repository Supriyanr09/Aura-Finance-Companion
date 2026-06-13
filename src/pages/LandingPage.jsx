// LandingPage.jsx — route: "/"
// ═══════════════════════════════════════════════════════════════
// Flow:
//   1. CinematicIntro plays (wordmark → particles → taglines → CTA)
//   2. User clicks "Begin your journey"
//   3. TaglineSequence fires word-explosion transition
//   4. After Prosper fades → navigate('/login')
//
// No scroll machinery. No Lenis. No scroll progress.
// No repeated brand reveal. No LoginReveal component.
// ═══════════════════════════════════════════════════════════════
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import CinematicIntro  from '../components/landing/CinematicIntro'
import TaglineSequence from '../components/landing/TaglineSequence'

export default function LandingPage() {
  const navigate = useNavigate()
  const [transitioning, setTransitioning] = useState(false)

  // Force dark theme; restore on unmount
  useEffect(() => {
    const prev = document.documentElement.getAttribute('data-theme')
    document.documentElement.setAttribute('data-theme', 'dark')
    document.body.style.overflow = 'hidden'
    return () => {
      if (prev) document.documentElement.setAttribute('data-theme', prev)
      document.body.style.overflow = ''
    }
  }, [])

  // Called when CTA is clicked
  const handleBegin = () => {
    if (transitioning) return
    setTransitioning(true)
  }

  // Called after last word explosion completes
  const handleTransitionDone = () => {
    navigate('/login')
  }

  return (
    <div className="lp-stage">
      <video
        className="lp-video"
        src="/Landingpagevideo.mp4"
        autoPlay muted loop playsInline
        aria-hidden="true"
      />

      <div className="lp-overlay lp-overlay--base" />
      <div className="lp-overlay lp-overlay--radial" />
      <div className="lp-overlay lp-overlay--edges" />

      {/* Cinematic intro — always mounted, owns the CTA */}
      <CinematicIntro
        onComplete={() => {}}
        onBegin={handleBegin}
      />

      {/* Word explosion transition — active only after CTA click */}
      <TaglineSequence
        active={transitioning}
        onDone={handleTransitionDone}
      />
    </div>
  )
}
