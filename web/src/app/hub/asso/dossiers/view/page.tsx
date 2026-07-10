'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { AssoDossierDetail } from '@/components/asso/asso-dossier-detail'
import { AssoShell } from '@/components/asso/asso-shell'
import { LinkCandidatePicker } from '@/components/asso/link-candidate-picker'
import { useAssoGate } from '@/hooks/useAssoGate'
import {
  ApiError,
  getAssoDossier,
  linkAssoDiscord,
  unlinkAssoDiscord,
  updateAssoDossier,
  type AssoDossier,
  type AssoLinkCandidate,
} from '@/lib/api'

function DossierViewContent() {
  const { session, ready } = useAssoGate({ bureauOnly: true })
  const router = useRouter()
  const params = useSearchParams()
  const id = Number(params.get('id'))

  const [dossier, setDossier] = useState<AssoDossier | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showLinkPicker, setShowLinkPicker] = useState(false)

  const load = useCallback(async () => {
    if (!session?.access_token || !id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getAssoDossier(session.access_token, id)
      setDossier(data.dossier)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Dossier introuvable')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, id])

  useEffect(() => {
    if (ready && session?.access_token && id) void load()
  }, [load, ready, session?.access_token, id])

  useEffect(() => {
    if (ready && !id) router.replace('/hub/asso/dossiers/')
  }, [ready, id, router])

  async function toggleAccess() {
    if (!session?.access_token || !dossier) return
    setBusy(true)
    try {
      const { dossier: updated } = await updateAssoDossier(session.access_token, dossier.id, {
        siteAccess: !dossier.siteAccess,
      })
      setDossier(updated)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Mise à jour échouée')
    } finally {
      setBusy(false)
    }
  }

  async function handleLink(candidate: AssoLinkCandidate | null) {
    if (!session?.access_token || !dossier || !candidate) return
    setBusy(true)
    setError(null)
    try {
      const { dossier: updated } = await linkAssoDiscord(
        session.access_token,
        dossier.id,
        candidate.discordId,
        true,
      )
      setDossier(updated)
      setShowLinkPicker(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Liaison échouée')
    } finally {
      setBusy(false)
    }
  }

  async function handleUnlink() {
    if (!session?.access_token || !dossier) return
    if (!window.confirm('Délier ce dossier du compte Discord ?')) return
    setBusy(true)
    try {
      const { dossier: updated } = await unlinkAssoDiscord(session.access_token, dossier.id)
      setDossier(updated)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Déliaison échouée')
    } finally {
      setBusy(false)
    }
  }

  if (!ready) return null

  return (
    <AssoShell
      activeNav="dossiers"
      title={dossier?.pseudo ?? 'Dossier'}
      subtitle="Fiche adhérent"
      backHref="/hub/asso/dossiers/"
      bureauOnly
    >
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:py-8">
        {error && <p className="text-sm text-red-500">{error}</p>}
        {loading && <div className="card h-48 animate-pulse bg-lavender/10" />}
        {dossier && (
          <>
            <AssoDossierDetail dossier={dossier} bureauView />

            <div className="card space-y-4 p-6">
              <h3 className="font-semibold">Accès & liaison Discord</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-secondary"
                  disabled={busy}
                  onClick={toggleAccess}
                >
                  {dossier.siteAccess ? 'Couper accès site' : 'Activer accès site'}
                </button>
                {dossier.discordId ? (
                  <button type="button" className="btn-ghost" disabled={busy} onClick={handleUnlink}>
                    Délier Discord
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={busy}
                    onClick={() => setShowLinkPicker((v) => !v)}
                  >
                    Lier Discord
                  </button>
                )}
              </div>

              {showLinkPicker && session?.access_token && (
                <LinkCandidatePicker
                  accessToken={session.access_token}
                  selectedDiscordId={dossier.discordId}
                  onSelect={handleLink}
                />
              )}
            </div>
          </>
        )}
      </main>
    </AssoShell>
  )
}

export default function AssoDossierViewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
        </div>
      }
    >
      <DossierViewContent />
    </Suspense>
  )
}
