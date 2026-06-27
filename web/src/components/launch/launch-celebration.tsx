'use client'

import { LayoutDashboard, Sparkles } from 'lucide-react'

interface LaunchCelebrationProps {
  onEnter: () => void
  loginLoading: boolean
  secondsRemaining: number
}

export function LaunchCelebration({
  onEnter,
  loginLoading,
  secondsRemaining,
}: LaunchCelebrationProps) {
  return (
    <div className="launch-celebration">
      <div className="launch-confetti" aria-hidden>
        {Array.from({ length: 24 }).map((_, i) => (
          <span key={i} className="launch-confetti-piece" style={{ '--i': i } as React.CSSProperties} />
        ))}
      </div>

      <Sparkles className="mx-auto text-[var(--accent)] launch-celebrate-pop" size={36} />
      <h2 className="launch-celebrate-title mt-4">C&apos;est ouvert !</h2>
      <p className="mt-3 max-w-md text-center text-[var(--text-muted)]">
        Le hub Gowrax est en ligne — bienvenue dans la nouvelle ère de l&apos;équipe.
      </p>
      {secondsRemaining > 0 && (
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Accès général dans {Math.ceil(secondsRemaining / 60)} min
        </p>
      )}
      <button
        type="button"
        className="launch-cta-primary mt-8"
        onClick={onEnter}
        disabled={loginLoading}
      >
        <LayoutDashboard size={20} />
        {loginLoading ? 'Connexion…' : 'Entrer dans le hub'}
      </button>
    </div>
  )
}
