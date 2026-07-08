'use client'

import Link from 'next/link'
import type { TryoutCandidate, TryoutPipelineStatus } from '@/lib/api'
import { candidateDisplayName, pipelineBadgeClass, pipelineLabel } from '@/lib/tryouts'

interface TryoutPipelineBoardProps {
  columns: { status: TryoutPipelineStatus; candidates: TryoutCandidate[] }[]
  campaignId: number
}

export function TryoutPipelineBoard({ columns, campaignId }: TryoutPipelineBoardProps) {
  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex min-w-max gap-3">
        {columns.map((col) => (
          <div
            key={col.status}
            className="w-56 shrink-0 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/60"
          >
            <div className="border-b border-[var(--border)] px-3 py-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                {pipelineLabel(col.status)}
              </p>
              <p className="text-lg font-bold">{col.candidates.length}</p>
            </div>
            <ul className="max-h-80 space-y-2 overflow-y-auto p-2">
              {col.candidates.length === 0 ? (
                <li className="px-2 py-4 text-center text-xs text-[var(--text-muted)]">Vide</li>
              ) : (
                col.candidates.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/hub/tryouts/candidates/view/?id=${c.id}&campaignId=${campaignId}`}
                      className="block rounded-lg border border-[var(--border)] bg-[var(--bg)] p-2 transition hover:border-[var(--accent)]"
                    >
                      <p className="truncate text-sm font-medium">{candidateDisplayName(c)}</p>
                      {c.currentRank && (
                        <p className="mt-0.5 text-xs text-[var(--text-muted)]">{c.currentRank}</p>
                      )}
                      <span className={`badge mt-2 text-[10px] ${pipelineBadgeClass(col.status)}`}>
                        {pipelineLabel(col.status)}
                      </span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
