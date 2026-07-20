'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { BookOpen, Plus, Search, Shield, Swords } from 'lucide-react'
import { HubShell } from '@/components/hub/hub-shell'
import { useAuth } from '@/hooks/useAuth'
import { ApiError, listStrats, type Strat, type StratSide } from '@/lib/api'
import { isFeatureEnabled } from '@/lib/feature-flags'
import { sideLabel, statusLabel } from '@/lib/strats'

type SideFilter = 'all' | StratSide
type StatusFilter = 'published' | 'proposed' | 'all'

export default function StratsPage() {
  const { session, permissions, loading: authLoading } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<Strat[]>([])
  const [side, setSide] = useState<SideFilter>('all')
  const [statusTab, setStatusTab] = useState<StatusFilter>('published')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isStaff = Boolean(permissions?.isStaff)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
    if (!authLoading && !isFeatureEnabled('strats')) router.replace('/hub/')
  }, [authLoading, session, router])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const load = useCallback(async () => {
    if (!session?.access_token) return
    setLoading(true)
    setError(null)
    try {
      const status =
        isStaff && statusTab !== 'all' ? statusTab : !isStaff ? 'published' : undefined
      const data = await listStrats(session.access_token, {
        side: side === 'all' ? undefined : side,
        search: debouncedSearch || undefined,
        status,
      })
      setItems(data.strats)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les strats')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, side, debouncedSearch, statusTab, isStaff])

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
    <HubShell
      activeNav="strats"
      title="Strat-Book"
      subtitle={`${items.length} strat${items.length !== 1 ? 's' : ''}`}
    >
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex gap-2">
              {(
                [
                  ['all', 'Toutes', null],
                  ['attack', 'Attaque', Swords],
                  ['defense', 'Défense', Shield],
                ] as const
              ).map(([key, label, Icon]) => (
                <button
                  key={key}
                  type="button"
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                    side === key
                      ? 'bg-[var(--accent)] text-white'
                      : 'border border-[var(--border)] text-[var(--text-muted)]'
                  }`}
                  onClick={() => setSide(key)}
                >
                  {Icon && <Icon size={14} />}
                  {label}
                </button>
              ))}
            </div>
            {isStaff && (
              <div className="flex gap-1 rounded-full border border-[var(--border)] p-1">
                {(['published', 'proposed', 'all'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      statusTab === s ? 'bg-[var(--accent-soft)] text-[var(--accent)]' : 'text-[var(--text-muted)]'
                    }`}
                    onClick={() => setStatusTab(s)}
                  >
                    {s === 'all' ? 'Toutes' : statusLabel(s)}
                  </button>
                ))}
              </div>
            )}
            <Link href="/hub/strats/new/" className="btn-primary text-sm">
              <Plus size={16} />
              Proposer
            </Link>
          </div>

          <label className="relative flex items-center">
            <Search size={16} className="absolute left-3 text-[var(--text-muted)]" />
            <input
              type="search"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] py-2 pl-9 pr-4 text-sm outline-none focus:border-[var(--accent)] sm:w-64"
            />
          </label>
        </div>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card h-40 animate-pulse bg-[var(--accent-soft)]/30" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="card mt-8 p-12 text-center">
            <BookOpen className="mx-auto text-[var(--text-muted)]" size={40} />
            <p className="mt-4 font-medium">Aucune strat trouvée</p>
            <Link href="/hub/strats/new/" className="btn-primary mt-6 inline-flex">
              Proposer une strat
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((strat) => (
              <Link
                key={strat.id}
                href={`/hub/strats/view/?id=${strat.id}`}
                className="card block overflow-hidden transition hover:-translate-y-0.5"
              >
                {strat.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={strat.imageUrl} alt="" className="h-32 w-full object-cover" />
                )}
                <div className="p-5">
                  <div className="flex flex-wrap gap-2">
                    <span className="badge badge-lavender">{strat.map}</span>
                    <span className="badge badge-mint">{sideLabel(strat.side)}</span>
                    {strat.status === 'proposed' && (
                      <span className="badge badge-gold">{statusLabel(strat.status)}</span>
                    )}
                  </div>
                  <h2 className="mt-3 font-semibold line-clamp-2">{strat.title}</h2>
                  {strat.authorUsername && (
                    <p className="mt-1 text-xs text-[var(--text-muted)]">par {strat.authorUsername}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </HubShell>
  )
}
