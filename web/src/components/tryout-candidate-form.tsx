'use client'

import { useState } from 'react'
import type { TryoutCandidateInput, TryoutPipelineStatus } from '@/lib/api'
import { inputClass, VALORANT_RANKS, VALORANT_ROLES } from '@/lib/valorant'
import { CANDIDATE_SOURCES, PIPELINE_STATUSES } from '@/lib/tryouts'

interface TryoutCandidateFormProps {
  campaignId?: number
  initial?: Partial<TryoutCandidateInput> & { riotId?: string; riotTag?: string }
  submitting: boolean
  onSubmit: (data: TryoutCandidateInput) => Promise<void>
  onCancel: () => void
}

export function TryoutCandidateForm({
  campaignId,
  initial,
  submitting,
  onSubmit,
  onCancel,
}: TryoutCandidateFormProps) {
  const [riotId, setRiotId] = useState(initial?.riotId ?? '')
  const [riotTag, setRiotTag] = useState(initial?.riotTag ?? '')
  const [displayName, setDisplayName] = useState(initial?.displayName ?? '')
  const [trackerUrl, setTrackerUrl] = useState(initial?.trackerUrl ?? '')
  const [role, setRole] = useState(initial?.role ?? '')
  const [currentRank, setCurrentRank] = useState(initial?.currentRank ?? '')
  const [source, setSource] = useState(initial?.source ?? 'discord_ticket')
  const [status, setStatus] = useState<TryoutPipelineStatus>(initial?.status ?? 'new')
  const [priority, setPriority] = useState(
    initial?.priority != null ? String(initial.priority) : '',
  )
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [campaignNotes, setCampaignNotes] = useState(initial?.campaignNotes ?? '')
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!riotId.trim() || !riotTag.trim()) {
      setFormError('Riot ID et tag requis.')
      return
    }
    try {
      await onSubmit({
        riotId: riotId.trim(),
        riotTag: riotTag.trim(),
        displayName: displayName.trim() || null,
        trackerUrl: trackerUrl.trim() || null,
        role: role ? (role as TryoutCandidateInput['role']) : null,
        currentRank: currentRank || null,
        source,
        notes: notes.trim() || null,
        campaignId,
        status,
        priority: priority ? Number(priority) : null,
        campaignNotes: campaignNotes.trim() || null,
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Enregistrement échoué')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5 p-6">
      {formError && <p className="text-sm text-red-500">{formError}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Riot ID</span>
          <input
            className={inputClass}
            value={riotId}
            onChange={(e) => setRiotId(e.target.value)}
            required
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Tag</span>
          <input
            className={inputClass}
            value={riotTag}
            onChange={(e) => setRiotTag(e.target.value)}
            maxLength={16}
            required
          />
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Nom affiché (optionnel)</span>
        <input className={inputClass} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Rôle</span>
          <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">—</option>
            {VALORANT_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Rang actuel</span>
          <select className={inputClass} value={currentRank} onChange={(e) => setCurrentRank(e.target.value)}>
            <option value="">—</option>
            {VALORANT_RANKS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Tracker URL</span>
        <input className={inputClass} value={trackerUrl} onChange={(e) => setTrackerUrl(e.target.value)} />
      </label>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Source</span>
          <select className={inputClass} value={source} onChange={(e) => setSource(e.target.value as typeof source)}>
            {CANDIDATE_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        {campaignId && (
          <>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Statut pipeline</span>
              <select
                className={inputClass}
                value={status}
                onChange={(e) => setStatus(e.target.value as TryoutPipelineStatus)}
              >
                {PIPELINE_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Priorité</span>
              <input
                className={inputClass}
                type="number"
                min={1}
                max={10}
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              />
            </label>
          </>
        )}
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Notes staff (privées)</span>
        <textarea className={inputClass} rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      {campaignId && (
        <label className="block space-y-1">
          <span className="text-sm font-medium">Notes campagne</span>
          <textarea
            className={inputClass}
            rows={2}
            value={campaignNotes}
            onChange={(e) => setCampaignNotes(e.target.value)}
          />
        </label>
      )}

      <div className="flex gap-3">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Enregistrement…' : 'Enregistrer'}
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={submitting}>
          Annuler
        </button>
      </div>
    </form>
  )
}
