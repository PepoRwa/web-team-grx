'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import {
  Ban,
  CheckCircle2,
  Copy,
  Download,
  Mail,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
} from 'lucide-react'
import { HubShell } from '@/components/hub/hub-shell'
import { useAuth } from '@/hooks/useAuth'
import {
  ApiError,
  adminBackfillEmails,
  adminDownloadUserData,
  adminListUsers,
  adminSetAccess,
  type AdminUser,
} from '@/lib/api'

export default function AdminPage() {
  const { session, permissions, loading: authLoading } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [search, setSearch] = useState('')
  const [includeDisabled, setIncludeDisabled] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [syncingEmails, setSyncingEmails] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const isFounder = permissions?.canAdmin === true

  useEffect(() => {
    if (authLoading) return
    if (!session) {
      router.replace('/')
      return
    }
    if (permissions && !isFounder) {
      router.replace('/hub/')
    }
  }, [authLoading, session, permissions, isFounder, router])

  const load = useCallback(async () => {
    if (!session?.access_token || !isFounder) return
    setLoading(true)
    setError(null)
    try {
      const data = await adminListUsers(session.access_token, { includeDisabled })
      setUsers(data.users)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Chargement impossible')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, isFounder, includeDisabled])

  useEffect(() => {
    if (!authLoading && isFounder) void load()
  }, [load, authLoading, isFounder])

  const handleToggleAccess = useCallback(
    async (user: AdminUser) => {
      if (!session?.access_token) return
      const willDisable = !user.isDisabled
      const label = user.publicName ?? user.username ?? user.discordId
      if (willDisable) {
        const ok = window.confirm(
          `Désactiver l'accès de « ${label} » ?\nLa personne sera déconnectée et bloquée partout, quels que soient ses rôles Discord.`,
        )
        if (!ok) return
      }
      const reason = willDisable
        ? window.prompt('Motif (optionnel, visible dans l\'audit log) :') ?? undefined
        : undefined
      setBusyId(user.discordId)
      setError(null)
      try {
        const { user: updated } = await adminSetAccess(
          session.access_token,
          user.discordId,
          willDisable,
          reason,
        )
        setUsers((prev) => prev.map((u) => (u.discordId === updated.discordId ? updated : u)))
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Action impossible')
      } finally {
        setBusyId(null)
      }
    },
    [session?.access_token],
  )

  const handleSyncEmails = useCallback(async () => {
    if (!session?.access_token) return
    setSyncingEmails(true)
    setError(null)
    setNotice(null)
    try {
      const { scanned, updated } = await adminBackfillEmails(session.access_token)
      setNotice(`Emails synchronisés : ${updated} mis à jour sur ${scanned} comptes Supabase scannés.`)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Synchronisation impossible')
    } finally {
      setSyncingEmails(false)
    }
  }, [session?.access_token, load])

  const handleExport = useCallback(
    async (user: AdminUser) => {
      if (!session?.access_token) return
      setBusyId(user.discordId)
      setError(null)
      try {
        await adminDownloadUserData(session.access_token, user.discordId)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Export impossible')
      } finally {
        setBusyId(null)
      }
    },
    [session?.access_token],
  )

  const q = search.trim().toLowerCase()
  const filtered = users.filter(
    (u) =>
      !q ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.discordId.includes(q) ||
      u.riotId?.toLowerCase().includes(q),
  )

  if (authLoading || !session || !permissions || !isFounder) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  const disabledCount = users.filter((u) => u.isDisabled).length

  return (
    <HubShell activeNav="profile" title="Administration" subtitle="Réservé au fondateur" backHref="/hub/">
      <main className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
        <div className="card border-[var(--accent)]/30 bg-[var(--accent-soft)]/20 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 shrink-0 text-[var(--accent)]" size={20} />
            <div>
              <p className="text-sm font-semibold">Panneau fondateur</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Emails, comptes inconnus et kill-switch d&apos;accès. Toute désactivation est
                journalisée. Ton compte fondateur ne peut jamais être désactivé.
              </p>
              <p className="mt-2 text-xs text-[var(--text-muted)]">
                Les emails ne se remplissent qu&apos;à la connexion de chaque membre. Utilise
                « Synchroniser les emails » pour les récupérer depuis Supabase pour tout le monde.
              </p>
              <button
                type="button"
                onClick={handleSyncEmails}
                disabled={syncingEmails}
                className="btn-ghost mt-3 text-xs disabled:opacity-50"
              >
                <RefreshCw size={14} className={syncingEmails ? 'animate-spin' : ''} />
                {syncingEmails ? 'Synchronisation…' : 'Synchroniser les emails'}
              </button>
            </div>
          </div>
        </div>

        {notice && (
          <p className="mt-4 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)]/20 px-4 py-2 text-sm text-[var(--accent)]">
            {notice}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative flex flex-1 items-center">
            <Search size={16} className="absolute left-3 text-[var(--text-muted)]" />
            <input
              type="search"
              placeholder="Pseudo, email, Discord ID, Riot ID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] py-2 pl-9 pr-4 text-sm outline-none focus:border-[var(--accent)]"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <input
              type="checkbox"
              checked={includeDisabled}
              onChange={(e) => setIncludeDisabled(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--border)]"
            />
            Inclure désactivés
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--text-muted)]">
          <span className="badge badge-lavender">{users.length} comptes</span>
          {disabledCount > 0 && <span className="badge badge-coral">{disabledCount} désactivés</span>}
        </div>

        {error && <p className="mt-4 text-sm text-red-500">{error}</p>}

        {loading ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="card h-24 animate-pulse bg-[var(--accent-soft)]/30" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card mt-6 p-12 text-center">
            <Shield className="mx-auto text-[var(--text-muted)]" size={40} />
            <p className="mt-4 font-medium">Aucun compte</p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {filtered.map((user) => (
              <AdminUserRow
                key={user.discordId}
                user={user}
                busy={busyId === user.discordId}
                onToggleAccess={() => handleToggleAccess(user)}
                onExport={() => handleExport(user)}
              />
            ))}
          </div>
        )}
      </main>
    </HubShell>
  )
}

function AdminUserRow({
  user,
  busy,
  onToggleAccess,
  onExport,
}: {
  user: AdminUser
  busy: boolean
  onToggleAccess: () => void
  onExport: () => void
}) {
  const avatar = user.avatarUrl ?? 'https://cdn.discordapp.com/embed/avatars/0.png'
  const name = user.publicName ?? user.username ?? 'Sans pseudo'
  const roles = user.roles ?? []
  const roleCount = user.roleCount ?? roles.length
  const isUnknown = roleCount === 0

  return (
    <div
      className={`card p-4 ${user.isDisabled ? 'border-red-500/40 bg-red-500/5' : isUnknown ? 'border-gold/40 bg-gold/5' : ''}`}
    >
      <div className="flex flex-wrap items-start gap-3">
        <Image src={avatar} alt="" width={44} height={44} className="shrink-0 rounded-xl" unoptimized />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold">{name}</p>
            {user.isDisabled && <span className="badge badge-coral text-[10px]">Désactivé</span>}
            {isUnknown && !user.isDisabled && (
              <span className="badge badge-gold text-[10px]">Inconnu · 0 rôle</span>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              if (user.email) void navigator.clipboard?.writeText(user.email)
            }}
            className="mt-1 flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--accent)]"
            title="Copier l'email"
          >
            <Mail size={12} />
            {user.email ?? 'email inconnu'}
            {user.email && <Copy size={11} />}
          </button>

          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-[var(--text-muted)]">
            <span>ID {user.discordId}</span>
            {user.riotId && <span>· {user.riotId}</span>}
            <span>· {roleCount} rôle{roleCount !== 1 ? 's' : ''}</span>
            {user.lastLoginAt && (
              <span>· vu {new Date(user.lastLoginAt).toLocaleDateString('fr-FR')}</span>
            )}
          </div>

          {roles.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {roles.slice(0, 5).map((r) => (
                <span key={r.roleId} className="badge badge-lavender text-[10px]">
                  {r.name}
                </span>
              ))}
            </div>
          )}

          {user.isDisabled && user.disabledReason && (
            <p className="mt-2 text-xs text-red-500">Motif : {user.disabledReason}</p>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2">
          <button
            type="button"
            onClick={onExport}
            disabled={busy}
            className="btn-ghost justify-center text-xs disabled:opacity-50"
          >
            <Download size={14} />
            Export
          </button>
          <button
            type="button"
            onClick={onToggleAccess}
            disabled={busy}
            className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition disabled:opacity-50 ${
              user.isDisabled
                ? 'bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25'
                : 'bg-red-500/15 text-red-600 hover:bg-red-500/25'
            }`}
          >
            {user.isDisabled ? (
              <>
                <CheckCircle2 size={14} />
                Réactiver
              </>
            ) : (
              <>
                <Ban size={14} />
                Désactiver
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
