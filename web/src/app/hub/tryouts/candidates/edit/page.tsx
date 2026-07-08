'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { HubShell } from '@/components/hub/hub-shell'
import { TryoutCandidateForm } from '@/components/tryout-candidate-form'
import { useAuth } from '@/hooks/useAuth'
import { ApiError, getTryoutCandidate, updateTryoutCandidate } from '@/lib/api'

function EditCandidateContent() {
  const { session, permissions, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const id = Number(params.get('id'))
  const campaignId = Number(params.get('campaignId'))
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [initial, setInitial] = useState<Awaited<ReturnType<typeof getTryoutCandidate>>['candidate'] | null>(null)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
    if (!authLoading && permissions && !permissions.canTryoutWrite) router.replace('/hub/tryouts/')
  }, [authLoading, session, permissions, router])

  useEffect(() => {
    if (!session?.access_token || !id) return
    void getTryoutCandidate(session.access_token, id, campaignId || undefined)
      .then((d) => setInitial(d.candidate))
      .catch(() => router.replace('/hub/tryouts/'))
      .finally(() => setLoading(false))
  }, [session?.access_token, id, campaignId, router])

  const backHref = `/hub/tryouts/candidates/view/?id=${id}&campaignId=${campaignId}`

  if (authLoading || loading || !session || (permissions && !permissions.canTryoutWrite)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  return (
    <HubShell activeNav="tryouts" title="Modifier candidat" backHref={backHref}>
      <main className="mx-auto max-w-2xl px-4 py-6">
        {initial && (
          <TryoutCandidateForm
            campaignId={campaignId || initial.campaignId}
            initial={{
              riotId: initial.riotId,
              riotTag: initial.riotTag,
              displayName: initial.displayName,
              trackerUrl: initial.trackerUrl,
              role: initial.role,
              currentRank: initial.currentRank,
              source: initial.source,
              notes: initial.notes,
              status: initial.status,
              priority: initial.priority,
              campaignNotes: initial.campaignNotes,
            }}
            submitting={submitting}
            onCancel={() => router.push(backHref)}
            onSubmit={async (data) => {
              if (!session.access_token) return
              setSubmitting(true)
              try {
                await updateTryoutCandidate(session.access_token, id, {
                  ...data,
                  campaignId: campaignId || initial.campaignId,
                })
                router.push(backHref)
              } catch (err) {
                throw err instanceof ApiError ? new Error(err.message) : err
              } finally {
                setSubmitting(false)
              }
            }}
          />
        )}
      </main>
    </HubShell>
  )
}

export default function EditTryoutCandidatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
        </div>
      }
    >
      <EditCandidateContent />
    </Suspense>
  )
}
