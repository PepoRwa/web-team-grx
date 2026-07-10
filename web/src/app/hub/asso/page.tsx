'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { AssoLoadingScreen } from '@/components/asso/asso-loading-screen'
import { useAuth } from '@/hooks/useAuth'
import { useAssoAccess } from '@/hooks/useAssoAccess'

export default function AssoIndexPage() {
  const { session, loading: authLoading } = useAuth()
  const router = useRouter()
  const { access, loading: assoLoading } = useAssoAccess(session?.access_token, Boolean(session))

  useEffect(() => {
    if (authLoading || assoLoading) return
    if (!session) {
      router.replace('/')
      return
    }
    if (!access.hasAccess) {
      router.replace('/hub/')
      return
    }
    router.replace(access.isBureau ? '/hub/asso/dossiers/' : '/hub/asso/me/')
  }, [authLoading, assoLoading, session, access, router])

  return <AssoLoadingScreen />
}
