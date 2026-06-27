'use client'

import { useState } from 'react'
import type { Strat, StratInput, StratSide, StratStatus } from '@/lib/api'
import { VALORANT_MAPS } from '@/lib/strats'

interface StratFormProps {
  initial?: Strat
  isStaff: boolean
  submitting: boolean
  onSubmit: (data: StratInput) => Promise<void>
  onCancel: () => void
  onDelete?: () => Promise<void>
}

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]'

export function StratForm({
  initial,
  isStaff,
  submitting,
  onSubmit,
  onCancel,
  onDelete,
}: StratFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [map, setMap] = useState(initial?.map ?? 'Ascent')
  const [side, setSide] = useState<StratSide>(initial?.side ?? 'attack')
  const [valoplantUrl, setValoplantUrl] = useState(initial?.valoplantUrl ?? '')
  const [vodUrl, setVodUrl] = useState(initial?.vodUrl ?? '')
  const [status, setStatus] = useState<StratStatus>(initial?.status ?? 'published')
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!title.trim()) {
      setFormError('Le titre est requis.')
      return
    }
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        map,
        side,
        valoplantUrl: valoplantUrl.trim() || null,
        vodUrl: vodUrl.trim() || null,
        ...(isStaff && initial ? { status } : {}),
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Enregistrement échoué')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5 p-6">
      {formError && <p className="text-sm text-red-500">{formError}</p>}

      {!isStaff && !initial && (
        <p className="rounded-xl bg-[var(--accent-soft)]/50 p-3 text-sm text-[var(--text-muted)]">
          Ta strat sera soumise en <strong>proposition</strong> — un coach la publiera après validation.
        </p>
      )}

      <label className="block space-y-1">
        <span className="text-sm font-medium">Titre</span>
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Description</span>
        <textarea className={inputClass} rows={5} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Map</span>
          <select className={inputClass} value={map} onChange={(e) => setMap(e.target.value)}>
            {VALORANT_MAPS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Côté</span>
          <select className={inputClass} value={side} onChange={(e) => setSide(e.target.value as StratSide)}>
            <option value="attack">Attaque</option>
            <option value="defense">Défense</option>
          </select>
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Lien ValoPlant</span>
        <input className={inputClass} type="url" value={valoplantUrl} onChange={(e) => setValoplantUrl(e.target.value)} placeholder="https://..." />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Lien VOD associée</span>
        <input className={inputClass} type="url" value={vodUrl} onChange={(e) => setVodUrl(e.target.value)} placeholder="https://..." />
      </label>

      {isStaff && initial && (
        <label className="block space-y-1">
          <span className="text-sm font-medium">Statut</span>
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as StratStatus)}>
            <option value="published">Publiée</option>
            <option value="proposed">Proposée</option>
          </select>
        </label>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {initial ? 'Enregistrer' : 'Proposer la strat'}
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={submitting}>
          Annuler
        </button>
        {onDelete && (
          <button type="button" className="btn-ghost ml-auto text-red-500" disabled={submitting} onClick={() => void onDelete()}>
            Supprimer
          </button>
        )}
      </div>
    </form>
  )
}
