'use client'

import Link from 'next/link'
import {
  Binoculars,
  BookOpen,
  Building2,
  Film,
  LayoutDashboard,
  Megaphone,
  User,
  UserPlus,
} from 'lucide-react'

export type HubNavKey =
  | 'hub'
  | 'vods'
  | 'strats'
  | 'scouting'
  | 'tryouts'
  | 'asso'
  | 'announcements'
  | 'profile'

const ALL_NAV_ITEMS: {
  key: HubNavKey
  href: string
  label: string
  icon: typeof Film
  requiresTryout?: boolean
  requiresAsso?: boolean
}[] = [
  { key: 'hub', href: '/hub/', label: 'Hub', icon: LayoutDashboard },
  { key: 'vods', href: '/hub/vods/', label: 'VODs', icon: Film },
  { key: 'strats', href: '/hub/strats/', label: 'Strats', icon: BookOpen },
  { key: 'scouting', href: '/hub/scouting/', label: 'Scout', icon: Binoculars },
  { key: 'tryouts', href: '/hub/tryouts/', label: 'Tryouts', icon: UserPlus, requiresTryout: true },
  { key: 'asso', href: '/hub/asso/', label: 'Asso', icon: Building2, requiresAsso: true },
  { key: 'announcements', href: '/hub/announcements/', label: 'News', icon: Megaphone },
  { key: 'profile', href: '/hub/profiles/me/', label: 'Profil', icon: User },
]

interface HubNavProps {
  active: HubNavKey
  announcementBadge?: number
  showTryouts?: boolean
  showAsso?: boolean
}

export function HubNav({
  active,
  announcementBadge = 0,
  showTryouts = false,
  showAsso = false,
}: HubNavProps) {
  const NAV_ITEMS = ALL_NAV_ITEMS.filter(
    (item) =>
      (!item.requiresTryout || showTryouts) && (!item.requiresAsso || showAsso),
  )
  return (
    <nav
      className="hub-bottom-nav fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-[var(--bg-elevated)]/95 backdrop-blur-md"
      aria-label="Navigation principale"
    >
      <div className="mx-auto flex max-w-2xl justify-around px-0.5 pt-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === active
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`relative flex min-h-[3rem] min-w-[2.75rem] flex-1 max-w-[4.5rem] flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-[9px] font-medium transition active:scale-95 sm:min-w-[3rem] sm:max-w-[5rem] sm:text-[10px] ${
                isActive
                  ? 'text-[var(--accent)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text)]'
              }`}
            >
              <item.icon size={22} strokeWidth={isActive ? 2.25 : 2} />
              <span className="leading-none">{item.label}</span>
              {item.key === 'announcements' && announcementBadge > 0 && (
                <span className="absolute right-2 top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-bold leading-none text-white">
                  {announcementBadge > 9 ? '9+' : announcementBadge}
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
