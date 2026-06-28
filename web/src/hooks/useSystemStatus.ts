'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  checkSystemHealth,
  type SystemIncident,
} from '@/lib/system-health'

export function useSystemStatus() {
  const [loading, setLoading] = useState(true)
  const [incident, setIncident] = useState<SystemIncident | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const result = await checkSystemHealth()
    setIncident(result.ok ? null : result.incident)
    setLoading(false)
  }, [])

  useEffect(() => {
    void refresh()
    const poll = setInterval(() => void refresh(), 30_000)
    return () => clearInterval(poll)
  }, [refresh])

  return { loading, incident, refresh, isOperational: !loading && !incident }
}
