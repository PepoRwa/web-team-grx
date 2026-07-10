'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Shield } from 'lucide-react'
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

  async function handleSetPermission(e: React.FormEvent) {
    e.preventDefault()
    if (!discordId.trim()) return
    setBusy(true)
    try {
      await setAssoModulePermission(accessToken, discordId.trim(), module, accessLevel)
      setDiscordId('')
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Échec mise à jour')
    } finally {
      setBusy(false)
    }
  }

  async function handleApplyProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!discordId.trim()) return
    setBusy(true)
    try {
      await applyAssoPermissionProfile(accessToken, discordId.trim(), profileId)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Profil non appliqué')
    } finally {
      setBusy(false)
    }
  }

  async function handleBureauGrant(grant: boolean) {
    if (!discordId.trim()) return
    setBusy(true)
    try {
      if (grant) await grantAssoBureau(accessToken, discordId.trim())
      else await revokeAssoBureau(accessToken, discordId.trim())
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Échec bureau')
    } finally {
      setBusy(false)
    }
  }

  async function handleFolderGrant(grant: boolean) {
    if (!discordId.trim()) return
    setBusy(true)
    try {
      if (grant) await grantAssoDocumentFolder(accessToken, discordId.trim(), grantFolder)
      else await revokeAssoDocumentFolder(accessToken, discordId.trim(), grantFolder)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Échec dossier')
    } finally {
      setBusy(false)
    }
  }

  if (!enabled) return null
  if (loading) return <div className="card h-32 animate-pulse bg-lavender/10" />

  return (
    <div className="card space-y-6 p-6">
      <div className="flex items-center gap-2">
        <Shield size={18} className="text-[var(--accent)]" />
        <h3 className="font-semibold">Permissions & accès bureau</h3>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={handleSetPermission} className="space-y-3 rounded-xl border border-[var(--border)] p-4">
          <p className="text-sm font-medium">Niveau par module</p>
          <input
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            placeholder="Discord ID"
            value={discordId}
            onChange={(e) => setDiscordId(e.target.value)}
          />
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
            disabled={busy}
            className="rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : 'Appliquer'}
          </button>
        </form>

        <form onSubmit={handleApplyProfile} className="space-y-3 rounded-xl border border-[var(--border)] p-4">
          <p className="text-sm font-medium">Profil prédéfini</p>
          <input
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            placeholder="Discord ID"
            value={discordId}
            onChange={(e) => setDiscordId(e.target.value)}
          />
          <select
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
            value={profileId}
            onChange={(e) => setProfileId(e.target.value)}
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={busy}
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
          Accorder dossier
        </button>
        <button
          type="button"
          disabled={busy || !discordId.trim()}
          onClick={() => void handleFolderGrant(false)}
          className="rounded-xl border border-[var(--border)] px-3 py-2 text-sm"
        >
          Révoquer dossier
        </button>
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <p className="mb-2 font-medium">Permissions modules ({permissions.length})</p>
          <ul className="max-h-40 space-y-1 overflow-y-auto text-[var(--text-muted)]">
            {permissions.map((p) => (
              <li key={`${p.discordId}-${p.module}`}>
                {p.discordId} · {assoModuleLabels[p.module]} · {assoAccessLevelLabels[p.accessLevel]}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 font-medium">Grants bureau ({bureauGrants.length})</p>
          <ul className="max-h-32 space-y-1 overflow-y-auto text-[var(--text-muted)]">
            {bureauGrants.map((g) => (
              <li key={g.discordId}>{g.discordId}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 font-medium">Accès dossiers PV ({folderGrants.length})</p>
          <ul className="max-h-32 space-y-1 overflow-y-auto text-[var(--text-muted)]">
            {folderGrants.map((g) => (
              <li key={`${g.discordId}-${g.folder}`}>
                {g.discordId} · {assoDocumentFolderLabels[g.folder]}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
