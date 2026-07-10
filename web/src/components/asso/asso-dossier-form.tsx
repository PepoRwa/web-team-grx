'use client'

import { useEffect, useState } from 'react'
import type { AssoDossier, AssoDossierInput, AssoLinkCandidate } from '@/lib/api'
import { LinkCandidatePicker } from '@/components/asso/link-candidate-picker'
import {
  AssoDossierEnrichment,
  CHARTE_VERSION,
  type DossierEnrichmentValues,
} from '@/components/asso/asso-dossier-enrichment'
import {
  requiresLegalGuardian,
  validateStructureRoles,
} from '@/lib/asso-dossier-rules'

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]'

interface AssoDossierFormProps {
  accessToken: string
  submitting: boolean
  mode?: 'create' | 'edit'
  initial?: AssoDossier
  onSubmit: (data: AssoDossierInput) => Promise<void>
  onCancel?: () => void
}

export function AssoDossierForm({
  accessToken,
  submitting,
  mode = 'create',
  initial,
  onSubmit,
  onCancel,
}: AssoDossierFormProps) {
  const isEdit = mode === 'edit'
  const charteAlreadyAccepted = Boolean(initial?.charteAcceptedAt)

  const [selected, setSelected] = useState<AssoLinkCandidate | null>(null)
  const [firstName, setFirstName] = useState(initial?.firstName ?? '')
  const [lastName, setLastName] = useState(initial?.lastName ?? '')
  const [pseudo, setPseudo] = useState(initial?.pseudo ?? '')
  const [email, setEmail] = useState(initial?.email ?? '')
  const [phone, setPhone] = useState(initial?.phone ?? '')
  const [assoTracker, setAssoTracker] = useState(initial?.trackerUrl ?? '')
  const [riotId, setRiotId] = useState(initial?.riotId ?? '')
  const [dateOfBirth, setDateOfBirth] = useState(initial?.dateOfBirth ?? '')
  const [birthPlace, setBirthPlace] = useState(initial?.birthPlace ?? '')
  const [nationality, setNationality] = useState(initial?.nationality ?? '')
  const [residenceCountry, setResidenceCountry] = useState(initial?.residenceCountry ?? '')
  const [status, setStatus] = useState<'actif' | 'inactif'>(initial?.status ?? 'actif')
  const [joinedAt, setJoinedAt] = useState(initial?.joinedAt ?? '')
  const [siteAccess, setSiteAccess] = useState(initial?.siteAccess ?? true)
  const [enrichment, setEnrichment] = useState<DossierEnrichmentValues>({
    structureRoles: initial?.structureRoles ?? [],
    charteAccepted: charteAlreadyAccepted,
    charteVersion: initial?.charteVersion ?? CHARTE_VERSION,
    legalGuardian: initial?.legalGuardian ?? null,
  })
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    if (!initial) return
    setFirstName(initial.firstName)
    setLastName(initial.lastName)
    setPseudo(initial.pseudo)
    setEmail(initial.email ?? '')
    setPhone(initial.phone ?? '')
    setAssoTracker(initial.trackerUrl ?? '')
    setRiotId(initial.riotId ?? '')
    setDateOfBirth(initial.dateOfBirth ?? '')
    setBirthPlace(initial.birthPlace ?? '')
    setNationality(initial.nationality ?? '')
    setResidenceCountry(initial.residenceCountry ?? '')
    setStatus(initial.status)
    setJoinedAt(initial.joinedAt)
    setSiteAccess(initial.siteAccess)
    setEnrichment({
      structureRoles: initial.structureRoles ?? [],
      charteAccepted: Boolean(initial.charteAcceptedAt),
      charteVersion: initial.charteVersion ?? CHARTE_VERSION,
      legalGuardian: initial.legalGuardian ?? null,
    })
  }, [initial])

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

    const teamTracker = initial?.teamTrackerUrl ?? selected?.teamTrackerUrl
    if (teamTracker && assoTracker.trim() && assoTracker.trim() === teamTracker.trim()) {
      setFormError(
        'Le tracker asso doit être différent du tracker profil team (ou laissez vide).',
      )
      return
    }

    const roleError = validateStructureRoles(enrichment.structureRoles)
    if (roleError) {
      setFormError(roleError)
      return
    }

    if (!isEdit && !enrichment.charteAccepted) {
      setFormError("L'acceptation de la charte est obligatoire.")
      return
    }

    if (requiresLegalGuardian(dateOfBirth)) {
      const g = enrichment.legalGuardian
      if (!g?.firstName || !g.lastName || !g.email || !g.phone) {
        setFormError('Autorisation parentale incomplète (mineur < 16 ans).')
        return
      }
    }

    try {
      await onSubmit({
        discordId: isEdit ? undefined : selected?.discordId ?? null,
        siteAccess: isEdit ? siteAccess : selected ? siteAccess : false,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        pseudo: pseudo.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        trackerUrl: assoTracker.trim() || null,
        riotId: riotId.trim() || null,
        discordPseudo: isEdit ? undefined : selected?.username ?? null,
        dateOfBirth: dateOfBirth || null,
        birthPlace: birthPlace.trim() || null,
        nationality: nationality.trim() || null,
        residenceCountry: residenceCountry.trim() || null,
        structureRoles: enrichment.structureRoles,
        charteAccepted: !isEdit || !charteAlreadyAccepted ? enrichment.charteAccepted : undefined,
        charteVersion: enrichment.charteVersion,
        legalGuardian: requiresLegalGuardian(dateOfBirth) ? enrichment.legalGuardian : null,
        status: isEdit ? status : undefined,
        joinedAt: isEdit && joinedAt ? joinedAt : undefined,
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Enregistrement échoué')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-6 p-6">
      {formError && <p className="text-sm text-red-500">{formError}</p>}

      {!isEdit && (
        <>
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
        </>
      )}

      {isEdit && initial?.teamTrackerUrl && (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-xs text-[var(--text-muted)]">
          Tracker team lié :{' '}
          <a href={initial.teamTrackerUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] underline">
            {initial.teamTrackerUrl}
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
          <span className="text-sm font-medium">Date de naissance</span>
          <input type="date" className={inputClass} value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Lieu de naissance</span>
          <input className={inputClass} value={birthPlace} onChange={(e) => setBirthPlace(e.target.value)} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Nationalité</span>
          <input className={inputClass} value={nationality} onChange={(e) => setNationality(e.target.value)} />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Pays de résidence</span>
          <input className={inputClass} value={residenceCountry} onChange={(e) => setResidenceCountry(e.target.value)} />
        </label>
        {isEdit && (
          <>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Statut adhérent</span>
              <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as 'actif' | 'inactif')}>
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium">Date d&apos;adhésion</span>
              <input type="date" className={inputClass} value={joinedAt} onChange={(e) => setJoinedAt(e.target.value)} />
            </label>
            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" checked={siteAccess} onChange={(e) => setSiteAccess(e.target.checked)} />
              Accès module asso activé
            </label>
          </>
        )}
        <label className="block space-y-1 sm:col-span-2">
          <span className="text-sm font-medium">Tracker asso</span>
          <input
            className={inputClass}
            type="text"
            inputMode="url"
            value={assoTracker}
            onChange={(e) => setAssoTracker(e.target.value)}
            placeholder="https://tracker.gg/… (optionnel)"
          />
          <span className="text-xs text-[var(--text-muted)]">
            Distinct du tracker profil team — laissez vide si non applicable.
          </span>
        </label>
      </div>

      <AssoDossierEnrichment
        dateOfBirth={dateOfBirth}
        values={enrichment}
        onChange={setEnrichment}
        charteReadOnly={isEdit && charteAlreadyAccepted}
      />

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer le dossier'}
        </button>
        {onCancel && (
          <button type="button" className="btn-ghost" disabled={submitting} onClick={onCancel}>
            Annuler
          </button>
        )}
      </div>
    </form>
  )
}
