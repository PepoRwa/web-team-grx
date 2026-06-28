'use client'

import type { ReactNode } from 'react'
import { SystemOutage } from '@/components/system-outage'
import { useSystemStatus } from '@/hooks/useSystemStatus'

export function SystemGate({ children }: { children: ReactNode }) {
  const { loading, incident, refresh } = useSystemStatus()

  if (loading) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3">
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-lavender/40" />
        <p className="text-sm text-[var(--text-muted)]">Vérification des services…</p>
      </div>
    )
  }

  if (incident) {
    return <SystemOutage incident={incident} onRetry={() => void refresh()} />
  }

  return <>{children}</>
}
