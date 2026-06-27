import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { Profile } from '@/lib/api'
import { gameBadgeClass, gameLabel, trackerDisplayUrl } from '@/lib/profiles'

interface ProfileCardProps {
  profile: Profile
  href: string
  highlight?: boolean
}

export function ProfileCard({ profile, href, highlight }: ProfileCardProps) {
  const avatar =
    profile.avatarUrl ?? 'https://cdn.discordapp.com/embed/avatars/0.png'
  const name = profile.publicName ?? profile.username ?? 'Membre'

  return (
    <Link
      href={href}
      className={`card block overflow-hidden transition hover:-translate-y-0.5 ${highlight ? 'ring-2 ring-[var(--accent)]' : ''}`}
    >
      <div className="h-12 bg-gradient-to-r from-lavender/30 via-mint/20 to-rose/20" />
      <div className="px-5 pb-5">
        <div className="-mt-7 flex items-end gap-3">
          <Image src={avatar} alt="" width={56} height={56} className="rounded-2xl ring-4 ring-[var(--bg-elevated)]" unoptimized />
          <div className="min-w-0 flex-1 pb-1">
            <p className="truncate font-semibold">{name}</p>
            {profile.username && profile.publicName && profile.publicName !== profile.username && (
              <p className="truncate text-xs text-[var(--text-muted)]">@{profile.username}</p>
            )}
          </div>
        </div>
        <span className={`badge mt-3 ${gameBadgeClass(profile.game)}`}>{gameLabel(profile.game)}</span>
        {profile.roles.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {profile.roles.slice(0, 3).map((r) => (
              <span key={r.roleId} className="badge badge-lavender text-[10px]">
                {r.name}
              </span>
            ))}
            {profile.roles.length > 3 && (
              <span className="text-xs text-[var(--text-muted)]">+{profile.roles.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}

interface ProfileDetailProps {
  profile: Profile
  isOwn?: boolean
}

export function ProfileDetail({ profile, isOwn }: ProfileDetailProps) {
  const avatar =
    profile.avatarUrl ?? 'https://cdn.discordapp.com/embed/avatars/0.png'
  const name = profile.publicName ?? profile.username ?? 'Membre'

  return (
    <div className="card overflow-hidden">
      <div className="h-20 bg-gradient-to-r from-lavender/35 via-mint/25 to-rose/25" />
      <div className="px-6 pb-6">
        <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end">
          <Image src={avatar} alt="" width={88} height={88} className="rounded-2xl ring-4 ring-[var(--bg-elevated)]" unoptimized />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold">{name}</h1>
              {isOwn && <span className="badge badge-mint">Toi</span>}
              <span className={`badge ${gameBadgeClass(profile.game)}`}>{gameLabel(profile.game)}</span>
            </div>
            {profile.username && (
              <p className="mt-1 text-sm text-[var(--text-muted)]">Discord : {profile.username}</p>
            )}
            {profile.twitchUsername && (
              <p className="mt-1 text-sm">
                Twitch :{' '}
                <a
                  href={`https://twitch.tv/${profile.twitchUsername}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent)] hover:underline"
                >
                  {profile.twitchUsername}
                </a>
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.roles.map((r) => (
                <span key={r.roleId} className="badge badge-lavender">
                  {r.name}
                </span>
              ))}
            </div>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 rounded-xl bg-[var(--accent-soft)]/30 p-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-[var(--text-muted)]">Riot ID</dt>
          <dd className="mt-1 text-sm">{profile.riotId ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-[var(--text-muted)]">Steam</dt>
          <dd className="mt-1 text-sm">{profile.steamId ?? '—'}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-xs font-medium text-[var(--text-muted)]">Tracker</dt>
          <dd className="mt-1 text-sm">
            {profile.trackerUrl ? (
              <a
                href={profile.trackerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[var(--accent)] hover:underline"
              >
                {trackerDisplayUrl(profile.trackerUrl)}
                <ExternalLink size={12} />
              </a>
            ) : (
              '—'
            )}
          </dd>
        </div>
        </dl>

        {isOwn && (
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            Twitch : lie via <code className="rounded bg-[var(--accent-soft)] px-1">/link-twitch</code> sur Discord.
          </p>
        )}
      </div>
    </div>
  )
}
