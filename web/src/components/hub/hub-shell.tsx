'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, LogOut, Moon, Sun } from 'lucide-react'
import { PwaInstallBanner } from '@/components/pwa-install-banner'
import { HubNav, type HubNavKey } from '@/components/hub/hub-nav'
import { HubPageBar } from '@/components/hub/hub-page-bar'
import { useTheme } from '@/components/providers'
import { useAuth } from '@/hooks/useAuth'
import { useHubAnnouncementBadge } from '@/hooks/useHubAnnouncementBadge'
import { useAssoAccess } from '@/hooks/useAssoAccess'

interface HubShellProps {
  children: React.ReactNode
  activeNav?: HubNavKey
  title?: string
  subtitle?: string
  backHref?: string
  showAsso?: boolean
}

export function HubShell({
  children,
  activeNav = 'hub',
  title,
  subtitle,
  backHref,
  showAsso: showAssoProp,
}: HubShellProps) {
  const { user, signOut, permissions, session } = useAuth()
  const { theme, toggle } = useTheme()
  const announcementBadge = useHubAnnouncementBadge()
  const { access: assoAccess } = useAssoAccess(session?.access_token, Boolean(session))
  const showAsso = showAssoProp ?? assoAccess.hasAccess

  const avatar = user?.avatarUrl ?? 'https://cdn.discordapp.com/embed/avatars/0.png'
  const showPageBar = Boolean(title)

  return (
    <div className="hub-shell min-h-screen">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:py-3">
          <Link href="/hub/" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <Image
              src="/logo-team-esport.png"
              alt="Gowrax"
              width={36}
              height={36}
              className="shrink-0 rounded-xl sm:h-10 sm:w-10"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-xs font-bold tracking-wide text-[var(--accent)] sm:text-sm">
                  GOWRAX
                </p>
                <span
                  className="hub-live-dot inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400"
                  title="Hub en ligne"
                />
              </div>
              {!showPageBar && (
                <p className="hidden text-xs text-[var(--text-muted)] sm:block">Team Hub</p>
              )}
            </div>
          </Link>

          {/* Titre compact dans le header sur mobile quand pas de page bar séparée */}
          {showPageBar && (
            <div className="min-w-0 flex-1 px-1 md:hidden">
              <p className="font-display truncate text-center text-xl">{title}</p>
            </div>
          )}

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Link
              href="/hub/profiles/me/"
              className="flex items-center rounded-full border border-[var(--border)] p-0.5 hover:border-[var(--accent)] sm:py-0.5 sm:pl-0.5 sm:pr-2.5"
              aria-label="Mon profil"
            >
              <Image src={avatar} alt="" width={32} height={32} className="rounded-full" unoptimized />
              <span className="ml-2 hidden max-w-[6rem] truncate text-xs font-medium md:inline">
                {user?.publicName ?? user?.username ?? 'Profil'}
              </span>
            </Link>
            <button type="button" onClick={toggle} className="btn-ghost p-2" aria-label="Thème">
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button
              type="button"
              onClick={signOut}
              className="btn-ghost hidden p-2 sm:inline-flex"
              aria-label="Quitter"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {showPageBar && (
        <div className="hidden md:block">
          <HubPageBar title={title!} subtitle={subtitle} backHref={backHref} />
        </div>
      )}

      {/* Barre retour mobile sous le header */}
      {showPageBar && backHref && (
        <div className="border-b border-[var(--border)] md:hidden">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2">
            <Link href={backHref} className="btn-ghost p-2" aria-label="Retour">
              <ArrowLeft size={18} />
            </Link>
            {subtitle && (
              <p className="truncate text-xs text-[var(--text-muted)]">{subtitle}</p>
            )}
          </div>
        </div>
      )}

      {children}

      <PwaInstallBanner placement="hub" />
      <HubNav
        active={activeNav}
        announcementBadge={announcementBadge}
        showTryouts={Boolean(permissions?.canTryoutRead)}
        showAsso={showAsso}
      />
    </div>
  )
}
