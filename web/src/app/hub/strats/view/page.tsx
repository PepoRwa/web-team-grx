'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { ExternalLink, Pencil } from 'lucide-react'
import { HubShell } from '@/components/hub/hub-shell'
import { useAuth } from '@/hooks/useAuth'
import { ApiError, getStrat, type Strat } from '@/lib/api'
import { sideLabel, statusLabel } from '@/lib/strats'

function StratViewContent() {
  const searchParams = useSearchParams()
  const id = Number(searchParams.get('id'))
  const { session, user, permissions, loading: authLoading } = useAuth()
  const router = useRouter()

  const [strat, setStrat] = useState<Strat | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isStaff = Boolean(permissions?.isStaff)
  const canEdit =
    strat &&
    (isStaff || (strat.authorDiscordId === user?.discordId && strat.status === 'proposed'))

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
  }, [authLoading, session, router])

  const load = useCallback(async () => {
    if (!session?.access_token || !Number.isFinite(id) || id < 1) return
    setLoading(true)
    setError(null)
    try {
      const { strat: s } = await getStrat(session.access_token, id)
      setStrat(s)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Strat introuvable')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, id])

  useEffect(() => {
    if (!authLoading && session?.access_token) void load()
  }, [load, authLoading, session?.access_token])

  if (authLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  return (
    <HubShell activeNav="strats" title={strat?.title ?? 'Strat'} backHref="/hub/strats/">
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        {loading ? (
          <div className="card h-64 animate-pulse bg-[var(--accent-soft)]/30" />
        ) : error || !strat ? (
          <div className="card p-8 text-center">
            <p className="text-red-500">{error ?? 'Introuvable'}</p>
            <Link href="/hub/strats/" className="btn-primary mt-6 inline-flex">
              Retour
            </Link>
          </div>
        ) : (
          <article className="card overflow-hidden">
            {strat.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={strat.imageUrl} alt="" className="max-h-80 w-full object-contain bg-black/5" />
            )}
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <span className="badge badge-lavender">{strat.map}</span>
                  <span className="badge badge-mint">{sideLabel(strat.side)}</span>
                  {strat.status === 'proposed' && (
                    <span className="badge badge-gold">{statusLabel(strat.status)}</span>
                  )}
                </div>
                {canEdit && (
                  <Link href={`/hub/strats/edit/?id=${strat.id}`} className="btn-ghost text-sm">
                    <Pencil size={14} />
                    Modifier
                  </Link>
                )}
              </div>

              <h1 className="mt-4 text-2xl font-bold">{strat.title}</h1>
              {strat.authorUsername && (
                <p className="mt-1 text-sm text-[var(--text-muted)]">par {strat.authorUsername}</p>
              )}

              {strat.description && (
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">{strat.description}</p>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                {strat.valoplantUrl && (
                  <a href={strat.valoplantUrl} target="_blank" rel="noopener noreferrer" className="btn-primary text-sm">
                    <ExternalLink size={16} />
                    ValoPlant
                  </a>
                )}
                {strat.vodUrl && (
                  <a href={strat.vodUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm">
                    <ExternalLink size={16} />
                    VOD liée
                  </a>
                )}
              </div>

              {strat.status === 'proposed' && !isStaff && (
                <p className="mt-6 text-xs text-[var(--text-muted)]">
                  En attente de validation par le staff.
                </p>
              )}
            </div>
          </article>
        )}
      </main>
    </HubShell>
  )
}

export default function StratViewPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" /></div>}>
      <StratViewContent />
    </Suspense>
  )
}
