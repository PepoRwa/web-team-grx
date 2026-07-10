'use client'

import { ExternalLink } from 'lucide-react'
import type { AssoDossier } from '@/lib/api'

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-[var(--border)] py-3 last:border-0 sm:flex-row sm:justify-between">
      <span className="text-sm text-[var(--text-muted)]">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

interface AssoDossierDetailProps {
  dossier: AssoDossier
  bureauView?: boolean
}

export function AssoDossierDetail({ dossier, bureauView }: AssoDossierDetailProps) {
  return (
    <div className="card divide-y divide-[var(--border)] p-6">
      <div className="pb-4">
        <h2 className="text-xl font-bold">{dossier.pseudo}</h2>
        <p className="text-sm text-[var(--text-muted)]">
          {dossier.firstName} {dossier.lastName}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className={`badge ${dossier.status === 'actif' ? 'badge-mint' : ''}`}>
            {dossier.status}
          </span>
          {dossier.siteAccess ? (
            <span className="badge badge-lavender">Accès site</span>
          ) : (
            <span className="badge">Accès coupé</span>
          )}
          {dossier.discordId ? (
            <span className="badge">Lié Discord</span>
          ) : (
            <span className="badge">Non lié</span>
          )}
        </div>
      </div>

      <div>
        {bureauView && (
          <>
            <Row label="Discord ID" value={dossier.discordId ?? '—'} />
            <Row label="Pseudo Discord" value={dossier.discordPseudo ?? '—'} />
          </>
        )}
        <Row label="Email" value={dossier.email ?? '—'} />
        <Row label="Téléphone" value={dossier.phone ?? '—'} />
        <Row label="Riot ID" value={dossier.riotId ?? '—'} />
        <Row label="Cotisation" value={`${dossier.cotisationType} · ${dossier.cotisationStatus}`} />
        <Row label="Adhésion depuis" value={dossier.joinedAt} />
        {dossier.teamTrackerUrl && (
          <Row
            label="Tracker team"
            value={
              <a
                href={dossier.teamTrackerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[var(--accent)]"
              >
                Profil esport
                <ExternalLink size={14} />
              </a>
            }
          />
        )}
        <Row
          label="Tracker asso"
          value={
            dossier.trackerUrl ? (
              <a
                href={dossier.trackerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[var(--accent)]"
              >
                Dossier
                <ExternalLink size={14} />
              </a>
            ) : (
              '—'
            )
          }
        />
      </div>
    </div>
  )
}
