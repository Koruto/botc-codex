import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

import http from '@/api/http'

interface ServerWakeBannerProps {
  triggerKey: string
  delayMs?: number
  warmTtlMs?: number
}

const LAST_CHECKED_KEY = 'botc_server_last_checked_ms'

function readLastCheckedMs(): number {
  try {
    const raw = localStorage.getItem(LAST_CHECKED_KEY)
    const parsed = raw ? Number(raw) : 0
    return Number.isFinite(parsed) ? parsed : 0
  } catch {
    return 0
  }
}

export function ServerWakeBanner({ triggerKey, delayMs = 3000, warmTtlMs = 30 * 60 * 1000 }: ServerWakeBannerProps) {
  const [visible, setVisible] = useState(false)
  const activeRequestId = useRef(0)
  const dismissedRequestId = useRef<number | null>(null)

  useEffect(() => {
    const lastCheckedMs = readLastCheckedMs()
    const isWarm = warmTtlMs > 0 && lastCheckedMs > 0 && Date.now() - lastCheckedMs < warmTtlMs
    if (isWarm) {
      setVisible(false)
      return
    }

    const requestId = ++activeRequestId.current
    dismissedRequestId.current = null
    setVisible(false)

    const controller1 = new AbortController()

    let timeoutId: ReturnType<typeof setTimeout> | undefined
    timeoutId = setTimeout(() => {
      if (requestId === activeRequestId.current && dismissedRequestId.current !== requestId) setVisible(true)
    }, delayMs)

    const cancelled = { value: false }

    const run = async () => {
      try {
        await http.get('/api/health', { signal: controller1.signal })

        if (cancelled.value || requestId !== activeRequestId.current) return

        // First request worked; do exactly one more check, then cache + hide.
        const controller2 = new AbortController()
        await http.get('/api/health', { signal: controller2.signal })

        if (cancelled.value || requestId !== activeRequestId.current) return

        try {
          localStorage.setItem(LAST_CHECKED_KEY, String(Date.now()))
        } catch {
        }
        setVisible(false)
      } catch {
        // If it fails, keep things simple: hide the banner.
        if (!cancelled.value && requestId === activeRequestId.current) setVisible(false)
      } finally {
        if (timeoutId) clearTimeout(timeoutId)
      }
    }

    run()

    return () => {
      cancelled.value = true
      controller1.abort()
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [triggerKey, delayMs, warmTtlMs])

  const requestId = activeRequestId.current
  if (!visible) return null

  const handleDismiss = () => {
    dismissedRequestId.current = requestId || null
    setVisible(false)
  }

  return (
    <div className="w-full border-b border-primary/20 bg-primary/5 px-6 py-1.5 text-xs md:text-sm md:px-12" role="status" aria-live="polite">
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
        <div aria-hidden />
        <div className="text-center">
          <span className="font-medium text-primary">Heads up:</span> the server is waking up from sleep. Your first request may take a
          few extra seconds on the free tier.
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="justify-self-end rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4 hover:cursor-pointer" />
        </button>
      </div>
    </div>
  )
}

