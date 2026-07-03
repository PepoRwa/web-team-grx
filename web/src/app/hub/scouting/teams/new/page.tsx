'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { HubShell } from '@/components/hub/hub-shell'
import { ScoutingTeamForm } from '@/components/scouting-team-form'
import { useAuth } from '@/hooks/useAuth'
import {
  ApiError,
  createScoutingTeam,
  linkScoutingTeamToTournament,
  listScoutingTeams,
  type ScoutingTeam,
} from '@/lib/api'

function NewTeamContent() {
  const { session, permissions, loading: authLoading } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const tournamentId = Number(params.get('tournamentId'))
  const [submitting, setSubmitting] = useState(false)
  const [seed, setSeed] = useState('')
  const [linkNotes, setLinkNotes] = useState('')
  const [mode, setMode] = useState<'new' | 'existing'>('new')
  const [existingTeams, setExistingTeams] = useState<ScoutingTeam[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<number | ''>('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
    if (!authLoading && permissions && !permissions.canScout) router.replace('/hub/')
  }, [authLoading, session, permissions, router])

  useEffect(() => {
    if (!session?.access_token || mode !== 'existing') return
    const t = setTimeout(() => {
      listScoutingTeams(session.access_token, search || undefined)
        .then((r) => setExistingTeams(r.teams))
        .catch(() => setExistingTeams([]))
    }, 300)
    return () => clearTimeout(t)
  }, [session?.access_token, search, mode])

  if (authLoading || !session || (permissions && !permissions.canScout)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  const backHref = tournamentId
    ? `/hub/scouting/tournaments/view/?id=${tournamentId}`
    : '/hub/scouting/'

  return (
    <HubShell activeNav="scouting" title="Ajouter équipe" backHref={backHref}>
      <main className="mx-auto max-w-2xl space-y-4 px-4 py-6">
        {tournamentId > 0 && (
          <div className="flex gap-2">
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                mode === 'new' ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border)]'
              }`}
              onClick={() => setMode('new')}
            >
              Nouvelle équipe
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-medium ${
                mode === 'existing'
                  ? 'bg-[var(--accent)] text-white'
                  : 'border border-[var(--border)]'
              }`}
              onClick={() => setMode('existing')}
            >
              Équipe existante
            </button>
          </div>
        )}

        {mode === 'existing' && tournamentId > 0 ? (
          <div className="card space-y-4 p-6">
            <input
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
              placeholder="Rechercher une équipe…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Choisir…</option>
              {existingTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.tag ? ` [${t.tag}]` : ''}
                </option>
              ))}
            </select>
            <input
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm"
              placeholder="Seed / poule"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
            />
            <button
              type="button"
              className="btn-primary"
              disabled={submitting || !selectedTeamId}
              onClick={async () => {
                if (!session.access_token || !selectedTeamId) return
                setSubmitting(true)
                try {
                  const { team } = await linkScoutingTeamToTournament(
                    session.access_token,
                    tournamentId,
                    {
                      teamId: selectedTeamId,
                      seed: seed || null,
                      linkNotes: linkNotes || null,
                    },
                  )
                  router.push(
                    `/hub/scouting/teams/view/?id=${team.id}&tournamentId=${tournamentId}`,
                  )
                } catch (err) {
                  alert(err instanceof ApiError ? err.message : 'Liaison échouée')
                } finally {
                  setSubmitting(false)
                }
              }}
            >
              Lier au tournoi
            </button>
          </div>
        ) : (
          <ScoutingTeamForm
            submitting={submitting}
            showLinkFields={tournamentId > 0}
            seed={seed}
            linkNotes={linkNotes}
            onSeedChange={setSeed}
            onLinkNotesChange={setLinkNotes}
            onCancel={() => router.push(backHref)}
            onSubmit={async (data) => {
              if (!session.access_token) return
              setSubmitting(true)
              try {
                if (tournamentId > 0) {
                  const { team } = await linkScoutingTeamToTournament(
                    session.access_token,
                    tournamentId,
                    { ...data, seed: seed || null, linkNotes: linkNotes || null },
                  )
                  router.push(
                    `/hub/scouting/teams/view/?id=${team.id}&tournamentId=${tournamentId}`,
                  )
                } else {
                  const { team } = await createScoutingTeam(session.access_token, data)
                  router.push(`/hub/scouting/teams/view/?id=${team.id}`)
                }
              } catch (err) {
                throw err instanceof ApiError ? err : new Error('Création échouée')
              } finally {
                setSubmitting(false)
              }
            }}
          />
        )}
      </main>
    </HubShell>
  )
}

export default function NewScoutingTeamPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
        </div>
      }
    >
      <NewTeamContent />
    </Suspense>
  )
}
