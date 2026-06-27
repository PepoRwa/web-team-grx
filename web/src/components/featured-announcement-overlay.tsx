'use client'

import Image from 'next/image'
import { Sparkles } from 'lucide-react'
import type { SiteAnnouncement } from '@/lib/api'
import { formatDateTime } from '@/lib/format'

interface FeaturedAnnouncementOverlayProps {
  announcement: SiteAnnouncement
  index: number
  total: number
  marking: boolean
  onMarkRead: () => void
}

export function FeaturedAnnouncementOverlay({
  announcement,
  index,
  total,
  marking,
  onMarkRead,
}: FeaturedAnnouncementOverlayProps) {
  const avatar =
    announcement.authorAvatarUrl ?? 'https://cdn.discordapp.com/embed/avatars/0.png'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-[var(--bg)]/90 backdrop-blur-md" aria-hidden />

      <div className="relative flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl">
        <div
          className="h-2 shrink-0"
          style={{ background: announcement.authorRoleColor }}
        />

        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border)] px-6 py-3">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
            <Sparkles size={14} />
            Annonce importante
          </span>
          {total > 1 && (
            <span className="text-xs text-[var(--text-muted)]">
              {index + 1} / {total}
            </span>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          <div className="flex gap-4">
            <Image
              src={avatar}
              alt=""
              width={56}
              height={56}
              className="shrink-0 rounded-2xl ring-2 ring-white/60"
              unoptimized
            />
            <div className="min-w-0">
              <p className="text-lg font-bold">{announcement.authorDisplayName}</p>
              <span
                className="mt-1 inline-block rounded-full px-3 py-0.5 text-xs font-semibold"
                style={{
                  background: `${announcement.authorRoleColor}88`,
                  color: 'var(--text)',
                }}
              >
                {announcement.authorRoleLabel}
              </span>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {formatDateTime(announcement.createdAt)}
              </p>
            </div>
          </div>

          <h1 className="mt-8 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">
            {announcement.title}
          </h1>
          <div className="mt-5 whitespace-pre-wrap text-base leading-relaxed text-[var(--text)]">
            {announcement.body}
          </div>
        </div>

        <div className="shrink-0 border-t border-[var(--border)] bg-[var(--bg)]/50 p-6">
          <button
            type="button"
            className="featured-read-btn w-full"
            disabled={marking}
            onClick={onMarkRead}
          >
            {marking ? 'Enregistrement…' : 'Marquer comme lu'}
          </button>
          <p className="mt-3 text-center text-xs text-[var(--text-muted)]">
            Tu dois confirmer la lecture pour accéder au hub.
          </p>
        </div>
      </div>
    </div>
  )
}
