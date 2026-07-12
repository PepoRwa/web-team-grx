'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Crown, Trash2 } from 'lucide-react'
import {
  ApiError,
  listProfiles,
  listRosterCaptains,
  removeRosterCaptain,
  setRosterCaptain,
  type Profile,
  type RosterCaptain,
  type RosterCaptainTarget,
} from '@/lib/api'
import { TARGET_ROSTERS } from '@/lib/tryouts'

interface RosterCaptainsPanelProps {
  accessToken: string
}

export function RosterCaptainsPanel({ accessToken }: RosterCaptainsPanelProps) {
  const [captains, setCaptains] = useState<RosterCaptain[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selections, setSelections] = useState<Record<RosterCaptainTarget, string>>({
    high_roster: '',
    game_changers: '',
    high_roster_cs2: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [capRes, profRes] = await Promise.all([
        listRosterCaptains(accessToken),
        listProfiles(accessToken),
      ])
      setCaptains(capRes.captains)
      setProfiles(profRes.profiles)
      const next: Record<RosterCaptainTarget, string> = {
        high_roster: '',
        game_changers: '',
        high_roster_cs2: '',
      }
      for (const c of capRes.captains) {
        next[c.targetRoster] = c.discordId
      }
      setSelections(next)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Chargement impossible')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSave(targetRoster: RosterCaptainTarget) {
    const discordId = selections[targetRoster]
    if (!discordId) return
    setSaving(true)
    setError(null)
    try {
      const res = await setRosterCaptain(accessToken, { targetRoster, discordId })
      setCaptains(res.captains)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enregistrement échoué')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove(targetRoster: RosterCaptainTarget) {
    setSaving(true)
    setError(null)
    try {
      const res = await removeRosterCaptain(accessToken, targetRoster)
      setCaptains(res.captains)
      setSelections((s) => ({ ...s, [targetRoster]: '' }))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Suppression échouée')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="card h-40 animate-pulse bg-[var(--accent-soft)]/30" />
  }

  return (
    <div className="card space-y-6 p-6">
      <div>
        <h2 className="flex items-center gap-2 font-semibold">
          <Crown size={18} className="text-[var(--color-gold)]" />
          Capitaines par roster
        </h2>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Chaque capitaine accède aux tryouts de son roster en lecture seule. Pense à prévenir le
          joueur par DM Discord (non automatique depuis le site).
        </p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="space-y-4">
        {TARGET_ROSTERS.map(({ value, label }) => {
          const current = captains.find((c) => c.targetRoster === value)
          return (
            <div
              key={value}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg)]/50 p-4"
            >
              <p className="text-sm font-medium">{label}</p>
              {current && (
                <div className="mt-2 flex items-center gap-2 text-sm text-[var(--text-muted)]">
                  {current.avatarUrl && (
                    <Image
                      src={current.avatarUrl}
                      alt=""
                      width={24}
                      height={24}
                      className="rounded-full"
                      unoptimized
                    />
                  )}
                  <span>
                    Actuel : <strong>{current.publicName ?? current.username ?? current.discordId}</strong>
                  </span>
                </div>
              )}
              <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-sm"
                  value={selections[value]}
                  onChange={(e) =>
                    setSelections((s) => ({ ...s, [value]: e.target.value }))
                  }
                >
                  <option value="">Choisir un joueur…</option>
                  {profiles.map((p) => (
                    <option key={p.discordId} value={p.discordId}>
                      {p.publicName ?? p.username ?? p.discordId}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-primary text-sm"
                  disabled={saving || !selections[value]}
                  onClick={() => void handleSave(value)}
                >
                  Définir
                </button>
                {current && (
                  <button
                    type="button"
                    className="btn-ghost text-sm text-red-500"
                    disabled={saving}
                    onClick={() => void handleRemove(value)}
                  >
                    <Trash2 size={14} />
                    Retirer
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
