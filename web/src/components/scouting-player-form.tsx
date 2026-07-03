'use client'

import { useState } from 'react'
import type { ScoutingPlayer, ScoutingPlayerInput, ScoutingRole } from '@/lib/api'
import { inputClass, SCOUTING_ROLES, VALORANT_RANKS } from '@/lib/scouting'

interface ScoutingPlayerFormProps {
  initial?: ScoutingPlayer
  submitting: boolean
  onSubmit: (data: ScoutingPlayerInput) => Promise<void>
  onCancel: () => void
  onDelete?: () => Promise<void>
}

function numOrNull(v: string): number | null {
  if (!v.trim()) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export function ScoutingPlayerForm({
  initial,
  submitting,
  onSubmit,
  onCancel,
  onDelete,
}: ScoutingPlayerFormProps) {
  const [riotId, setRiotId] = useState(initial?.riotId ?? '')
  const [riotTag, setRiotTag] = useState(initial?.riotTag ?? '')
  const [role, setRole] = useState<ScoutingRole | ''>(initial?.role ?? '')
  const [isStarter, setIsStarter] = useState<string>(
    initial?.isStarter === true ? '1' : initial?.isStarter === false ? '0' : '',
  )
  const [currentRank, setCurrentRank] = useState(initial?.currentRank ?? '')
  const [peakRankCurrent, setPeakRankCurrent] = useState(initial?.peakRankCurrent ?? '')
  const [peakRankPrev, setPeakRankPrev] = useState(initial?.peakRankPrev ?? '')
  const [endRankPrev, setEndRankPrev] = useState(initial?.endRankPrev ?? '')
  const [gamesThisSeason, setGamesThisSeason] = useState(
    initial?.gamesThisSeason != null ? String(initial.gamesThisSeason) : '',
  )
  const [recentWinrate, setRecentWinrate] = useState(
    initial?.recentWinrate != null ? String(initial.recentWinrate) : '',
  )
  const [avgAcs, setAvgAcs] = useState(initial?.avgAcs != null ? String(initial.avgAcs) : '')
  const [avgKda, setAvgKda] = useState(initial?.avgKda != null ? String(initial.avgKda) : '')
  const [agent1, setAgent1] = useState(initial?.agentPool?.[0]?.agent ?? '')
  const [agent1Rate, setAgent1Rate] = useState(
    initial?.agentPool?.[0]?.pickRate != null ? String(initial.agentPool[0].pickRate) : '',
  )
  const [agent2, setAgent2] = useState(initial?.agentPool?.[1]?.agent ?? '')
  const [agent2Rate, setAgent2Rate] = useState(
    initial?.agentPool?.[1]?.pickRate != null ? String(initial.agentPool[1].pickRate) : '',
  )
  const [agent3, setAgent3] = useState(initial?.agentPool?.[2]?.agent ?? '')
  const [agent3Rate, setAgent3Rate] = useState(
    initial?.agentPool?.[2]?.pickRate != null ? String(initial.agentPool[2].pickRate) : '',
  )
  const [formerTeam, setFormerTeam] = useState(initial?.formerTeam ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [formError, setFormError] = useState<string | null>(null)

  function buildAgentPool() {
    const entries = [
      { agent: agent1.trim(), pickRate: numOrNull(agent1Rate) },
      { agent: agent2.trim(), pickRate: numOrNull(agent2Rate) },
      { agent: agent3.trim(), pickRate: numOrNull(agent3Rate) },
    ].filter((e) => e.agent)
    return entries.length > 0 ? entries : null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!riotId.trim() || !riotTag.trim()) {
      setFormError('Riot ID et tag sont requis.')
      return
    }
    try {
      await onSubmit({
        riotId: riotId.trim(),
        riotTag: riotTag.trim(),
        role: role || null,
        isStarter: isStarter === '' ? null : isStarter === '1',
        currentRank: currentRank || null,
        peakRankCurrent: peakRankCurrent || null,
        peakRankPrev: peakRankPrev || null,
        endRankPrev: endRankPrev || null,
        gamesThisSeason: numOrNull(gamesThisSeason),
        recentWinrate: numOrNull(recentWinrate),
        avgAcs: numOrNull(avgAcs),
        avgKda: numOrNull(avgKda),
        agentPool: buildAgentPool(),
        formerTeam: formerTeam.trim() || null,
        notes: notes.trim() || null,
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Enregistrement échoué')
    }
  }

  const rankSelect = (value: string, onChange: (v: string) => void, label: string) => (
    <label className="block space-y-1">
      <span className="text-sm font-medium">{label}</span>
      <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">— Non renseigné —</option>
        {VALORANT_RANKS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
    </label>
  )

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 p-6">
      {formError && <p className="text-sm text-red-500">{formError}</p>}

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--accent)]">Identité</h2>
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
              required
            />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Rôle</span>
            <select
              className={inputClass}
              value={role}
              onChange={(e) => setRole(e.target.value as ScoutingRole | '')}
            >
              <option value="">— Non renseigné —</option>
              {SCOUTING_ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Statut roster</span>
            <select
              className={inputClass}
              value={isStarter}
              onChange={(e) => setIsStarter(e.target.value)}
            >
              <option value="">Inconnu</option>
              <option value="1">Titulaire</option>
              <option value="0">Remplaçant</option>
            </select>
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--accent)]">Rangs</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {rankSelect(currentRank, setCurrentRank, 'Rang actuel')}
          {rankSelect(peakRankCurrent, setPeakRankCurrent, 'Peak saison en cours')}
          {rankSelect(peakRankPrev, setPeakRankPrev, 'Peak saison précédente')}
          {rankSelect(endRankPrev, setEndRankPrev, 'Rang fin saison précédente')}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--accent)]">
          Stats tracker <span className="font-normal normal-case text-[var(--text-muted)]">(si dispo)</span>
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block space-y-1">
            <span className="text-sm font-medium">Games saison</span>
            <input
              className={inputClass}
              type="number"
              min={0}
              value={gamesThisSeason}
              onChange={(e) => setGamesThisSeason(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Winrate récent %</span>
            <input
              className={inputClass}
              type="number"
              min={0}
              max={100}
              value={recentWinrate}
              onChange={(e) => setRecentWinrate(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">ACS moyen</span>
            <input
              className={inputClass}
              type="number"
              min={0}
              value={avgAcs}
              onChange={(e) => setAvgAcs(e.target.value)}
            />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">KDA moyen</span>
            <input
              className={inputClass}
              type="number"
              min={0}
              step={0.01}
              value={avgKda}
              onChange={(e) => setAvgKda(e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--accent)]">Agent pool</h2>
        {[1, 2, 3].map((i) => {
          const agent = i === 1 ? agent1 : i === 2 ? agent2 : agent3
          const rate = i === 1 ? agent1Rate : i === 2 ? agent2Rate : agent3Rate
          const setAgent = i === 1 ? setAgent1 : i === 2 ? setAgent2 : setAgent3
          const setRate = i === 1 ? setAgent1Rate : i === 2 ? setAgent2Rate : setAgent3Rate
          return (
            <div key={i} className="grid gap-3 sm:grid-cols-[1fr_120px]">
              <input
                className={inputClass}
                value={agent}
                onChange={(e) => setAgent(e.target.value)}
                placeholder={`Agent ${i}`}
              />
              <input
                className={inputClass}
                type="number"
                min={0}
                max={100}
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="% pick"
              />
            </div>
          )
        })}
      </section>

      <section className="space-y-4">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Ancienne structure</span>
          <input
            className={inputClass}
            value={formerTeam}
            onChange={(e) => setFormerTeam(e.target.value)}
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Notes libres</span>
          <textarea
            className={`${inputClass} min-h-[120px]`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={10000}
          />
        </label>
      </section>

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
