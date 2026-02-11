import { useState, useEffect, useRef } from 'react'

/** Delay before nomination clock starts (ms). Wait for background transition (2s) + small buffer. */
const NOMINATION_ROTATION_DELAY_MS = 2000
/** Duration for the nomination clock hand to complete one full rotation (ms). */
const NOMINATION_ROTATION_DURATION_MS = 2800
/** Delay after rotation finishes before hiding hands and showing stats (ms). */
const NOMINATION_DONE_DELAY_MS = 500

interface UseNominationAnimationProps {
  showNominationHands: boolean
  votesForIndices: number[]
}

export function useNominationAnimation({ showNominationHands, votesForIndices }: UseNominationAnimationProps) {
  const [rotationProgress, setRotationProgress] = useState(0)
  const [rotationDoneDisplay, setRotationDoneDisplay] = useState(false)
  const [revealedHandIndices, setRevealedHandIndices] = useState<Set<number>>(new Set())
  const rotationStartRef = useRef<number | null>(null)
  
  // Hand reveal animation (staggered appearance)
  useEffect(() => {
    if (!showNominationHands || votesForIndices.length === 0) {
      setRevealedHandIndices(new Set())
      return
    }
    const timeouts: number[] = []
    votesForIndices.forEach((idx) => {
      const delay = Math.floor(Math.random() * 700)
      const id = window.setTimeout(() => {
        setRevealedHandIndices((prev) => new Set(prev).add(idx))
      }, delay)
      timeouts.push(id)
    })
    return () => timeouts.forEach(clearTimeout)
  }, [showNominationHands, JSON.stringify(votesForIndices)])

  // Rotation animation
  const rotationRafRef = useRef<number | null>(null)
  useEffect(() => {
    if (!showNominationHands) {
      setRotationProgress(0)
      setRotationDoneDisplay(false)
      rotationStartRef.current = null
      if (rotationRafRef.current != null) cancelAnimationFrame(rotationRafRef.current)
      return
    }
    setRotationProgress(0)
    setRotationDoneDisplay(false)
    rotationStartRef.current = null
    const timeoutId = window.setTimeout(() => {
      const tick = (now: number) => {
        if (rotationStartRef.current == null) rotationStartRef.current = now
        const elapsed = now - rotationStartRef.current
        const progress = Math.min(elapsed / NOMINATION_ROTATION_DURATION_MS, 1)
        setRotationProgress(progress)
        if (progress < 1) rotationRafRef.current = requestAnimationFrame(tick)
      }
      rotationRafRef.current = requestAnimationFrame(tick)
    }, NOMINATION_ROTATION_DELAY_MS)
    return () => {
      clearTimeout(timeoutId)
      if (rotationRafRef.current != null) cancelAnimationFrame(rotationRafRef.current)
    }
  }, [showNominationHands])

  // End delay
  useEffect(() => {
    if (!showNominationHands || rotationProgress < 1) return
    const id = window.setTimeout(() => setRotationDoneDisplay(true), NOMINATION_DONE_DELAY_MS)
    return () => clearTimeout(id)
  }, [showNominationHands, rotationProgress])

  return {
    rotationProgress,
    rotationDoneDisplay,
    revealedHandIndices
  }
}
