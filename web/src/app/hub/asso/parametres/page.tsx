'use client'

import { AssoPermissionsPanel } from '@/components/asso/asso-permissions-panel'
import { AssoSettingsForm } from '@/components/asso/asso-settings-form'
import { AssoShell } from '@/components/asso/asso-shell'
import { useAssoGate } from '@/hooks/useAssoGate'

export default function AssoParametresPage() {
  const { session, access, ready } = useAssoGate({ module: 'parametres', moduleMin: 'lecture' })

  const parametresLevel = access.modules?.parametres ?? 'aucun'
  const canEditSettings = parametresLevel === 'edition' || parametresLevel === 'admin'

  if (!ready) return null

  return (
    <AssoShell activeNav="parametres" title="Paramètres asso">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <AssoSettingsForm
          accessToken={session!.access_token}
          canEdit={canEditSettings}
        />

        <AssoPermissionsPanel
          accessToken={session!.access_token}
          enabled={Boolean(access.canManagePermissions)}
        />

        {!access.canManagePermissions && (
          <p className="text-sm text-[var(--text-muted)]">
            La gestion des permissions est réservée au président ou aux admins paramètres.
          </p>
        )}
      </div>
    </AssoShell>
  )
}
