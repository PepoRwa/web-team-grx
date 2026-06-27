'use client'

import { Download, Share, Smartphone, X } from 'lucide-react'
import { usePwaInstall } from '@/hooks/usePwaInstall'

interface PwaInstallBannerProps {
  /** landing = bas écran ; hub = au-dessus de la bottom nav */
  placement?: 'landing' | 'hub'
}

export function PwaInstallBanner({ placement = 'landing' }: PwaInstallBannerProps) {
  const { showBanner, isIOS, hasNativePrompt, install, dismiss } = usePwaInstall()

  if (!showBanner) return null

  const isHub = placement === 'hub'

  return (
    <div
      className={`pwa-install-banner ${isHub ? 'pwa-install-banner-hub' : 'pwa-install-banner-landing'}`}
      role="region"
      aria-label="Installation application"
    >
      <div className="pwa-install-inner">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)]">
          <Smartphone size={20} className="text-[var(--accent)]" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug">
            Installe le hub Gowrax
            <span className="ml-1.5 rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--accent)]">
              Recommandé
            </span>
          </p>
          <p className="mt-0.5 text-xs leading-relaxed text-[var(--text-muted)]">
            {isIOS ? (
              <>
                Touche <Share size={12} className="mx-0.5 inline align-text-bottom" /> puis{' '}
                <strong>Sur l&apos;écran d&apos;accueil</strong> — accès rapide, plein écran.
              </>
            ) : hasNativePrompt ? (
              'Accès direct depuis ton écran d\'accueil, sans barre d\'adresse — comme une vraie app.'
            ) : (
              'Via le menu du navigateur : « Installer l\'application » ou « Ajouter à l\'écran d\'accueil ».'
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {hasNativePrompt && (
            <button type="button" className="pwa-install-btn" onClick={() => void install()}>
              <Download size={14} />
              <span className="hidden sm:inline">Installer</span>
            </button>
          )}
          <button
            type="button"
            className="pwa-install-dismiss"
            onClick={dismiss}
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
