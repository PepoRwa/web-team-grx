'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  checkSystemHealth,
  type ApiLifecycle,
  type HealthPayload,
  type SystemIncident,
} from '@/lib/system-health'

const WARMING_POLL_MS = 4_000
const DOWN_POLL_MS = 8_000
const MAX_AUTO_ATTEMPTS = 20

interface SystemStatusValue {
  lifecycle: ApiLifecycle
  isInitializing: boolean
  /** API healthy — auth sync / Discord login autorisés. */
  isReady: boolean
  incident: SystemIncident | null
  attempt: number
  lastLatencyMs: number | null
  health: HealthPayload | null
  retrying: boolean
  nextRetryInSec: number | null
  blockApp: boolean
  showBanner: boolean
  retry: () => Promise<void>
}

const SystemStatusContext = createContext<SystemStatusValue | null>(null)

export function SystemStatusProvider({ children }: { children: ReactNode }) {
  const [lifecycle, setLifecycle] = useState<ApiLifecycle>('checking')
  const [isInitializing, setIsInitializing] = useState(true)
  const [incident, setIncident] = useState<SystemIncident | null>(null)
  const [attempt, setAttempt] = useState(0)
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null)
  const [health, setHealth] = useState<HealthPayload | null>(null)
  const [retrying, setRetrying] = useState(false)
  const [nextRetryInSec, setNextRetryInSec] = useState<number | null>(null)

  const wasReadyRef = useRef(false)
  const attemptRef = useRef(0)
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const mountedRef = useRef(true)

  const clearTimers = useCallback(() => {
    if (pollTimer.current) clearTimeout(pollTimer.current)
    if (countdownTimer.current) clearInterval(countdownTimer.current)
    pollTimer.current = null
    countdownTimer.current = null
    if (mountedRef.current) setNextRetryInSec(null)
  }, [])

  const runCheck = useCallback(
    async (opts?: { manual?: boolean }) => {
      if (!mountedRef.current) return
      if (opts?.manual) setRetrying(true)

      attemptRef.current += 1
      const n = attemptRef.current
      setAttempt(n)
      if (n === 1 || opts?.manual) setLifecycle((prev) => (prev === 'ready' ? prev : 'checking'))

      try {
        const result = await checkSystemHealth()
        if (!mountedRef.current) return

        setLastLatencyMs(result.latencyMs)

        if (result.ok) {
          wasReadyRef.current = true
          setIncident(null)
          setHealth(result.payload)
          setLifecycle('ready')
          clearTimers()
          return
        }

        setHealth(null)
        setIncident(result.incident)
        setLifecycle(result.lifecycle)

        const shouldAuto =
          !wasReadyRef.current &&
          n < MAX_AUTO_ATTEMPTS &&
          (result.lifecycle === 'warming' ||
            result.incident.likelyColdStart ||
            result.lifecycle === 'down')

        if (shouldAuto) {
          clearTimers()
          const delay =
            result.lifecycle === 'warming' || result.incident.likelyColdStart
              ? WARMING_POLL_MS
              : DOWN_POLL_MS
          const endsAt = Date.now() + delay
          setNextRetryInSec(Math.ceil(delay / 1000))
          countdownTimer.current = setInterval(() => {
            if (!mountedRef.current) return
            setNextRetryInSec(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)))
          }, 250)
          pollTimer.current = setTimeout(() => {
            void runCheck()
          }, delay)
        } else {
          clearTimers()
        }
      } finally {
        if (mountedRef.current) {
          setIsInitializing(false)
          if (opts?.manual) setRetrying(false)
        }
      }
    },
    [clearTimers],
  )

  useEffect(() => {
    mountedRef.current = true
    void runCheck()
    return () => {
      mountedRef.current = false
      clearTimers()
    }
  }, [runCheck, clearTimers])

  const retry = useCallback(async () => {
    clearTimers()
    await runCheck({ manual: true })
  }, [clearTimers, runCheck])

  const isReady = lifecycle === 'ready'
  const blockApp =
    isInitializing ||
    lifecycle === 'checking' ||
    lifecycle === 'warming' ||
    ((lifecycle === 'down' || lifecycle === 'degraded') && !wasReadyRef.current)

  const value = useMemo<SystemStatusValue>(
    () => ({
      lifecycle,
      isInitializing,
      isReady,
      incident,
      attempt,
      lastLatencyMs,
      health,
      retrying,
      nextRetryInSec,
      blockApp,
      showBanner: Boolean(incident) && wasReadyRef.current,
      retry,
    }),
    [
      lifecycle,
      isInitializing,
      isReady,
      incident,
      attempt,
      lastLatencyMs,
      health,
      retrying,
      nextRetryInSec,
      blockApp,
      retry,
    ],
  )

  return (
    <SystemStatusContext.Provider value={value}>{children}</SystemStatusContext.Provider>
  )
}

export function useSystemStatus(): SystemStatusValue {
  const ctx = useContext(SystemStatusContext)
  if (!ctx) {
    throw new Error('useSystemStatus must be used within SystemStatusProvider')
  }
  return ctx
}
