// ═══════════════════════════════════════════════════════════════
// LandingPage.jsx
// Marketing landing page — route: "/"
// Entirely isolated from authenticated app layout.
// Hero content area is reserved for future: logo, headline, CTA.
// ═══════════════════════════════════════════════════════════════
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import Lenis from 'lenis'
import HeroAnimationBackground from '../components/landing/HeroAnimationBackground'

export default function LandingPage() {
  // Lenis smooth scroll — landing page specific instance
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    })
    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])

  // Force dark theme on landing page — marketing always dark
  useEffect(() => {
    const prev = document.documentElement.getAttribute('data-theme')
    document.documentElement.setAttribute('data-theme', 'dark')
    return () => {
      // Restore whatever theme was active when leaving
      if (prev) document.documentElement.setAttribute('data-theme', prev)
    }
  }, [])

  return (
    <div className="landing-page">
      {/* ── Full-screen hero ────────────────────────────── */}
      <section className="landing-hero">
        {/* Layer 0: Animated currency background */}
        <HeroAnimationBackground />

        {/* Layer 1: Hero content — reserved for future additions */}
        <div className="landing-hero__content" style={{ position: 'relative', zIndex: 10 }}>
          {/*
            ┌─────────────────────────────────────────────┐
            │  FUTURE CONTENT PLACEHOLDER                 │
            │                                             │
            │  • Aura Finance logo + wordmark             │
            │  • Primary headline                         │
            │  • Supporting tagline                       │
            │  • CTA buttons (Sign In / Get Started)      │
            └─────────────────────────────────────────────┘
          */}

          {/* Temporary: Aura mascot centered as focal point */}
          <motion.div
            className="landing-hero__mascot"
            initial={{ opacity: 0, scale: 0.88, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <img
              src="/Mascot - Aura.svg"
              alt="Aura Finance"
              className="landing-hero__mascot-img"
              onError={(e) => { e.target.style.display = 'none' }}
            />
          </motion.div>

          {/* Brand wordmark — temporary minimal version */}
          <motion.div
            className="landing-hero__wordmark"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="landing-hero__brand-name">Aura Finance</span>
            <span className="landing-hero__brand-tag">Clarity. Control. Intelligence.</span>
          </motion.div>

          {/* CTA cluster — placeholder layout */}
          <motion.div
            className="landing-hero__cta"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Navigate to /app for now — will become auth flow later */}
            <a href="/app" className="landing-btn landing-btn--primary">
              Get Started
            </a>
            <a href="/app" className="landing-btn landing-btn--ghost">
              Sign In
            </a>
          </motion.div>
        </div>
      </section>

      <style>{`
        /* ── Landing page reset — no app-shell interference ── */
        .landing-page {
          width: 100%;
          min-height: 100svh;
          background: #060818;
          overflow-x: hidden;
        }

        /* ── Hero section ─────────────────────────────────── */
        .landing-hero {
          position: relative;
          width: 100%;
          height: 100svh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        /* ── Content layer — centered column ──────────────── */
        .landing-hero__content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 28px;
          text-align: center;
          padding: 0 24px;
          /* Clear center zone: 480px wide, ±220px tall */
          max-width: 480px;
        }

        /* ── Mascot ───────────────────────────────────────── */
        .landing-hero__mascot {
          width: 120px;
          height: 120px;
          flex-shrink: 0;
        }

        .landing-hero__mascot-img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          filter: drop-shadow(0 0 40px rgba(109, 93, 252, 0.45))
                  drop-shadow(0 0 80px rgba(109, 93, 252, 0.20));
        }

        /* ── Wordmark ─────────────────────────────────────── */
        .landing-hero__wordmark {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .landing-hero__brand-name {
          font-family: var(--font-display);
          font-size: 40px;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: #F1F5FF;
          line-height: 1;
        }

        .landing-hero__brand-tag {
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 400;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(139, 157, 195, 0.75);
          line-height: 1;
        }

        /* ── CTA buttons ──────────────────────────────────── */
        .landing-hero__cta {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .landing-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 12px 28px;
          border-radius: 999px;
          font-family: var(--font-body);
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 0.01em;
          cursor: pointer;
          text-decoration: none;
          transition: all 200ms cubic-bezier(0.16, 1, 0.3, 1);
          white-space: nowrap;
        }

        .landing-btn--primary {
          background: linear-gradient(135deg, #6D5DFC 0%, #8B5CF6 100%);
          color: #FFFFFF;
          box-shadow: 0 4px 20px rgba(109, 93, 252, 0.40);
        }

        .landing-btn--primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 28px rgba(109, 93, 252, 0.55);
        }

        .landing-btn--ghost {
          background: rgba(255, 255, 255, 0.06);
          color: rgba(241, 245, 255, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(8px);
        }

        .landing-btn--ghost:hover {
          background: rgba(255, 255, 255, 0.10);
          border-color: rgba(255, 255, 255, 0.20);
        }
      `}</style>
    </div>
  )
}
