'use client'

import Image from 'next/image'
import { ExternalLink, PartyPopper, Sparkles } from 'lucide-react'
import type { ProfileGame } from '@/lib/api'
import { gameBadgeClass, gameLabel, trackerDisplayUrl } from '@/lib/profiles'

interface OnboardingProfilePreviewProps {
  displayName: string
  username: string | null
  avatarUrl: string
  game: ProfileGame
  riotId: string
  steamId: string
  trackerUrl: string
  roles: { roleId: string; name: string }[]
}

export function OnboardingProfilePreview({
  displayName,
  username,
  avatarUrl,
  game,
  riotId,
  steamId,
  trackerUrl,
  roles,
}: OnboardingProfilePreviewProps) {
  const tracker = trackerUrl.trim()
  const showDiscordHandle = Boolean(username && username !== displayName.trim())

  return (
    <div className="text-center">
      <div className="onboarding-tada-title relative inline-flex items-center justify-center gap-2">
        <PartyPopper size={22} className="onboarding-tada-sparkle text-[var(--accent)]" />
        <h2 className="text-2xl font-bold tracking-tight">Tadaaaa !</h2>
        <Sparkles size={20} className="onboarding-tada-sparkle text-[var(--color-mint-dark)] [animation-delay:0.35s]" />
      </div>
      <p className="onboarding-tada-title mt-2 text-sm text-[var(--text-muted)] [animation-delay:0.08s]">
        Voilà comment tu apparaîtras sur le hub Gowrax
      </p>

      <div className="onboarding-tada-card mx-auto mt-6 max-w-sm text-left">
        <div className="card overflow-hidden ring-2 ring-[var(--accent)]/30">
          <div className="h-16 bg-gradient-to-r from-lavender/40 via-mint/30 to-rose/30" />
          <div className="px-5 pb-5">
            <div className="-mt-9 flex items-end gap-3">
              <Image
                src={avatarUrl}
                alt=""
                width={72}
                height={72}
                className="rounded-2xl ring-4 ring-[var(--bg-elevated)]"
                unoptimized
              />
              <div className="min-w-0 flex-1 pb-1">
                <p className="truncate text-lg font-bold">{displayName.trim()}</p>
                {showDiscordHandle && (
                  <p className="truncate text-xs text-[var(--text-muted)]">@{username}</p>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="badge badge-mint">Nouveau membre</span>
              <span className={`badge ${gameBadgeClass(game)}`}>{gameLabel(game)}</span>
            </div>

            {roles.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {roles.slice(0, 4).map((r) => (
                  <span key={r.roleId} className="badge badge-lavender text-[10px]">
                    {r.name}
                  </span>
                ))}
                {roles.length > 4 && (
                  <span className="text-xs text-[var(--text-muted)]">+{roles.length - 4}</span>
                )}
              </div>
            )}

            {(riotId.trim() || steamId.trim() || tracker) && (
              <dl className="mt-4 space-y-2 rounded-xl bg-[var(--accent-soft)]/35 p-3 text-sm">
                {game === 'valorant' && riotId.trim() && (
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Riot ID
                    </dt>
                    <dd className="mt-0.5 font-medium">{riotId.trim()}</dd>
                  </div>
                )}
                {game === 'cs2' && steamId.trim() && (
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Steam
                    </dt>
                    <dd className="mt-0.5 truncate font-medium">{steamId.trim()}</dd>
                  </div>
                )}
                {tracker && (
                  <div>
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                      Tracker
                    </dt>
                    <dd className="mt-0.5 inline-flex items-center gap-1 font-medium text-[var(--accent)]">
                      {trackerDisplayUrl(tracker) ?? tracker}
                      <ExternalLink size={12} />
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        </div>
      </div>

      <p className="onboarding-tada-title mt-4 text-xs text-[var(--text-muted)] [animation-delay:0.2s]">
        Tu pourras modifier tout ça depuis{' '}
        <span className="font-medium text-[var(--text)]">Mon profil</span> à tout moment.
      </p>
    </div>
  )
}
