'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAssoAccess } from '@/hooks/useAssoAccess'

type Options = {
  requireBureau?: boolean
  /** Si true, les adhérents non-bureau sont redirigés (ex. pages bureau only) */
  bureauOnly?: boolean
}

export function useAssoGate(options: Options = {}) {
  const { session, loading: authLoading } = useAuth()
  const router = useRouter()
  const { access, loading: assoLoading } = useAssoAccess(session?.access_token, Boolean(session))

  const loading = authLoading || assoLoading

  useEffect(() => {
    if (loading) return
    if (!session) {
      router.replace('/')
      return
    }
    if (!access.hasAccess) {
      router.replace('/hub/')
      return
    }
    if (options.bureauOnly && !access.isBureau) {
      router.replace('/hub/asso/me/')
    }
  }, [loading, session, access, router, options.bureauOnly])

  const ready =
    !loading && Boolean(session) && access.hasAccess && (!options.bureauOnly || access.isBureau)

  return { session, access, loading, ready }
}
