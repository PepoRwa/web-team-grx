'use client'

import { useState } from 'react'
import type { TryoutEvaluationInput } from '@/lib/api'
import { inputClass } from '@/lib/scouting'
import { RECOMMENDATIONS } from '@/lib/tryouts'

const CRITERIA = [
  { key: 'mechanics', label: 'Mécaniques' },
  { key: 'comms', label: 'Comms' },
  { key: 'adaptability', label: 'Adaptabilité' },
  { key: 'mental', label: 'Mental' },
  { key: 'teamplay', label: 'Teamplay' },
] as const

interface TryoutEvaluationFormProps {
  submitting: boolean
  onSubmit: (data: TryoutEvaluationInput) => Promise<void>
  onCancel: () => void
}

export function TryoutEvaluationForm({ submitting, onSubmit, onCancel }: TryoutEvaluationFormProps) {
  const [scores, setScores] = useState<Record<string, number>>({})
  const [recommendation, setRecommendation] =
    useState<TryoutEvaluationInput['recommendation']>('neutral')
  const [comment, setComment] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    try {
      await onSubmit({
        scores: Object.keys(scores).length > 0 ? scores : null,
        recommendation,
        comment: comment.trim() || null,
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Enregistrement échoué')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-5">
      {formError && <p className="text-sm text-red-500">{formError}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {CRITERIA.map((c) => (
          <label key={c.key} className="block space-y-1">
            <span className="text-sm font-medium">{c.label} (1–5)</span>
            <input
              className={inputClass}
              type="number"
              min={1}
              max={5}
              value={scores[c.key] ?? ''}
              onChange={(e) => {
                const v = e.target.value
                setScores((prev) => {
                  const next = { ...prev }
                  if (v) next[c.key] = Number(v)
                  else delete next[c.key]
                  return next
                })
              }}
            />
          </label>
        ))}
      </div>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Recommandation</span>
        <select
          className={inputClass}
          value={recommendation}
          onChange={(e) =>
            setRecommendation(e.target.value as TryoutEvaluationInput['recommendation'])
          }
        >
          {RECOMMENDATIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Commentaire privé staff</span>
        <textarea className={inputClass} rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
      </label>

      <div className="flex gap-3">
        <button type="submit" className="btn-primary text-sm" disabled={submitting}>
          Enregistrer évaluation
        </button>
        <button type="button" className="btn-ghost text-sm" onClick={onCancel} disabled={submitting}>
          Annuler
        </button>
      </div>
    </form>
  )
}
