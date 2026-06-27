'use client'

import { BookOpen, Film, Megaphone, Radio, User, Zap } from 'lucide-react'

/** Mock UI abstraits — zéro screenshot, 100 % CSS/SVG */

export function OrbitalHub() {
  return (
    <div className="landing-orbital relative mx-auto aspect-square w-full max-w-md">
      <div className="landing-orbital-core flex items-center justify-center rounded-3xl border border-white/30 bg-[var(--bg-elevated)]/70 shadow-2xl backdrop-blur-xl">
        <div className="text-center">
          <Zap className="mx-auto text-[var(--accent)]" size={28} />
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)]">Hub</p>
        </div>
      </div>

      {[
        { icon: Film, color: 'from-sky/60 to-lavender/40', delay: '0s', orbit: 'landing-orbit-a' },
        { icon: BookOpen, color: 'from-mint/60 to-sky/40', delay: '-5s', orbit: 'landing-orbit-b' },
        { icon: User, color: 'from-rose/60 to-gold/40', delay: '-10s', orbit: 'landing-orbit-c' },
        { icon: Megaphone, color: 'from-gold/60 to-coral/40', delay: '-15s', orbit: 'landing-orbit-d' },
      ].map(({ icon: Icon, color, delay, orbit }, i) => (
        <div
          key={i}
          className={`landing-orbit-ring absolute left-1/2 top-1/2 ${orbit}`}
          style={{ animationDelay: delay }}
        >
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl border border-white/25 bg-gradient-to-br ${color} shadow-lg backdrop-blur-md sm:h-14 sm:w-14`}
          >
            <Icon size={20} className="text-[var(--text)]" />
          </div>
        </div>
      ))}

      <div className="landing-ring-pulse absolute inset-[12%] rounded-full border border-[var(--accent)]/20" />
      <div className="landing-ring-pulse absolute inset-[22%] rounded-full border border-[var(--accent)]/10 [animation-delay:-2s]" />
    </div>
  )
}

export function MockVodCard({ active }: { active?: boolean }) {
  return (
    <div className={`landing-mock-card ${active ? 'landing-mock-active' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="landing-mock-pill landing-mock-pill-win">WIN</span>
        <span className="landing-mock-pill landing-mock-pill-pro">PRO</span>
      </div>
      <div className="mt-4 h-2 w-3/4 rounded-full bg-[var(--accent-soft)]">
        <div className="landing-mock-shimmer h-full w-1/2 rounded-full bg-gradient-to-r from-[var(--accent)] to-mint" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-2.5 w-full rounded-md bg-[var(--border)]" />
        <div className="h-2.5 w-2/3 rounded-md bg-[var(--border)]" />
      </div>
      <div className="mt-4 flex gap-2">
        <span className="landing-mock-tag">Ascent</span>
        <span className="landing-mock-tag">13–11</span>
      </div>
      <div className="landing-mock-playbar mt-4">
        <div className="landing-mock-playhead" />
      </div>
    </div>
  )
}

export function MockStratBoard({ active }: { active?: boolean }) {
  return (
    <div className={`landing-mock-card landing-mock-strat ${active ? 'landing-mock-active' : ''}`}>
      <div className="landing-strat-grid absolute inset-0 opacity-40" />
      <div className="relative">
        <div className="flex gap-2">
          <span className="landing-mock-tag">Haven</span>
          <span className="landing-mock-pill landing-mock-pill-atk">ATK</span>
        </div>
        <svg viewBox="0 0 200 120" className="mt-3 w-full" aria-hidden>
          <path
            d="M20 90 Q 60 30, 100 60 T 180 40"
            fill="none"
            stroke="url(#stratGrad)"
            strokeWidth="3"
            strokeDasharray="6 4"
            className="landing-strat-path"
          />
          <circle cx="20" cy="90" r="6" fill="var(--color-mint-dark)" className="landing-strat-node" />
          <circle cx="100" cy="60" r="6" fill="var(--color-lavender-dark)" className="landing-strat-node [animation-delay:0.3s]" />
          <circle cx="180" cy="40" r="6" fill="var(--color-rose-dark)" className="landing-strat-node [animation-delay:0.6s]" />
          <defs>
            <linearGradient id="stratGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#7c6bc4" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  )
}

export function MockProfileCard({ active }: { active?: boolean }) {
  return (
    <div className={`landing-mock-card ${active ? 'landing-mock-active' : ''}`}>
      <div className="h-10 rounded-t-xl bg-gradient-to-r from-lavender/50 via-mint/40 to-rose/40" />
      <div className="px-4 pb-4">
        <div className="-mt-5 flex items-end gap-3">
          <div className="landing-mock-avatar h-12 w-12 rounded-xl ring-4 ring-[var(--bg-elevated)]" />
          <div className="flex-1 space-y-1.5 pb-1">
            <div className="h-2.5 w-20 rounded-md bg-[var(--accent)]/40" />
            <div className="h-2 w-14 rounded-md bg-[var(--border)]" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="landing-mock-pill landing-mock-pill-role">Coach</span>
          <span className="landing-mock-pill landing-mock-pill-val">Valorant</span>
        </div>
        <div className="mt-3 rounded-lg bg-[var(--accent-soft)]/50 p-2 space-y-1.5">
          <div className="h-1.5 w-full rounded bg-[var(--border)]" />
          <div className="h-1.5 w-4/5 rounded bg-[var(--border)]" />
        </div>
      </div>
    </div>
  )
}

export function MockTransmission({ active }: { active?: boolean }) {
  return (
    <div className={`landing-mock-card ${active ? 'landing-mock-active' : ''}`}>
      <div className="flex items-center gap-3">
        <div className="landing-mock-avatar h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-1.5">
          <div className="h-2 w-24 rounded bg-[var(--accent)]/50" />
          <div className="h-1.5 w-16 rounded bg-[var(--border)]" />
        </div>
        <Radio size={18} className="text-[var(--accent)]" />
      </div>
      <div className="mt-4 h-2 w-3/4 rounded bg-[var(--text)]/10" />
      <div className="mt-2 space-y-1.5">
        <div className="h-1.5 w-full rounded bg-[var(--border)]" />
        <div className="h-1.5 w-5/6 rounded bg-[var(--border)]" />
        <div className="h-1.5 w-2/3 rounded bg-[var(--border)]" />
      </div>
      <div className="landing-mock-broadcast mt-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
        <span className="landing-live-beacon h-1.5 w-1.5 rounded-full bg-emerald-400" />
        Discord + Site
      </div>
    </div>
  )
}

export function SyncPipeline({ active }: { active?: boolean }) {
  return (
    <div className={`landing-sync-pipeline ${active ? 'landing-sync-active' : ''}`}>
      {['Discord', 'Bot Gowrax', 'Team Hub'].map((label) => (
        <div key={label} className="landing-sync-node">
          <div className="landing-sync-dot" />
          <span className="text-xs font-semibold sm:text-sm">{label}</span>
        </div>
      ))}
    </div>
  )
}
