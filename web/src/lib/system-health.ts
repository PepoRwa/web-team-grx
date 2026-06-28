const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.team.gowrax.me'

export type IncidentCode =
  | 'API_UNREACHABLE'
  | 'API_TIMEOUT'
  | 'API_HTTP_ERROR'
  | 'MYSQL_UNAVAILABLE'
  | 'API_DEGRADED'

export interface SystemIncident {
  ref: string
  code: IncidentCode
  httpStatus?: number
  title: string
  message: string
  component: string
  checkedAt: string
}

export interface HealthPayload {
  status?: string
  service?: string
  checks?: { mysql?: string }
  timestamp?: string
}

function makeRef(code: IncidentCode): string {
  const ts = Date.now().toString(36).toUpperCase()
  return `GRX-${code}-${ts}`
}

export async function checkSystemHealth(): Promise<
  { ok: true } | { ok: false; incident: SystemIncident }
> {
  const checkedAt = new Date().toISOString()

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12_000)

    const res = await fetch(`${API_URL}/health`, {
      signal: controller.signal,
      cache: 'no-store',
    })
    clearTimeout(timer)

    const data = (await res.json().catch(() => ({}))) as HealthPayload
    const mysql = data.checks?.mysql

    if (mysql === 'error' || data.status === 'degraded') {
      return {
        ok: false,
        incident: {
          ref: makeRef('MYSQL_UNAVAILABLE'),
          code: 'MYSQL_UNAVAILABLE',
          httpStatus: res.status,
          title: 'Base de données indisponible',
          message:
            'Le serveur API répond, mais la connexion MySQL (YorkHost) est coupée. Le hub staff ne peut pas fonctionner tant que la base n’est pas de retour.',
          component: 'MySQL · YorkHost',
          checkedAt,
        },
      }
    }

    if (!res.ok) {
      return {
        ok: false,
        incident: {
          ref: makeRef('API_HTTP_ERROR'),
          code: 'API_HTTP_ERROR',
          httpStatus: res.status,
          title: 'API en erreur',
          message:
            'L’API Gowrax a répondu avec une erreur. Réessaie dans quelques minutes ou contacte l’équipe technique.',
          component: 'API Render',
          checkedAt,
        },
      }
    }

    return { ok: true }
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'AbortError'
    const code: IncidentCode = isTimeout ? 'API_TIMEOUT' : 'API_UNREACHABLE'
    return {
      ok: false,
      incident: {
        ref: makeRef(code),
        code,
        title: isTimeout ? 'API injoignable (timeout)' : 'API injoignable',
        message: isTimeout
          ? 'L’API met trop longtemps à répondre — probable panne réseau ou hébergeur (Render / YorkHost).'
          : 'Impossible de joindre l’API (api.team.gowrax.me). Vérifie ta connexion ou réessaie plus tard.',
        component: 'API Render · réseau',
        checkedAt,
      },
    }
  }
}

export function incidentDevSummary(incident: SystemIncident): string {
  return [
    `ref=${incident.ref}`,
    `code=${incident.code}`,
    incident.httpStatus != null ? `http=${incident.httpStatus}` : null,
    `component=${incident.component}`,
    `at=${incident.checkedAt}`,
  ]
    .filter(Boolean)
    .join(' · ')
}
