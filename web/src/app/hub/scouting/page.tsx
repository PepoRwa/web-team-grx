'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Binoculars, Calendar, ChevronRight, Plus } from 'lucide-react'
import { HubShell } from '@/components/hub/hub-shell'
import { useAuth } from '@/hooks/useAuth'
import { ApiError, listScoutingTournaments, type ScoutingTournament } from '@/lib/api'

export default function ScoutingPage() {
  const { session, permissions, loading: authLoading } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<ScoutingTournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
    if (!authLoading && permissions && !permissions.canScout) router.replace('/hub/')
  }, [authLoading, session, permissions, router])

  const load = useCallback(async () => {
    if (!session?.access_token) return
    setLoading(true)
    setError(null)
    try {
      const data = await listScoutingTournaments(session.access_token)
      setItems(data.tournaments)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les tournois')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  useEffect(() => {
    if (!authLoading && session?.access_token && permissions?.canScout) void load()
  }, [load, authLoading, session?.access_token, permissions?.canScout])

  if (authLoading || !session || (permissions && !permissions.canScout)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  return (
    <HubShell activeNav="scouting" title="Scouting" subtitle="Tournois adverses">
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--text-muted)]">
            Centralise le scouting par tournoi → équipe → joueur.
          </p>
          <Link href="/hub/scouting/new/" className="btn-primary inline-flex w-fit">
            <Plus size={18} />
            Nouveau tournoi
          </Link>
        </div>

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="card h-28 animate-pulse bg-lavender/10" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 p-10 text-center">
            <Binoculars size={40} className="text-[var(--accent)]" />
            <p className="font-medium">Aucun tournoi scouté</p>
            <p className="text-sm text-[var(--text-muted)]">
              Crée un tournoi pour commencer (ex. Les Ascendants).
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((t) => (
              <Link
                key={t.id}
                href={`/hub/scouting/tournaments/view/?id=${t.id}`}
                className="card flex items-center justify-between gap-3 p-5 transition hover:border-[var(--accent)]"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{t.name}</p>
                  {(t.startDate || t.format) && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-[var(--text-muted)]">
                      <Calendar size={12} />
                      {[t.startDate, t.endDate && t.endDate !== t.startDate ? `→ ${t.endDate}` : null, t.format]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                </div>
                <ChevronRight size={20} className="shrink-0 text-[var(--text-muted)]" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </HubShell>
  )
}
