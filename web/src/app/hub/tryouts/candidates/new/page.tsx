'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { HubShell } from '@/components/hub/hub-shell'
import { TryoutCandidateForm } from '@/components/tryout-candidate-form'
import { useAuth } from '@/hooks/useAuth'
import { ApiError, createTryoutCandidate } from '@/lib/api'

function NewCandidateContent() {
  const { session, permissions, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const campaignId = Number(params.get('campaignId'))
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
    if (!authLoading && permissions && !permissions.canTryoutWrite) router.replace('/hub/tryouts/')
  }, [authLoading, session, permissions, router])

  if (authLoading || !session || (permissions && !permissions.canTryoutWrite) || !campaignId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  return (
    <HubShell
      activeNav="tryouts"
      title="Nouveau candidat"
      backHref={`/hub/tryouts/campaigns/view/?id=${campaignId}`}
    >
      <main className="mx-auto max-w-2xl px-4 py-6">
        <TryoutCandidateForm
          campaignId={campaignId}
          submitting={submitting}
          onCancel={() => router.push(`/hub/tryouts/campaigns/view/?id=${campaignId}`)}
          onSubmit={async (data) => {
            if (!session.access_token) return
            setSubmitting(true)
            try {
              const res = await createTryoutCandidate(session.access_token, data)
              router.push(
                `/hub/tryouts/candidates/view/?id=${res.candidate.id}&campaignId=${campaignId}`,
              )
            } catch (err) {
              throw err instanceof ApiError ? new Error(err.message) : err
            } finally {
              setSubmitting(false)
            }
          }}
        />
      </main>
    </HubShell>
  )
}

export default function NewTryoutCandidatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
        </div>
      }
    >
      <NewCandidateContent />
    </Suspense>
  )
}
