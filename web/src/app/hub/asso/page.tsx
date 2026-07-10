'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Building2, ChevronRight, Plus, UserCircle } from 'lucide-react'
import { HubShell } from '@/components/hub/hub-shell'
import { useAuth } from '@/hooks/useAuth'
import { useAssoAccess } from '@/hooks/useAssoAccess'
import { ApiError, listAssoDossiers, type AssoDossier } from '@/lib/api'

export default function AssoHubPage() {
  const { session, loading: authLoading } = useAuth()
  const router = useRouter()
  const { access, loading: assoLoading } = useAssoAccess(session?.access_token, Boolean(session))
  const [dossiers, setDossiers] = useState<AssoDossier[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
    if (!authLoading && !assoLoading && session && !access.hasAccess) router.replace('/hub/')
  }, [authLoading, assoLoading, session, access.hasAccess, router])

  const load = useCallback(async () => {
    if (!session?.access_token || !access.isBureau) return
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
  }, [session?.access_token, access.isBureau])

  useEffect(() => {
    if (!assoLoading && access.isBureau && session?.access_token) void load()
  }, [load, assoLoading, access.isBureau, session?.access_token])

  useEffect(() => {
    if (!assoLoading && access.hasAccess && !access.isBureau) {
      router.replace('/hub/asso/me/')
    }
  }, [assoLoading, access, router])

  if (authLoading || assoLoading || !session || !access.hasAccess) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  if (!access.isBureau) return null

  return (
    <HubShell
      activeNav="asso"
      title="Gestion asso"
      subtitle="Dossiers adhérents — bureau"
      backHref="/hub/"
      showAsso
    >
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[var(--text-muted)]">
            Création manuelle, liaison Discord, accès module.
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
            <p className="font-medium">Aucun dossier asso</p>
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

        <Link
          href="/hub/asso/me/"
          className="mt-8 inline-flex items-center gap-2 text-sm text-[var(--accent)]"
        >
          <UserCircle size={16} />
          Voir mon dossier asso (si lié)
        </Link>
      </main>
    </HubShell>
  )
}
