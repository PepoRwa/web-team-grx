'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'
import { HubShell } from '@/components/hub/hub-shell'
import { ProfileDetail } from '@/components/profile-card'
import { useAuth } from '@/hooks/useAuth'
import { ApiError, getProfile, type Profile } from '@/lib/api'
import { canEditTeamProfiles, canViewTeamProfiles } from '@/lib/permissions'

function ProfileViewContent() {
  const searchParams = useSearchParams()
  const discordId = searchParams.get('id') ?? ''
  const { session, user, loading: authLoading, permissions } = useAuth()
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isOwn = profile?.discordId === user?.discordId
  const staffView = canViewTeamProfiles(permissions)
  const canEdit = canEditTeamProfiles(permissions)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
    if (!authLoading && discordId && user && discordId === user.discordId) {
      router.replace('/hub/profiles/me/')
    }
    if (
      !authLoading &&
      permissions &&
      discordId &&
      user &&
      discordId !== user.discordId &&
      !staffView
    ) {
      router.replace('/hub/profiles/me/')
    }
  }, [authLoading, session, permissions, discordId, user, staffView, router])

  const load = useCallback(async () => {
    if (!session?.access_token || !discordId) return
    setLoading(true)
    setError(null)
    try {
      const { profile: p } = await getProfile(session.access_token, discordId)
      setProfile(p)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Profil introuvable')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, discordId])

  useEffect(() => {
    if (!authLoading && session?.access_token && discordId) void load()
  }, [load, authLoading, session?.access_token, discordId])

  if (authLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  if (!discordId) {
    return (
      <HubShell activeNav="profile" title="Profil" backHref={staffView ? '/hub/profiles/' : '/hub/profiles/me/'}>
        <main className="mx-auto max-w-2xl px-4 py-12 text-center">
          <Link href={staffView ? '/hub/profiles/' : '/hub/profiles/me/'} className="btn-primary inline-flex">
            Retour
          </Link>
        </main>
      </HubShell>
    )
  }

  return (
    <HubShell
      activeNav="profile"
      title={profile?.publicName ?? profile?.username ?? 'Profil'}
      backHref={staffView ? '/hub/profiles/' : '/hub/profiles/me/'}
    >
      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        {loading ? (
          <div className="card h-64 animate-pulse bg-[var(--accent-soft)]/30" />
        ) : error || !profile ? (
          <div className="card p-8 text-center">
            <p className="text-red-500">{error ?? 'Introuvable'}</p>
            <Link href={staffView ? '/hub/profiles/' : '/hub/profiles/me/'} className="btn-primary mt-6 inline-flex">
              Retour
            </Link>
          </div>
        ) : (
          <>
            <ProfileDetail profile={profile} isOwn={isOwn} />
            {canEdit && !isOwn && (
              <Link
                href={`/hub/profiles/edit/?id=${profile.discordId}`}
                className="btn-primary mt-6 inline-flex"
              >
                <Pencil size={16} />
                Modifier ce profil
              </Link>
            )}
            {isOwn && (
              <Link href="/hub/profiles/me/" className="btn-primary mt-6 inline-flex">
                <Pencil size={16} />
                Modifier mon profil
              </Link>
            )}
          </>
        )}
      </main>
    </HubShell>
  )
}

export default function ProfileViewPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" /></div>}>
      <ProfileViewContent />
    </Suspense>
  )
}
