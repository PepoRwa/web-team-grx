'use client'

import type { ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { SystemOutage } from '@/components/system-outage'
import { useSystemStatus } from '@/hooks/useSystemStatus'

export function SystemGate({ children }: { children: ReactNode }) {
  const { isInitializing, incident, retrying, blockApp, showBanner, retry } = useSystemStatus()

  if (isInitializing) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3">
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-lavender/40" />
        <p className="text-sm text-[var(--text-muted)]">Vérification des services…</p>
      </div>
    )
  }

  if (blockApp && incident) {
    return <SystemOutage incident={incident} onRetry={() => void retry()} retrying={retrying} />
  }

  return (
    <>
      {showBanner && incident && (
        <div
          className="fixed left-0 right-0 top-0 z-50 flex items-center justify-center gap-2 border-b border-amber-500/30 bg-amber-500/10 px-3 py-2 text-center text-xs backdrop-blur-sm sm:text-sm"
          role="status"
        >
          <AlertTriangle size={16} className="shrink-0 text-amber-600" />
          <span className="text-[var(--text)]">
            {incident.title} — les données peuvent ne pas se sauvegarder.
          </span>
          <button
            type="button"
            className="ml-1 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-semibold text-[var(--accent)] hover:underline"
            onClick={() => void retry()}
            disabled={retrying}
          >
            <RefreshCw size={14} className={retrying ? 'animate-spin' : ''} />
            Réessayer
          </button>
        </div>
      )}
      {children}
    </>
  )
}
