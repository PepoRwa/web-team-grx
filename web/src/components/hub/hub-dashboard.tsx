'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import {
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronRight,
  Film,
  Megaphone,
  Plus,
  Radio,
  Sparkles,
  Target,
  User,
  Users,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import {
  getSeasonBanner,
  listAnnouncements,
  listProfiles,
  listStrats,
  listVods,
  type SeasonBanner,
  type SiteAnnouncement,
  type Vod,
} from '@/lib/api'
import { formatMatchDate, statusBadgeClass, statusLabel } from '@/lib/format'
import { hubGreeting, relativeTime } from '@/lib/greeting'
import { gameBadgeClass, gameLabel } from '@/lib/profiles'
import type { LucideIcon } from 'lucide-react'

interface DashboardStats {
  vodsTotal: number
  stratsTotal: number
  membersTotal: number
  unreadAnnouncements: number
  recentVods: Vod[]
  recentAnnouncements: SiteAnnouncement[]
  seasonBanner: SeasonBanner | null
}

const EMPTY_STATS: DashboardStats = {
  vodsTotal: 0,
  stratsTotal: 0,
  membersTotal: 0,
  unreadAnnouncements: 0,
  recentVods: [],
  recentAnnouncements: [],
  seasonBanner: null,
}

interface HubModule {
  icon: LucideIcon
  title: string
  desc: string
  href: string
  gradient: string
  stat?: string
  badge?: number
  staffOnly?: boolean
}

export function HubDashboard() {
  const { session, user, permissions } = useAuth()
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!session?.access_token) return
    setLoading(true)
    try {
      const [vodsRes, stratsRes, announcementsRes, profilesRes, seasonRes] = await Promise.all([
        listVods(session.access_token, { page: 1, limit: 4 }),
        listStrats(session.access_token),
        listAnnouncements(session.access_token),
        listProfiles(session.access_token),
        getSeasonBanner(session.access_token).catch(() => ({ banner: null })),
      ])

      setStats({
        vodsTotal: vodsRes.total,
        stratsTotal: stratsRes.strats.length,
        membersTotal: profilesRes.profiles.length,
        unreadAnnouncements: announcementsRes.unreadCount,
        recentVods: vodsRes.items.slice(0, 3),
        recentAnnouncements: announcementsRes.announcements.slice(0, 3),
        seasonBanner: seasonRes.banner,
      })
    } catch {
      setStats(EMPTY_STATS)
    } finally {
      setLoading(false)
    }
  }, [session?.access_token])

  useEffect(() => {
    if (session?.access_token) void load()
  }, [load, session?.access_token])

  const displayName = user?.publicName ?? user?.username ?? 'coach'
  const avatar = user?.avatarUrl ?? 'https://cdn.discordapp.com/embed/avatars/0.png'
  const greeting = hubGreeting()

  const modules: HubModule[] = [
    {
      icon: Film,
      title: 'VODs & Replays',
      desc: 'Scrims, matchs pro, débriefs staff.',
      href: '/hub/vods/',
      gradient: 'from-sky/45 via-lavender/30 to-transparent',
      stat: loading ? '…' : String(stats.vodsTotal),
    },
    {
      icon: BookOpen,
      title: 'Strat-Book',
      desc: 'Tactiques par map, ValoPlant, images.',
      href: '/hub/strats/',
      gradient: 'from-mint/45 via-sky/25 to-transparent',
      stat: loading ? '…' : String(stats.stratsTotal),
    },
    {
      icon: User,
      title: 'Profils',
      desc: 'Riot ID, tracker, rôles synchronisés.',
      href: '/hub/profiles/',
      gradient: 'from-rose/40 via-gold/25 to-transparent',
      stat: loading ? '…' : String(stats.membersTotal),
    },
    {
      icon: Megaphone,
      title: 'Annonces',
      desc: 'News staff, mises à jour équipe.',
      href: '/hub/announcements/',
      gradient: 'from-gold/40 via-coral/30 to-transparent',
      badge: stats.unreadAnnouncements,
    },
    ...(permissions?.canTransmit
      ? [
          {
            icon: Radio,
            title: 'Transmissions',
            desc: 'Diffuser vers Discord & le site.',
            href: '/hub/transmissions/',
            gradient: 'from-lavender/50 via-rose/30 to-transparent',
            staffOnly: true,
          } satisfies HubModule,
        ]
      : []),
  ]

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      {/* Hero */}
      <section className="hub-stagger relative overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--bg-elevated)] p-6 shadow-[var(--shadow)] md:p-8">
        <div className="hub-blob absolute -right-6 -top-8 h-44 w-44 rounded-full bg-lavender/25 blur-2xl" />
        <div className="hub-blob-delayed absolute -bottom-10 left-8 h-36 w-36 rounded-full bg-mint/20 blur-2xl" />
        <div className="hub-blob absolute right-1/3 top-1/2 h-24 w-24 rounded-full bg-rose/15 blur-xl" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
          <div className="relative shrink-0">
            <Image
              src={avatar}
              alt=""
              width={88}
              height={88}
              className="rounded-2xl ring-4 ring-[var(--accent-soft)]"
              unoptimized
            />
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--bg-elevated)] text-base shadow-md">
              ✨
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
              <Sparkles size={14} />
              {greeting}
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight md:text-4xl">
              {displayName}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {user?.game && (
                <span className={`badge ${gameBadgeClass(user.game)}`}>{gameLabel(user.game)}</span>
              )}
              {permissions?.roles.slice(0, 4).map((r) => (
                <span key={r.roleId} className="badge badge-lavender">
                  {r.name}
                </span>
              ))}
              {permissions?.isCaptain && <span className="badge badge-gold">Capitaine</span>}
            </div>
          </div>

          <div className="relative flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
            <Link href="/hub/profiles/me/" className="btn-primary text-sm">
              Mon profil
              <ChevronRight size={16} />
            </Link>
            <Link href="/hub/vods/new/" className="btn-ghost justify-center text-sm">
              <Plus size={16} />
              Ajouter une VOD
            </Link>
          </div>
        </div>
      </section>

      {/* Season banner */}
      {stats.seasonBanner && (
        <section className="hub-stagger mt-6">
          <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-r from-gold/30 via-lavender/25 to-mint/20 p-5 md:p-6">
            <div className="flex gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--bg-elevated)]/80 text-2xl">
                {stats.seasonBanner.icon ?? '🎯'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
                  <Target size={12} />
                  Objectif saison
                </div>
                <h2 className="mt-1 text-lg font-bold">{stats.seasonBanner.title}</h2>
                {stats.seasonBanner.description && (
                  <p className="mt-1 text-sm text-[var(--text-muted)]">{stats.seasonBanner.description}</p>
                )}
                {stats.seasonBanner.deadline && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--text-muted)]">
                    <Calendar size={12} />
                    Échéance : {formatMatchDate(stats.seasonBanner.deadline)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stats */}
      <section className="hub-stagger mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatPill icon={Film} label="VODs" value={loading ? '—' : stats.vodsTotal} href="/hub/vods/" />
        <StatPill icon={BookOpen} label="Strats" value={loading ? '—' : stats.stratsTotal} href="/hub/strats/" />
        <StatPill
          icon={Megaphone}
          label="Non lues"
          value={loading ? '—' : stats.unreadAnnouncements}
          href="/hub/announcements/"
          highlight={stats.unreadAnnouncements > 0}
        />
        <StatPill icon={Users} label="Membres" value={loading ? '—' : stats.membersTotal} href="/hub/profiles/" />
      </section>

      {/* Modules */}
      <section className="hub-stagger mt-8">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-bold">Modules</h2>
            <p className="text-sm text-[var(--text-muted)]">Tout ce dont l&apos;équipe a besoin</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => (
            <Link
              key={mod.title}
              href={mod.href}
              className={`hub-module-card group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-gradient-to-br ${mod.gradient} p-5`}
            >
              <div className="flex items-start justify-between">
                <mod.icon className="text-[var(--accent)]" size={26} />
                <div className="flex items-center gap-2">
                  {mod.badge !== undefined && mod.badge > 0 && (
                    <span className="rounded-full bg-[var(--accent)] px-2 py-0.5 text-xs font-bold text-white">
                      {mod.badge}
                    </span>
                  )}
                  {mod.stat !== undefined && (
                    <span className="hub-stat-value text-2xl font-bold">{mod.stat}</span>
                  )}
                </div>
              </div>
              <h3 className="mt-4 font-semibold">{mod.title}</h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">{mod.desc}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-[var(--accent)] opacity-0 transition group-hover:opacity-100">
                Ouvrir
                <ArrowRight size={14} />
              </span>
              {mod.staffOnly && (
                <span className="absolute right-3 top-3 badge badge-mint text-[10px]">Staff</span>
              )}
            </Link>
          ))}
        </div>
      </section>

      {/* Activity */}
      <section className="hub-stagger mt-8 grid gap-6 lg:grid-cols-2">
        <ActivityBlock
          title="Dernières VODs"
          href="/hub/vods/"
          emptyIcon={Film}
          emptyText="Aucune VOD pour l'instant"
          loading={loading}
          isEmpty={stats.recentVods.length === 0}
        >
          {stats.recentVods.map((vod) => (
            <Link
              key={vod.id}
              href={`/hub/vods/view/?id=${vod.id}`}
              className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/60 p-3 transition hover:border-[var(--accent)] hover:bg-[var(--accent-soft)]/20"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky/30">
                <Film size={18} className="text-[var(--accent)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{vod.title}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {vod.map} · {formatMatchDate(vod.matchDate)}
                </p>
              </div>
              <span className={`badge shrink-0 ${statusBadgeClass(vod.status)}`}>
                {statusLabel(vod.status)}
              </span>
            </Link>
          ))}
        </ActivityBlock>

        <ActivityBlock
          title="Annonces récentes"
          href="/hub/announcements/"
          emptyIcon={Megaphone}
          emptyText="Pas d'annonce récente"
          loading={loading}
          isEmpty={stats.recentAnnouncements.length === 0}
        >
          {stats.recentAnnouncements.map((a) => (
            <Link
              key={a.id}
              href="/hub/announcements/"
              className={`flex items-start gap-3 rounded-xl border p-3 transition hover:border-[var(--accent)] ${
                a.isRead
                  ? 'border-[var(--border)] bg-[var(--bg-elevated)]/60'
                  : 'border-[var(--accent)]/40 bg-[var(--accent-soft)]/25'
              }`}
            >
              <Image
                src={a.authorAvatarUrl ?? 'https://cdn.discordapp.com/embed/avatars/0.png'}
                alt=""
                width={36}
                height={36}
                className="shrink-0 rounded-xl"
                unoptimized
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{a.title}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {a.authorDisplayName} · {relativeTime(a.createdAt)}
                </p>
              </div>
              {!a.isRead && (
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--accent)]" />
              )}
            </Link>
          ))}
        </ActivityBlock>
      </section>
    </main>
  )
}

function StatPill({
  icon: Icon,
  label,
  value,
  href,
  highlight,
}: {
  icon: LucideIcon
  label: string
  value: number | string
  href: string
  highlight?: boolean
}) {
  return (
    <Link
      href={href}
      className={`rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:border-[var(--accent)] ${
        highlight
          ? 'border-[var(--accent)]/50 bg-[var(--accent-soft)]/40'
          : 'border-[var(--border)] bg-[var(--bg-elevated)]'
      }`}
    >
      <Icon size={18} className="text-[var(--accent)]" />
      <p className="hub-stat-value mt-2 text-2xl font-bold">{value}</p>
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
    </Link>
  )
}

function ActivityBlock({
  title,
  href,
  emptyIcon: EmptyIcon,
  emptyText,
  loading,
  isEmpty,
  children,
}: {
  title: string
  href: string
  emptyIcon: LucideIcon
  emptyText: string
  loading: boolean
  isEmpty: boolean
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <Link href={href} className="text-xs font-medium text-[var(--accent)] hover:underline">
          Tout voir →
        </Link>
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-[var(--accent-soft)]/30" />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center py-8 text-center">
          <EmptyIcon size={32} className="text-[var(--text-muted)]" />
          <p className="mt-2 text-sm text-[var(--text-muted)]">{emptyText}</p>
        </div>
      ) : (
        <div className="space-y-2">{children}</div>
      )}
    </div>
  )
}
