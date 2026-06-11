// ═══════════════════════════════════════════════
// useGreeting.js — Time-aware greeting hook
// ═══════════════════════════════════════════════
import { useState, useEffect } from 'react'
import { USER, AURA_GREETING } from '../data/mockData'

function getSlot(hour) {
  if (hour >= 5  && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 21) return 'evening'
  return 'night'
}

const SLOTS = {
  morning:   { greeting: `Good morning, ${USER.name}`, icon: '☀️', context: "I checked your finances while you slept." },
  afternoon: { greeting: `Good afternoon, ${USER.name}`, icon: '⛅', context: "Here's where things stand right now."    },
  evening:   { greeting: `Good evening, ${USER.name}`, icon: '🌇', context: "Markets just closed. Here's your day."   },
  night:     { greeting: `Still up, ${USER.name}?`,    icon: '🌙', context: "Late check-in. Everything looks fine."   },
}

export function useGreeting() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  const slot   = getSlot(now.getHours())
  const config = SLOTS[slot]

  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })

  return {
    greeting:  config.greeting,
    icon:      config.icon,
    context:   config.context,
    insight:   AURA_GREETING.insight,
    dateStr,
    slot,
  }
}
