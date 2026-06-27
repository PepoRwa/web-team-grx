'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { Megaphone } from 'lucide-react'
import { AnnouncementCard } from '@/components/announcement-card'
import { HubShell } from '@/components/hub/hub-shell'
import { useAuth } from '@/hooks/useAuth'
import { ApiError, listAnnouncements, markAnnouncementRead, type SiteAnnouncement } from '@/lib/api'

export default function AnnouncementsPage() {
  const { session, loading: authLoading } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<SiteAnnouncement[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [markingId, setMarkingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !session) router.replace('/')
  }, [authLoading, session, router])

  const load = useCallback(async () => {
    if (!session?.access_token) return
    setLoading(true)
    try {
      const data = await listAnnouncements(session.access_token)
      setItems(data.announcements)
      setUnreadCount(data.unreadCount)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erreur chargement')
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  useEffect(() => {
    if (!authLoading && session?.access_token) void load()
  }, [load, authLoading, session?.access_token])

  async function handleMarkRead(id: number) {
    if (!session?.access_token) return
    setMarkingId(id)
    try {
      await markAnnouncementRead(session.access_token, id)
      setItems((prev) => prev.map((a) => (a.id === id ? { ...a, isRead: true } : a)))
      setUnreadCount((c) => Math.max(0, c - 1))
    } finally {
      setMarkingId(null)
    }
  }

  if (authLoading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-pulse rounded-full bg-lavender/40" />
      </div>
    )
  }

  return (
    <HubShell
      activeNav="announcements"
      title="Annonces"
      subtitle={unreadCount ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'À jour'}
    >
      <main className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:py-8">
        {error && <p className="text-sm text-red-500">{error}</p>}
        {loading ? (
          <div className="card h-48 animate-pulse bg-[var(--accent-soft)]/30" />
        ) : items.length === 0 ? (
          <div className="card p-12 text-center">
            <Megaphone className="mx-auto text-[var(--text-muted)]" size={40} />
            <p className="mt-4 font-medium">Aucune annonce pour l&apos;instant</p>
          </div>
        ) : (
          items.map((a) => (
            <AnnouncementCard
              key={a.id}
              announcement={a}
              onMarkRead={handleMarkRead}
              marking={markingId === a.id}
            />
          ))
        )}
      </main>
    </HubShell>
  )
}
