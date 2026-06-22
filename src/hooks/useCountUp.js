// ═══════════════════════════════════════════════════════════════
// useCountUp.js — Animated 0 → target numeric counter
// Used for hero/KPI values that should count up rather than
// appearing as a static figure.
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'

// Ease-out cubic — fast start, soft landing. Matches the rest of
// the design system's spring/ease feel rather than a linear tick.
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

/**
 * @param {number} target      - final value to land on
 * @param {object} opts
 * @param {number} opts.duration   - ms, default 1400
 * @param {number} opts.delay      - ms before counting starts (after
 *                                     startWhen first becomes true),
 *                                     default 0
 * @param {boolean} opts.startWhen - gate controlling when the count
 *                                     is allowed to begin. Defaults
 *                                     to true, reproducing the
 *                                     original always-run-on-mount
 *                                     behavior. Pass a scroll-
 *                                     visibility boolean (see
 *                                     useInView) to defer the count
 *                                     until the element is actually
 *                                     on screen.
 *
 *                                     IMPLEMENTATION NOTE: this does
 *                                     NOT use a ref-based "already
 *                                     started" guard. An earlier
 *                                     version did (`started.current`,
 *                                     set true the instant the effect
 *                                     ran, checked on every re-run to
 *                                     avoid restarting a finished
 *                                     count). That guard broke under
 *                                     React StrictMode's intentional
 *                                     double-invoke of effects in
 *                                     dev: the throwaway first
 *                                     mount's effect set the ref to
 *                                     true, and the real second
 *                                     mount's effect saw it already
 *                                     true and permanently skipped
 *                                     running at all — the counter
 *                                     stayed frozen at 0 forever,
 *                                     reproduced and confirmed via
 *                                     console logging (disposable
 *                                     was correct, countedDisposable
 *                                     never left 0). Relying purely
 *                                     on the effect's own cleanup
 *                                     (cancel pending timeout/frame
 *                                     on unmount) instead of a
 *                                     manual guard is what makes
 *                                     StrictMode's double-invoke
 *                                     harmless: the throwaway mount
 *                                     starts and is cleanly cancelled
 *                                     by cleanup, the real mount
 *                                     starts fresh and runs to
 *                                     completion. Do not reintroduce
 *                                     a started-ref guard here.
 */
export function useCountUp(target, { duration = 1400, delay = 0, startWhen = true } = {}) {
  const [value, setValue] = useState(0)
  const frame = useRef(null)
  const start = useRef(null)

  useEffect(() => {
    if (!startWhen) return

    let timeoutId
    let cancelled = false

    const tick = (ts) => {
      if (cancelled) return
      if (start.current === null) start.current = ts
      const elapsed  = ts - start.current
      const progress = Math.min(1, elapsed / duration)
      setValue(target * easeOutCubic(progress))
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick)
      }
    }

    timeoutId = setTimeout(() => {
      start.current = null
      frame.current = requestAnimationFrame(tick)
    }, delay)

    return () => {
      cancelled = true
      clearTimeout(timeoutId)
      if (frame.current) cancelAnimationFrame(frame.current)
    }
    // target/duration/delay intentionally omitted from deps — once
    // startWhen flips true and this effect runs, it should run to
    // completion using the target/duration/delay values captured at
    // that moment, not restart if those happen to change for an
    // unrelated reason. startWhen IS the dep since it's the actual
    // trigger. Going from true -> false does nothing special (no
    // guard needed) since the effect body itself does nothing when
    // startWhen is false; going false -> true -> false -> true would
    // restart the count each time, which is correct/intended for any
    // hook consumer that deliberately toggles startWhen more than
    // once (none currently do, but nothing here assumes one-time-only).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startWhen])

  return value
}
