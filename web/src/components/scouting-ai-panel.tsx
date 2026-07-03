'use client'

import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { ApiError, analyzeScoutingTeam, type ScoutingAiAnalysis } from '@/lib/api'

interface ScoutingAiPanelProps {
  teamId: number
  tournamentId?: string | null
  accessToken: string
  disabled?: boolean
}

function renderAnalysis(text: string) {
  const sections = text.split(/^## /m).filter(Boolean)
  if (sections.length <= 1) {
    return <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
  }

  return (
    <div className="space-y-4">
      {sections.map((block) => {
        const nl = block.indexOf('\n')
        const title = nl >= 0 ? block.slice(0, nl).trim() : block.trim()
        const body = nl >= 0 ? block.slice(nl + 1).trim() : ''
        return (
          <div key={title}>
            <h3 className="text-sm font-bold text-[var(--accent)]">{title}</h3>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[var(--text)]">
              {body}
            </p>
          </div>
        )
      })}
    </div>
  )
}

export function ScoutingAiPanel({
  teamId,
  tournamentId,
  accessToken,
  disabled,
}: ScoutingAiPanelProps) {
  const [analysis, setAnalysis] = useState<ScoutingAiAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runAnalysis() {
    setLoading(true)
    setError(null)
    try {
      const tid = tournamentId ? Number(tournamentId) : undefined
      const result = await analyzeScoutingTeam(accessToken, teamId, tid)
      setAnalysis(result.analysis)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Analyse impossible')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <Sparkles size={18} className="text-[var(--accent)]" />
            Analyse IA
          </h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Gemini · synthèse tactique basée sur les fiches scouting (12 analyses / h max)
          </p>
        </div>
        <button
          type="button"
          onClick={() => void runAnalysis()}
          disabled={disabled || loading}
          className="btn-primary inline-flex text-sm disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {analysis ? 'Régénérer' : 'Analyser'}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {loading && !analysis && (
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Loader2 size={16} className="animate-spin" />
          Analyse en cours…
        </div>
      )}

      {analysis && (
        <div className="space-y-3 border-t border-[var(--border)] pt-4">
          {renderAnalysis(analysis.text)}
          <p className="text-[10px] text-[var(--text-muted)]">
            {analysis.model} · {new Date(analysis.generatedAt).toLocaleString('fr-FR')}
          </p>
        </div>
      )}
    </section>
  )
}
