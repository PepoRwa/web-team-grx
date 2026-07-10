'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { ApiError, listAssoLinkCandidates, type AssoLinkCandidate } from '@/lib/api'

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]'

interface LinkCandidatePickerProps {
  accessToken: string
  selectedDiscordId: string | null
  onSelect: (candidate: AssoLinkCandidate | null) => void
}

export function LinkCandidatePicker({
  accessToken,
  selectedDiscordId,
  onSelect,
}: LinkCandidatePickerProps) {
  const [search, setSearch] = useState('')
  const [candidates, setCandidates] = useState<AssoLinkCandidate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualId, setManualId] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await listAssoLinkCandidates(accessToken, search.trim() || undefined)
      setCandidates(data.candidates)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Liste indisponible')
    } finally {
      setLoading(false)
    }
  }, [accessToken, search])

  useEffect(() => {
    const t = setTimeout(() => void load(), 300)
    return () => clearTimeout(t)
  }, [load])

  function selectManual() {
    const id = manualId.trim()
    if (!/^\d{17,20}$/.test(id)) {
      setError('ID Discord invalide (17–20 chiffres)')
      return
    }
    setError(null)
    onSelect({
      discordId: id,
      username: null,
      displayName: null,
      avatarUrl: null,
      email: null,
      riotId: null,
      teamTrackerUrl: null,
      alreadyLinked: false,
      linkedDossierId: null,
    })
  }

  return (
    <div className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
      <div>
        <p className="text-sm font-medium">Lier un compte Discord</p>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Choisis un membre team ou saisis un ID manuellement. Optionnel à la création.
        </p>
      </div>

      <label className="relative block">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          className={`${inputClass} pl-9`}
          placeholder="Pseudo, Riot ID, Discord ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>

      {loading && (
        <p className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Loader2 size={16} className="animate-spin" />
          Chargement…
        </p>
      )}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <ul className="max-h-48 space-y-2 overflow-y-auto">
        {candidates.map((c) => {
          const selected = selectedDiscordId === c.discordId
          const label = c.displayName ?? c.username ?? c.discordId
          return (
            <li key={c.discordId}>
              <button
                type="button"
                disabled={c.alreadyLinked}
                onClick={() => onSelect(c)}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition ${
                  selected
                    ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                    : 'border-[var(--border)] hover:border-[var(--accent)]'
                } ${c.alreadyLinked ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <Image
                  src={c.avatarUrl ?? 'https://cdn.discordapp.com/embed/avatars/0.png'}
                  alt=""
                  width={36}
                  height={36}
                  className="rounded-lg"
                  unoptimized
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{label}</p>
                  <p className="truncate text-xs text-[var(--text-muted)]">{c.discordId}</p>
                </div>
                {c.alreadyLinked && (
                  <span className="text-[10px] uppercase text-[var(--text-muted)]">Lié</span>
                )}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="border-t border-[var(--border)] pt-4">
        <p className="mb-2 text-xs font-medium text-[var(--text-muted)]">Ou ID manuel</p>
        <div className="flex gap-2">
          <input
            className={inputClass}
            placeholder="123456789012345678"
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
          />
          <button type="button" className="btn-secondary shrink-0" onClick={selectManual}>
            Utiliser
          </button>
        </div>
      </div>

      {selectedDiscordId && (
        <button
          type="button"
          className="text-xs text-[var(--text-muted)] underline"
          onClick={() => onSelect(null)}
        >
          Retirer la sélection
        </button>
      )}
    </div>
  )
}
