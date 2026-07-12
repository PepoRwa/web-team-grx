'use client'

import { useEffect, useState } from 'react'
import type { TryoutSessionInput, Vod } from '@/lib/api'
import { listVods } from '@/lib/api'
import { inputClass } from '@/lib/valorant'
import { SESSION_OUTCOMES, SESSION_TYPES } from '@/lib/tryouts'

interface TryoutSessionFormProps {
  campaignId: number
  accessToken: string
  submitting: boolean
  onSubmit: (data: TryoutSessionInput) => Promise<void>
  onCancel: () => void
}

export function TryoutSessionForm({
  campaignId,
  accessToken,
  submitting,
  onSubmit,
  onCancel,
}: TryoutSessionFormProps) {
  const [sessionType, setSessionType] = useState<TryoutSessionInput['sessionType']>('scrim')
  const [scheduledAt, setScheduledAt] = useState('')
  const [map, setMap] = useState('')
  const [vodId, setVodId] = useState('')
  const [outcome, setOutcome] = useState<TryoutSessionInput['outcome']>('pending')
  const [notes, setNotes] = useState('')
  const [vods, setVods] = useState<Vod[]>([])
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    void listVods(accessToken, { page: 1, limit: 50 }).then((res) => setVods(res.items))
  }, [accessToken])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    try {
      await onSubmit({
        campaignId,
        sessionType,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        map: map.trim() || null,
        vodId: vodId ? Number(vodId) : null,
        outcome,
        notes: notes.trim() || null,
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Enregistrement échoué')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-5">
      {formError && <p className="text-sm text-red-500">{formError}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Type</span>
          <select
            className={inputClass}
            value={sessionType}
            onChange={(e) => setSessionType(e.target.value as TryoutSessionInput['sessionType'])}
          >
            {SESSION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Date / heure</span>
          <input
            className={inputClass}
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Map</span>
          <input className={inputClass} value={map} onChange={(e) => setMap(e.target.value)} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">VOD liée</span>
          <select className={inputClass} value={vodId} onChange={(e) => setVodId(e.target.value)}>
            <option value="">—</option>
            {vods.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Résultat</span>
        <select
          className={inputClass}
          value={outcome}
          onChange={(e) => setOutcome(e.target.value as TryoutSessionInput['outcome'])}
        >
          {SESSION_OUTCOMES.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Notes</span>
        <textarea className={inputClass} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>

      <div className="flex gap-3">
        <button type="submit" className="btn-primary text-sm" disabled={submitting}>
          Ajouter session
        </button>
        <button type="button" className="btn-ghost text-sm" onClick={onCancel} disabled={submitting}>
          Annuler
        </button>
      </div>
    </form>
  )
}
