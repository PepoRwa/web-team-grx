'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Download, ShieldCheck } from 'lucide-react'
import { HubShell } from '@/components/hub/hub-shell'
import { ProfileDetail } from '@/components/profile-card'
import { ProfileForm } from '@/components/profile-form'
import { useAuth } from '@/hooks/useAuth'
import {
  ApiError,
  downloadMyData,
  getMyProfile,
  updateMyProfile,
  type Profile,
  type ProfileUpdate,
} from '@/lib/api'

export default function MyProfilePage() {
  const { session, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
  }, [authLoading, session, router])

  const load = useCallback(async () => {
    if (!session?.access_token) return
    setLoading(true)
    try {
      const { profile: p } = await getMyProfile(session.access_token)
      setProfile(p)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Profil introuvable')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  useEffect(() => {
    if (!authLoading && session?.access_token) void load()
  }, [load, authLoading, session?.access_token])

  const handleSubmit = useCallback(
    async (data: ProfileUpdate) => {
      if (!session?.access_token) return
      setSubmitting(true)
      try {
        const { profile: updated } = await updateMyProfile(session.access_token, data)
        setProfile(updated)
      } finally {
        setSubmitting(false)
      }
    },
    [session?.access_token],
  )

  const handleExport = useCallback(async () => {
    if (!session?.access_token) return
    setExporting(true)
    setExportError(null)
    try {
      await downloadMyData(session.access_token)
    } catch (err) {
      setExportError(err instanceof ApiError ? err.message : 'Export impossible')
    } finally {
      setExporting(false)
    }
  }, [session?.access_token])

  if (authLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  return (
    <HubShell activeNav="profile" title="Mon profil" backHref="/hub/profiles/">
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:py-8">
        {error && <p className="text-sm text-red-500">{error}</p>}
        {loading ? (
          <div className="card h-64 animate-pulse bg-[var(--accent-soft)]/30" />
        ) : profile ? (
          <>
            <ProfileDetail profile={profile} isOwn />
            <ProfileForm initial={profile} submitting={submitting} onSubmit={handleSubmit} />

            <div className="card p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 shrink-0 text-[var(--accent)]" size={20} />
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold">Mes données personnelles (RGPD)</h3>
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    Télécharge une copie complète des données que Gowrax détient sur toi (profil,
                    rôles, VODs, strats, notifications…) au format JSON.
                  </p>
                  {exportError && <p className="mt-2 text-xs text-red-500">{exportError}</p>}
                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={exporting}
                    className="btn-ghost mt-3 text-sm disabled:opacity-50"
                  >
                    <Download size={16} />
                    {exporting ? 'Préparation…' : 'Télécharger mes données'}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </HubShell>
  )
}
