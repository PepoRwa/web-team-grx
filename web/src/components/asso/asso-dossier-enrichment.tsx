'use client'

import { useMemo, useState } from 'react'
import type { LegalGuardian, PlayerDivision, StructureRole, StructureRoleKind } from '@/lib/api'
import {
  playerDivisionLabels,
  structureRoleKindLabels,
} from '@/lib/asso-module-labels'
import { requiresLegalGuardian } from '@/lib/asso-dossier-rules'

const CHARTE_VERSION = '2025-2026'
const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]'

const emptyGuardian = (): LegalGuardian => ({
  firstName: '',
  lastName: '',
  relation: '',
  phone: '',
  email: '',
})

export interface DossierEnrichmentValues {
  structureRoles: StructureRole[]
  charteAccepted: boolean
  charteVersion: string
  legalGuardian: LegalGuardian | null
}

interface AssoDossierEnrichmentProps {
  dateOfBirth: string
  values: DossierEnrichmentValues
  onChange: (values: DossierEnrichmentValues) => void
  /** Charte déjà signée — affichage lecture seule en édition */
  charteReadOnly?: boolean
}

export function AssoDossierEnrichment({
  dateOfBirth,
  values,
  onChange,
  charteReadOnly = false,
}: AssoDossierEnrichmentProps) {
  const [roles, setRoles] = useState({
    joueur: values.structureRoles.some((r) => r.kind === 'joueur'),
    joueurDivision:
      values.structureRoles.find((r) => r.kind === 'joueur')?.division ?? ('' as PlayerDivision | ''),
    staffSportif: values.structureRoles.some((r) => r.kind === 'staff_sportif'),
    staffSportifFn:
      values.structureRoles.find((r) => r.kind === 'staff_sportif')?.function ?? '',
    staffCom: values.structureRoles.some((r) => r.kind === 'staff_com'),
    staffComFn: values.structureRoles.find((r) => r.kind === 'staff_com')?.function ?? '',
    medias: values.structureRoles.some((r) => r.kind === 'medias'),
    mediasFn: values.structureRoles.find((r) => r.kind === 'medias')?.function ?? '',
    autre: values.structureRoles.some((r) => r.kind === 'autre'),
    autreLabel: values.structureRoles.find((r) => r.kind === 'autre')?.label ?? '',
  })

  const needsGuardian = useMemo(() => requiresLegalGuardian(dateOfBirth), [dateOfBirth])
  const guardian = values.legalGuardian ?? emptyGuardian()

  function buildStructureRolesFromState(state: typeof roles): StructureRole[] {
    const list: StructureRole[] = []
    if (state.joueur && state.joueurDivision) {
      list.push({ kind: 'joueur', division: state.joueurDivision })
    }
    if (state.staffSportif && state.staffSportifFn.trim()) {
      list.push({ kind: 'staff_sportif', function: state.staffSportifFn.trim() })
    }
    if (state.staffCom && state.staffComFn.trim()) {
      list.push({ kind: 'staff_com', function: state.staffComFn.trim() })
    }
    if (state.medias && state.mediasFn.trim()) {
      list.push({ kind: 'medias', function: state.mediasFn.trim() })
    }
    if (state.autre && state.autreLabel.trim()) {
      list.push({ kind: 'autre', label: state.autreLabel.trim() })
    }
    return list
  }

  function emit(patch: Partial<DossierEnrichmentValues>) {
    onChange({ ...values, ...patch })
  }

  function syncRoles(next: typeof roles) {
    setRoles(next)
    emit({ structureRoles: buildStructureRolesFromState(next) })
  }

  function toggleRole(kind: StructureRoleKind, checked: boolean) {
    const next = { ...roles }
    if (kind === 'joueur') next.joueur = checked
    if (kind === 'staff_sportif') next.staffSportif = checked
    if (kind === 'staff_com') next.staffCom = checked
    if (kind === 'medias') next.medias = checked
    if (kind === 'autre') next.autre = checked
    syncRoles(next)
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Rôles au sein de la structure</h3>
        <div className="rounded-xl border border-[var(--border)] p-4 space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={roles.joueur}
              onChange={(e) => toggleRole('joueur', e.target.checked)}
            />
            {structureRoleKindLabels.joueur}
          </label>
          {roles.joueur && (
            <select
              className={inputClass}
              value={roles.joueurDivision}
              onChange={(e) =>
                syncRoles({
                  ...roles,
                  joueurDivision: e.target.value as PlayerDivision,
                })
              }
            >
              <option value="">Choisir une division…</option>
              {Object.entries(playerDivisionLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          )}
        </div>

        {(['staff_sportif', 'staff_com', 'medias'] as const).map((kind) => {
          const key =
            kind === 'staff_sportif' ? 'staffSportif' : kind === 'staff_com' ? 'staffCom' : 'medias'
          const fnKey = `${key}Fn` as 'staffSportifFn' | 'staffComFn' | 'mediasFn'
          return (
            <div key={kind} className="rounded-xl border border-[var(--border)] p-4 space-y-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={roles[key]}
                  onChange={(e) => toggleRole(kind, e.target.checked)}
                />
                {structureRoleKindLabels[kind]}
              </label>
              {roles[key] && (
                <input
                  className={inputClass}
                  placeholder="Fonction"
                  value={roles[fnKey]}
                  onChange={(e) =>
                    syncRoles({ ...roles, [fnKey]: e.target.value } as typeof roles)
                  }
                />
              )}
            </div>
          )
        })}

        <div className="rounded-xl border border-[var(--border)] p-4 space-y-2">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={roles.autre}
              onChange={(e) => toggleRole('autre', e.target.checked)}
            />
            {structureRoleKindLabels.autre}
          </label>
          {roles.autre && (
            <input
              className={inputClass}
              placeholder="Libellé"
              value={roles.autreLabel}
              onChange={(e) => syncRoles({ ...roles, autreLabel: e.target.value })}
            />
          )}
        </div>
      </section>

      <section className="space-y-2">
        {charteReadOnly ? (
          <p className="text-sm text-[var(--text-muted)]">
            Charte acceptée ({values.charteVersion ?? CHARTE_VERSION})
            {values.charteAccepted ? ' ✓' : ''}
          </p>
        ) : (
          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={values.charteAccepted}
              onChange={(e) =>
                emit({
                  charteAccepted: e.target.checked,
                  charteVersion: e.target.checked ? CHARTE_VERSION : values.charteVersion,
                })
              }
            />
            <span>
              J&apos;accepte la charte Gowrax ({CHARTE_VERSION}) et le règlement intérieur de
              l&apos;association.
            </span>
          </label>
        )}
      </section>

      {needsGuardian && (
        <section className="space-y-3 rounded-xl border border-gold/30 bg-gold/5 p-4">
          <h3 className="text-sm font-semibold">Autorisation parentale (mineur &lt; 16 ans)</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              className={inputClass}
              placeholder="Prénom représentant"
              value={guardian.firstName}
              onChange={(e) =>
                emit({ legalGuardian: { ...guardian, firstName: e.target.value } })
              }
            />
            <input
              className={inputClass}
              placeholder="Nom représentant"
              value={guardian.lastName}
              onChange={(e) => emit({ legalGuardian: { ...guardian, lastName: e.target.value } })}
            />
            <input
              className={inputClass}
              placeholder="Lien de parenté"
              value={guardian.relation}
              onChange={(e) => emit({ legalGuardian: { ...guardian, relation: e.target.value } })}
            />
            <input
              className={inputClass}
              placeholder="Téléphone"
              value={guardian.phone}
              onChange={(e) => emit({ legalGuardian: { ...guardian, phone: e.target.value } })}
            />
            <input
              className={`${inputClass} sm:col-span-2`}
              type="email"
              placeholder="Email"
              value={guardian.email}
              onChange={(e) => emit({ legalGuardian: { ...guardian, email: e.target.value } })}
            />
          </div>
        </section>
      )}
    </div>
  )
}

export { CHARTE_VERSION }
