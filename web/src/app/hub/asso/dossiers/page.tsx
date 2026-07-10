'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { Building2, ChevronRight, Plus } from 'lucide-react'
import { AssoShell } from '@/components/asso/asso-shell'
import { useAssoGate } from '@/hooks/useAssoGate'
import { ApiError, listAssoDossiers, type AssoDossier } from '@/lib/api'

export default function AssoDossiersPage() {
  const { session, ready } = useAssoGate({ bureauOnly: true })
  const [dossiers, setDossiers] = useState<AssoDossier[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!session?.access_token) return
    setLoading(true)
    setError(null)
    try {
      const data = await listAssoDossiers(session.access_token)
      setDossiers(data.dossiers)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Chargement impossible')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  useEffect(() => {
    if (ready && session?.access_token) void load()
  }, [load, ready, session?.access_token])

  if (!ready) return null

  return (
    <AssoShell
      activeNav="dossiers"
      title="Dossiers adhérents"
      subtitle="Création, liaison Discord, accès"
      bureauOnly
    >
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--text-muted)]">
            Saisie bureau uniquement — pas d&apos;inscription publique.
          </p>
          <Link href="/hub/asso/dossiers/new/" className="btn-primary inline-flex w-fit">
            <Plus size={18} />
            Nouveau dossier
          </Link>
        </div>

        {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => (
              <div key={i} className="card h-28 animate-pulse bg-lavender/10" />
            ))}
          </div>
        ) : dossiers.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 p-10 text-center">
            <Building2 size={40} className="text-[var(--accent)]" />
            <p className="font-medium">Aucun dossier</p>
            <p className="text-sm text-[var(--text-muted)]">
              Crée un dossier et lie-le à un compte Discord team.
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {dossiers.map((d) => (
              <Link
                key={d.id}
                href={`/hub/asso/dossiers/view/?id=${d.id}`}
                className="card flex items-center justify-between gap-3 p-4 transition hover:border-[var(--accent)]"
              >
                <div className="min-w-0">
                  <p className="font-semibold">{d.pseudo}</p>
                  <p className="truncate text-sm text-[var(--text-muted)]">
                    {d.firstName} {d.lastName}
                    {d.discordPseudo ? ` · @${d.discordPseudo}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {d.siteAccess ? (
                    <span className="badge badge-mint text-[10px]">Actif</span>
                  ) : (
                    <span className="badge text-[10px]">Off</span>
                  )}
                  <ChevronRight size={18} className="text-[var(--text-muted)]" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </AssoShell>
  )
}
