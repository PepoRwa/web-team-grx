'use client'

import { useRef, useState } from 'react'
import { Download, FileText, Loader2, Trash2, Upload } from 'lucide-react'
import {
  deleteAssoDocument,
  downloadAssoDocument,
  uploadAssoDocument,
  type AssoDocument,
  type AssoDocumentFolder,
} from '@/lib/api'
import { assoDocumentFolderHints, assoDocumentFolderLabels } from '@/lib/asso-document-labels'

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

interface AssoDocTreeProps {
  accessToken: string
  documents: AssoDocument[]
  accessibleFolders: AssoDocumentFolder[]
  canUpload: boolean
  onChanged: () => void
}

export function AssoDocTree({
  accessToken,
  documents,
  accessibleFolders,
  canUpload,
  onChanged,
}: AssoDocTreeProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFolder, setSelectedFolder] = useState<AssoDocumentFolder>(
    accessibleFolders[0] ?? 'statuts',
  )
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [busy, setBusy] = useState<'upload' | 'download' | 'delete' | null>(null)

  const filtered = documents.filter((d) => d.folder === selectedFolder)
  const selected = documents.find((d) => d.id === selectedId) ?? filtered[0] ?? null

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  async function handleUpload(file: File) {
    setBusy('upload')
    try {
      const doc = await uploadAssoDocument(accessToken, selectedFolder, file)
      showMessage('success', `« ${doc.name} » déposé avec succès.`)
      setSelectedId(doc.id)
      onChanged()
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Échec de l\'upload.')
    } finally {
      setBusy(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function openDocument(doc: AssoDocument) {
    if (!doc.hasFile) {
      showMessage('error', 'Ce document n\'a pas encore de fichier associé.')
      return
    }

    setBusy('download')
    try {
      const { url } = await downloadAssoDocument(accessToken, doc.id)
      window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Ouverture impossible.')
    } finally {
      setBusy(null)
    }
  }

  async function handleDelete() {
    if (!selected) return
    if (!window.confirm(`Supprimer « ${selected.name} » ? Cette action est irréversible.`)) {
      return
    }

    setBusy('delete')
    try {
      await deleteAssoDocument(accessToken, selected.id)
      showMessage('success', 'Document supprimé.')
      setSelectedId(null)
      onChanged()
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Suppression impossible.')
    } finally {
      setBusy(null)
    }
  }

  if (accessibleFolders.length === 0) {
    return (
      <div className="card p-6 text-sm text-[var(--text-muted)]">
        Aucun dossier document accessible pour votre profil.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {message && (
        <div
          className={`rounded-xl border px-4 py-2 text-sm ${
            message.type === 'success'
              ? 'border-mint/40 bg-mint/15 text-[var(--text)]'
              : 'border-rose/40 bg-rose/10 text-rose'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.xlsx,.zip,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/zip"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void handleUpload(file)
          }}
        />
        {canUpload && (
          <button
            type="button"
            className="btn-secondary text-sm"
            disabled={busy !== null}
            onClick={() => fileInputRef.current?.click()}
          >
            {busy === 'upload' ? (
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 inline h-4 w-4" />
            )}
            Déposer
          </button>
        )}
        <button
          type="button"
          className="btn-secondary text-sm"
          disabled={!selected?.hasFile || busy !== null}
          onClick={() => selected && void openDocument(selected)}
        >
          {busy === 'download' ? (
            <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 inline h-4 w-4" />
          )}
          Ouvrir
        </button>
        {canUpload && (
          <button
            type="button"
            className="btn-secondary text-sm text-rose"
            disabled={!selected || busy !== null}
            onClick={() => void handleDelete()}
          >
            {busy === 'delete' ? (
              <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 inline h-4 w-4" />
            )}
            Supprimer
          </button>
        )}
      </div>

      <p className="text-sm text-[var(--text-muted)]">
        {canUpload
          ? 'PDF, DOCX, XLSX ou ZIP — max 10 Mo. Cliquez sur un document pour l\'ouvrir.'
          : 'Accès lecture seule — cliquez sur un document pour l\'ouvrir.'}
      </p>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="card space-y-1 p-2">
          {accessibleFolders.map((folder) => {
            const count = documents.filter((d) => d.folder === folder).length
            const active = folder === selectedFolder
            return (
              <button
                key={folder}
                type="button"
                onClick={() => {
                  setSelectedFolder(folder)
                  setSelectedId(null)
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition ${
                  active
                    ? 'bg-[var(--accent-soft)] font-medium text-[var(--accent)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]'
                }`}
              >
                <span>{assoDocumentFolderLabels[folder]}</span>
                <span className="text-xs opacity-70">{count}</span>
              </button>
            )
          })}
        </div>

        <div className="card overflow-hidden">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <h3 className="font-semibold">{assoDocumentFolderLabels[selectedFolder]}</h3>
            <p className="text-xs text-[var(--text-muted)]">
              {assoDocumentFolderHints[selectedFolder]}
            </p>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-12 text-center text-sm text-[var(--text-muted)]">
              <FileText className="h-8 w-8 opacity-40" />
              Aucun document dans ce dossier.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]">
                    <th className="px-4 py-2 font-medium">Nom</th>
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2 font-medium">Date</th>
                    <th className="px-4 py-2 font-medium">Taille</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((doc) => {
                    const isSelected = selected?.id === doc.id
                    return (
                      <tr
                        key={doc.id}
                        className={`cursor-pointer border-b border-[var(--border)] last:border-0 transition ${
                          isSelected ? 'bg-[var(--accent-soft)]/50' : 'hover:bg-[var(--bg)]'
                        }`}
                        onClick={() => {
                          setSelectedId(doc.id)
                          void openDocument(doc)
                        }}
                      >
                        <td className="px-4 py-3 font-medium">{doc.name}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{doc.fileType}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">
                          {formatDate(doc.uploadedAt)}
                        </td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{doc.sizeLabel}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
