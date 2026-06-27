'use client'

import Image from 'next/image'
import type { SiteAnnouncement } from '@/lib/api'
import { formatDateTime } from '@/lib/format'

interface AnnouncementCardProps {
  announcement: SiteAnnouncement
  onMarkRead?: (id: number) => void
  marking?: boolean
}

export function AnnouncementCard({ announcement, onMarkRead, marking }: AnnouncementCardProps) {
  const avatar =
    announcement.authorAvatarUrl ?? 'https://cdn.discordapp.com/embed/avatars/0.png'

  return (
    <article
      className={`card overflow-hidden transition ${!announcement.isRead ? 'ring-2 ring-[var(--accent)]/40' : ''}`}
    >
      <div className="h-1.5" style={{ background: announcement.authorRoleColor }} />
      <div className="p-6">
        <div className="flex gap-4">
          <Image
            src={avatar}
            alt=""
            width={52}
            height={52}
            className="rounded-2xl ring-2 ring-white/50"
            unoptimized
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold">{announcement.authorDisplayName}</span>
              <span
                className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
                style={{
                  background: `${announcement.authorRoleColor}66`,
                  color: 'var(--text)',
                }}
              >
                {announcement.authorRoleLabel}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-[var(--text-muted)]">
              {formatDateTime(announcement.createdAt)}
            </p>
          </div>
        </div>

        <h2 className="mt-5 text-xl font-bold tracking-tight">{announcement.title}</h2>
        <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{announcement.body}</div>

        {!announcement.isRead && onMarkRead && (
          <button
            type="button"
            className="featured-read-btn mt-5 text-sm"
            disabled={marking}
            onClick={() => onMarkRead(announcement.id)}
          >
            {marking ? 'Enregistrement…' : 'Marquer comme lu'}
          </button>
        )}
        {announcement.isFeatured && (
          <span className="badge badge-gold mt-3 inline-flex">Premier plan</span>
        )}
      </div>
    </article>
  )
}
