'use client'

import { HubShell } from '@/components/hub/hub-shell'
import { AssoModuleBadge, AssoNav, type AssoNavKey } from '@/components/asso/asso-nav'
import { useAssoGate } from '@/hooks/useAssoGate'
import { AssoLoadingScreen } from '@/components/asso/asso-loading-screen'

interface AssoShellProps {
  children: React.ReactNode
  activeNav: AssoNavKey
  title: string
  subtitle?: string
  backHref?: string
  bureauOnly?: boolean
}

export function AssoShell({
  children,
  activeNav,
  title,
  subtitle,
  backHref = '/hub/',
  bureauOnly = false,
}: AssoShellProps) {
  const { access, ready } = useAssoGate({ bureauOnly })

  if (!ready) return <AssoLoadingScreen />

  return (
    <HubShell
      activeNav="asso"
      title={title}
      subtitle={subtitle ?? 'Gestion associative Gowrax'}
      backHref={backHref}
      showAsso
    >
      <div className="border-b border-[var(--border)] bg-[var(--bg)]/50">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2">
          <AssoModuleBadge />
          <span className="text-xs text-[var(--text-muted)]">Espace associatif · retour Hub via ←</span>
        </div>
      </div>
      <AssoNav active={activeNav} isBureau={access.isBureau} />
      <div className="pb-24">{children}</div>
    </HubShell>
  )
}
