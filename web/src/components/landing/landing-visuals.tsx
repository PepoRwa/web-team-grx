'use client'

import Image from 'next/image'
import { Building2, Film, Megaphone, Radio, UserPlus } from 'lucide-react'

/** Emblème maillot : logo + foil holographique derrière / à travers */
export function HoloCrest({ size = 160 }: { size?: number }) {
  return (
    <div className="landing-holo-crest" style={{ width: size, height: size }}>
      <div className="landing-holo-foil" aria-hidden />
      <div className="landing-holo-foil landing-holo-foil-shift" aria-hidden />
      <div className="landing-holo-glyph" aria-hidden>
        <svg viewBox="0 0 120 120" className="h-full w-full">
          <path
            d="M20 95 L60 18 L100 95 Z M38 72 H82"
            fill="none"
            stroke="currentColor"
            strokeWidth="3.5"
            strokeLinejoin="round"
            className="text-lavender/50"
          />
          <circle cx="60" cy="52" r="10" fill="none" stroke="currentColor" strokeWidth="2" className="text-mint/60" />
        </svg>
      </div>
      <div className="landing-holo-logo-wrap">
        <Image
          src="/logo-team-esport.png"
          alt="Gowrax"
          width={size}
          height={size}
          className="landing-holo-logo"
          priority
        />
      </div>
      <div className="landing-holo-sheen" aria-hidden />
    </div>
  )
}

/** Hero mark : crest + anneaux strat */
export function HoloHeroMark() {
  return (
    <div className="landing-holo-hero-mark">
      <div className="landing-strat-radar" aria-hidden>
        <span className="landing-radar-ring" />
        <span className="landing-radar-ring landing-radar-ring-2" />
        <span className="landing-radar-sweep" />
        <span className="landing-radar-cross landing-radar-cross-h" />
        <span className="landing-radar-cross landing-radar-cross-v" />
      </div>
      <HoloCrest size={168} />
      <div className="landing-holo-callouts" aria-hidden>
        <span className="landing-callout landing-callout-a">ATK</span>
        <span className="landing-callout landing-callout-b">B</span>
        <span className="landing-callout landing-callout-c">ECO</span>
      </div>
    </div>
  )
}

export function MockVodCard({ active }: { active?: boolean }) {
  return (
    <div className={`landing-mock-card landing-mock-holo ${active ? 'landing-mock-active' : ''}`}>
      <div className="landing-mock-holo-strip" aria-hidden />
      <div className="flex items-center justify-between">
        <span className="landing-mock-pill landing-mock-pill-win">WIN</span>
        <span className="landing-mock-pill landing-mock-pill-pro">SCRIM</span>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Film size={22} className="text-[var(--accent)]" />
        <div className="flex-1 space-y-2">
          <div className="h-2.5 w-3/4 rounded-md bg-[var(--accent)]/35" />
          <div className="h-2 w-1/2 rounded-md bg-[var(--border)]" />
        </div>
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

export function MockTryoutBoard({ active }: { active?: boolean }) {
  return (
    <div className={`landing-mock-card landing-mock-strat landing-mock-holo ${active ? 'landing-mock-active' : ''}`}>
      <div className="landing-strat-grid absolute inset-0 opacity-40" />
      <div className="landing-mock-holo-strip" aria-hidden />
      <div className="relative">
        <div className="flex items-center gap-2">
          <UserPlus size={16} className="text-[var(--accent)]" />
          <span className="landing-mock-tag">Pipeline</span>
          <span className="landing-mock-pill landing-mock-pill-atk">TRYOUT</span>
        </div>
        <svg viewBox="0 0 200 110" className="mt-3 w-full" aria-hidden>
          <path
            d="M16 88 L55 88 L55 42 L100 42 L100 70 L155 70 L155 28 L184 28"
            fill="none"
            stroke="url(#tryGrad)"
            strokeWidth="2.5"
            strokeDasharray="5 4"
            className="landing-strat-path"
          />
          {[
            [16, 88],
            [55, 42],
            [100, 70],
            [155, 28],
            [184, 28],
          ].map(([cx, cy], i) => (
            <circle
              key={i}
              cx={cx}
              cy={cy}
              r="5"
              fill={i === 4 ? 'var(--color-mint-dark)' : 'var(--color-lavender-dark)'}
              className="landing-strat-node"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
          <defs>
            <linearGradient id="tryGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7c6bc4" />
              <stop offset="50%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#fde68a" />
            </linearGradient>
          </defs>
        </svg>
        <div className="mt-1 flex justify-between text-[9px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          <span>New</span>
          <span>Contact</span>
          <span>Trial</span>
          <span>Offer</span>
        </div>
      </div>
    </div>
  )
}

export function MockAssoCrest({ active }: { active?: boolean }) {
  return (
    <div className={`landing-mock-card landing-mock-holo flex flex-col items-center py-6 ${active ? 'landing-mock-active' : ''}`}>
      <div className="landing-mock-holo-strip" aria-hidden />
      <div className="relative">
        <HoloCrest size={88} />
      </div>
      <div className="mt-4 flex items-center gap-2 text-sm font-semibold">
        <Building2 size={16} className="text-[var(--accent)]" />
        Dossier adhérent
      </div>
      <div className="mt-3 w-full space-y-2 px-2">
        <div className="h-2 rounded-md bg-[var(--border)]" />
        <div className="h-2 w-4/5 rounded-md bg-[var(--border)]" />
        <div className="flex gap-2 pt-1">
          <span className="landing-mock-pill landing-mock-pill-role">Cotisation</span>
          <span className="landing-mock-pill landing-mock-pill-val">Docs</span>
        </div>
      </div>
    </div>
  )
}

export function MockTransmission({ active }: { active?: boolean }) {
  return (
    <div className={`landing-mock-card landing-mock-holo ${active ? 'landing-mock-active' : ''}`}>
      <div className="landing-mock-holo-strip" aria-hidden />
      <div className="flex items-center gap-3">
        <div className="landing-mock-avatar h-10 w-10 rounded-xl" />
        <div className="flex-1 space-y-1.5">
          <div className="h-2 w-24 rounded bg-[var(--accent)]/50" />
          <div className="h-1.5 w-16 rounded bg-[var(--border)]" />
        </div>
        <Megaphone size={18} className="text-[var(--accent)]" />
      </div>
      <div className="mt-4 h-2 w-3/4 rounded bg-[var(--text)]/10" />
      <div className="mt-2 space-y-1.5">
        <div className="h-1.5 w-full rounded bg-[var(--border)]" />
        <div className="h-1.5 w-5/6 rounded bg-[var(--border)]" />
      </div>
      <div className="landing-mock-broadcast mt-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
        <span className="landing-live-beacon h-1.5 w-1.5 rounded-full bg-emerald-400" />
        <Radio size={12} />
        Discord + Site
      </div>
    </div>
  )
}
