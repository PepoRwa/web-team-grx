'use client'

import { useCallback, useEffect, useState } from 'react'
import { FileKey, Loader2, X } from 'lucide-react'
import {
  ApiError,
  grantAssoDocumentAccess,
  listAssoDocumentGrants,
  revokeAssoDocumentAccess,
  type AssoDocument,
  type AssoDocumentGrant,
} from '@/lib/api'
import { assoDocumentFolderLabels } from '@/lib/asso-document-labels'

interface AssoDocumentGrantsPanelProps {
  accessToken: string
  enabled: boolean
  documents: AssoDocument[]
}

export function AssoDocumentGrantsPanel({
  accessToken,
  enabled,
  documents,
}: AssoDocumentGrantsPanelProps) {
  const [selectedDocId, setSelectedDocId] = useState<number | ''>('')
  const [discordId, setDiscordId] = useState('')
  const [accessLevel, setAccessLevel] = useState<'lecture' | 'edition'>('lecture')
  const [grants, setGrants] = useState<AssoDocumentGrant[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedDoc = documents.find((d) => d.id === selectedDocId)

  const loadGrants = useCallback(async () => {
    if (!enabled || !selectedDocId) {
      setGrants([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await listAssoDocumentGrants(accessToken, Number(selectedDocId))
      setGrants(data.grants)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Chargement impossible')
    } finally {
      setLoading(false)
    }
  }, [accessToken, enabled, selectedDocId])

  useEffect(() => {
    void loadGrants()
  }, [loadGrants])

  async function handleGrant(e: React.FormEvent) {
    e.preventDefault()
    if (!discordId.trim() || !selectedDocId) return
    setBusy(true)
    setError(null)
    try {
      await grantAssoDocumentAccess(
        accessToken,
        discordId.trim(),
        Number(selectedDocId),
        accessLevel,
      )
      setDiscordId('')
      await loadGrants()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Attribution échouée')
    } finally {
      setBusy(false)
    }
  }

  if (!enabled) return null

  const restrictedDocs = documents.filter((d) => d.folder !== 'statuts')

  return (
    <div className="card space-y-4 p-6">
      <div className="flex items-center gap-2">
        <FileKey size={18} className="text-[var(--accent)]" />
        <h3 className="card-title">Accès par document</h3>
      </div>
      <p className="text-xs text-[var(--text-muted)]">
        Chaque PV ou document sensible est attribué individuellement (pas par groupe de dossier).
        Les statuts restent publics pour tous les adhérents actifs.
      </p>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <label className="block space-y-1">
        <span className="text-sm font-medium">Document</span>
        <select
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
          value={selectedDocId}
          onChange={(e) =>
            setSelectedDocId(e.target.value ? Number(e.target.value) : '')
          }
        >
          <option value="">Choisir un document…</option>
          {restrictedDocs.map((d) => (
            <option key={d.id} value={d.id}>
              [{assoDocumentFolderLabels[d.folder]}] {d.name}
            </option>
          ))}
        </select>
      </label>

      {selectedDoc && (
        <form onSubmit={handleGrant} className="flex flex-wrap items-end gap-2">
          <label className="min-w-[180px] flex-1 space-y-1">
            <span className="text-xs font-medium">Discord ID</span>
            <input
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
              value={discordId}
              onChange={(e) => setDiscordId(e.target.value)}
              placeholder="123456789012345678"
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-medium">Niveau</span>
            <select
              className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value as 'lecture' | 'edition')}
            >
              <option value="lecture">Lecture</option>
              <option value="edition">Édition</option>
            </select>
          </label>
          <button type="submit" disabled={busy || !discordId.trim()} className="btn-primary text-sm">
            {busy ? <Loader2 size={16} className="animate-spin" /> : 'Accorder'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="h-16 animate-pulse rounded-xl bg-lavender/10" />
      ) : selectedDocId ? (
        <ul className="max-h-40 space-y-1 overflow-y-auto text-sm">
          {grants.length === 0 ? (
            <li className="text-[var(--text-muted)]">Aucun accès individuel pour ce fichier.</li>
          ) : (
            grants.map((g) => (
              <li
                key={g.discordId}
                className="flex items-center justify-between gap-2 rounded-lg border border-[var(--border)] px-2 py-1"
              >
                <span>
                  {g.discordId} · {g.accessLevel}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  className="rounded p-1 hover:text-red-500"
                  onClick={async () => {
                    setBusy(true)
                    try {
                      await revokeAssoDocumentAccess(accessToken, g.discordId, g.documentId)
                      await loadGrants()
                    } catch (err) {
                      setError(err instanceof ApiError ? err.message : 'Révocation échouée')
                    } finally {
                      setBusy(false)
                    }
                  }}
                >
                  <X size={14} />
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  )
}
