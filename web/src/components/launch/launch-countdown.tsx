'use client'

interface LaunchCountdownProps {
  secondsRemaining: number
  progress: number
  label?: string
}

export function LaunchCountdown({ secondsRemaining, progress, label }: LaunchCountdownProps) {
  const h = Math.floor(secondsRemaining / 3600)
  const m = Math.floor((secondsRemaining % 3600) / 60)
  const s = secondsRemaining % 60

  const parts = [
    { value: String(h).padStart(2, '0'), unit: 'h' },
    { value: String(m).padStart(2, '0'), unit: 'm' },
    { value: String(s).padStart(2, '0'), unit: 's' },
  ]

  return (
    <div className="launch-countdown">
      {label && <p className="launch-countdown-label">{label}</p>}
      <div className="launch-countdown-digits">
        {parts.map((p, i) => (
          <div key={p.unit} className="flex items-center gap-2 sm:gap-3">
            {i > 0 && <span className="launch-countdown-sep">:</span>}
            <div className="launch-countdown-block">
              <span className="launch-countdown-value">{p.value}</span>
              <span className="launch-countdown-unit">{p.unit}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="launch-progress-track mt-6">
        <div
          className="launch-progress-fill"
          style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
        />
      </div>
      <p className="mt-2 text-center text-xs text-[var(--text-muted)]">Ouverture à 19h30</p>
    </div>
  )
}
