'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Plus, Save, Trash2 } from 'lucide-react'
import {
  ApiError,
  createAssoAssembly,
  deleteAssoAssembly,
  listAssoAssemblies,
  listAssoDocuments,
  updateAssoAssembly,
  type AssoAssembly,
  type AssoAssemblyStatus,
  type AssoDocument,
} from '@/lib/api'

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]'

interface AssoAssemblyListProps {
  accessToken: string
}

export function AssoAssemblyList({ accessToken }: AssoAssemblyListProps) {
  const [assemblies, setAssemblies] = useState<AssoAssembly[]>([])
  const [documents, setDocuments] = useState<AssoDocument[]>([])
  const [canEdit, setCanEdit] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<number | 'new' | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    title: '',
    date: '',
    agenda: '',
    status: 'a_venir' as AssoAssemblyStatus,
    pvDocumentId: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [agData, docData] = await Promise.all([
        listAssoAssemblies(accessToken),
        listAssoDocuments(accessToken).catch(() => ({ documents: [] as AssoDocument[] })),
      ])
      setAssemblies(agData.assemblies)
      setCanEdit(agData.canEdit)
      setDocuments(docData.documents.filter((d) => d.folder === 'pv_ag'))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Chargement impossible')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    void load()
  }, [load])

  function startEdit(ag: AssoAssembly) {
    setEditingId(ag.id)
    setForm({
      title: ag.title,
      date: ag.date,
      agenda: ag.agenda.join('\n'),
      status: ag.status,
      pvDocumentId: ag.pvDocumentId ? String(ag.pvDocumentId) : '',
    })
  }

  function startCreate() {
    setEditingId('new')
    setForm({ title: '', date: '', agenda: '', status: 'a_venir', pvDocumentId: '' })
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const payload = {
        title: form.title.trim(),
        date: form.date,
        agenda: form.agenda,
        status: form.status,
        pvDocumentId: form.pvDocumentId ? Number(form.pvDocumentId) : null,
      }
      if (editingId === 'new') {
        await createAssoAssembly(accessToken, payload)
      } else if (editingId !== null) {
        await updateAssoAssembly(accessToken, editingId, payload)
      }
      setEditingId(null)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enregistrement échoué')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Supprimer cette assemblée ?')) return
    setSaving(true)
    try {
      await deleteAssoAssembly(accessToken, id)
      setEditingId(null)
      await load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Suppression impossible')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="card h-40 animate-pulse bg-lavender/10" />
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-red-500">{error}</p>}

      {canEdit && (
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white"
        >
          <Plus size={16} />
          Nouvelle assemblée
        </button>
      )}

      {editingId && (
        <div className="card space-y-4 p-6">
          <h3 className="font-semibold">
            {editingId === 'new' ? 'Nouvelle assemblée' : 'Modifier l&apos;assemblée'}
          </h3>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Titre</span>
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Date</span>
            <input
              type="date"
              className={inputClass}
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Statut</span>
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as AssoAssemblyStatus }))
              }
            >
              <option value="a_venir">À venir</option>
              <option value="terminee">Terminée</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Ordre du jour (une ligne par point)</span>
            <textarea
              className={inputClass}
              rows={5}
              value={form.agenda}
              onChange={(e) => setForm((f) => ({ ...f, agenda: e.target.value }))}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">PV associé</span>
            <select
              className={inputClass}
              value={form.pvDocumentId}
              onChange={(e) => setForm((f) => ({ ...f, pvDocumentId: e.target.value }))}
            >
              <option value="">Aucun</option>
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSave()}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="rounded-xl px-3 py-2 text-sm text-[var(--text-muted)]"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {assemblies.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">Aucune assemblée enregistrée.</p>
      ) : (
        assemblies.map((ag) => (
          <div key={ag.id} className="card space-y-3 p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">{ag.title}</h3>
                <p className="text-sm text-[var(--text-muted)]">
                  {new Date(ag.date).toLocaleDateString('fr-FR')}
                </p>
              </div>
              <span
                className={`badge ${ag.status === 'a_venir' ? 'badge-gold' : 'badge-mint'}`}
              >
                {ag.status === 'a_venir' ? 'À venir' : 'Terminée'}
              </span>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Ordre du jour</p>
              <ul className="list-inside list-disc space-y-1 text-sm text-[var(--text-muted)]">
                {ag.agenda.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              {ag.pvDocumentName
                ? `PV : ${ag.pvDocumentName}`
                : 'PV non encore publié'}
            </p>
            {canEdit && (
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => startEdit(ag)}
                  className="rounded-xl border border-[var(--border)] px-3 py-1.5 text-sm"
                >
                  Modifier
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(ag.id)}
                  className="inline-flex items-center gap-1 rounded-xl border border-red-500/30 px-3 py-1.5 text-sm text-red-500"
                >
                  <Trash2 size={14} />
                  Supprimer
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
