// ═══════════════════════════════════════════════════════════════
// useInView.js — "has this element scrolled into view yet"
// Thin wrapper around IntersectionObserver. Returns a ref to
// attach to the element you care about, plus a boolean that flips
// to true the first time that element becomes visible and then
// STAYS true (observer disconnects after the first sighting —
// this answers "has the user reached this section," not "is it
// currently on screen," so scrolling back past it again should
// not flip the boolean back to false).
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'

/**
 * @param {object} opts
 * @param {string} opts.rootMargin - shrinks/grows the viewport box
 *   used for the intersection check. A small negative bottom margin
 *   (default) means the element must be a little more than just
 *   barely peeking onto screen before it counts as "in view" —
 *   avoids triggering the instant a sliver of the card's top edge
 *   appears at the very bottom of the viewport.
 * @param {number} opts.threshold - fraction of the element that
 *   must be visible to trigger, default 0.2 (20%).
 */
export function useInView({ rootMargin = '0px 0px -10% 0px', threshold = 0.2 } = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Fallback for environments without IntersectionObserver (very
    // old browsers / some SSR contexts) — treat as immediately in
    // view rather than silently never animating.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setInView(true)
          observer.disconnect() // one-time trigger, not live tracking
        }
      },
      { rootMargin, threshold }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [rootMargin, threshold])

  return [ref, inView]
}
