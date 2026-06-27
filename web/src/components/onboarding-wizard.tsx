'use client'

import Image from 'next/image'
import { useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Eye,
  Loader2,
  PartyPopper,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { OnboardingProfilePreview } from '@/components/onboarding-profile-preview'
import { useAuth } from '@/hooks/useAuth'
import { ApiError, updateMyProfile, type ProfileGame } from '@/lib/api'

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]'

const STEPS = ['identity', 'profile', 'preview'] as const
type Step = (typeof STEPS)[number]

const STEP_LABELS: Record<Step, string> = {
  identity: 'Identité',
  profile: 'Profil',
  preview: 'Aperçu',
}

export function OnboardingWizard() {
  const {
    session,
    user,
    permissions,
    loading,
    syncing,
    error: authError,
    retryIdentitySync,
    refresh,
  } = useAuth()

  const [step, setStep] = useState<Step>('identity')
  const [retrying, setRetrying] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [displayName, setDisplayName] = useState('')
  const [game, setGame] = useState<ProfileGame>('valorant')
  const [riotId, setRiotId] = useState('')
  const [steamId, setSteamId] = useState('')
  const [trackerUrl, setTrackerUrl] = useState('')
  const [notifyVodDm, setNotifyVodDm] = useState(true)
  const [notifyStratDm, setNotifyStratDm] = useState(true)

  if (loading || !session || !user) return null
  if (user.onboardingCompletedAt) return null

  const identityOk = Boolean(user.username && permissions?.canAccessSite)
  const rolesOk = Boolean(permissions?.roles.length)
  const syncIssue = authError || !identityOk || !rolesOk
  const stepIndex = STEPS.indexOf(step)

  async function handleRetrySync() {
    setRetrying(true)
    setFormError(null)
    try {
      await retryIdentitySync()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Sync échouée')
    } finally {
      setRetrying(false)
    }
  }

  function handleGoToPreview(e: React.FormEvent) {
    e.preventDefault()
    if (displayName.trim().length < 2) {
      setFormError('Pseudo d\'affichage requis (2 caractères min.)')
      return
    }
    setFormError(null)
    setStep('preview')
  }

  async function handleFinish() {
    if (!session?.access_token || displayName.trim().length < 2) {
      setFormError('Pseudo d\'affichage requis (2 caractères min.)')
      return
    }
    setSaving(true)
    setFormError(null)
    try {
      await updateMyProfile(session.access_token, {
        displayName: displayName.trim(),
        game,
        riotId: riotId.trim() || null,
        steamId: steamId.trim() || null,
        trackerUrl: trackerUrl.trim() || null,
        notifyVodDm,
        notifyStratDm,
        completeOnboarding: true,
      })
      await refresh()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Enregistrement échoué')
    } finally {
      setSaving(false)
    }
  }

  const avatar = user.avatarUrl ?? 'https://cdn.discordapp.com/embed/avatars/0.png'

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 sm:p-8">
      <div className="absolute inset-0 bg-[var(--bg)]/95 backdrop-blur-md" aria-hidden />

      <div className="relative flex max-h-[94vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--bg-elevated)] shadow-2xl">
        <div className="border-b border-[var(--border)] px-6 py-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
            <Sparkles size={14} />
            Bienvenue sur le hub Gowrax
          </div>
          <div className="mt-3 flex gap-2">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1.5 flex-1 rounded-full transition ${
                  i <= stepIndex ? 'bg-[var(--accent)]' : 'bg-[var(--border)]'
                } ${i < stepIndex ? 'opacity-60' : ''}`}
                title={STEP_LABELS[s]}
              />
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {step === 'identity' ? (
            <>
              <h2 className="text-xl font-bold">Ton identité Discord</h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Voici ce que le site a enregistré via Supabase + le bot. Si quelque chose cloche,
                resynchronise avant de configurer ton profil.
              </p>

              <div className="mt-6 flex items-center gap-4 rounded-2xl bg-[var(--accent-soft)]/40 p-4">
                <Image src={avatar} alt="" width={64} height={64} className="rounded-2xl" unoptimized />
                <div className="min-w-0">
                  <p className="font-semibold">{user.username ?? '—'}</p>
                  <p className="text-xs text-[var(--text-muted)]">ID {user.discordId}</p>
                </div>
              </div>

              <ul className="mt-6 space-y-3">
                <StatusRow
                  ok={Boolean(user.username)}
                  label="Compte Discord lié"
                  detail={user.username ?? 'Pseudo introuvable'}
                />
                <StatusRow
                  ok={permissions?.canAccessSite ?? false}
                  label="Accès membre Gowrax"
                  detail={
                    permissions?.canAccessSite
                      ? 'Rôle Membre détecté'
                      : 'En attente — resync si tu viens de rejoindre'
                  }
                />
                <StatusRow
                  ok={rolesOk}
                  label="Rôles synchronisés"
                  detail={
                    rolesOk
                      ? permissions!.roles.map((r) => r.name).join(', ')
                      : 'Aucun rôle — le bot doit sync (quelques secondes)'
                  }
                />
              </ul>

              {(authError || syncIssue) && (
                <div className="mt-4 flex gap-2 rounded-xl border border-amber-200/60 bg-amber-50/80 p-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
                  <AlertCircle size={18} className="shrink-0" />
                  <p>
                    {authError ??
                      'Identité incomplète. Clique sur resynchroniser — le bot met à jour les rôles sous ~10 s.'}
                  </p>
                </div>
              )}

              <button
                type="button"
                className="btn-ghost mt-4 w-full"
                disabled={retrying || syncing}
                onClick={() => void handleRetrySync()}
              >
                {retrying || syncing ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <RefreshCw size={16} />
                )}
                Resynchroniser identité & rôles
              </button>

              {!identityOk && (
                <p className="mt-3 text-center text-xs text-[var(--text-muted)]">
                  Le bouton Continuer s&apos;active quand ton compte Discord et le rôle Membre
                  sont détectés.
                </p>
              )}
            </>
          ) : step === 'profile' ? (
            <form id="onboarding-profile" onSubmit={handleGoToPreview} className="space-y-4">
              <h2 className="text-xl font-bold">Configure ton profil</h2>
              <p className="text-sm text-[var(--text-muted)]">
                Ces infos apparaissent sur le site, les VODs et les annonces — pas ton pseudo Discord
                ({user.username}).
              </p>

              <label className="block space-y-1">
                <span className="text-sm font-medium">Pseudo d&apos;affichage *</span>
                <input
                  className={inputClass}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex. Crazzynel"
                  maxLength={50}
                  required
                  autoFocus
                />
              </label>

              <label className="block space-y-1">
                <span className="text-sm font-medium">Jeu principal</span>
                <select
                  className={inputClass}
                  value={game}
                  onChange={(e) => setGame(e.target.value as ProfileGame)}
                >
                  <option value="valorant">Valorant</option>
                  <option value="cs2">CS2</option>
                  <option value="other">Autre</option>
                </select>
              </label>

              {game === 'valorant' && (
                <label className="block space-y-1">
                  <span className="text-sm font-medium">Riot ID</span>
                  <input
                    className={inputClass}
                    value={riotId}
                    onChange={(e) => setRiotId(e.target.value)}
                    placeholder="Pseudo#TAG"
                    maxLength={50}
                  />
                </label>
              )}

              {game === 'cs2' && (
                <label className="block space-y-1">
                  <span className="text-sm font-medium">Steam (profil ou ID)</span>
                  <input
                    className={inputClass}
                    value={steamId}
                    onChange={(e) => setSteamId(e.target.value)}
                    placeholder="steamcommunity.com/…"
                    maxLength={50}
                  />
                </label>
              )}

              <label className="block space-y-1">
                <span className="text-sm font-medium">Tracker.gg (optionnel)</span>
                <input
                  className={inputClass}
                  type="url"
                  value={trackerUrl}
                  onChange={(e) => setTrackerUrl(e.target.value)}
                  placeholder="https://tracker.gg/…"
                  maxLength={255}
                />
              </label>

              <fieldset className="space-y-2 border-t border-[var(--border)] pt-4">
                <legend className="text-sm font-medium">Notifications DM bot</legend>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={notifyVodDm} onChange={(e) => setNotifyVodDm(e.target.checked)} />
                  Nouvelles VODs
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={notifyStratDm} onChange={(e) => setNotifyStratDm(e.target.checked)} />
                  Nouvelles strats
                </label>
              </fieldset>

              {formError && <p className="text-sm text-red-500">{formError}</p>}
            </form>
          ) : (
            <>
              <OnboardingProfilePreview
                displayName={displayName}
                username={user.username}
                avatarUrl={avatar}
                game={game}
                riotId={riotId}
                steamId={steamId}
                trackerUrl={trackerUrl}
                roles={permissions?.roles ?? []}
              />
              {formError && <p className="mt-4 text-center text-sm text-red-500">{formError}</p>}
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-[var(--border)] p-6">
          {step === 'identity' ? (
            <button
              type="button"
              className="btn-primary w-full"
              disabled={!identityOk}
              title={
                identityOk
                  ? undefined
                  : 'Resynchronise jusqu’à ce que l’accès membre soit détecté'
              }
              onClick={() => {
                setDisplayName(user.publicName ?? user.username ?? '')
                setGame((user.game as ProfileGame) ?? 'valorant')
                setRiotId(user.riotId ?? '')
                setSteamId(user.steamId ?? '')
                setTrackerUrl(user.trackerUrl ?? '')
                setStep('profile')
              }}
            >
              Continuer
              <ChevronRight size={18} />
            </button>
          ) : step === 'profile' ? (
            <div className="flex gap-3">
              <button type="button" className="btn-ghost flex-1" onClick={() => setStep('identity')}>
                Retour
              </button>
              <button
                type="submit"
                form="onboarding-profile"
                className="btn-primary flex-[2]"
                disabled={displayName.trim().length < 2}
              >
                <Eye size={16} />
                Voir l&apos;aperçu
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                type="button"
                className="btn-ghost flex-1"
                disabled={saving}
                onClick={() => {
                  setFormError(null)
                  setStep('profile')
                }}
              >
                Modifier
              </button>
              <button
                type="button"
                className="featured-read-btn flex-[2] text-sm"
                disabled={saving}
                onClick={() => void handleFinish()}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Enregistrement…
                  </>
                ) : (
                  <>
                    <PartyPopper size={16} />
                    C&apos;est parfait — entrer dans le hub
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatusRow({
  ok,
  label,
  detail,
}: {
  ok: boolean
  label: string
  detail: string
}) {
  return (
    <li className="flex gap-3 rounded-xl border border-[var(--border)] p-3">
      {ok ? (
        <CheckCircle2 size={20} className="shrink-0 text-emerald-500" />
      ) : (
        <AlertCircle size={20} className="shrink-0 text-amber-500" />
      )}
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-[var(--text-muted)]">{detail}</p>
      </div>
    </li>
  )
}
