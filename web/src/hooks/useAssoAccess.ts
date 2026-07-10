'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError, getAssoAccess, type AssoAccess } from '@/lib/api'

const EMPTY: AssoAccess = { hasAccess: false, isBureau: false, dossierId: null }

export function useAssoAccess(accessToken: string | undefined, enabled = true) {
  const [access, setAccess] = useState<AssoAccess>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!accessToken || !enabled) {
      setAccess(EMPTY)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await getAssoAccess(accessToken)
      setAccess(data)
    } catch (err) {
      setAccess(EMPTY)
      setError(err instanceof ApiError ? err.message : 'Accès asso indisponible')
    } finally {
      setLoading(false)
    }
  }, [accessToken, enabled])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { access, loading, error, refresh }
}
