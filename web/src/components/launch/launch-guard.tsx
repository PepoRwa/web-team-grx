'use client'

import { useRouter } from 'next/navigation'
import { useEffect, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useLaunchStatus } from '@/hooks/useLaunchStatus'

export function LaunchGuard({ children }: { children: ReactNode }) {
  const { loading, isHubLocked } = useLaunchStatus()
  const { permissions, loading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading || authLoading) return
    if (!isHubLocked) return
    if (permissions?.isCEO) return
    router.replace('/launch/')
  }, [loading, authLoading, isHubLocked, permissions?.isCEO, router])

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  if (isHubLocked && !permissions?.isCEO) {
    return null
  }

  return <>{children}</>
}
