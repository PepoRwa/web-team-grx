'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { ApiError, exportAssoDossierRgpd, exportMyAssoRgpd } from '@/lib/api'

interface AssoRgpdExportButtonProps {
  accessToken: string
  dossierId?: number
  fileName: string
}

export function AssoRgpdExportButton({
  accessToken,
  dossierId,
  fileName,
}: AssoRgpdExportButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleExport() {
    setLoading(true)
    setError(null)
    try {
      const blob = dossierId
        ? await exportAssoDossierRgpd(accessToken, dossierId)
        : await exportMyAssoRgpd(accessToken)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Export impossible')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={loading}
        onClick={() => void handleExport()}
        className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-sm font-medium hover:bg-[var(--bg)] disabled:opacity-50"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        Exporter mes données (RGPD)
      </button>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
