'use client'

import { useState } from 'react'
import type { Profile, Vod, VodInput, VodStatus } from '@/lib/api'
import { VALORANT_MAPS } from '@/lib/vods'

interface VodFormProps {
  initial?: Vod
  profiles: Profile[]
  submitting: boolean
  onSubmit: (data: VodInput) => Promise<void>
  onCancel: () => void
  onDelete?: () => Promise<void>
}

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]'

export function VodForm({
  initial,
  profiles,
  submitting,
  onSubmit,
  onCancel,
  onDelete,
}: VodFormProps) {
  const matchDateRaw = initial?.matchDate
    ? String(initial.matchDate).slice(0, 10)
    : new Date().toISOString().slice(0, 10)

  const [title, setTitle] = useState(initial?.title ?? '')
  const [link, setLink] = useState(initial?.link ?? '')
  const [map, setMap] = useState(initial?.map ?? 'Ascent')
  const [matchDate, setMatchDate] = useState(matchDateRaw)
  const [status, setStatus] = useState<VodStatus>(initial?.status ?? 'win')
  const [score, setScore] = useState(initial?.score ?? '')
  const [opponent, setOpponent] = useState(initial?.opponent ?? '')
  const [isPro, setIsPro] = useState(initial?.isPro ?? false)
  const [descriptionPro, setDescriptionPro] = useState(initial?.descriptionPro ?? '')
  const [playersPresent, setPlayersPresent] = useState<string[]>(initial?.playersPresent ?? [])
  const [notifyDiscord, setNotifyDiscord] = useState(initial?.notifyDiscord ?? false)
  const [formError, setFormError] = useState<string | null>(null)

  function togglePlayer(discordId: string) {
    setPlayersPresent((prev) =>
      prev.includes(discordId) ? prev.filter((id) => id !== discordId) : [...prev, discordId],
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!title.trim() || !link.trim() || !score.trim()) {
      setFormError('Titre, lien et score sont requis.')
      return
    }
    try {
      await onSubmit({
        title: title.trim(),
        link: link.trim(),
        map,
        matchDate,
        status,
        score: score.trim(),
        opponent: opponent.trim() || null,
        isPro,
        descriptionPro: descriptionPro.trim() || null,
        playersPresent,
        notifyDiscord,
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Enregistrement échoué')
    }
  }

  const rosterProfiles = profiles.filter((p) => p.username)

  return (
    <form onSubmit={handleSubmit} className="card space-y-5 p-6">
      {formError && <p className="text-sm text-red-500">{formError}</p>}

      <label className="block space-y-1">
        <span className="text-sm font-medium">Titre</span>
        <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
      </label>

      <label className="block space-y-1">
        <span className="text-sm font-medium">Lien replay</span>
        <input className={inputClass} type="url" value={link} onChange={(e) => setLink(e.target.value)} required />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Map</span>
          <select className={inputClass} value={map} onChange={(e) => setMap(e.target.value)}>
            {VALORANT_MAPS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Date du match</span>
          <input className={inputClass} type="date" value={matchDate} onChange={(e) => setMatchDate(e.target.value)} required />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Résultat</span>
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as VodStatus)}>
            <option value="win">Victoire</option>
            <option value="loss">Défaite</option>
            <option value="draw">Nul</option>
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Score</span>
          <input className={inputClass} value={score} onChange={(e) => setScore(e.target.value)} placeholder="13-7" maxLength={20} required />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Adversaire</span>
          <input className={inputClass} value={opponent} onChange={(e) => setOpponent(e.target.value)} maxLength={100} />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isPro} onChange={(e) => setIsPro(e.target.checked)} />
        VOD Pro (librairie séparée)
      </label>

      {isPro && (
        <label className="block space-y-1">
          <span className="text-sm font-medium">Description pro</span>
          <textarea className={inputClass} rows={3} value={descriptionPro} onChange={(e) => setDescriptionPro(e.target.value)} />
        </label>
      )}

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Joueurs présents</legend>
        {rosterProfiles.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            Aucun membre sync — les joueurs doivent se connecter au site une fois pour apparaître ici.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {rosterProfiles.map((p) => (
              <label
                key={p.discordId}
                className={`cursor-pointer rounded-full border px-3 py-1 text-sm transition ${
                  playersPresent.includes(p.discordId)
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'border-[var(--border)]'
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={playersPresent.includes(p.discordId)}
                  onChange={() => togglePlayer(p.discordId)}
                />
                {p.username}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      {!isPro && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={notifyDiscord} onChange={(e) => setNotifyDiscord(e.target.checked)} />
          Notifier le channel Discord VOD
        </label>
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {initial ? 'Enregistrer' : 'Ajouter la VOD'}
        </button>
        <button type="button" className="btn-ghost" onClick={onCancel} disabled={submitting}>
          Annuler
        </button>
        {onDelete && (
          <button
            type="button"
            className="btn-ghost ml-auto text-red-500"
            disabled={submitting}
            onClick={() => void onDelete()}
          >
            Supprimer
          </button>
        )}
      </div>
    </form>
  )
}
