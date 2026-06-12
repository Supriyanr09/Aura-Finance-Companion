// ═══════════════════════════════════════════════════════════════
// LandingPage.jsx — route: "/"
// Styles: src/styles/landing.css
//
// Orchestrates the full cinematic landing journey:
//   Phase 0 · Brand Reveal   (auto, timed)
//   Phase 1 · Hero State     (static, waits for scroll)
//   Phase 2 · Tagline Sequence (scroll-driven 0→1)
//   Phase 3 · Login Reveal   (scroll-driven, triggers at ~0.90)
//
// The only style props used here are scroll-computed animation
// values (opacity, CSS custom property) — not design values.
// All design values live in landing.css.
// ═══════════════════════════════════════════════════════════════
import { useEffect, useState, useRef } from 'react'
import Lenis from 'lenis'

import CinematicIntro  from '../components/landing/CinematicIntro'
import HeroContent     from '../components/landing/HeroContent'
import TaglineSequence from '../components/landing/TaglineSequence'
import LoginReveal     from '../components/landing/LoginReveal'

const SCROLL_MULTIPLIER = 5

export default function LandingPage() {
  const [revealDone,     setRevealDone]     = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  // Force dark theme; restore on unmount
  useEffect(() => {
    const prev = document.documentElement.getAttribute('data-theme')
    document.documentElement.setAttribute('data-theme', 'dark')
    document.body.style.overflow = 'auto'
    return () => {
      if (prev) document.documentElement.setAttribute('data-theme', prev)
      document.body.style.overflow = ''
    }
  }, [])

  // Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({ duration: 1.4, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)) })
    const raf = time => { lenis.raf(time); requestAnimationFrame(raf) }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])

  // Scroll progress 0→1 over the scroll track
  useEffect(() => {
    const onScroll = () => {
      const scrollable = window.innerHeight * (SCROLL_MULTIPLIER - 1)
      setScrollProgress(Math.min(1, Math.max(0, window.scrollY / scrollable)))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Derived display state
  const showHero     = revealDone
  const showSequence = revealDone && scrollProgress > 0.02
  const showLogin    = scrollProgress > 0.90

  // Scroll-computed values — animation values only, not design values
  const videoOpacity      = Math.max(0.08, 0.25 - scrollProgress * 0.17)
  const sequenceOverlay   = scrollProgress > 0.05
    ? Math.min(0.72, (scrollProgress - 0.05) * 0.85)
    : 0

  return (
    <>
      {/* Tall scroll track — drives scroll progress */}
      <div className="lp-scroll-track" />

      {/* Fixed cinematic stage */}
      <div className="lp-stage">

        {/* Video — opacity is scroll-computed */}
        <video
          className="lp-video"
          src="/Landingpagevideo.mp4"
          autoPlay muted loop playsInline
          aria-hidden="true"
          style={{ opacity: videoOpacity }}
        />

        <div className="lp-overlay lp-overlay--base" />
        <div className="lp-overlay lp-overlay--radial" />
        <div className="lp-overlay lp-overlay--edges" />

        {/* Progressive darkening — scroll-computed custom property */}
        {sequenceOverlay > 0 && (
          <div
            className="lp-overlay lp-overlay--sequence"
            style={{ '--sequence-overlay': sequenceOverlay.toFixed(3) }}
          />
        )}

        <HeroContent
          visible={showHero && !showSequence}
          scrollProgress={scrollProgress}
        />

        <TaglineSequence
          scrollProgress={scrollProgress}
          visible={showSequence && !showLogin}
        />

        {!revealDone && (
          <CinematicIntro onComplete={() => setRevealDone(true)} />
        )}

        <LoginReveal visible={showLogin} />

      </div>
    </>
  )
}
