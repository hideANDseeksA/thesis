// useWalkthrough.js
import { useState, useEffect } from 'react'

const STORAGE_KEY = 'residents_walkthrough_done'

export function useWalkthrough() {
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY)
    if (!done) {
      // Small delay so the page renders first
      const t = setTimeout(() => setActive(true), 600)
      return () => clearTimeout(t)
    }
  }, [])

  const next = () => {
    setStep((s) => s + 1)
  }

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setActive(false)
    setStep(0)
  }

  const skip = () => finish()

  return { active, step, next, finish, skip }
}