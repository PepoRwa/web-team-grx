'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface HubPageBarProps {
  title: string
  subtitle?: string
  backHref?: string
}

export function HubPageBar({ title, subtitle, backHref }: HubPageBarProps) {
  return (
    <div className="border-b border-[var(--border)] bg-[var(--bg-elevated)]/60">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        {backHref && (
          <Link
            href={backHref}
            className="btn-ghost shrink-0 p-2"
            aria-label="Retour"
          >
            <ArrowLeft size={18} />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-display truncate text-2xl md:text-3xl">{title}</h1>
          {subtitle && (
            <p className="truncate text-xs text-[var(--text-muted)] md:text-sm">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  )
}
