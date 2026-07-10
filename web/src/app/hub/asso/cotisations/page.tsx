'use client'

import { useCallback, useEffect, useState } from 'react'
import { AssoCotisationsTable } from '@/components/asso/asso-cotisations-table'
import { AssoShell } from '@/components/asso/asso-shell'
import { useAssoGate } from '@/hooks/useAssoGate'
import { useAuth } from '@/hooks/useAuth'
import { cotisationStatusLabels } from '@/lib/asso-cotisation-labels'
import { assoAccessLevelLabels } from '@/lib/asso-document-labels'
import {
  ApiError,
  getAssoCotisations,
  type AssoCotisationStatus,
  type CotisationsOverview,
} from '@/lib/api'

const STAT_CARDS: {
  key: AssoCotisationStatus
  label: string
  accent: string
}[] = [
  { key: 'paye', label: 'Payées', accent: 'text-mint' },
  { key: 'en_attente', label: 'En attente', accent: 'text-lavender' },
  { key: 'expire', label: 'Expirées', accent: 'text-[var(--text-muted)]' },
  { key: 'dispense', label: 'Dispensés', accent: 'text-gold' },
]

export default function AssoCotisationsPage() {
  const { session } = useAuth()
  const { ready } = useAssoGate({ bureauOnly: true, module: 'cotisations', moduleMin: 'lecture' })
  const token = session?.access_token

  const [overview, setOverview] = useState<CotisationsOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const data = await getAssoCotisations(token)
      setOverview(data.overview)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Cotisations indisponibles')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (ready && token) void load()
  }, [ready, token, load])

  if (!ready) return null

  return (
    <AssoShell activeNav="cotisations" title="Cotisations">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {overview && (
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="badge badge-lavender">
              Exercice {overview.fiscalYear}
            </span>
            <span className="badge">
              Niveau : {assoAccessLevelLabels[overview.cotisationsLevel]}
            </span>
            {overview.canEdit ? (
              <span className="badge badge-mint">Édition autorisée</span>
            ) : (
              <span className="badge">Lecture seule</span>
            )}
          </div>
        )}

        {loading ? (
          <div className="card flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-pulse rounded-full bg-lavender/40" />
          </div>
        ) : error ? (
          <div className="card border-rose/30 p-6 text-sm text-rose">{error}</div>
        ) : overview ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STAT_CARDS.map((card) => (
                <div key={card.key} className="card p-4">
                  <p className="text-xs text-[var(--text-muted)]">
                    {card.label}
                  </p>
                  <p className={`mt-1 text-2xl font-bold ${card.accent}`}>
                    {overview.counts[card.key]}
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--text-muted)]">
                    {cotisationStatusLabels[card.key]}
                  </p>
                </div>
              ))}
            </div>

            <AssoCotisationsTable
              accessToken={token!}
              rows={overview.rows}
              canEdit={overview.canEdit}
              onChanged={() => void load()}
            />
          </>
        ) : null}
      </div>
    </AssoShell>
  )
}
