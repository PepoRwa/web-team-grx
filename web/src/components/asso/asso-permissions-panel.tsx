'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Shield, X } from 'lucide-react'
import {
  ApiError,
  applyAssoPermissionProfile,
  grantAssoBureau,
  grantAssoDocumentFolder,
  listAssoPermissionProfiles,
  listAssoPermissions,
  revokeAssoBureau,
  revokeAssoDocumentFolder,
  setAssoModulePermission,
  type AssoAccessLevel,
  type AssoBureauGrant,
  type AssoDocumentFolderGrant,
  type AssoModule,
  type AssoModulePermission,
  type AssoPermissionProfile,
} from '@/lib/api'
import { assoAccessLevelLabels, assoModuleLabels } from '@/lib/asso-module-labels'
import { assoDocumentFolderLabels } from '@/lib/asso-document-labels'

const MODULES: AssoModule[] = [
  'membres',
  'documents',
  'cotisations',
  'assemblees',
  'parametres',
]
const LEVELS: AssoAccessLevel[] = ['aucun', 'lecture', 'edition', 'admin']

interface AssoPermissionsPanelProps {
  accessToken: string
  enabled: boolean
}

export function AssoPermissionsPanel({ accessToken, enabled }: AssoPermissionsPanelProps) {
  const [permissions, setPermissions] = useState<AssoModulePermission[]>([])
  const [folderGrants, setFolderGrants] = useState<AssoDocumentFolderGrant[]>([])
  const [bureauGrants, setBureauGrants] = useState<AssoBureauGrant[]>([])
  const [profiles, setProfiles] = useState<AssoPermissionProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [discordId, setDiscordId] = useState('')
  const [module, setModule] = useState<AssoModule>('documents')
  const [accessLevel, setAccessLevel] = useState<AssoAccessLevel>('lecture')
  const [profileId, setProfileId] = useState('membre_basique')
  const [grantFolder, setGrantFolder] = useState<'pv_ag' | 'pv_bureau'>('pv_ag')

  const selectedProfile = useMemo(
    () => profiles.find((p) => p.id === profileId),
    [profiles, profileId],
  )

  const load = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    setError(null)
    try {
      const [permData, profileData] = await Promise.all([
        listAssoPermissions(accessToken),
        listAssoPermissionProfiles(accessToken),
      ])
      setPermissions(permData.permissions)
      setFolderGrants(permData.folderGrants)
      setBureauGrants(permData.bureauGrants)
      setProfiles(profileData.profiles)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Permissions indisponibles')
    } finally {
      setLoading(false)
    }
  }, [accessToken, enabled])

  useEffect(() => {
    void load()
  }, [load])

  async function runAction(fn: () => Promise<unknown>) {
    setBusy(true)
    setError(null)
    try {
      await fn()
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Action échouée')
    } finally {
      setBusy(false)
    }
  }

  async function handleSetPermission(e: React.FormEvent) {
    e.preventDefault()
    if (!discordId.trim()) return
    await runAction(() =>
      setAssoModulePermission(accessToken, discordId.trim(), module, accessLevel),
    )
  }

  async function handleApplyProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!discordId.trim()) return
    await runAction(() =>
      applyAssoPermissionProfile(accessToken, discordId.trim(), profileId),
    )
  }

  async function handleBureauGrant(grant: boolean, targetId?: string) {
    const id = (targetId ?? discordId).trim()
    if (!id) return
    await runAction(async () => {
      if (grant) await grantAssoBureau(accessToken, id)
      else await revokeAssoBureau(accessToken, id)
    })
  }

  async function handleFolderGrant(grant: boolean, targetId?: string, folder = grantFolder) {
    const id = (targetId ?? discordId).trim()
    if (!id) return
    await runAction(async () => {
      if (grant) await grantAssoDocumentFolder(accessToken, id, folder)
      else await revokeAssoDocumentFolder(accessToken, id, folder)
    })
  }

  async function revokeModulePermission(targetId: string, mod: AssoModule) {
    await runAction(() =>
      setAssoModulePermission(accessToken, targetId, mod, 'aucun'),
    )
  }

  if (!enabled) return null
  if (loading) return <div className="card h-32 animate-pulse bg-lavender/10" />

  return (
    <div className="card space-y-6 p-6">
      <div className="flex items-center gap-2">
        <Shield size={18} className="text-[var(--accent)]" />
        <h3 className="font-semibold">Permissions & accès bureau</h3>
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        Les profils bureau (président, secrétaire, trésorier) appliquent automatiquement les droits
        modules <strong>et</strong> l&apos;accès bureau (requis pour les cotisations).
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <label className="block space-y-1">
        <span className="text-sm font-medium">Discord ID cible</span>
        <input
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
          placeholder="123456789012345678"
          value={discordId}
          onChange={(e) => setDiscordId(e.target.value)}
        />
      </label>

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={handleSetPermission} className="space-y-3 rounded-xl border border-[var(--border)] p-4">
          <p className="text-sm font-medium">Niveau par module</p>
          <select
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            value={module}
            onChange={(e) => setModule(e.target.value as AssoModule)}
          >
            {MODULES.map((m) => (
              <option key={m} value={m}>
                {assoModuleLabels[m]}
              </option>
            ))}
          </select>
          <select
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            value={accessLevel}
            onChange={(e) => setAccessLevel(e.target.value as AssoAccessLevel)}
          >
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {assoAccessLevelLabels[l]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={busy || !discordId.trim()}
            className="rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : 'Appliquer le niveau'}
          </button>
        </form>

        <form onSubmit={handleApplyProfile} className="space-y-3 rounded-xl border border-[var(--border)] p-4">
          <p className="text-sm font-medium">Profil prédéfini</p>
          <select
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
                {p.grantsBureau ? ' (+ bureau)' : ''}
              </option>
            ))}
          </select>
          {selectedProfile && (
            <p className="text-xs text-[var(--text-muted)]">{selectedProfile.description}</p>
          )}
          <button
            type="submit"
            disabled={busy || !discordId.trim()}
            className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm disabled:opacity-50"
          >
            Appliquer le profil
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !discordId.trim()}
          onClick={() => void handleBureauGrant(true)}
          className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
        >
          Accorder bureau
        </button>
        <button
          type="button"
          disabled={busy || !discordId.trim()}
          onClick={() => void handleBureauGrant(false)}
          className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
        >
          Révoquer bureau
        </button>
        <select
          className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
          value={grantFolder}
          onChange={(e) => setGrantFolder(e.target.value as 'pv_ag' | 'pv_bureau')}
        >
          <option value="pv_ag">{assoDocumentFolderLabels.pv_ag}</option>
          <option value="pv_bureau">{assoDocumentFolderLabels.pv_bureau}</option>
        </select>
        <button
          type="button"
          disabled={busy || !discordId.trim()}
          onClick={() => void handleFolderGrant(true)}
          className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
        >
          Accorder dossier PV
        </button>
        <button
          type="button"
          disabled={busy || !discordId.trim()}
          onClick={() => void handleFolderGrant(false)}
          className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
        >
          Révoquer dossier PV
        </button>
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <p className="mb-2 font-medium">Membres du bureau ({bureauGrants.length})</p>
          <ul className="max-h-40 space-y-1 overflow-y-auto">
            {bureauGrants.length === 0 && (
              <li className="text-[var(--text-muted)]">Aucun grant explicite</li>
            )}
            {bureauGrants.map((g) => (
              <li
                key={g.discordId}
                className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] px-2 py-1"
              >
                <button
                  type="button"
                  className="truncate text-left hover:text-[var(--accent)]"
                  onClick={() => setDiscordId(g.discordId)}
                >
                  {g.discordId}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  title="Révoquer le bureau"
                  className="shrink-0 rounded p-1 text-[var(--text-muted)] hover:bg-red-500/10 hover:text-red-500"
                  onClick={() => void handleBureauGrant(false, g.discordId)}
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-2 font-medium">Permissions modules ({permissions.length})</p>
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {permissions.map((p) => (
              <li
                key={`${p.discordId}-${p.module}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] px-2 py-1 text-[var(--text-muted)]"
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate text-left hover:text-[var(--accent)]"
                  onClick={() => setDiscordId(p.discordId)}
                >
                  {p.discordId} · {assoModuleLabels[p.module]} ·{' '}
                  {assoAccessLevelLabels[p.accessLevel]}
                </button>
                {p.accessLevel !== 'aucun' && (
                  <button
                    type="button"
                    disabled={busy}
                    title="Révoquer (aucun)"
                    className="shrink-0 rounded p-1 hover:bg-red-500/10 hover:text-red-500"
                    onClick={() => void revokeModulePermission(p.discordId, p.module)}
                  >
                    <X size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-2 font-medium">Accès dossiers PV ({folderGrants.length})</p>
          <ul className="max-h-32 space-y-1 overflow-y-auto">
            {folderGrants.map((g) => (
              <li
                key={`${g.discordId}-${g.folder}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] px-2 py-1 text-[var(--text-muted)]"
              >
                <button
                  type="button"
                  className="truncate text-left hover:text-[var(--accent)]"
                  onClick={() => setDiscordId(g.discordId)}
                >
                  {g.discordId} · {assoDocumentFolderLabels[g.folder]}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  title="Révoquer"
                  className="shrink-0 rounded p-1 hover:bg-red-500/10 hover:text-red-500"
                  onClick={() => void handleFolderGrant(false, g.discordId, g.folder)}
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
