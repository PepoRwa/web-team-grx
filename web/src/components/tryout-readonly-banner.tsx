'use client'

interface TryoutReadonlyBannerProps {
  show: boolean
}

export function TryoutReadonlyBanner({ show }: TryoutReadonlyBannerProps) {
  if (!show) return null
  return (
    <div className="rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-soft)]/30 px-4 py-2 text-sm text-[var(--text-muted)]">
      Mode lecture seule — les notes staff et évaluations ne sont pas visibles.
    </div>
  )
}
