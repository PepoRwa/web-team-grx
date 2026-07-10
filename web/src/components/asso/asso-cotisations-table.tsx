'use client'

import { Fragment, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  cotisationStatusBadgeClass,
  cotisationStatusLabels,
  cotisationTypeLabels,
} from '@/lib/asso-cotisation-labels'
import {
  requiresCotisationExemptionJustification,
  validateCotisationExemptionClient,
} from '@/lib/asso-cotisation-rules'
import {
  updateAssoCotisation,
  type AssoCotisationStatus,
  type AssoCotisationType,
  type CotisationRow,
} from '@/lib/api'

const inputClass =
  'w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] px-2 py-1.5 text-sm outline-none focus:border-[var(--accent)]'

interface AssoCotisationsTableProps {
  accessToken: string
  rows: CotisationRow[]
  canEdit: boolean
  onChanged: () => void
}

type Draft = {
  cotisationType: AssoCotisationType
  cotisationStatus: AssoCotisationStatus
  exemptionRef: string
  exemptionNote: string
}

function rowToDraft(row: CotisationRow): Draft {
  return {
    cotisationType: row.cotisationType,
    cotisationStatus: row.cotisationStatus,
    exemptionRef: row.cotisationExemptionRef ?? '',
    exemptionNote: row.cotisationExemptionNote ?? '',
  }
}

export function AssoCotisationsTable({
  accessToken,
  rows,
  canEdit,
  onChanged,
}: AssoCotisationsTableProps) {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [drafts, setDrafts] = useState<Record<number, Draft>>({})

  useEffect(() => {
    const next: Record<number, Draft> = {}
    for (const row of rows) {
      next[row.id] = rowToDraft(row)
    }
    setDrafts(next)
  }, [rows])

  function showMessage(type: 'success' | 'error', text: string) {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  function setDraft(id: number, patch: Partial<Draft>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id]!, ...patch } }))
  }

  async function saveRow(id: number) {
    const draft = drafts[id]
    if (!draft) return

    const validationError = validateCotisationExemptionClient(
      draft.cotisationType,
      draft.exemptionRef,
      draft.exemptionNote,
    )
    if (validationError) {
      showMessage('error', validationError)
      return
    }

    setSavingId(id)
    try {
      await updateAssoCotisation(accessToken, id, {
        cotisationType: draft.cotisationType,
        cotisationStatus: draft.cotisationStatus,
        cotisationExemptionRef: draft.exemptionRef.trim() || null,
        cotisationExemptionNote: draft.exemptionNote.trim() || null,
      })
      showMessage('success', 'Cotisation mise à jour.')
      onChanged()
    } catch (err) {
      showMessage('error', err instanceof Error ? err.message : 'Mise à jour impossible.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-[var(--border)] px-4 py-3">
        <h3 className="font-semibold">Détail par adhérent</h3>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Cotisation partielle ou dispensée : n° de délibération bureau <strong>ou</strong>{' '}
          engagement sur l&apos;honneur d&apos;un membre du staff + motifs.
        </p>
      </div>

      {message && (
        <div
          className={`mx-4 mt-4 rounded-xl border px-3 py-2 text-sm ${
            message.type === 'success'
              ? 'border-mint/40 bg-mint/15'
              : 'border-rose/40 bg-rose/10 text-rose'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-muted)]">
              <th className="px-4 py-2 font-medium">Adhérent</th>
              <th className="px-4 py-2 font-medium">Statut membre</th>
              <th className="px-4 py-2 font-medium">Type</th>
              <th className="px-4 py-2 font-medium">Cotisation</th>
              {canEdit && <th className="px-4 py-2 font-medium" />}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 5 : 4} className="px-4 py-10 text-center text-[var(--text-muted)]">
                  Aucun dossier adhérent.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const draft = drafts[row.id] ?? rowToDraft(row)
                const needsExemption = requiresCotisationExemptionJustification(draft.cotisationType)
                const dirty =
                  draft.cotisationType !== row.cotisationType ||
                  draft.cotisationStatus !== row.cotisationStatus ||
                  draft.exemptionRef !== (row.cotisationExemptionRef ?? '') ||
                  draft.exemptionNote !== (row.cotisationExemptionNote ?? '')

                return (
                  <Fragment key={row.id}>
                    <tr className="border-b border-[var(--border)]">
                      <td className="px-4 py-3">
                        <div className="font-medium">{row.pseudo}</div>
                        <div className="text-xs text-[var(--text-muted)]">
                          {row.firstName} {row.lastName}
                        </div>
                      </td>
                      <td className="px-4 py-3 capitalize">{row.memberStatus}</td>
                      <td className="px-4 py-3">
                        {canEdit ? (
                          <select
                            className={inputClass}
                            value={draft.cotisationType}
                            disabled={savingId === row.id}
                            onChange={(e) =>
                              setDraft(row.id, {
                                cotisationType: e.target.value as AssoCotisationType,
                              })
                            }
                          >
                            {Object.entries(cotisationTypeLabels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          cotisationTypeLabels[row.cotisationType]
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {canEdit ? (
                          <select
                            className={inputClass}
                            value={draft.cotisationStatus}
                            disabled={savingId === row.id}
                            onChange={(e) =>
                              setDraft(row.id, {
                                cotisationStatus: e.target.value as AssoCotisationStatus,
                              })
                            }
                          >
                            {Object.entries(cotisationStatusLabels).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className={`badge ${cotisationStatusBadgeClass[row.cotisationStatus]}`}>
                            {cotisationStatusLabels[row.cotisationStatus]}
                          </span>
                        )}
                      </td>
                      {canEdit && (
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className="btn-primary text-xs"
                            disabled={savingId === row.id || !dirty}
                            onClick={() => void saveRow(row.id)}
                          >
                            {savingId === row.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Enregistrer'
                            )}
                          </button>
                        </td>
                      )}
                    </tr>
                    {needsExemption && (
                      <tr className="border-b border-[var(--border)] bg-[var(--bg)]/60">
                        <td colSpan={canEdit ? 5 : 4} className="px-4 py-3">
                          <div className="grid gap-3 sm:grid-cols-2">
                            <label className="flex flex-col gap-1 text-xs">
                              <span className="text-[var(--text-muted)]">
                                N° délibération bureau
                              </span>
                              {canEdit ? (
                                <input
                                  className={inputClass}
                                  value={draft.exemptionRef}
                                  disabled={savingId === row.id}
                                  placeholder="Ex. DELIB-2026-03"
                                  onChange={(e) =>
                                    setDraft(row.id, { exemptionRef: e.target.value })
                                  }
                                />
                              ) : (
                                <span>{row.cotisationExemptionRef ?? '—'}</span>
                              )}
                            </label>
                            <label className="flex flex-col gap-1 text-xs sm:col-span-2">
                              <span className="text-[var(--text-muted)]">
                                Engagement staff sur l&apos;honneur + motifs
                              </span>
                              {canEdit ? (
                                <textarea
                                  className={`${inputClass} min-h-[72px] resize-y`}
                                  value={draft.exemptionNote}
                                  disabled={savingId === row.id}
                                  placeholder="Membre staff, date, raison de la dispense ou du montant partiel…"
                                  onChange={(e) =>
                                    setDraft(row.id, { exemptionNote: e.target.value })
                                  }
                                />
                              ) : (
                                <span className="whitespace-pre-wrap">
                                  {row.cotisationExemptionNote ?? '—'}
                                </span>
                              )}
                            </label>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
