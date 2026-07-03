'use client'

import { useState } from 'react'
import type { ScoutingTeam, ScoutingTeamInput } from '@/lib/api'
import { inputClass } from '@/lib/scouting'

interface ScoutingTeamFormProps {
  initial?: ScoutingTeam
  submitting: boolean
  onSubmit: (data: ScoutingTeamInput) => Promise<void>
  onCancel: () => void
  onDelete?: () => Promise<void>
  showLinkFields?: boolean
  seed?: string
  linkNotes?: string
  onSeedChange?: (v: string) => void
  onLinkNotesChange?: (v: string) => void
}

export function ScoutingTeamForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
  onDelete,
  showLinkFields,
  seed = '',
  linkNotes = '',
  onSeedChange,
  onLinkNotesChange,
}: ScoutingTeamFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [tag, setTag] = useState(initial?.tag ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!name.trim()) {
      setFormError('Le nom de l’équipe est requis.')
      return
    }
    try {
      await onSubmit({
        name: name.trim(),
        tag: tag.trim() || null,
        notes: notes.trim() || null,
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Enregistrement échoué')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5 p-6">
      {formError && <p className="text-sm text-red-500">{formError}</p>}

      <label className="block space-y-1">
        <span className="text-sm font-medium">Nom de l’équipe</span>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          required
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Tag</span>
        <input
          className={inputClass}
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          maxLength={20}
          placeholder="Optionnel"
        />
      </label>

      {showLinkFields && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Seed / poule</span>
            <input
              className={inputClass}
              value={seed}
              onChange={(e) => onSeedChange?.(e.target.value)}
              maxLength={20}
              placeholder="A1, Groupe B…"
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Notes tournoi</span>
            <input
              className={inputClass}
              value={linkNotes}
              onChange={(e) => onLinkNotesChange?.(e.target.value)}
              placeholder="Contexte pour ce tournoi"
            />
          </label>
        </div>
      )}

      <label className="block space-y-1">
        <span className="text-sm font-medium">Notes équipe</span>
        <textarea
          className={`${inputClass} min-h-[80px]`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={10000}
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Annuler
        </button>
        {onDelete && (
          <button
            type="button"
            className="btn-ghost ml-auto text-red-500"
            onClick={() => void onDelete()}
          >
            Supprimer
          </button>
        )}
      </div>
    </form>
  )
}
