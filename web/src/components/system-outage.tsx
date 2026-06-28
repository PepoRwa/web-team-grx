'use client'

import { useState } from 'react'
import { AlertTriangle, Copy, RefreshCw } from 'lucide-react'
import {
  incidentDevSummary,
  type SystemIncident,
} from '@/lib/system-health'

interface SystemOutageProps {
  incident: SystemIncident
  onRetry: () => void
  retrying?: boolean
}

export function SystemOutage({ incident, onRetry, retrying }: SystemOutageProps) {
  const [copied, setCopied] = useState(false)

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
        <div className="outage-icon-wrap">
          <AlertTriangle size={32} className="text-[var(--accent)]" />
        </div>

        <h1 className="outage-title">Service temporairement indisponible</h1>
        <p className="outage-subtitle">{incident.title}</p>
        <p className="outage-message">{incident.message}</p>

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
            {retrying ? 'Vérification…' : 'Réessayer'}
          </button>
          <button type="button" className="outage-btn outage-btn-ghost" onClick={() => void copyRef()}>
            <Copy size={18} />
            {copied ? 'Copié !' : 'Copier les infos'}
          </button>
        </div>

        <p className="outage-foot">
          Gowrax Team Hub · incident détecté{' '}
          {new Date(incident.checkedAt).toLocaleString('fr-FR', {
            dateStyle: 'short',
            timeStyle: 'short',
          })}
        </p>
      </main>
    </div>
  )
}
