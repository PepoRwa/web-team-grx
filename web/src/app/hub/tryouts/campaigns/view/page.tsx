'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { HubShell } from '@/components/hub/hub-shell'
import { TryoutPipelineBoard } from '@/components/tryout-pipeline-board'
import { TryoutReadonlyBanner } from '@/components/tryout-readonly-banner'
import { useAuth } from '@/hooks/useAuth'
import {
  ApiError,
  getTryoutCampaign,
  getTryoutCampaignBoard,
  type TryoutCampaign,
  type TryoutCandidate,
  type TryoutPipelineStatus,
} from '@/lib/api'
import { campaignStatusLabel, targetRosterLabel } from '@/lib/tryouts'

function CampaignViewContent() {
  const { session, permissions, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const id = Number(params.get('id'))
  const [campaign, setCampaign] = useState<TryoutCampaign | null>(null)
  const [columns, setColumns] = useState<
    { status: TryoutPipelineStatus; candidates: TryoutCandidate[] }[]
  >([])
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const canWrite = Boolean(permissions?.canTryoutWrite)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
    if (!authLoading && permissions && !permissions.canTryoutRead) router.replace('/hub/')
  }, [authLoading, session, permissions, router])

  const load = useCallback(async () => {
    if (!session?.access_token || !id) return
    setLoading(true)
    setError(null)
    try {
      const [detail, board] = await Promise.all([
        getTryoutCampaign(session.access_token, id),
        getTryoutCampaignBoard(session.access_token, id),
      ])
      setCampaign(detail.campaign)
      setStatusCounts(detail.statusCounts)
      setColumns(board.columns)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Campagne introuvable')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, id])

  useEffect(() => {
    if (!authLoading && session?.access_token && permissions?.canTryoutRead && id) void load()
  }, [load, authLoading, session?.access_token, permissions?.canTryoutRead, id])

  if (authLoading || !session || (permissions && !permissions.canTryoutRead)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  const activeCount = Object.entries(statusCounts)
    .filter(([s]) => !['rejected', 'joined', 'withdrawn'].includes(s))
    .reduce((sum, [, n]) => sum + n, 0)

  return (
    <HubShell
      activeNav="tryouts"
      title={campaign?.name ?? 'Campagne'}
      backHref="/hub/tryouts/"
    >
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <TryoutReadonlyBanner show={!canWrite} />

        {loading ? (
          <div className="card h-32 animate-pulse bg-lavender/10" />
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : campaign ? (
          <>
            <section className="card space-y-3 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold">{campaign.name}</h1>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {targetRosterLabel(campaign.targetRoster)} · {campaignStatusLabel(campaign.status)}
                    {campaign.slotsTarget != null && ` · ${campaign.slotsTarget} place(s)`}
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    {activeCount} candidat(s) actif(s)
                  </p>
                </div>
                {canWrite && (
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/hub/tryouts/candidates/new/?campaignId=${campaign.id}`}
                      className="btn-primary text-sm"
                    >
                      <Plus size={16} />
                      Candidat
                    </Link>
                    <Link
                      href={`/hub/tryouts/campaigns/edit/?id=${campaign.id}`}
                      className="btn-ghost text-sm"
                    >
                      Modifier
                    </Link>
                  </div>
                )}
              </div>
              {campaign.notes && (
                <p className="text-sm text-[var(--text-muted)]">{campaign.notes}</p>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="font-semibold">Pipeline</h2>
              <TryoutPipelineBoard columns={columns} campaignId={campaign.id} />
            </section>
          </>
        ) : null}
      </main>
    </HubShell>
  )
}

export default function TryoutCampaignViewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
        </div>
      }
    >
      <CampaignViewContent />
    </Suspense>
  )
}
