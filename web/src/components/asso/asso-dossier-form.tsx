'use client'

import { useState } from 'react'
import type { AssoDossierInput, AssoLinkCandidate } from '@/lib/api'
import { LinkCandidatePicker } from '@/components/asso/link-candidate-picker'

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]'

interface AssoDossierFormProps {
  accessToken: string
  submitting: boolean
  onSubmit: (data: AssoDossierInput) => Promise<void>
}

export function AssoDossierForm({ accessToken, submitting, onSubmit }: AssoDossierFormProps) {
  const [selected, setSelected] = useState<AssoLinkCandidate | null>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [assoTracker, setAssoTracker] = useState('')
  const [riotId, setRiotId] = useState('')
  const [siteAccess, setSiteAccess] = useState(true)
  const [formError, setFormError] = useState<string | null>(null)

  function applyCandidate(c: AssoLinkCandidate | null) {
    setSelected(c)
    if (!c) return
    if (c.displayName && !pseudo) setPseudo(c.displayName)
    if (c.username && !pseudo) setPseudo(c.username)
    if (c.email) setEmail(c.email)
    if (c.riotId) setRiotId(c.riotId)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (firstName.trim().length < 1 || lastName.trim().length < 1 || pseudo.trim().length < 1) {
      setFormError('Prénom, nom et pseudo sont requis.')
      return
    }

    if (
      selected?.teamTrackerUrl &&
      assoTracker.trim() &&
      assoTracker.trim() === selected.teamTrackerUrl.trim()
    ) {
      setFormError(
        'Le tracker asso doit être différent du tracker profil team (ou laissez vide).',
      )
      return
    }

    try {
      await onSubmit({
        discordId: selected?.discordId ?? null,
        siteAccess: selected ? siteAccess : false,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        pseudo: pseudo.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        trackerUrl: assoTracker.trim() || null,
        riotId: riotId.trim() || null,
        discordPseudo: selected?.username ?? null,
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Enregistrement échoué')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 p-6">
      {formError && <p className="text-sm text-red-500">{formError}</p>}

      <LinkCandidatePicker
        accessToken={accessToken}
        selectedDiscordId={selected?.discordId ?? null}
        onSelect={applyCandidate}
      />

      {selected && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={siteAccess}
            onChange={(e) => setSiteAccess(e.target.checked)}
          />
          Activer l&apos;accès module asso pour ce compte
        </label>
      )}

      {selected?.teamTrackerUrl && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text-muted)]">
          <span className="font-medium text-[var(--text)]">Tracker team (lecture seule) :</span>{' '}
          <a
            href={selected.teamTrackerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] underline"
          >
            {selected.teamTrackerUrl}
          </a>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block space-y-1">
          <span className="text-sm font-medium">Prénom</span>
          <input className={inputClass} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Nom</span>
          <input className={inputClass} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </label>
        <label className="block space-y-1 sm:col-span-2">
          <span className="text-sm font-medium">Pseudo asso</span>
          <input className={inputClass} value={pseudo} onChange={(e) => setPseudo(e.target.value)} required />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Email</span>
          <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Téléphone</span>
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Riot ID</span>
          <input className={inputClass} value={riotId} onChange={(e) => setRiotId(e.target.value)} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Tracker asso</span>
          <input
            className={inputClass}
            type="url"
            value={assoTracker}
            onChange={(e) => setAssoTracker(e.target.value)}
            placeholder="https://tracker.gg/…"
          />
          <span className="text-xs text-[var(--text-muted)]">
            Distinct du tracker profil team — ne pas dupliquer.
          </span>
        </label>
      </div>

      <button type="submit" className="btn-primary" disabled={submitting}>
        {submitting ? 'Création…' : 'Créer le dossier'}
      </button>
    </form>
  )
}
