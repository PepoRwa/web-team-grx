'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { HubShell } from '@/components/hub/hub-shell'
import { StratForm } from '@/components/strat-form'
import { useAuth } from '@/hooks/useAuth'
import { ApiError, createStrat, type StratInput } from '@/lib/api'

export default function NewStratPage() {
  const { session, permissions, loading: authLoading } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
  }, [authLoading, session, router])

  const handleSubmit = useCallback(
    async (data: StratInput) => {
      if (!session?.access_token) return
      setSubmitting(true)
      setError(null)
      try {
        const { strat } = await createStrat(session.access_token, data)
        router.push(`/hub/strats/view/?id=${strat.id}`)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Création échouée')
        throw err
      } finally {
        setSubmitting(false)
      }
    },
    [session?.access_token, router],
  )

  if (authLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  return (
    <HubShell activeNav="strats" title="Nouvelle strat" backHref="/hub/strats/">
      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
        <StratForm
          isStaff={Boolean(permissions?.isStaff)}
          submitting={submitting}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/hub/strats/')}
        />
      </main>
    </HubShell>
  )
}
