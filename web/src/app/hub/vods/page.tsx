'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, ExternalLink, Film, Plus, Search } from 'lucide-react'
import { HubShell } from '@/components/hub/hub-shell'
import { useAuth } from '@/hooks/useAuth'
import { ApiError, listVods, type Vod } from '@/lib/api'
import { formatMatchDate, statusBadgeClass, statusLabel } from '@/lib/format'

type FilterTab = 'all' | 'scrim' | 'pro'

export default function VodsPage() {
  const { session, loading: authLoading } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<Vod[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [tab, setTab] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const limit = 12

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
  }, [authLoading, session, router])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  useEffect(() => {
    setPage(1)
  }, [tab, debouncedSearch])

  const load = useCallback(async () => {
    if (!session?.access_token) return
    setLoading(true)
    setError(null)
    try {
      const isPro = tab === 'pro' ? true : tab === 'scrim' ? false : undefined
      const data = await listVods(session.access_token, {
        page,
        limit,
        isPro,
        search: debouncedSearch || undefined,
      })
      setItems(data.items)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les VODs')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, page, tab, debouncedSearch])

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

  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <HubShell
      activeNav="vods"
      title="VODs & Replays"
      subtitle={`${total} replay${total !== 1 ? 's' : ''}`}
    >
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-2">
            {(
              [
                ['all', 'Toutes'],
                ['scrim', 'Scrims'],
                ['pro', 'Pro'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  tab === key
                    ? 'bg-[var(--accent)] text-white'
                    : 'border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)]'
                }`}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
            </div>
            <Link href="/hub/vods/new/" className="btn-primary text-sm">
              <Plus size={16} />
              Ajouter
            </Link>
          </div>

          <label className="relative flex items-center">
            <Search size={16} className="absolute left-3 text-[var(--text-muted)]" />
            <input
              type="search"
              placeholder="Rechercher map, titre, adversaire…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] py-2 pl-9 pr-4 text-sm outline-none focus:border-[var(--accent)] sm:w-72"
            />
          </label>
        </div>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card h-36 animate-pulse bg-[var(--accent-soft)]/30" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="card mt-8 p-12 text-center">
            <Film className="mx-auto text-[var(--text-muted)]" size={40} />
            <p className="mt-4 font-medium">Aucune VOD trouvée</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {debouncedSearch ? 'Essaie une autre recherche.' : 'La librairie est vide pour l’instant.'}
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((vod) => (
              <article key={vod.id} className="card flex flex-col p-5 transition hover:-translate-y-0.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <span className={`badge ${statusBadgeClass(vod.status)}`}>
                    {statusLabel(vod.status)}
                  </span>
                  {vod.isPro && <span className="badge badge-gold">Pro</span>}
                </div>
                <h2 className="mt-3 line-clamp-2 font-semibold">{vod.title}</h2>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {vod.map} · {formatMatchDate(vod.matchDate)}
                </p>
                <p className="mt-1 text-sm font-medium">{vod.score}</p>
                {vod.opponent && (
                  <p className="text-xs text-[var(--text-muted)]">vs {vod.opponent}</p>
                )}
                <div className="mt-auto flex gap-2 pt-4">
                  <Link
                    href={`/hub/vods/view/?id=${vod.id}`}
                    className="btn-primary flex-1 text-sm"
                  >
                    Détails
                  </Link>
                  <a
                    href={vod.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-ghost px-3"
                    aria-label="Ouvrir le replay"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              className="btn-ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={16} />
              Préc.
            </button>
            <span className="text-sm text-[var(--text-muted)]">
              Page {page} / {totalPages}
            </span>
            <button
              type="button"
              className="btn-ghost"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Suiv.
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </main>
    </HubShell>
  )
}
