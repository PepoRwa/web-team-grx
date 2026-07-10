'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAssoAccess } from '@/hooks/useAssoAccess'
import type { AssoAccessLevel, AssoModule } from '@/lib/api'
import { assoDefaultPath } from '@/components/asso/asso-nav'

const LEVEL_RANK: Record<AssoAccessLevel, number> = {
  aucun: 0,
  lecture: 1,
  edition: 2,
  admin: 3,
}

type Options = {
  /** Si true, les adhérents non-bureau sont redirigés */
  bureauOnly?: boolean
  module?: AssoModule
  moduleMin?: AssoAccessLevel
}

export function useAssoGate(options: Options = {}) {
  const { session, loading: authLoading } = useAuth()
  const router = useRouter()
  const { access, loading: assoLoading } = useAssoAccess(session?.access_token, Boolean(session))

  const loading = authLoading || assoLoading
  const moduleMin = options.moduleMin ?? 'lecture'

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
      return
    }
    if (options.module) {
      const level = access.modules?.[options.module] ?? 'aucun'
      if (LEVEL_RANK[level] < LEVEL_RANK[moduleMin]) {
        router.replace(assoDefaultPath(access))
      }
    }
  }, [loading, session, access, router, options.bureauOnly, options.module, moduleMin])

  const moduleOk = !options.module
    ? true
    : LEVEL_RANK[access.modules?.[options.module] ?? 'aucun'] >= LEVEL_RANK[moduleMin]

  const ready =
    !loading &&
    Boolean(session) &&
    access.hasAccess &&
    (!options.bureauOnly || access.isBureau) &&
    moduleOk

  return { session, access, loading, ready }
}
