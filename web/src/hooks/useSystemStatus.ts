'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  checkSystemHealth,
  type SystemIncident,
} from '@/lib/system-health'

/** Ping /health une fois au chargement — jamais de re-mount de l'app ensuite. */
export function useSystemStatus() {
  const [isInitializing, setIsInitializing] = useState(true)
  const [incident, setIncident] = useState<SystemIncident | null>(null)
  const [retrying, setRetrying] = useState(false)
  const wasOperationalRef = useRef(false)

  const check = useCallback(async (opts?: { manual?: boolean }) => {
    if (opts?.manual) setRetrying(true)
    try {
      const result = await checkSystemHealth()
      if (result.ok) {
        wasOperationalRef.current = true
        setIncident(null)
      } else {
        setIncident(result.incident)
      }
    } finally {
      setIsInitializing(false)
      if (opts?.manual) setRetrying(false)
    }
  }, [])

  useEffect(() => {
    void check()
  }, [check])

  const blockApp = isInitializing || (Boolean(incident) && !wasOperationalRef.current)

  return {
    isInitializing,
    incident,
    retrying,
    blockApp,
    showBanner: Boolean(incident) && wasOperationalRef.current,
    retry: () => check({ manual: true }),
    isOperational: !incident,
  }
}
