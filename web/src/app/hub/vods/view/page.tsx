'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'
import { ExternalLink, Lock, MessageSquare, Pencil, Send } from 'lucide-react'
import { HubShell } from '@/components/hub/hub-shell'
import { VodPlayers } from '@/components/vod-players'
import { useAuth } from '@/hooks/useAuth'
import {
  ApiError,
  addVodComment,
  getVod,
  getVodComments,
  type Vod,
  type VodComment,
} from '@/lib/api'
import { formatDateTime, formatMatchDate, statusBadgeClass, statusLabel } from '@/lib/format'

function VodViewContent() {
  const searchParams = useSearchParams()
  const id = Number(searchParams.get('id'))
  const { session, user, permissions, loading: authLoading } = useAuth()
  const router = useRouter()

  const [vod, setVod] = useState<Vod | null>(null)
  const [comments, setComments] = useState<VodComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
  }, [authLoading, session, router])

  const load = useCallback(async () => {
    if (!session?.access_token || !Number.isFinite(id) || id < 1) return
    setLoading(true)
    setError(null)
    try {
      const [vodRes, commentsRes] = await Promise.all([
        getVod(session.access_token, id),
        getVodComments(session.access_token, id),
      ])
      setVod(vodRes.vod)
      setComments(commentsRes.comments)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'VOD introuvable')
      setVod(null)
    } finally {
      setLoading(false)
    }
  }, [session?.access_token, id])

  useEffect(() => {
    if (!authLoading && session?.access_token) void load()
  }, [load, authLoading, session?.access_token])

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    if (!session?.access_token || !commentText.trim()) return
    setSubmitting(true)
    try {
      const res = await addVodComment(session.access_token, id, commentText.trim(), isPrivate)
      setComments(res.comments)
      setCommentText('')
      setIsPrivate(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Envoi du commentaire échoué')
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  if (!Number.isFinite(id) || id < 1) {
    return (
      <HubShell activeNav="vods" title="VOD" backHref="/hub/vods/">
        <main className="mx-auto max-w-3xl px-4 py-12 text-center">
          <p className="text-[var(--text-muted)]">ID de VOD invalide.</p>
          <Link href="/hub/vods/" className="btn-primary mt-6 inline-flex">
            Retour à la liste
          </Link>
        </main>
      </HubShell>
    )
  }

  return (
    <HubShell
      activeNav="vods"
      title={vod?.title ?? 'VOD'}
      backHref="/hub/vods/"
    >
      <main className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
        {loading ? (
          <div className="card h-64 animate-pulse bg-[var(--accent-soft)]/30" />
        ) : error && !vod ? (
          <div className="card p-8 text-center">
            <p className="text-red-500">{error}</p>
            <Link href="/hub/vods/" className="btn-primary mt-6 inline-flex">
              Retour
            </Link>
          </div>
        ) : vod ? (
          <>
            <section className="card p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  <span className={`badge ${statusBadgeClass(vod.status)}`}>
                    {statusLabel(vod.status)}
                  </span>
                  {vod.isPro && <span className="badge badge-gold">Pro</span>}
                  <span className="badge badge-lavender">{vod.map}</span>
                </div>
                {(permissions?.isStaff || vod.authorDiscordId === user?.discordId) && (
                  <Link
                    href={`/hub/vods/edit/?id=${vod.id}`}
                    className="btn-ghost text-sm"
                  >
                    <Pencil size={14} />
                    Modifier
                  </Link>
                )}
              </div>

              <h1 className="mt-4 text-2xl font-bold">{vod.title}</h1>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                {formatMatchDate(vod.matchDate)} · {vod.score}
                {vod.opponent ? ` · vs ${vod.opponent}` : ''}
              </p>
              {vod.authorUsername && (
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Ajouté par {vod.authorUsername}
                </p>
              )}

              {vod.descriptionPro && (
                <p className="mt-4 rounded-xl bg-[var(--accent-soft)]/50 p-4 text-sm">
                  {vod.descriptionPro}
                </p>
              )}

              <VodPlayers
                players={
                  vod.players?.length
                    ? vod.players
                    : vod.playersPresent.map((discordId) => ({ discordId, username: null }))
                }
              />

              <a
                href={vod.link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary mt-6 inline-flex"
              >
                <ExternalLink size={18} />
                Ouvrir le replay
              </a>
            </section>

            <section className="card mt-6 p-6">
              <h2 className="flex items-center gap-2 font-semibold">
                <MessageSquare size={18} />
                Débrief staff
                <span className="text-sm font-normal text-[var(--text-muted)]">
                  ({comments.length})
                </span>
              </h2>

              {comments.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--text-muted)]">
                  Aucun commentaire pour l&apos;instant.
                </p>
              ) : (
                <ul className="mt-4 space-y-4">
                  {comments.map((c) => (
                    <li
                      key={c.id}
                      className="rounded-xl border border-[var(--border)] p-4"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
                        <span>{c.authorUsername ?? 'Staff'}</span>
                        <span className="flex items-center gap-2">
                          {c.isPrivate && (
                            <span className="badge badge-lavender inline-flex items-center gap-1">
                              <Lock size={10} />
                              Privé
                            </span>
                          )}
                          {formatDateTime(c.createdAt)}
                        </span>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm">{c.content}</p>
                    </li>
                  ))}
                </ul>
              )}

              {permissions?.isStaff && (
                <form onSubmit={handleComment} className="mt-6 space-y-3 border-t border-[var(--border)] pt-6">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Note de débrief (staff)…"
                    rows={3}
                    maxLength={5000}
                    className="w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-sm outline-none focus:border-[var(--accent)]"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                      <input
                        type="checkbox"
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                      />
                      Commentaire privé (staff only)
                    </label>
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={submitting || !commentText.trim()}
                    >
                      <Send size={16} />
                      Publier
                    </button>
                  </div>
                </form>
              )}
            </section>
          </>
        ) : null}
      </main>
    </HubShell>
  )
}

export default function VodViewPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
        </div>
      }
    >
      <VodViewContent />
    </Suspense>
  )
}
