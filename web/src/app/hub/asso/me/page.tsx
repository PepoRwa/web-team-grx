'use client'

import { useEffect, useState } from 'react'
import { AssoDossierDetail } from '@/components/asso/asso-dossier-detail'
import { AssoRgpdExportButton } from '@/components/asso/asso-rgpd-export-button'
import { AssoShell } from '@/components/asso/asso-shell'
import { useAssoGate } from '@/hooks/useAssoGate'
import { ApiError, getMyAssoDossier } from '@/lib/api'
import type { AssoDossier } from '@/lib/api'

export default function AssoMePage() {
  const { session, access, ready } = useAssoGate()
  const [dossier, setDossier] = useState<AssoDossier | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!ready || !session?.access_token) return
    if (access.isBureau && !access.dossierId) {
      setLoading(false)
      return
    }

    void (async () => {
      setLoading(true)
      try {
        const data = await getMyAssoDossier(session.access_token)
        setDossier(data.dossier)
      } catch (err) {
        if (err instanceof ApiError && err.code === 'ASSO_ACCESS_DENIED') {
          setError('Aucun dossier asso lié à ton compte Discord.')
        } else {
          setError(err instanceof ApiError ? err.message : 'Chargement impossible')
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [ready, session?.access_token, access])

  if (!ready) return null

  return (
    <AssoShell activeNav="me" title="Mon dossier asso" subtitle="Adhésion & données personnelles">
      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        {loading && <div className="card h-40 animate-pulse bg-lavender/10" />}
        {error && <p className="text-sm text-red-500">{error}</p>}
        {!loading && dossier && (
          <div className="space-y-4">
            <AssoDossierDetail dossier={dossier} />
            <AssoRgpdExportButton
              accessToken={session!.access_token}
              fileName={`gowrax-asso-${dossier.pseudo}.json`}
            />
          </div>
        )}
        {!loading && !dossier && !error && access.isBureau && (
          <p className="text-sm text-[var(--text-muted)]">
            Compte bureau sans dossier adhérent lié — utilise l&apos;onglet Dossiers pour gérer les
            membres.
          </p>
        )}
      </main>
    </AssoShell>
  )
}
