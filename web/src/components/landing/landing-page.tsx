'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import {
  ArrowDown,
  BookOpen,
  Film,
  LayoutDashboard,
  Megaphone,
  Moon,
  Sparkles,
  Sun,
  User,
  Calendar,
  LineChart,
  Bell,
  Smartphone,
  Zap,
} from 'lucide-react'
import { useTheme } from '@/components/providers'
import { PwaInstallBanner } from '@/components/pwa-install-banner'
import {
  MockProfileCard,
  MockStratBoard,
  MockTransmission,
  MockVodCard,
  OrbitalHub,
  SyncPipeline,
} from '@/components/landing/landing-visuals'
import { useInView } from '@/hooks/useInView'
import { useScrollContainerProgress } from '@/hooks/useScrollContainerProgress'

interface LandingPageProps {
  onLogin: () => void
  loginLoading: boolean
  loginError: string | null
}

const SHOWCASE = [
  {
    id: 'vods',
    icon: Film,
    tag: 'VODs & Replays',
    titleLine1: 'Chaque scrim,',
    titleLine2: 'archivé et reviewable.',
    desc: 'Centralise replays scrims et matchs pro : map, score, adversaire, joueurs présents et statut W/L. Le staff retrouve un débrief en deux clics — fini les liens perdus dans Discord.',
    gradient: 'from-sky/30 via-lavender/20 to-transparent',
    Visual: MockVodCard,
  },
  {
    id: 'strats',
    icon: BookOpen,
    tag: 'Strat-Book',
    titleLine1: 'Des tactiques vivantes,',
    titleLine2: 'pas des PDF oubliés.',
    desc: 'Strat-book par map et par côté (ATK/DEF), avec liens ValoPlant, VOD associée et visuels tactiques. Les joueurs peuvent proposer des strats ; le staff valide avant publication.',
    gradient: 'from-mint/30 via-sky/15 to-transparent',
    Visual: MockStratBoard,
  },
  {
    id: 'profiles',
    icon: User,
    tag: 'Profils',
    titleLine1: 'Une identité claire,',
    titleLine2: 'sync avec Discord.',
    desc: 'Pseudo d\'affichage distinct du Discord, Riot ID ou Steam, tracker.gg, jeu principal et rôles bot — visible sur les VODs, les annonces et l\'annuaire équipe.',
    gradient: 'from-rose/30 via-gold/15 to-transparent',
    Visual: MockProfileCard,
  },
  {
    id: 'news',
    icon: Megaphone,
    tag: 'Annonces',
    titleLine1: 'Les annonces staff,',
    titleLine2: 'là où il faut.',
    desc: 'Fil d\'annonces sur le site avec avatar, badge rôle et titre. Les transmissions CEO/TM ciblent Discord, le site ou les deux — avec popup premier plan à la connexion pour l\'essentiel.',
    gradient: 'from-gold/30 via-coral/20 to-transparent',
    Visual: MockTransmission,
  },
] as const

const BENTO = [
  {
    icon: Zap,
    title: 'Sync bot',
    desc: 'Rôles Discord synchronisés via le bot Gowrax — permissions et accès à jour en quelques secondes.',
  },
  {
    icon: Sparkles,
    title: 'Onboarding',
    desc: 'Première connexion guidée : vérif identité, profil, aperçu « tadaaa » avant d\'entrer dans le hub.',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard live',
    desc: 'Compteurs VODs/strats/membres, activité récente et bandeau objectif saison — tout en un coup d\'œil.',
  },
  {
    icon: Smartphone,
    title: 'App installable',
    desc: 'PWA : installe le hub sur ton écran d\'accueil pour un accès rapide, plein écran, sans barre d\'adresse.',
  },
] as const

const ROADMAP = [
  {
    icon: Calendar,
    title: 'Calendriers',
    subtitle: 'Disponibilités',
    desc: 'Créneaux dispos par joueur, vue staff consolidée et sync avec l\'orga — pour planifier scrims et bootcamps sans Excel.',
    status: 'planned' as const,
  },
  {
    icon: LineChart,
    title: 'Stats trackers',
    subtitle: 'Valorant & CS2',
    desc: 'Récupération dynamique des données tracker.gg (Valorant) et CS — rang, perf récente et tendances affichés sur le profil.',
    status: 'planned' as const,
  },
  {
    icon: Bell,
    title: 'Notifications push',
    subtitle: 'Mobile & app',
    desc: 'Alertes VODs, strats et annonces directement sur ton téléphone — même quand le hub n\'est pas ouvert.',
    status: 'planned' as const,
  },
] as const

export function LandingPage({ onLogin, loginLoading, loginError }: LandingPageProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const progress = useScrollContainerProgress(scrollRef)
  const { theme, toggle } = useTheme()

  const hero = useInView<HTMLElement>(0.15)
  const flow = useInView<HTMLElement>(0.25)
  const cta = useInView<HTMLElement>(0.3)

  return (
    <div className="landing-root">
      {/* Progress rail */}
      <div className="landing-progress-rail" aria-hidden>
        <div className="landing-progress-fill" style={{ height: `${progress * 100}%` }} />
      </div>

      {/* Fixed nav */}
      <header className="landing-nav">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo-team-esport.png" alt="Gowrax" width={36} height={36} className="rounded-xl" />
          <span className="hidden text-sm font-bold tracking-wide text-[var(--accent)] sm:inline">GOWRAX</span>
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

      {/* Scroll container */}
      <div ref={scrollRef} className="landing-scroll">
        {/* ── HERO ── */}
        <section ref={hero.ref} className="landing-section landing-hero">
          <div className="landing-hero-bg" aria-hidden>
            <div className="landing-blob landing-blob-1" />
            <div className="landing-blob landing-blob-2" />
            <div className="landing-blob landing-blob-3" />
            <div className="landing-grid-overlay" />
          </div>

          <div className={`landing-hero-inner ${hero.visible ? 'is-visible' : ''}`}>
            <div className="landing-hero-copy">
              <span className="landing-eyebrow">
                <Sparkles size={14} />
                Saison 2026 · Team Hub
              </span>
              <h1 className="landing-headline">
                <span className="landing-headline-line">L&apos;esport,</span>
                <span className="landing-headline-line landing-headline-accent">reimaginé.</span>
              </h1>
              <p className="landing-subline">
                Le hub central de Gowrax Esport : replays, tactiques, profils et annonces
                staff — connecté à Discord, synchronisé avec le bot, pensé pour le
                quotidien de l&apos;équipe.
              </p>
              <div className="landing-hero-actions">
                <button
                  type="button"
                  className="landing-cta-primary"
                  onClick={onLogin}
                  disabled={loginLoading}
                >
                  <LayoutDashboard size={20} />
                  {loginLoading ? 'Connexion…' : 'Entrer avec Discord'}
                </button>
                <a href="#showcase" className="landing-cta-ghost">
                  Explorer
                  <ArrowDown size={16} />
                </a>
              </div>
              {loginError && <p className="mt-4 text-sm text-red-500">{loginError}</p>}
              <p className="landing-disclaimer">Réservé aux membres Gowrax validés.</p>
            </div>

            <div className="landing-hero-visual">
              <OrbitalHub />
            </div>
          </div>

          <div className="landing-scroll-hint" aria-hidden>
            <span>Scroll</span>
            <div className="landing-scroll-line" />
          </div>
        </section>

        {/* ── SHOWCASE (snap panels) ── */}
        <div id="showcase">
          {SHOWCASE.map((item, i) => (
            <ShowcasePanel key={item.id} item={item} index={i} reverse={i % 2 === 1} />
          ))}
        </div>

        {/* ── SYNC FLOW ── */}
        <section ref={flow.ref} className="landing-section landing-flow-section">
          <div className={`landing-flow-inner ${flow.visible ? 'is-visible' : ''}`}>
            <div className="landing-flow-copy">
              <span className="landing-eyebrow">Pipeline</span>
              <h2 className="landing-section-title">
                Discord connecté.
                <br />
                <span className="text-[var(--accent)]">Bot synchronisé.</span>
              </h2>
              <p className="landing-section-desc">
                Connexion OAuth Discord via Supabase, base MySQL partagée avec le bot Gowrax
                et resync des rôles en ~10 secondes. Ton pseudo, avatar et permissions
                suivent partout — hub, VODs et annonces.
              </p>
            </div>
            <SyncPipeline active={flow.visible} />
          </div>
        </section>

        {/* ── BENTO ── */}
        <section className="landing-section landing-bento-section">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <span className="landing-eyebrow justify-center">Plus qu&apos;un site</span>
            <h2 className="landing-section-title mt-4">Tout l&apos;écosystème Gowrax</h2>
          </div>
          <div className="landing-bento mx-auto mt-10 max-w-5xl px-6">
            {BENTO.map((b, i) => (
              <article
                key={b.title}
                className="landing-bento-item"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <b.icon size={22} className="text-[var(--accent)]" />
                <h3 className="mt-3 font-semibold">{b.title}</h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{b.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── ROADMAP ── */}
        <section id="roadmap" className="landing-section landing-roadmap-section">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <span className="landing-eyebrow justify-center">Roadmap</span>
            <h2 className="landing-section-title mt-4">La suite du hub</h2>
            <p className="landing-section-desc mx-auto mt-3 max-w-xl">
              Des modules en préparation pour aller plus loin — dispo, stats live et
              notifications, sans quitter l&apos;écosystème Gowrax.
            </p>
          </div>
          <div className="landing-roadmap mx-auto mt-10 max-w-5xl px-6">
            {ROADMAP.map((item) => (
              <article key={item.title} className="landing-roadmap-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)]">
                    <item.icon size={22} className="text-[var(--accent)]" />
                  </div>
                  <span className="landing-roadmap-badge">Prévu</span>
                </div>
                <h3 className="mt-4 text-lg font-bold leading-snug">{item.title}</h3>
                <p className="mt-0.5 text-sm font-medium text-[var(--accent)]">{item.subtitle}</p>
                <p className="mt-3 text-sm leading-relaxed text-[var(--text-muted)]">{item.desc}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section ref={cta.ref} className="landing-section landing-cta-section">
          <div className={`landing-cta-inner ${cta.visible ? 'is-visible' : ''}`}>
            <div className="landing-cta-glow" aria-hidden />
            <h2 className="landing-cta-title">
              Prêt à entrer
              <br />
              dans le hub ?
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-[var(--text-muted)]">
              Rejoins le hub avec ton compte Discord membre Gowrax — ou installe
              l&apos;app PWA pour un accès encore plus fluide.
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
  item: (typeof SHOWCASE)[number]
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
      <div className={`landing-showcase-inner ${reverse ? 'landing-showcase-reverse' : ''} ${visible ? 'is-visible' : ''}`}>
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
          <div className="landing-visual-frame">
            <Visual active={visible} />
          </div>
        </div>
      </div>
    </section>
  )
}
