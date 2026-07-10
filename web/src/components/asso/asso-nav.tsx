'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  FileText,
  FolderOpen,
  Gavel,
  Settings,
  UserCircle,
  Users,
  Wallet,
} from 'lucide-react'
import type { AssoAccess, AssoAccessLevel, AssoModule } from '@/lib/api'

export type AssoNavKey =
  | 'dossiers'
  | 'cotisations'
  | 'documents'
  | 'assemblees'
  | 'me'
  | 'parametres'

type NavItem = {
  key: AssoNavKey
  href: string
  label: string
  icon: typeof Users
  visible: (access: AssoAccess) => boolean
}

const LEVEL_RANK: Record<AssoAccessLevel, number> = {
  aucun: 0,
  lecture: 1,
  edition: 2,
  admin: 3,
}

function moduleAtLeast(
  access: AssoAccess,
  module: AssoModule,
  min: AssoAccessLevel = 'lecture',
): boolean {
  const level = access.modules?.[module]
  if (!level) return false
  return LEVEL_RANK[level] >= LEVEL_RANK[min]
}

const ITEMS: NavItem[] = [
  {
    key: 'dossiers',
    href: '/hub/asso/dossiers/',
    label: 'Dossiers',
    icon: Users,
    visible: (access) => moduleAtLeast(access, 'membres'),
  },
  {
    key: 'cotisations',
    href: '/hub/asso/cotisations/',
    label: 'Cotisations',
    icon: Wallet,
    visible: (access) => access.isBureau && moduleAtLeast(access, 'cotisations'),
  },
  {
    key: 'documents',
    href: '/hub/asso/documents/',
    label: 'Documents',
    icon: FolderOpen,
    visible: (access) => Boolean(access.documents?.canAccess),
  },
  {
    key: 'assemblees',
    href: '/hub/asso/assemblees/',
    label: 'Assemblées',
    icon: Gavel,
    visible: (access) => moduleAtLeast(access, 'assemblees'),
  },
  {
    key: 'me',
    href: '/hub/asso/me/',
    label: 'Mon dossier',
    icon: UserCircle,
    visible: () => true,
  },
  {
    key: 'parametres',
    href: '/hub/asso/parametres/',
    label: 'Paramètres',
    icon: Settings,
    visible: (access) => moduleAtLeast(access, 'parametres'),
  },
]

interface AssoNavProps {
  active: AssoNavKey
  access: AssoAccess
}

export function AssoNav({ active, access }: AssoNavProps) {
  const pathname = usePathname()
  const visible = ITEMS.filter((item) => item.visible(access))

  return (
    <nav
      className="border-b border-[var(--border)] bg-[var(--bg-elevated)]/80 backdrop-blur-sm"
      aria-label="Navigation asso"
    >
      <div className="mx-auto max-w-6xl overflow-x-auto px-2 sm:px-4">
        <ul className="flex min-w-max gap-0.5 py-2">
          {visible.map((item) => {
            const isActive =
              item.key === active ||
              (item.key === 'dossiers' &&
                (pathname?.includes('/hub/asso/dossiers') ?? false)) ||
              (item.key === 'me' && pathname === '/hub/asso/me/')
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-medium transition sm:text-sm ${
                    isActive
                      ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]'
                  }`}
                >
                  <item.icon size={16} strokeWidth={isActive ? 2.25 : 2} />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

export function AssoModuleBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--accent)]">
      <FileText size={12} />
      Asso
    </span>
  )
}

export function assoDefaultPath(access: AssoAccess): string {
  if (moduleAtLeast(access, 'membres')) return '/hub/asso/dossiers/'
  return '/hub/asso/me/'
}
