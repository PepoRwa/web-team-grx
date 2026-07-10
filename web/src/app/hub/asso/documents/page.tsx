'use client'

import { useCallback, useEffect, useState } from 'react'
import { AssoDocTree } from '@/components/asso/asso-doc-tree'
import { AssoShell } from '@/components/asso/asso-shell'
import { useAssoGate } from '@/hooks/useAssoGate'
import { useAuth } from '@/hooks/useAuth'
import {
  ApiError,
  getAssoDocumentsMeta,
  listAssoDocuments,
  type AssoDocument,
  type AssoDocumentsMeta,
} from '@/lib/api'
import { assoAccessLevelLabels } from '@/lib/asso-document-labels'

export default function AssoDocumentsPage() {
  const { session } = useAuth()
  const { ready } = useAssoGate()
  const token = session?.access_token

  const [meta, setMeta] = useState<AssoDocumentsMeta | null>(null)
  const [documents, setDocuments] = useState<AssoDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError(null)
    try {
      const [metaRes, docsRes] = await Promise.all([
        getAssoDocumentsMeta(token),
        listAssoDocuments(token),
      ])
      setMeta(metaRes)
      setDocuments(docsRes.documents)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Documents indisponibles')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (ready && token) void load()
  }, [ready, token, load])

  if (!ready) return null

  return (
    <AssoShell activeNav="documents" title="Documents">
      <div className="mx-auto max-w-6xl px-4 py-6">
        {meta && (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
            <span className="badge badge-lavender">
              Niveau : {assoAccessLevelLabels[meta.documentsLevel]}
            </span>
            {meta.canUpload ? (
              <span className="badge badge-mint">Édition autorisée</span>
            ) : (
              <span className="badge">Lecture seule</span>
            )}
          </div>
        )}

        {loading ? (
          <div className="card flex items-center justify-center p-12">
            <div className="h-8 w-8 animate-pulse rounded-full bg-lavender/40" />
          </div>
        ) : error ? (
          <div className="card border-rose/30 p-6 text-sm text-rose">{error}</div>
        ) : meta ? (
          <AssoDocTree
            accessToken={token!}
            documents={documents}
            accessibleFolders={meta.accessibleFolders}
            canUpload={meta.canUpload}
            onChanged={() => void load()}
          />
        ) : null}
      </div>
    </AssoShell>
  )
}
