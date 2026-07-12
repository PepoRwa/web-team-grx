'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Search, User, UserCircle } from 'lucide-react'
import { HubShell } from '@/components/hub/hub-shell'
import { ProfileCard } from '@/components/profile-card'
import { useAuth } from '@/hooks/useAuth'
import { ApiError, listProfiles, type Profile } from '@/lib/api'
import { canViewTeamProfiles } from '@/lib/permissions'

export default function ProfilesPage() {
  const { session, user, loading: authLoading, permissions } = useAuth()
  const router = useRouter()
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
    if (!authLoading && permissions && !canViewTeamProfiles(permissions)) {
      router.replace('/hub/profiles/me/')
    }
  }, [authLoading, session, permissions, router])

  const load = useCallback(async () => {
    if (!session?.access_token || !canViewTeamProfiles(permissions)) return
    setLoading(true)
    setError(null)
    try {
      const data = await listProfiles(session.access_token)
      setProfiles(data.profiles)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Impossible de charger les profils')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, permissions])

  useEffect(() => {
    if (!authLoading && session?.access_token) void load()
  }, [load, authLoading, session?.access_token])

  const q = search.trim().toLowerCase()
  const filtered = profiles.filter(
    (p) =>
      !q ||
      p.username?.toLowerCase().includes(q) ||
      p.riotId?.toLowerCase().includes(q) ||
      p.roles.some((r) => r.name.toLowerCase().includes(q)),
  )

  if (authLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  return (
    <HubShell
      activeNav="profile"
      title="Profils équipe"
      subtitle={`${profiles.length} membre${profiles.length !== 1 ? 's' : ''} · staff`}
    >
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/hub/profiles/me/" className="btn-primary text-sm">
            <UserCircle size={16} />
            Mon profil
          </Link>
          <label className="relative flex items-center">
            <Search size={16} className="absolute left-3 text-[var(--text-muted)]" />
            <input
              type="search"
              placeholder="Pseudo, Riot ID, rôle…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] py-2 pl-9 pr-4 text-sm outline-none focus:border-[var(--accent)] sm:w-72"
            />
          </label>
        </div>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        {loading ? (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card h-28 animate-pulse bg-[var(--accent-soft)]/30" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card mt-8 p-12 text-center">
            <User className="mx-auto text-[var(--text-muted)]" size={40} />
            <p className="mt-4 font-medium">Aucun profil trouvé</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Les membres apparaissent après leur première connexion au site.
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <ProfileCard
                key={p.discordId}
                profile={p}
                href={`/hub/profiles/view/?id=${p.discordId}`}
                highlight={p.discordId === user?.discordId}
              />
            ))}
          </div>
        )}
      </main>
    </HubShell>
  )
}
