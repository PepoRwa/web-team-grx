'use client'

import { useState } from 'react'
import type { Profile, ProfileGame, ProfileUpdate } from '@/lib/api'

interface ProfileFormProps {
  initial: Profile
  submitting: boolean
  onSubmit: (data: ProfileUpdate) => Promise<void>
}

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]'

export function ProfileForm({ initial, submitting, onSubmit }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(initial.displayName ?? initial.publicName ?? '')
  const [trackerUrl, setTrackerUrl] = useState(initial.trackerUrl ?? '')
  const [riotId, setRiotId] = useState(initial.riotId ?? '')
  const [steamId, setSteamId] = useState(initial.steamId ?? '')
  const [game, setGame] = useState<ProfileGame>(initial.game ?? 'valorant')
  const [notifyVodDm, setNotifyVodDm] = useState(initial.notifyVodDm)
  const [notifyStratDm, setNotifyStratDm] = useState(initial.notifyStratDm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setSaved(false)
    try {
      await onSubmit({
        displayName: displayName.trim() || null,
        trackerUrl: trackerUrl.trim() || null,
        riotId: riotId.trim() || null,
        steamId: steamId.trim() || null,
        game,
        notifyVodDm,
        notifyStratDm,
      })
      setSaved(true)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Enregistrement échoué')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5 p-6">
      {formError && <p className="text-sm text-red-500">{formError}</p>}
      {saved && <p className="text-sm text-emerald-600">Profil enregistré.</p>}

      <label className="block space-y-1">
        <span className="text-sm font-medium">Pseudo d&apos;affichage</span>
        <input
          className={inputClass}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Crazzynel"
          maxLength={50}
        />
        <span className="text-xs text-[var(--text-muted)]">
          Visible sur le site et les annonces (Discord : {initial.username ?? '—'})
        </span>
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Jeu principal</span>
        <select className={inputClass} value={game} onChange={(e) => setGame(e.target.value as ProfileGame)}>
          <option value="valorant">Valorant</option>
          <option value="cs2">CS2</option>
          <option value="other">Autre</option>
        </select>
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Riot ID</span>
        <input
          className={inputClass}
          value={riotId}
          onChange={(e) => setRiotId(e.target.value)}
          placeholder="Pseudo#TAG"
          maxLength={50}
        />
        <span className="text-xs text-[var(--text-muted)]">Valorant — format Riot ID complet</span>
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Steam ID / lien profil</span>
        <input
          className={inputClass}
          value={steamId}
          onChange={(e) => setSteamId(e.target.value)}
          placeholder="steamcommunity.com/… ou Steam ID"
          maxLength={50}
        />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Tracker.gg</span>
        <input
          className={inputClass}
          type="text"
          inputMode="url"
          value={trackerUrl}
          onChange={(e) => setTrackerUrl(e.target.value)}
          placeholder="https://tracker.gg/valorant/profile/…"
          maxLength={255}
        />
      </label>

      <fieldset className="space-y-3 border-t border-[var(--border)] pt-5">
        <legend className="text-sm font-medium">Notifications Discord (DM bot)</legend>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={notifyVodDm} onChange={(e) => setNotifyVodDm(e.target.checked)} />
          DM quand une nouvelle VOD est postée
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={notifyStratDm} onChange={(e) => setNotifyStratDm(e.target.checked)} />
          DM quand une nouvelle strat est publiée
        </label>
      </fieldset>

      <button type="submit" className="btn-primary" disabled={submitting}>
        Enregistrer mon profil
      </button>
    </form>
  )
}
