'use client'

import { useState } from 'react'
import type { TryoutCampaign, TryoutCampaignInput } from '@/lib/api'
import { inputClass } from '@/lib/scouting'
import { CAMPAIGN_STATUSES, TARGET_ROSTERS } from '@/lib/tryouts'

interface TryoutCampaignFormProps {
  initial?: TryoutCampaign
  submitting: boolean
  onSubmit: (data: TryoutCampaignInput) => Promise<void>
  onCancel: () => void
  onDelete?: () => Promise<void>
}

export function TryoutCampaignForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
  onDelete,
}: TryoutCampaignFormProps) {
  const [name, setName] = useState(initial?.name ?? '')
  const [targetRoster, setTargetRoster] = useState(initial?.targetRoster ?? 'high_roster')
  const [game, setGame] = useState(initial?.game ?? 'valorant')
  const [status, setStatus] = useState(initial?.status ?? 'draft')
  const [startDate, setStartDate] = useState(initial?.startDate ?? '')
  const [endDate, setEndDate] = useState(initial?.endDate ?? '')
  const [slotsTarget, setSlotsTarget] = useState(
    initial?.slotsTarget != null ? String(initial.slotsTarget) : '',
  )
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!name.trim()) {
      setFormError('Le nom de la campagne est requis.')
      return
    }
    try {
      await onSubmit({
        name: name.trim(),
        targetRoster,
        game,
        status,
        startDate: startDate || null,
        endDate: endDate || null,
        slotsTarget: slotsTarget ? Number(slotsTarget) : null,
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
        <span className="text-sm font-medium">Nom de la campagne</span>
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
          <span className="text-sm font-medium">Roster cible</span>
          <select
            className={inputClass}
            value={targetRoster}
            onChange={(e) => setTargetRoster(e.target.value as TryoutCampaign['targetRoster'])}
          >
            {TARGET_ROSTERS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Statut</span>
          <select
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as TryoutCampaign['status'])}
          >
            {CAMPAIGN_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Jeu</span>
          <select
            className={inputClass}
            value={game}
            onChange={(e) => setGame(e.target.value as TryoutCampaign['game'])}
          >
            <option value="valorant">Valorant</option>
            <option value="cs2">CS2</option>
            <option value="other">Autre</option>
          </select>
        </label>
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
        <span className="text-sm font-medium">Places visées</span>
        <input
          className={inputClass}
          type="number"
          min={0}
          max={20}
          value={slotsTarget}
          onChange={(e) => setSlotsTarget(e.target.value)}
          placeholder="ex. 1"
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Notes internes</span>
        <textarea
          className={inputClass}
          rows={4}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Enregistrement…' : initial ? 'Mettre à jour' : 'Créer'}
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={submitting}>
          Annuler
        </button>
        {onDelete && (
          <button
            type="button"
            className="btn-ghost text-red-500"
            onClick={() => void onDelete()}
            disabled={submitting}
          >
            Supprimer
          </button>
        )}
      </div>
    </form>
  )
}
