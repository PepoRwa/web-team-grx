'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Shield } from 'lucide-react'
import {
  ApiError,
  grantAssoDocumentFolder,
  listAssoDocumentPermissions,
  revokeAssoDocumentFolder,
  setAssoDocumentPermission,
  type AssoAccessLevel,
  type AssoDocumentFolderGrant,
  type AssoModulePermission,
} from '@/lib/api'
import { assoAccessLevelLabels, assoDocumentFolderLabels } from '@/lib/asso-document-labels'

const LEVELS: AssoAccessLevel[] = ['aucun', 'lecture', 'edition', 'admin']

interface AssoDocumentPermissionsPanelProps {
  accessToken: string
  enabled: boolean
}

export function AssoDocumentPermissionsPanel({
  accessToken,
  enabled,
}: AssoDocumentPermissionsPanelProps) {
  const [permissions, setPermissions] = useState<AssoModulePermission[]>([])
  const [folderGrants, setFolderGrants] = useState<AssoDocumentFolderGrant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [discordId, setDiscordId] = useState('')
  const [accessLevel, setAccessLevel] = useState<AssoAccessLevel>('lecture')
  const [grantFolder, setGrantFolder] = useState<'pv_ag' | 'pv_bureau'>('pv_ag')

  const load = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    setError(null)
    try {
      const data = await listAssoDocumentPermissions(accessToken)
      setPermissions(data.permissions)
      setFolderGrants(data.folderGrants)
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
      await setAssoDocumentPermission(accessToken, discordId.trim(), accessLevel)
      setDiscordId('')
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Échec mise à jour')
    } finally {
      setBusy(false)
    }
  }

  async function handleFolderGrant(grant: boolean) {
    if (!discordId.trim()) return
    setBusy(true)
    try {
      if (grant) {
        await grantAssoDocumentFolder(accessToken, discordId.trim(), grantFolder)
      } else {
        await revokeAssoDocumentFolder(accessToken, discordId.trim(), grantFolder)
      }
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Échec grant dossier')
    } finally {
      setBusy(false)
    }
  }

  if (!enabled) return null

  return (
    <section className="card space-y-4 p-6">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5 text-[var(--accent)]" />
        <h2 className="text-lg font-semibold">Permissions documents</h2>
      </div>
      <p className="text-sm text-[var(--text-muted)]">
        Niveaux : aucun → lecture → édition (upload/suppression) → admin (gère les droits).
        Le bureau a l&apos;édition par défaut ; les adhérents voient les statuts sans droit
        d&apos;écriture.
      </p>

      {error && (
        <div className="rounded-xl border border-rose/30 bg-rose/10 px-3 py-2 text-sm text-rose">
          {error}
        </div>
      )}

      <form onSubmit={handleSetPermission} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--text-muted)]">Discord ID</span>
          <input
            className="input"
            value={discordId}
            onChange={(e) => setDiscordId(e.target.value)}
            placeholder="123456789012345678"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--text-muted)]">Niveau module</span>
          <select
            className="input"
            value={accessLevel}
            onChange={(e) => setAccessLevel(e.target.value as AssoAccessLevel)}
          >
            {LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>
                {assoAccessLevelLabels[lvl]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-[var(--text-muted)]">Dossier sur demande</span>
          <select
            className="input"
            value={grantFolder}
            onChange={(e) => setGrantFolder(e.target.value as 'pv_ag' | 'pv_bureau')}
          >
            <option value="pv_ag">{assoDocumentFolderLabels.pv_ag}</option>
            <option value="pv_bureau">{assoDocumentFolderLabels.pv_bureau}</option>
          </select>
        </label>
        <div className="flex flex-wrap items-end gap-2">
          <button type="submit" className="btn-primary text-sm" disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Appliquer niveau'}
          </button>
          <button
            type="button"
            className="btn-secondary text-sm"
            disabled={busy || !discordId.trim()}
            onClick={() => void handleFolderGrant(true)}
          >
            Accorder dossier
          </button>
          <button
            type="button"
            className="btn-secondary text-sm"
            disabled={busy || !discordId.trim()}
            onClick={() => void handleFolderGrant(false)}
          >
            Révoquer dossier
          </button>
        </div>
      </form>

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-6 w-6 animate-spin text-lavender" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-medium">Niveaux explicites</h3>
            {permissions.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Aucun — défauts bureau/adhérent.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {permissions.map((p) => (
                  <li key={p.discordId} className="rounded-lg bg-[var(--bg)] px-3 py-2">
                    <span className="font-mono text-xs">{p.discordId}</span>
                    <span className="mx-2 text-[var(--text-muted)]">→</span>
                    {assoAccessLevelLabels[p.accessLevel]}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium">Accès PV sur demande</h3>
            {folderGrants.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">Aucun grant actif.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {folderGrants.map((g) => (
                  <li
                    key={`${g.discordId}-${g.folder}`}
                    className="rounded-lg bg-[var(--bg)] px-3 py-2"
                  >
                    <span className="font-mono text-xs">{g.discordId}</span>
                    <span className="mx-2 text-[var(--text-muted)]">→</span>
                    {assoDocumentFolderLabels[g.folder]}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
