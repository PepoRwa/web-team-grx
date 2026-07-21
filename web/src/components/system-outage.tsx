'use client'

import { useState } from 'react'
import { AlertTriangle, Copy, Loader2, RefreshCw, Server } from 'lucide-react'
import {
  incidentDevSummary,
  lifecycleLabel,
  type ApiLifecycle,
  type SystemIncident,
} from '@/lib/system-health'

interface SystemOutageProps {
  incident: SystemIncident
  onRetry: () => void
  retrying?: boolean
  lifecycle?: ApiLifecycle
  attempt?: number
  nextRetryInSec?: number | null
  lastLatencyMs?: number | null
}

export function SystemOutage({
  incident,
  onRetry,
  retrying,
  lifecycle = 'down',
  attempt = 1,
  nextRetryInSec = null,
  lastLatencyMs = null,
}: SystemOutageProps) {
  const [copied, setCopied] = useState(false)
  const warming = lifecycle === 'warming' || incident.likelyColdStart || incident.code === 'API_WARMING'

  const copyRef = async () => {
    const text = incidentDevSummary(incident)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="outage-root">
      <div className="outage-bg" aria-hidden>
        <div className="outage-bg-blob outage-bg-blob-1" />
        <div className="outage-bg-blob outage-bg-blob-2" />
      </div>

      <main className="outage-card">
        <div className={`outage-icon-wrap ${warming ? 'outage-icon-warming' : ''}`}>
          {warming ? (
            <Loader2 size={32} className="animate-spin text-[var(--accent)]" />
          ) : (
            <AlertTriangle size={32} className="text-[var(--accent)]" />
          )}
        </div>

        <p className="outage-lifecycle">
          <Server size={14} />
          {lifecycleLabel(warming ? 'warming' : lifecycle)}
          {attempt > 1 && <span className="opacity-70"> · essai {attempt}</span>}
        </p>

        <h1 className="outage-title">
          {warming ? 'Démarrage de l’API' : 'Service temporairement indisponible'}
        </h1>
        <p className="outage-subtitle">{incident.title}</p>
        <p className="outage-message">{incident.message}</p>

        {warming && (
          <p className="outage-warmup-hint">
            La connexion Discord est <strong>bloquée</strong> tant que l’API n’est pas prête —
            ça évite les sessions à moitié synchronisées.
            {nextRetryInSec != null && nextRetryInSec > 0 && (
              <>
                {' '}
                Prochain essai dans <strong>{nextRetryInSec}s</strong>.
              </>
            )}
          </p>
        )}

        <div className="outage-meta">
          <div className="outage-meta-row">
            <span className="outage-meta-label">Composant</span>
            <span>{incident.component}</span>
          </div>
          <div className="outage-meta-row">
            <span className="outage-meta-label">Code incident</span>
            <code className="outage-code">{incident.code}</code>
          </div>
          {incident.httpStatus != null && (
            <div className="outage-meta-row">
              <span className="outage-meta-label">HTTP</span>
              <code className="outage-code">{incident.httpStatus}</code>
            </div>
          )}
          {lastLatencyMs != null && (
            <div className="outage-meta-row">
              <span className="outage-meta-label">Latence check</span>
              <code className="outage-code">{lastLatencyMs} ms</code>
            </div>
          )}
          <div className="outage-meta-row">
            <span className="outage-meta-label">Référence dev</span>
            <code className="outage-code">{incident.ref}</code>
          </div>
        </div>

        <p className="outage-dev-hint">
          Communique cette référence au développeur pour le diagnostic.
        </p>

        <div className="outage-actions">
          <button
            type="button"
            className="outage-btn outage-btn-primary"
            onClick={onRetry}
            disabled={retrying}
          >
            <RefreshCw size={18} className={retrying ? 'animate-spin' : ''} />
            {retrying ? 'Vérification…' : 'Réessayer maintenant'}
          </button>
          <button type="button" className="outage-btn outage-btn-ghost" onClick={() => void copyRef()}>
            <Copy size={18} />
            {copied ? 'Copié !' : 'Copier les infos'}
          </button>
        </div>

        <p className="outage-foot">
          Gowrax Team Hub · check{' '}
          {new Date(incident.checkedAt).toLocaleString('fr-FR', {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
        </p>
      </main>
    </div>
  )
}
