// ═══════════════════════════════════════════════════════════════
// useMarketTicker.js — Simulated live-fluctuating market prices
// Takes the static markets[] array from mockData and returns a
// version whose price/% change nudge on an interval, approximating
// a real ticker feed without any actual network call.
//
// Realism choices, deliberate:
//   - % change is always computed against each instrument's
//     SESSION-OPEN price (captured once, on mount), not against
//     the previous tick. That's how real "+0.82%" tickers work —
//     drifting tick-to-tick would make the displayed % wander
//     incoherently relative to what a real feed shows.
//   - Each tick is a small bounded random step sized as a % of
//     the instrument's OWN price (a ₹24,531 index and a ₹228
//     stock shouldn't move by the same absolute number) — not a
//     fixed rupee amount for everyone.
//   - Steps have a mild momentum bias: there's a higher chance of
//     continuing the prior tick's direction than reversing it.
//     Pure random-walk (50/50 every tick) looks visibly jittery/
//     fake; real prices trend in short bursts.
//   - Indices (Nifty/Sensex) move with a smaller max step than
//     individual stocks, since broad indices are an average of
//     many stocks and are inherently less volatile tick-to-tick.
// ═══════════════════════════════════════════════════════════════
import { useEffect, useRef, useState } from 'react'

const TICK_INTERVAL_MS = 2500

// Max single-tick move, as a fraction of current price. Indices
// get a smaller cap — see file header.
function maxStepPct(instrument) {
  return instrument.id === 'nifty' || instrument.id === 'sensex' ? 0.0006 : 0.0025
}

function formatValue(price, prefix, decimals) {
  const rounded = decimals > 0 ? price.toFixed(decimals) : Math.round(price).toString()
  // Indian-style grouping (1,641 not 1641) — same convention as
  // the rest of the app's FMT helpers, applied manually here since
  // this needs to run on a live number, not call into FMT (FMT
  // always prefixes ₹; indices like Nifty/Sensex don't take one).
  const grouped = Number(rounded).toLocaleString('en-IN')
  return `${prefix}${grouped}`
}

export function useMarketTicker(initialMarkets) {
  // state[] is keyed identically to initialMarkets, carrying the
  // live price + bookkeeping (open price, last tick's direction
  // for the momentum bias) needed to compute the next tick and
  // the display strings.
  const [state, setState] = useState(() =>
    initialMarkets.map(m => ({ ...m, price: m.base, openPrice: m.base, lastStepDir: m.dir === 'up' ? 1 : -1 }))
  )
  // initialMarkets is captured once via this ref so a parent
  // re-render (e.g. persona switch) with a NEW markets array
  // resets the ticker cleanly rather than silently ticking against
  // stale state — see the effect below.
  const initialRef = useRef(initialMarkets)

  useEffect(() => {
    // If the actual market list changed (different persona/user),
    // reset state to the new seed rather than ticking old prices
    // for instruments that may not even exist in the new list.
    if (initialRef.current !== initialMarkets) {
      initialRef.current = initialMarkets
      setState(initialMarkets.map(m => ({ ...m, price: m.base, openPrice: m.base, lastStepDir: m.dir === 'up' ? 1 : -1 })))
    }

    const id = setInterval(() => {
      setState(prev => prev.map(m => {
        // 70% chance of continuing the previous tick's direction,
        // 30% chance of reversing — the momentum bias described
        // in the file header. Math.random() < 0.7 keeps direction;
        // otherwise flip it.
        const dir      = Math.random() < 0.7 ? m.lastStepDir : -m.lastStepDir
        const stepPct  = Math.random() * maxStepPct(m)
        const newPrice = Math.max(0.01, m.price * (1 + dir * stepPct))

        return { ...m, price: newPrice, lastStepDir: dir }
      }))
    }, TICK_INTERVAL_MS)

    return () => clearInterval(id)
  }, [initialMarkets])

  // Derive display strings fresh from live price + openPrice on
  // every render — never stored, so there's no risk of value/
  // change/dir drifting out of sync with the underlying price.
  return state.map(m => {
    const changePct = ((m.price - m.openPrice) / m.openPrice) * 100
    const dir       = changePct >= 0 ? 'up' : 'down'
    return {
      id:     m.id,
      label:  m.label,
      value:  formatValue(m.price, m.prefix, m.decimals),
      change: `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`,
      dir,
    }
  })
}
