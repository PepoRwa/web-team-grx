'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { ChevronRight, Plus, UserPlus } from 'lucide-react'
import { HubShell } from '@/components/hub/hub-shell'
import { TryoutReadonlyBanner } from '@/components/tryout-readonly-banner'
import { useAuth } from '@/hooks/useAuth'
import { ApiError, listTryoutCampaigns, type TryoutCampaign } from '@/lib/api'
import { campaignStatusLabel, targetRosterLabel } from '@/lib/tryouts'

export default function TryoutsPage() {
  const { session, permissions, loading: authLoading } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<TryoutCampaign[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const canWrite = Boolean(permissions?.canTryoutWrite)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
    if (!authLoading && permissions && !permissions.canTryoutRead) router.replace('/hub/')
  }, [authLoading, session, permissions, router])

  const load = useCallback(async () => {
    if (!session?.access_token) return
    setLoading(true)
    setError(null)
    try {
      const data = await listTryoutCampaigns(session.access_token)
      setItems(data.campaigns)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les campagnes')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  useEffect(() => {
    if (!authLoading && session?.access_token && permissions?.canTryoutRead) void load()
  }, [load, authLoading, session?.access_token, permissions?.canTryoutRead])

  if (authLoading || !session || (permissions && !permissions.canTryoutRead)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  const active = items.filter((c) => c.status === 'active')
  const other = items.filter((c) => c.status !== 'active')

  return (
    <HubShell activeNav="tryouts" title="Try Outs" subtitle="Recrutement interne">
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:py-8">
        <TryoutReadonlyBanner show={!canWrite} />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--text-muted)]">
            Suivi des candidats par campagne et roster cible.
          </p>
          {canWrite && (
            <Link href="/hub/tryouts/campaigns/new/" className="btn-primary inline-flex w-fit">
              <Plus size={18} />
              Nouvelle campagne
            </Link>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="card h-28 animate-pulse bg-lavender/10" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 p-10 text-center">
            <UserPlus size={40} className="text-[var(--accent)]" />
            <p className="font-medium">Aucune campagne tryout</p>
            {canWrite && (
              <p className="text-sm text-[var(--text-muted)]">
                Crée une campagne pour commencer le suivi recrutement.
              </p>
            )}
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Actives
                </h2>
                <CampaignGrid campaigns={active} />
              </section>
            )}
            {other.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  Archivées / brouillons
                </h2>
                <CampaignGrid campaigns={other} />
              </section>
            )}
          </>
        )}
      </main>
    </HubShell>
  )
}

function CampaignGrid({ campaigns }: { campaigns: TryoutCampaign[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {campaigns.map((c) => (
        <Link
          key={c.id}
          href={`/hub/tryouts/campaigns/view/?id=${c.id}`}
          className="card flex items-center justify-between gap-3 p-5 transition hover:border-[var(--accent)]"
        >
          <div className="min-w-0">
            <p className="truncate font-semibold">{c.name}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {targetRosterLabel(c.targetRoster)} · {campaignStatusLabel(c.status)}
            </p>
          </div>
          <ChevronRight size={20} className="shrink-0 text-[var(--text-muted)]" />
        </Link>
      ))}
    </div>
  )
}
