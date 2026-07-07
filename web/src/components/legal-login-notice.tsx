/** Mention légale affichée sur les écrans de connexion team.gowrax.me */
export function LegalLoginNotice({ className = '' }: { className?: string }) {
  return (
    <p
      className={`text-xs leading-relaxed text-[var(--text-muted)] ${className}`.trim()}
    >
      L&apos;utilisation des services de team.gowrax.me s&apos;effectue en application conforme
      des lois françaises en vigueur et des documents suivants :{' '}
      <a
        href="https://gowrax.me/privacy"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
      >
        Politique de confidentialité
      </a>
      {' · '}
      <a
        href="https://gowrax.me/cgu"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium text-[var(--accent)] underline-offset-2 hover:underline"
      >
        CGU
      </a>
      .
    </p>
  )
}
