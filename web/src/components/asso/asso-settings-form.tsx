'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Save } from 'lucide-react'
import {
  ApiError,
  getAssoSettings,
  updateAssoSettings,
  type AssoAssociationSettings,
} from '@/lib/api'

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]'

interface AssoSettingsFormProps {
  accessToken: string
  canEdit: boolean
}

export function AssoSettingsForm({ accessToken, canEdit }: AssoSettingsFormProps) {
  const [settings, setSettings] = useState<AssoAssociationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAssoSettings(accessToken)
      setSettings(data.settings)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Paramètres indisponibles')
    } finally {
      setLoading(false)
    }
  }, [accessToken])

  useEffect(() => {
    void load()
  }, [load])

  function updateField<K extends keyof AssoAssociationSettings>(key: K, value: string) {
    setSettings((s) => (s ? { ...s, [key]: value } : s))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!settings || !canEdit) return
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const data = await updateAssoSettings(accessToken, settings)
      setSettings(data.settings)
      setMessage('Paramètres enregistrés.')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Enregistrement échoué')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="card h-40 animate-pulse bg-lavender/10" />
  if (!settings) return <p className="text-sm text-red-500">{error ?? 'Paramètres introuvables'}</p>

  const fields: { key: keyof AssoAssociationSettings; label: string; type?: string }[] = [
    { key: 'name', label: 'Nom de l\'association' },
    { key: 'tagline', label: 'Slogan' },
    { key: 'objetSocial', label: 'Objet social' },
    { key: 'legalForm', label: 'Forme juridique' },
    { key: 'rna', label: 'RNA' },
    { key: 'siren', label: 'SIREN' },
    { key: 'siret', label: 'SIRET' },
    { key: 'dateCreation', label: 'Date de création' },
    { key: 'datePublicationJo', label: 'Publication JO' },
    { key: 'fiscalYear', label: 'Exercice comptable' },
    { key: 'address', label: 'Adresse' },
    { key: 'postalCode', label: 'Code postal' },
    { key: 'city', label: 'Ville' },
    { key: 'country', label: 'Pays' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'phone', label: 'Téléphone' },
    { key: 'website', label: 'Site web', type: 'url' },
    { key: 'discordUrl', label: 'Discord', type: 'url' },
    { key: 'presidentName', label: 'Président·e' },
    { key: 'treasurerName', label: 'Trésorier·ère' },
    { key: 'secretaryName', label: 'Secrétaire' },
    { key: 'bankName', label: 'Banque' },
    { key: 'ibanMasked', label: 'IBAN (masqué)' },
    { key: 'insuranceRef', label: 'Assurance' },
    { key: 'agrementJeunesse', label: 'Agrément jeunesse' },
  ]

  return (
    <form onSubmit={handleSave} className="card space-y-4 p-6">
      <h3 className="font-semibold">Identité & paramètres généraux</h3>
      {message && <p className="text-sm text-green-600">{message}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map(({ key, label, type }) => (
          <label key={key} className="block space-y-1">
            <span className="text-sm font-medium">{label}</span>
            <input
              type={type ?? 'text'}
              className={inputClass}
              value={String(settings[key] ?? '')}
              onChange={(e) => updateField(key, e.target.value)}
              disabled={!canEdit}
            />
          </label>
        ))}
      </div>

      {canEdit && (
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Enregistrer
        </button>
      )}
    </form>
  )
}
