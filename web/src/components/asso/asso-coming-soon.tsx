import { Construction } from 'lucide-react'

interface AssoComingSoonProps {
  title: string
  description: string
}

export function AssoComingSoon({ title, description }: AssoComingSoonProps) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="card flex flex-col items-center gap-4 p-10 text-center">
        <Construction size={44} className="text-[var(--accent)]" />
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-[var(--text-muted)]">{description}</p>
        <p className="text-xs text-[var(--text-muted)]">
          Module en cours d&apos;intégration depuis asso.gowrax.me
        </p>
      </div>
    </main>
  )
}
