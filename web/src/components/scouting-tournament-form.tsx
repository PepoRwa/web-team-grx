'use client'

import { useState } from 'react'
import type { ScoutingTournament, ScoutingTournamentInput } from '@/lib/api'
import { inputClass } from '@/lib/scouting'

interface ScoutingTournamentFormProps {
  initial?: ScoutingTournament
  submitting: boolean
  onSubmit: (data: ScoutingTournamentInput) => Promise<void>
  onCancel: () => void
  onDelete?: () => Promise<void>
}

export function ScoutingTournamentForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
  onDelete,
}: ScoutingTournamentFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [startDate, setStartDate] = useState(initial?.startDate ?? '')
  const [endDate, setEndDate] = useState(initial?.endDate ?? '')
  const [format, setFormat] = useState(initial?.format ?? '')
  const [rulesUrl, setRulesUrl] = useState(initial?.rulesUrl ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!name.trim()) {
      setFormError('Le nom du tournoi est requis.')
      return
    }
    try {
      await onSubmit({
        name: name.trim(),
        startDate: startDate || null,
        endDate: endDate || null,
        format: format.trim() || null,
        rulesUrl: rulesUrl.trim() || null,
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
        <span className="text-sm font-medium">Nom du tournoi</span>
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={200}
          required
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Date début</span>
          <input
            className={inputClass}
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Date fin</span>
          <input
            className={inputClass}
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Format</span>
        <input
          className={inputClass}
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          placeholder="BO3, Swiss, etc."
          maxLength={120}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Lien règlement</span>
        <input
          className={inputClass}
          type="url"
          value={rulesUrl}
          onChange={(e) => setRulesUrl(e.target.value)}
          placeholder="https://..."
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Notes</span>
        <textarea
          className={`${inputClass} min-h-[100px]`}
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
