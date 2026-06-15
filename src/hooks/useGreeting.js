// ═══════════════════════════════════════════════════════════════
// useGreeting.js — Time-aware, health-state-aware greeting
// Reads the active user from UserContext.
// ═══════════════════════════════════════════════════════════════
import { useState, useEffect } from 'react'

function getTimeSlot(hour) {
  if (hour >= 6  && hour < 9)  return 'early_morning'
  if (hour >= 9  && hour < 12) return 'morning'
  if (hour >= 12 && hour < 15) return 'afternoon'
  if (hour >= 15 && hour < 19) return 'late_afternoon'
  if (hour >= 19 && hour < 23) return 'evening'
  return 'night'
}

function buildGreeting(name, slot, healthState) {
  // Night owl is always the same regardless of health state
  if (slot === 'night') {
    return { greeting: `Hey night owl, ${name}`, emoji: '🌙' }
  }

  // Health-state-aware openings per the personality spec
  if (healthState === 'critical') {
    const criticalGreetings = {
      early_morning: { greeting: `Morning, ${name}`,              emoji: '☀️' },
      morning:       { greeting: `${name}, let's fix this today`, emoji: '⚡' },
      afternoon:     { greeting: `${name}`,                        emoji: ''   },
      late_afternoon:{ greeting: `${name}, still with you`,       emoji: ''   },
      evening:       { greeting: `Evening check-in, ${name}`,     emoji: '🌆' },
    }
    return criticalGreetings[slot] || { greeting: name, emoji: '' }
  }

  if (healthState === 'watchful') {
    const watchfulGreetings = {
      early_morning: { greeting: `Good morning, ${name}`,        emoji: '☀️' },
      morning:       { greeting: `${name}, here's where things stand`, emoji: '📊' },
      afternoon:     { greeting: `Afternoon, ${name}`,           emoji: '⛅' },
      late_afternoon:{ greeting: `Wrapping up, ${name}?`,        emoji: '🌤' },
      evening:       { greeting: `Evening, ${name}`,             emoji: '🌇' },
    }
    return watchfulGreetings[slot] || { greeting: `Good day, ${name}`, emoji: '' }
  }

  // Healthy state
  const healthyGreetings = {
    early_morning: { greeting: `Good morning, ${name}`,          emoji: '🌅' },
    morning:       { greeting: `Good morning, ${name}`,          emoji: '☀️' },
    afternoon:     { greeting: `Good afternoon, ${name}`,        emoji: '⛅' },
    late_afternoon:{ greeting: `${name}, you're on track today`, emoji: '✨' },
    evening:       { greeting: `Good evening, ${name}`,          emoji: '🌇' },
  }
  return healthyGreetings[slot] || { greeting: `Hello, ${name}`, emoji: '' }
}

export function useGreeting(user) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])

  if (!user) return { greeting: 'Hello', emoji: '', contextLine: '', slot: 'morning' }

  const slot   = getTimeSlot(now.getHours())
  const { greeting, emoji } = buildGreeting(user.name, slot, user.healthState)

  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })

  return {
    greeting,
    emoji,
    contextLine: user.auraGreeting.contextLine,
    dateStr,
    slot,
  }
}
