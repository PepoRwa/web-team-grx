'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { ExternalLink, Film } from 'lucide-react'
import { HubShell } from '@/components/hub/hub-shell'
import { TryoutEvaluationForm } from '@/components/tryout-evaluation-form'
import { TryoutReadonlyBanner } from '@/components/tryout-readonly-banner'
import { TryoutSessionForm } from '@/components/tryout-session-form'
import { useAuth } from '@/hooks/useAuth'
import {
  ApiError,
  createTryoutEvaluation,
  createTryoutSession,
  getTryoutCandidate,
  type TryoutCandidate,
} from '@/lib/api'
import { roleLabel } from '@/lib/scouting'
import {
  candidateDisplayName,
  pipelineBadgeClass,
  pipelineLabel,
  recommendationLabel,
  sessionOutcomeLabel,
} from '@/lib/tryouts'
import { formatMatchDate } from '@/lib/format'

function CandidateViewContent() {
  const { session, permissions, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const id = Number(params.get('id'))
  const campaignId = Number(params.get('campaignId'))
  const [candidate, setCandidate] = useState<TryoutCandidate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showSessionForm, setShowSessionForm] = useState(false)
  const [showEvalForm, setShowEvalForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const canWrite = Boolean(permissions?.canTryoutWrite)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
    if (!authLoading && permissions && !permissions.canTryoutRead) router.replace('/hub/')
  }, [authLoading, session, permissions, router])

  const load = useCallback(async () => {
    if (!session?.access_token || !id) return
    setLoading(true)
    setError(null)
    try {
      const data = await getTryoutCandidate(
        session.access_token,
        id,
        campaignId || undefined,
      )
      setCandidate(data.candidate)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Candidat introuvable')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, id, campaignId])

  useEffect(() => {
    if (!authLoading && session?.access_token && permissions?.canTryoutRead && id) void load()
  }, [load, authLoading, session?.access_token, permissions?.canTryoutRead, id])

  const backHref = campaignId
    ? `/hub/tryouts/campaigns/view/?id=${campaignId}`
    : '/hub/tryouts/'

  if (authLoading || !session || (permissions && !permissions.canTryoutRead)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  return (
    <HubShell
      activeNav="tryouts"
      title={candidate ? candidateDisplayName(candidate) : 'Candidat'}
      backHref={backHref}
    >
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-6">
        <TryoutReadonlyBanner show={!canWrite} />

        {loading ? (
          <div className="card h-40 animate-pulse bg-lavender/10" />
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : candidate ? (
          <>
            <section className="card space-y-4 p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold">{candidateDisplayName(candidate)}</h1>
                  <p className="text-sm text-[var(--text-muted)]">
                    {candidate.riotId}#{candidate.riotTag}
                  </p>
                  {candidate.status && (
                    <span className={`badge mt-2 ${pipelineBadgeClass(candidate.status)}`}>
                      {pipelineLabel(candidate.status)}
                    </span>
                  )}
                </div>
                {canWrite && (
                  <Link
                    href={`/hub/tryouts/candidates/edit/?id=${candidate.id}&campaignId=${campaignId || candidate.campaignId}`}
                    className="btn-ghost text-sm"
                  >
                    Modifier
                  </Link>
                )}
              </div>

              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[var(--text-muted)]">Rôle</dt>
                  <dd className="font-medium">{roleLabel(candidate.role)}</dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">Rang</dt>
                  <dd className="font-medium">{candidate.currentRank ?? '—'}</dd>
                </div>
                {candidate.trackerUrl && (
                  <div className="sm:col-span-2">
                    <dt className="text-[var(--text-muted)]">Tracker</dt>
                    <dd>
                      <a
                        href={candidate.trackerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[var(--accent)]"
                      >
                        Voir le profil <ExternalLink size={14} />
                      </a>
                    </dd>
                  </div>
                )}
              </dl>

              {canWrite && candidate.notes && (
                <div className="rounded-xl bg-[var(--accent-soft)]/20 p-3 text-sm">
                  <p className="text-xs font-semibold uppercase text-[var(--text-muted)]">
                    Notes staff
                  </p>
                  <p className="mt-1">{candidate.notes}</p>
                </div>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Sessions</h2>
                {canWrite && !showSessionForm && (
                  <button
                    type="button"
                    className="btn-ghost text-sm"
                    onClick={() => setShowSessionForm(true)}
                  >
                    + Session
                  </button>
                )}
              </div>

              {showSessionForm && session?.access_token && (
                <TryoutSessionForm
                  campaignId={campaignId || candidate.campaignId!}
                  accessToken={session.access_token}
                  submitting={submitting}
                  onCancel={() => setShowSessionForm(false)}
                  onSubmit={async (data) => {
                    setSubmitting(true)
                    try {
                      await createTryoutSession(session.access_token!, id, data)
                      setShowSessionForm(false)
                      await load()
                    } finally {
                      setSubmitting(false)
                    }
                  }}
                />
              )}

              {!candidate.sessions?.length ? (
                <p className="text-sm text-[var(--text-muted)]">Aucune session enregistrée.</p>
              ) : (
                <ul className="space-y-2">
                  {candidate.sessions.map((s) => (
                    <li key={s.id} className="card p-4 text-sm">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium capitalize">{s.sessionType}</span>
                        <span className="badge badge-lavender">
                          {sessionOutcomeLabel(s.outcome)}
                        </span>
                      </div>
                      {s.scheduledAt && (
                        <p className="mt-1 text-[var(--text-muted)]">
                          {formatMatchDate(s.scheduledAt.slice(0, 10))}
                          {s.map && ` · ${s.map}`}
                        </p>
                      )}
                      {s.notes && <p className="mt-2">{s.notes}</p>}
                      {s.vodId && (
                        <Link
                          href={`/hub/vods/view/?id=${s.vodId}`}
                          className="mt-2 inline-flex items-center gap-1 text-[var(--accent)]"
                        >
                          <Film size={14} /> Voir la VOD
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Évaluations staff</h2>
                {canWrite && !showEvalForm && (
                  <button
                    type="button"
                    className="btn-ghost text-sm"
                    onClick={() => setShowEvalForm(true)}
                  >
                    + Évaluation
                  </button>
                )}
              </div>

              {canWrite && showEvalForm && (
                <TryoutEvaluationForm
                  submitting={submitting}
                  onCancel={() => setShowEvalForm(false)}
                  onSubmit={async (data) => {
                    setSubmitting(true)
                    try {
                      await createTryoutEvaluation(session!.access_token!, id, data)
                      setShowEvalForm(false)
                      await load()
                    } finally {
                      setSubmitting(false)
                    }
                  }}
                />
              )}

              {!canWrite ? (
                <p className="text-sm text-[var(--text-muted)]">
                  {(candidate.evaluationCount ?? 0) > 0
                    ? `${candidate.evaluationCount} évaluation(s) staff — réservé au coaching staff.`
                    : 'Aucune évaluation staff.'}
                </p>
              ) : !candidate.evaluations?.length ? (
                <p className="text-sm text-[var(--text-muted)]">Aucune évaluation.</p>
              ) : (
                <ul className="space-y-2">
                  {candidate.evaluations.map((ev) => (
                    <li key={ev.id} className="card p-4 text-sm">
                      <p className="font-medium">{recommendationLabel(ev.recommendation)}</p>
                      {ev.scores && (
                        <p className="mt-1 text-[var(--text-muted)]">
                          {Object.entries(ev.scores)
                            .map(([k, v]) => `${k}: ${v}/5`)
                            .join(' · ')}
                        </p>
                      )}
                      {ev.comment && <p className="mt-2">{ev.comment}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </main>
    </HubShell>
  )
}

export default function TryoutCandidateViewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
        </div>
      }
    >
      <CandidateViewContent />
    </Suspense>
  )
}
