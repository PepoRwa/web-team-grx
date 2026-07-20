'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import {
  ArrowDown,
  Building2,
  Film,
  LayoutDashboard,
  Megaphone,
  Moon,
  Sparkles,
  Sun,
  UserPlus,
} from 'lucide-react'
import { useTheme } from '@/components/providers'
import { PwaInstallBanner } from '@/components/pwa-install-banner'
import {
  HoloHeroMark,
  MockAssoCrest,
  MockTransmission,
  MockTryoutBoard,
  MockVodCard,
} from '@/components/landing/landing-visuals'
import { useInView } from '@/hooks/useInView'
import { useScrollContainerProgress } from '@/hooks/useScrollContainerProgress'
import { LegalLoginNotice } from '@/components/legal-login-notice'

interface LandingPageProps {
  onLogin: () => void
  loginLoading: boolean
  loginError: string | null
}

const BANDS = [
  {
    id: 'vods',
    icon: Film,
    tag: 'VODs & Replays',
    titleLine1: 'Chaque round,',
    titleLine2: 'sous le microscope.',
    desc: 'Scrims et matchs pro archivés : map, score, adversaire, joueurs. Le staff review sans chercher le lien Discord.',
    gradient: 'from-sky/25 via-lavender/15 to-transparent',
    Visual: MockVodCard,
  },
  {
    id: 'tryouts',
    icon: UserPlus,
    tag: 'Tryouts',
    titleLine1: 'Recrutement,',
    titleLine2: 'vue pipeline.',
    desc: 'Campagnes par roster, candidats, essais et évaluations. Capitaines en lecture — staff en écriture.',
    gradient: 'from-mint/25 via-lavender/12 to-transparent',
    Visual: MockTryoutBoard,
  },
  {
    id: 'asso',
    icon: Building2,
    tag: 'Association',
    titleLine1: 'Le dossier légal,',
    titleLine2: 'à portée de main.',
    desc: 'Adhésion, cotisations, documents et assemblées — lié à ton Discord, géré par le bureau.',
    gradient: 'from-gold/25 via-rose/12 to-transparent',
    Visual: MockAssoCrest,
  },
  {
    id: 'news',
    icon: Megaphone,
    tag: 'News',
    titleLine1: 'Les annonces staff,',
    titleLine2: 'là où il faut.',
    desc: 'Fil hub + popup à la connexion. Les transmissions ciblent Discord, le site, ou les deux.',
    gradient: 'from-rose/20 via-coral/15 to-transparent',
    Visual: MockTransmission,
  },
] as const

export function LandingPage({ onLogin, loginLoading, loginError }: LandingPageProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const progress = useScrollContainerProgress(scrollRef)
  const { theme, toggle } = useTheme()

  const hero = useInView<HTMLElement>(0.12)
  const cta = useInView<HTMLElement>(0.3)

  return (
    <div className="landing-root">
      <div className="landing-progress-rail" aria-hidden>
        <div className="landing-progress-fill" style={{ height: `${progress * 100}%` }} />
      </div>

      <header className="landing-nav">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="landing-nav-crest">
            <Image src="/logo-team-esport.png" alt="" width={36} height={36} className="rounded-xl" />
            <span className="landing-nav-foil" aria-hidden />
          </span>
          <span className="hidden text-sm font-bold tracking-[0.2em] text-[var(--accent)] sm:inline">
            GOWRAX
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button type="button" onClick={toggle} className="btn-ghost p-2" aria-label="Thème">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <button
            type="button"
            className="landing-nav-cta"
            onClick={onLogin}
            disabled={loginLoading}
          >
            <LayoutDashboard size={16} />
            <span className="hidden sm:inline">Connexion</span>
          </button>
        </div>
      </header>

      <div ref={scrollRef} className="landing-scroll">
        <section ref={hero.ref} className="landing-section landing-hero">
          <div className="landing-hero-bg" aria-hidden>
            <div className="landing-blob landing-blob-1" />
            <div className="landing-blob landing-blob-2" />
            <div className="landing-blob landing-blob-3" />
            <div className="landing-grid-overlay landing-grid-strat" />
            <div className="landing-holo-wash" />
          </div>

          <div className={`landing-hero-inner landing-hero-brand ${hero.visible ? 'is-visible' : ''}`}>
            <div className="landing-hero-visual landing-hero-visual-lead">
              <HoloHeroMark />
            </div>

            <div className="landing-hero-copy landing-hero-copy-center">
              <p className="landing-brand-word">
                <span className="landing-brand-holo">Gowrax</span>
              </p>
              <h1 className="landing-headline landing-headline-tight">
                <span className="landing-headline-line">Le hub d&apos;équipe.</span>
                <span className="landing-headline-line landing-headline-accent">Vue strat.</span>
              </h1>
              <p className="landing-subline mx-auto">
                VODs, tryouts, asso et news — synchronisé Discord, pensé pour le quotidien roster.
              </p>
              <div className="landing-hero-actions justify-center">
                <button
                  type="button"
                  className="landing-cta-primary"
                  onClick={onLogin}
                  disabled={loginLoading}
                >
                  <LayoutDashboard size={20} />
                  {loginLoading ? 'Connexion…' : 'Entrer avec Discord'}
                </button>
                <a href="#modules" className="landing-cta-ghost">
                  Explorer
                  <ArrowDown size={16} />
                </a>
              </div>
              {loginError && <p className="mt-4 text-sm text-red-500">{loginError}</p>}
              <LegalLoginNotice className="mx-auto mt-4 max-w-md text-center" />
              <p className="landing-disclaimer mt-2">Réservé aux membres Gowrax validés.</p>
            </div>
          </div>

          <div className="landing-scroll-hint" aria-hidden>
            <span>Scroll</span>
            <div className="landing-scroll-line" />
          </div>
        </section>

        <div id="modules">
          {BANDS.map((item, i) => (
            <ShowcasePanel key={item.id} item={item} index={i} reverse={i % 2 === 1} />
          ))}
        </div>

        <section ref={cta.ref} className="landing-section landing-cta-section">
          <div className={`landing-cta-inner ${cta.visible ? 'is-visible' : ''}`}>
            <div className="landing-cta-glow" aria-hidden />
            <div className="landing-cta-holo-badge mx-auto mb-6">
              <Sparkles size={16} />
              Accès membre
            </div>
            <h2 className="landing-cta-title">
              Prêt pour
              <br />
              <span className="landing-brand-holo text-[clamp(2.5rem,8vw,4rem)]">le call ?</span>
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-[var(--text-muted)]">
              Connecte-toi avec Discord — même compte que le serveur Gowrax.
            </p>
            <button
              type="button"
              className="landing-cta-primary mt-8 text-lg"
              onClick={onLogin}
              disabled={loginLoading}
            >
              <LayoutDashboard size={22} />
              Connexion Discord
            </button>
            <LegalLoginNotice className="mx-auto mt-6 max-w-lg text-center" />
          </div>

          <footer className="landing-footer">
            <Link href="https://gowrax.me" className="hover:text-[var(--accent)]">
              gowrax.me
            </Link>
            <span aria-hidden> · </span>
            team.gowrax.me
          </footer>
        </section>
      </div>

      <PwaInstallBanner placement="landing" />
    </div>
  )
}

function ShowcasePanel({
  item,
  index,
  reverse,
}: {
  item: (typeof BANDS)[number]
  index: number
  reverse: boolean
}) {
  const { ref, visible } = useInView<HTMLElement>(0.35)
  const Visual = item.Visual

  return (
    <section
      ref={ref}
      className={`landing-section landing-showcase-panel bg-gradient-to-br ${item.gradient}`}
    >
      <div
        className={`landing-showcase-inner ${reverse ? 'landing-showcase-reverse' : ''} ${visible ? 'is-visible' : ''}`}
      >
        <div className="landing-showcase-copy" style={{ transitionDelay: `${index * 0.05}s` }}>
          <span className="landing-eyebrow">
            <item.icon size={14} />
            {item.tag}
          </span>
          <h2 className="landing-section-title mt-4">
            <span className="landing-title-line">{item.titleLine1}</span>
            <span className="landing-title-line landing-title-accent">{item.titleLine2}</span>
          </h2>
          <p className="landing-section-desc mt-4">{item.desc}</p>
        </div>
        <div className="landing-showcase-visual">
          <div className="landing-visual-frame landing-visual-frame-holo">
            <Visual active={visible} />
          </div>
        </div>
      </div>
    </section>
  )
}
