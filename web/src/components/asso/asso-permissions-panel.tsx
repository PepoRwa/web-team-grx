'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Shield, X } from 'lucide-react'
import {
  ApiError,
  applyAssoPermissionProfile,
  grantAssoBureau,
  listAssoPermissionProfiles,
  listAssoPermissions,
  revokeAssoBureau,
  setAssoModulePermission,
  updateAssoBureauRole,
  type AssoAccessLevel,
  type AssoBureauGrant,
  type AssoBureauRoleDefinition,
  type AssoModule,
  type AssoModulePermission,
  type AssoPermissionProfile,
  type BureauRole,
} from '@/lib/api'
import { assoAccessLevelLabels, assoModuleLabels } from '@/lib/asso-module-labels'

const MODULES: AssoModule[] = [
  'membres',
  'documents',
  'cotisations',
  'assemblees',
  'parametres',
]
const LEVELS: AssoAccessLevel[] = ['aucun', 'lecture', 'edition', 'admin']
const BUREAU_ROLE_IDS: BureauRole[] = ['president', 'secretaire', 'tresorier', 'membre_bureau']

interface AssoPermissionsPanelProps {
  accessToken: string
  enabled: boolean
}

export function AssoPermissionsPanel({ accessToken, enabled }: AssoPermissionsPanelProps) {
  const [permissions, setPermissions] = useState<AssoModulePermission[]>([])
  const [bureauGrants, setBureauGrants] = useState<AssoBureauGrant[]>([])
  const [profiles, setProfiles] = useState<AssoPermissionProfile[]>([])
  const [bureauRoles, setBureauRoles] = useState<AssoBureauRoleDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [discordId, setDiscordId] = useState('')
  const [module, setModule] = useState<AssoModule>('documents')
  const [accessLevel, setAccessLevel] = useState<AssoAccessLevel>('lecture')
  const [profileId, setProfileId] = useState('membre_basique')
  const [bureauRole, setBureauRole] = useState<BureauRole>('secretaire')

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
      setBureauGrants(permData.bureauGrants)
      setProfiles(profileData.profiles)
      setBureauRoles(profileData.bureauRoles ?? [])
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

  if (!enabled) return null
  if (loading) return <div className="card h-32 animate-pulse bg-lavender/10" />

  return (
    <div className="card space-y-6 p-6">
      <div className="flex items-center gap-2">
        <Shield size={18} className="text-[var(--accent)]" />
        <h3 className="font-semibold">Permissions & rôles bureau</h3>
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        Réservé au président ou admin paramètres. Les accès documents se gèrent fichier par
        fichier dans l&apos;onglet Documents.
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
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!discordId.trim()) return
            void runAction(() =>
              setAssoModulePermission(accessToken, discordId.trim(), module, accessLevel),
            )
          }}
          className="space-y-3 rounded-xl border border-[var(--border)] p-4"
        >
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
          <button type="submit" disabled={busy || !discordId.trim()} className="btn-primary text-sm">
            Appliquer le niveau
          </button>
        </form>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!discordId.trim()) return
            void runAction(() =>
              applyAssoPermissionProfile(accessToken, discordId.trim(), profileId),
            )
          }}
          className="space-y-3 rounded-xl border border-[var(--border)] p-4"
        >
          <p className="text-sm font-medium">Profil adhérent / bureau</p>
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
          <button type="submit" disabled={busy || !discordId.trim()} className="btn-secondary text-sm">
            Appliquer le profil
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-[var(--border)] p-4 space-y-3">
        <p className="text-sm font-medium">Rôle bureau</p>
        <select
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
          value={bureauRole}
          onChange={(e) => setBureauRole(e.target.value as BureauRole)}
        >
          {BUREAU_ROLE_IDS.map((id) => {
            const def = bureauRoles.find((r) => r.id === id)
            return (
              <option key={id} value={id}>
                {def?.label ?? id}
              </option>
            )
          })}
        </select>
        <p className="text-xs text-[var(--text-muted)]">
          {bureauRoles.find((r) => r.id === bureauRole)?.description}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || !discordId.trim()}
            className="btn-primary text-sm"
            onClick={() =>
              void runAction(() => grantAssoBureau(accessToken, discordId.trim(), bureauRole))
            }
          >
            Nommer au bureau
          </button>
          <button
            type="button"
            disabled={busy || !discordId.trim()}
            className="btn-secondary text-sm"
            onClick={() =>
              void runAction(() => updateAssoBureauRole(accessToken, discordId.trim(), bureauRole))
            }
          >
            Changer le rôle
          </button>
          <button
            type="button"
            disabled={busy || !discordId.trim()}
            className="btn-ghost text-sm text-rose"
            onClick={() => void runAction(() => revokeAssoBureau(accessToken, discordId.trim()))}
          >
            Retirer du bureau
          </button>
        </div>
      </div>

      <div className="space-y-4 text-sm">
        <div>
          <p className="mb-2 font-medium">Membres du bureau ({bureauGrants.length})</p>
          <ul className="max-h-48 space-y-1 overflow-y-auto">
            {bureauGrants.map((g) => (
              <li
                key={g.discordId}
                className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] px-2 py-1"
              >
                <button
                  type="button"
                  className="truncate text-left hover:text-[var(--accent)]"
                  onClick={() => {
                    setDiscordId(g.discordId)
                    setBureauRole(g.role)
                  }}
                >
                  {g.discordId} · {g.role}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  className="shrink-0 rounded p-1 hover:text-red-500"
                  onClick={() => void runAction(() => revokeAssoBureau(accessToken, g.discordId))}
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
                  className="min-w-0 flex-1 truncate text-left"
                  onClick={() => setDiscordId(p.discordId)}
                >
                  {p.discordId} · {assoModuleLabels[p.module]} · {assoAccessLevelLabels[p.accessLevel]}
                </button>
                {p.accessLevel !== 'aucun' && (
                  <button
                    type="button"
                    disabled={busy}
                    className="shrink-0 rounded p-1 hover:text-red-500"
                    onClick={() =>
                      void runAction(() =>
                        setAssoModulePermission(accessToken, p.discordId, p.module, 'aucun'),
                      )
                    }
                  >
                    <X size={14} />
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
