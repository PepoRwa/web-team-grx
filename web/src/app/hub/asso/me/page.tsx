'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { HubShell } from '@/components/hub/hub-shell'
import { AssoDossierDetail } from '@/components/asso/asso-dossier-detail'
import { useAuth } from '@/hooks/useAuth'
import { useAssoAccess } from '@/hooks/useAssoAccess'
import { ApiError, getMyAssoDossier } from '@/lib/api'
import type { AssoDossier } from '@/lib/api'

export default function AssoMePage() {
  const { session, loading: authLoading } = useAuth()
  const router = useRouter()
  const { access, loading: assoLoading } = useAssoAccess(session?.access_token, Boolean(session))
  const [dossier, setDossier] = useState<AssoDossier | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
  }, [authLoading, session, router])

  useEffect(() => {
    if (!assoLoading && session && !access.hasAccess) router.replace('/hub/')
  }, [assoLoading, session, access.hasAccess, router])

  useEffect(() => {
    if (!session?.access_token || assoLoading) return
    if (access.isBureau && !access.dossierId) {
      setLoading(false)
      return
    }
    if (!access.hasAccess) return

    void (async () => {
      setLoading(true)
      try {
        const data = await getMyAssoDossier(session.access_token)
        setDossier(data.dossier)
      } catch (err) {
        if (err instanceof ApiError && err.code === 'ASSO_ACCESS_DENIED') {
          setError('Aucun dossier asso lié à ton compte.')
        } else {
          setError(err instanceof ApiError ? err.message : 'Chargement impossible')
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [session?.access_token, assoLoading, access])

  if (authLoading || assoLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  return (
    <HubShell
      activeNav="asso"
      title="Mon dossier asso"
      subtitle="Adhésion Gowrax"
      backHref={access.isBureau ? '/hub/asso/' : '/hub/'}
      showAsso
    >
      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        {loading && <div className="card h-40 animate-pulse bg-lavender/10" />}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!loading && dossier && <AssoDossierDetail dossier={dossier} />}
        {!loading && !dossier && !error && access.isBureau && (
          <p className="text-sm text-[var(--text-muted)]">
            Ton compte bureau n&apos;a pas de dossier adhérent lié — normal.
          </p>
        )}
      </main>
    </HubShell>
  )
}
