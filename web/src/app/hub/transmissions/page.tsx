'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { HubShell } from '@/components/hub/hub-shell'
import { useAuth } from '@/hooks/useAuth'
import {
  ApiError,
  listTransmissionChannels,
  sendTransmission,
  type TransmissionChannel,
  type TransmissionTarget,
} from '@/lib/api'

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]'

export default function TransmissionsPage() {
  const { session, permissions, loading: authLoading } = useAuth()
  const router = useRouter()
  const [channels, setChannels] = useState<TransmissionChannel[]>([])
  const [target, setTarget] = useState<TransmissionTarget>('site')
  const [channelKey, setChannelKey] = useState('')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [featured, setFeatured] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
    if (!authLoading && permissions && !permissions.canTransmit) router.replace('/hub/')
  }, [authLoading, session, permissions, router])

  useEffect(() => {
    if (!session?.access_token) return
    listTransmissionChannels(session.access_token)
      .then((r) => {
        setChannels(r.channels)
        if (r.channels[0]) setChannelKey(r.channels[0].key)
      })
      .catch(() => setChannels([]))
  }, [session?.access_token])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      if (!session?.access_token) return
      setSubmitting(true)
      setError(null)
      setSuccess(null)
      try {
        const res = await sendTransmission(session.access_token, {
          target,
          channelKey: target === 'site' ? undefined : channelKey,
          title: title.trim(),
          body,
          featured: target !== 'discord' ? featured : false,
        })
        const parts = []
        if (res.discord) parts.push('Discord')
        if (res.site) parts.push('Site')
        setSuccess(`Envoyé : ${parts.join(' + ')}`)
        setTitle('')
        setBody('')
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Envoi échoué')
      } finally {
        setSubmitting(false)
      }
    },
    [session?.access_token, target, channelKey, title, body],
  )

  if (authLoading || !session || !permissions?.canTransmit) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  return (
    <HubShell activeNav="hub" title="Transmissions" subtitle="CEO / Team Manager" backHref="/hub/">
      <main className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
        <form onSubmit={handleSubmit} className="card space-y-5 p-6">
          <p className="text-sm text-[var(--text-muted)]">
            Deux canaux distincts : <strong>Discord</strong> (embed channel, style annonce) et{' '}
            <strong>Site</strong> (carte avec avatar, pseudo d&apos;affichage, badge rôle, titre + corps).
          </p>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Destination</legend>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['site', 'Site uniquement'],
                  ['discord', 'Discord uniquement'],
                  ['both', 'Les deux'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm ${
                    target === key ? 'bg-[var(--accent)] text-white' : 'border border-[var(--border)]'
                  }`}
                  onClick={() => setTarget(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>

          {(target === 'discord' || target === 'both') && (
            <label className="block space-y-1">
              <span className="text-sm font-medium">Channel Discord</span>
              <select className={inputClass} value={channelKey} onChange={(e) => setChannelKey(e.target.value)}>
                {channels.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="block space-y-1">
            <span className="text-sm font-medium">Titre (H1)</span>
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
          </label>

          <label className="block space-y-1">
            <span className="text-sm font-medium">Message</span>
            <textarea
              className={inputClass}
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              placeholder="Corps du message — casse et retours à la ligne conservés."
            />
          </label>

          {(target === 'site' || target === 'both') && (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] bg-[var(--accent-soft)]/30 p-4">
              <input
                type="checkbox"
                className="mt-1"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
              />
              <span>
                <span className="text-sm font-semibold">Premier plan à la connexion</span>
                <span className="mt-1 block text-xs text-[var(--text-muted)]">
                  Popup plein écran obligatoire — le membre doit « Marquer comme lu » avant d&apos;accéder au hub.
                </span>
              </span>
            </label>
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-emerald-600">{success}</p>}

          <button type="submit" className="btn-primary" disabled={submitting}>
            Envoyer la transmission
          </button>
        </form>

        <p className="mt-4 text-center text-sm">
          <Link href="/hub/announcements/" className="text-[var(--accent)] hover:underline">
            Voir le fil d&apos;annonces site
          </Link>
        </p>
      </main>
    </HubShell>
  )
}
