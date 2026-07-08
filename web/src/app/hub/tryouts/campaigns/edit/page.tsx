'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { HubShell } from '@/components/hub/hub-shell'
import { TryoutCampaignForm } from '@/components/tryout-campaign-form'
import { useAuth } from '@/hooks/useAuth'
import {
  ApiError,
  deleteTryoutCampaign,
  getTryoutCampaign,
  updateTryoutCampaign,
} from '@/lib/api'

function EditCampaignContent() {
  const { session, permissions, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const id = Number(params.get('id'))
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
    if (!authLoading && permissions && !permissions.canTryoutWrite) router.replace('/hub/tryouts/')
  }, [authLoading, session, permissions, router])

  const [initial, setInitial] = useState<Awaited<ReturnType<typeof getTryoutCampaign>>['campaign'] | null>(null)

  useEffect(() => {
    if (!session?.access_token || !id) return
    void getTryoutCampaign(session.access_token, id)
      .then((d) => setInitial(d.campaign))
      .catch(() => router.replace('/hub/tryouts/'))
      .finally(() => setLoading(false))
  }, [session?.access_token, id, router])

  if (authLoading || loading || !session || (permissions && !permissions.canTryoutWrite)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  return (
    <HubShell
      activeNav="tryouts"
      title="Modifier campagne"
      backHref={`/hub/tryouts/campaigns/view/?id=${id}`}
    >
      <main className="mx-auto max-w-2xl px-4 py-6">
        {initial && (
          <TryoutCampaignForm
            initial={initial}
            submitting={submitting}
            onCancel={() => router.push(`/hub/tryouts/campaigns/view/?id=${id}`)}
            onDelete={async () => {
              if (!session.access_token || !confirm('Supprimer cette campagne ?')) return
              setSubmitting(true)
              try {
                await deleteTryoutCampaign(session.access_token, id)
                router.push('/hub/tryouts/')
              } finally {
                setSubmitting(false)
              }
            }}
            onSubmit={async (data) => {
              if (!session.access_token) return
              setSubmitting(true)
              try {
                await updateTryoutCampaign(session.access_token, id, data)
                router.push(`/hub/tryouts/campaigns/view/?id=${id}`)
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

export default function EditTryoutCampaignPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
        </div>
      }
    >
      <EditCampaignContent />
    </Suspense>
  )
}
