'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { HubShell } from '@/components/hub/hub-shell'
import { ProfileDetail } from '@/components/profile-card'
import { ProfileForm } from '@/components/profile-form'
import { useAuth } from '@/hooks/useAuth'
import { ApiError, getMyProfile, updateMyProfile, type Profile, type ProfileUpdate } from '@/lib/api'

export default function MyProfilePage() {
  const { session, loading: authLoading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
          </>
        ) : null}
      </main>
    </HubShell>
  )
}
