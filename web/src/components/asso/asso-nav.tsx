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
  bureauOnly?: boolean
}

const ITEMS: NavItem[] = [
  { key: 'dossiers', href: '/hub/asso/dossiers/', label: 'Dossiers', icon: Users, bureauOnly: true },
  {
    key: 'cotisations',
    href: '/hub/asso/cotisations/',
    label: 'Cotisations',
    icon: Wallet,
    bureauOnly: true,
  },
  {
    key: 'documents',
    href: '/hub/asso/documents/',
    label: 'Documents',
    icon: FolderOpen,
  },
  {
    key: 'assemblees',
    href: '/hub/asso/assemblees/',
    label: 'Assemblées',
    icon: Gavel,
    bureauOnly: true,
  },
  { key: 'me', href: '/hub/asso/me/', label: 'Mon dossier', icon: UserCircle },
  {
    key: 'parametres',
    href: '/hub/asso/parametres/',
    label: 'Paramètres',
    icon: Settings,
    bureauOnly: true,
  },
]

interface AssoNavProps {
  active: AssoNavKey
  isBureau: boolean
}

export function AssoNav({ active, isBureau }: AssoNavProps) {
  const pathname = usePathname()

  const visible = ITEMS.filter((item) => {
    if (item.bureauOnly && !isBureau) return false
    if (item.key === 'me' && isBureau) return true
    return true
  })

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
