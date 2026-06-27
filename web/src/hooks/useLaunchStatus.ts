'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { getLaunchStatus, type LaunchPhase, type LaunchStatus } from '@/lib/api'

const LIVE_STATUS: LaunchStatus = {
  phase: 'live',
  isActive: false,
  opensAt: new Date().toISOString(),
  celebrationEndsAt: null,
  secondsRemaining: 0,
  progress: 1,
  ceoMessageTitle: null,
  ceoMessageBody: null,
  manualUnlock: false,
}

function computePhase(status: LaunchStatus, now: number): LaunchPhase {
  if (!status.isActive || status.manualUnlock) return 'live'
  const opens = new Date(status.opensAt).getTime()
  if (now >= opens) return 'live'
  return 'countdown'
}

function computeDerived(status: LaunchStatus, now: number) {
  const opens = new Date(status.opensAt).getTime()
  const phase = computePhase(status, now)

  const windowStart = opens - 24 * 60 * 60 * 1000
  const progress =
    phase === 'countdown'
      ? Math.min(1, Math.max(0, (now - windowStart) / (opens - windowStart)))
      : 1

  const secondsRemaining =
    phase === 'countdown' ? Math.max(0, Math.floor((opens - now) / 1000)) : 0

  return { phase, progress, secondsRemaining }
}

export function useLaunchStatus() {
  const [status, setStatus] = useState<LaunchStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [now, setNow] = useState(() => Date.now())

  const load = useCallback(async () => {
    try {
      const { status: s } = await getLaunchStatus()
      setStatus(s)
    } catch {
      setStatus(LIVE_STATUS)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const poll = setInterval(() => void load(), 30_000)
    return () => clearInterval(poll)
  }, [load])

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  const effective = useMemo(() => {
    if (!status) return null
    const derived = computeDerived(status, now)
    return { ...status, ...derived }
  }, [status, now])

  const isPreLive = effective
    ? effective.isActive && effective.phase !== 'live'
    : false

  const isHubLocked = effective
    ? effective.isActive && effective.phase === 'countdown'
    : false

  return { status: effective, loading, isPreLive, isHubLocked, refresh: load }
}
