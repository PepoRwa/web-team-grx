'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { HubShell } from '@/components/hub/hub-shell'
import { TryoutCampaignForm } from '@/components/tryout-campaign-form'
import { useAuth } from '@/hooks/useAuth'
import { ApiError, createTryoutCampaign } from '@/lib/api'

export default function NewTryoutCampaignPage() {
  const { session, permissions, loading: authLoading } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
    if (!authLoading && permissions && !permissions.canTryoutWrite) router.replace('/hub/tryouts/')
  }, [authLoading, session, permissions, router])

  if (authLoading || !session || (permissions && !permissions.canTryoutWrite)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  return (
    <HubShell activeNav="tryouts" title="Nouvelle campagne" backHref="/hub/tryouts/">
      <main className="mx-auto max-w-2xl px-4 py-6">
        <TryoutCampaignForm
          submitting={submitting}
          onCancel={() => router.push('/hub/tryouts/')}
          onSubmit={async (data) => {
            if (!session.access_token) return
            setSubmitting(true)
            try {
              const res = await createTryoutCampaign(session.access_token, data)
              router.push(`/hub/tryouts/campaigns/view/?id=${res.campaign.id}`)
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
