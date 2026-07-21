const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.team.gowrax.me'
const IS_LOCAL_API = /localhost|127\.0\.0\.1/.test(API_URL)

/** Timeout health — assez court pour UX ; le cold start Render se gère en retry. */
export const HEALTH_TIMEOUT_MS = 8_000

export type IncidentCode =
  | 'API_UNREACHABLE'
  | 'API_TIMEOUT'
  | 'API_WARMING'
  | 'API_HTTP_ERROR'
  | 'MYSQL_UNAVAILABLE'
  | 'API_DEGRADED'

export type ApiLifecycle =
  | 'checking'
  | 'warming'
  | 'ready'
  | 'degraded'
  | 'down'

export interface SystemIncident {
  ref: string
  code: IncidentCode
  httpStatus?: number
  title: string
  message: string
  component: string
  checkedAt: string
  /** Cold start / wake hébergeur probable — auto-retry recommandé. */
  likelyColdStart: boolean
}

export interface HealthPayload {
  status?: string
  service?: string
  checks?: { mysql?: string }
  timestamp?: string
  env?: string
  version?: string
}

export interface HealthOk {
  ok: true
  lifecycle: 'ready'
  latencyMs: number
  payload: HealthPayload
}

export interface HealthFail {
  ok: false
  lifecycle: 'warming' | 'degraded' | 'down'
  incident: SystemIncident
  latencyMs: number
}

function makeRef(code: IncidentCode): string {
  const ts = Date.now().toString(36).toUpperCase()
  return `GRX-${code}-${ts}`
}

function buildIncident(
  code: IncidentCode,
  fields: {
    title: string
    message: string
    component: string
    checkedAt: string
    likelyColdStart: boolean
    httpStatus?: number
  },
): SystemIncident {
  return {
    ref: makeRef(code),
    code,
    ...fields,
  }
}

function isColdStartStatus(httpStatus: number): boolean {
  return httpStatus === 502 || httpStatus === 503 || httpStatus === 504 || httpStatus === 520
}

export async function checkSystemHealth(): Promise<HealthOk | HealthFail> {
  const checkedAt = new Date().toISOString()
  const started = performance.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS)

  try {
    const res = await fetch(`${API_URL}/health`, {
      signal: controller.signal,
      cache: 'no-store',
    })
    clearTimeout(timer)
    const latencyMs = Math.round(performance.now() - started)
    const data = (await res.json().catch(() => ({}))) as HealthPayload
    const mysql = data.checks?.mysql

    if (isColdStartStatus(res.status)) {
      return {
        ok: false,
        lifecycle: 'warming',
        latencyMs,
        incident: buildIncident('API_WARMING', {
          httpStatus: res.status,
          title: 'API en cours de démarrage',
          message: IS_LOCAL_API
            ? `L’API locale répond ${res.status}. Vérifie que \`npm run dev\` tourne dans api/.`
            : 'Le serveur Render se réveille (cold start). Ça peut prendre 30 à 60 secondes — on réessaie automatiquement. Ne te connecte pas via Discord tant que ce n’est pas prêt.',
          component: IS_LOCAL_API ? 'API locale · :4000' : 'API Render · cold start',
          checkedAt,
          likelyColdStart: true,
        }),
      }
    }

    if (mysql === 'error' || data.status === 'degraded') {
      return {
        ok: false,
        lifecycle: 'degraded',
        latencyMs,
        incident: buildIncident('MYSQL_UNAVAILABLE', {
          httpStatus: res.status,
          title: 'Base de données indisponible',
          message:
            'L’API répond, mais MySQL (YorkHost) est injoignable. Le hub ne peut pas synchroniser les comptes.',
          component: 'MySQL · YorkHost',
          checkedAt,
          likelyColdStart: false,
        }),
      }
    }

    if (!res.ok) {
      return {
        ok: false,
        lifecycle: 'down',
        latencyMs,
        incident: buildIncident('API_HTTP_ERROR', {
          httpStatus: res.status,
          title: 'API en erreur',
          message: `L’API a répondu HTTP ${res.status}. Réessaie dans quelques minutes.`,
          component: IS_LOCAL_API ? 'API locale' : 'API Render',
          checkedAt,
          likelyColdStart: false,
        }),
      }
    }

    return {
      ok: true,
      lifecycle: 'ready',
      latencyMs,
      payload: data,
    }
  } catch (err: unknown) {
    clearTimeout(timer)
    const latencyMs = Math.round(performance.now() - started)
    const isTimeout = err instanceof Error && err.name === 'AbortError'
    // Prod timeout / réseau = souvent cold start. Local sans réponse = API pas lancée.
    const likelyColdStart = !IS_LOCAL_API
    const code: IncidentCode = likelyColdStart
      ? 'API_WARMING'
      : isTimeout
        ? 'API_TIMEOUT'
        : 'API_UNREACHABLE'

    return {
      ok: false,
      lifecycle: likelyColdStart ? 'warming' : 'down',
      latencyMs,
      incident: buildIncident(code, {
        title: likelyColdStart
          ? 'API en cours de démarrage'
          : isTimeout
            ? 'API injoignable (timeout)'
            : 'API injoignable',
        message: likelyColdStart
          ? `L’API (${API_URL}) ne répond pas encore — démarrage Render probable (30–60 s). Réessai auto. N’ouvre pas Discord tant que le statut n’est pas « prêt ».`
          : isTimeout
            ? `Pas de réponse de ${API_URL} sous ${HEALTH_TIMEOUT_MS / 1000}s. Lance \`cd api && npm run dev\`.`
            : `Impossible de joindre ${API_URL}. Lance l’API locale ou pointe NEXT_PUBLIC_API_URL vers la prod.`,
        component: IS_LOCAL_API
          ? 'API locale · :4000'
          : likelyColdStart
            ? 'API Render · cold start'
            : 'API Render · réseau',
        checkedAt,
        likelyColdStart,
      }),
    }
  }
}

export function incidentDevSummary(incident: SystemIncident): string {
  return [
    `ref=${incident.ref}`,
    `code=${incident.code}`,
    incident.likelyColdStart ? 'coldStart=1' : null,
    incident.httpStatus != null ? `http=${incident.httpStatus}` : null,
    `component=${incident.component}`,
    `at=${incident.checkedAt}`,
    `api=${API_URL}`,
  ]
    .filter(Boolean)
    .join(' · ')
}

export function lifecycleLabel(lifecycle: ApiLifecycle): string {
  switch (lifecycle) {
    case 'checking':
      return 'Vérification…'
    case 'warming':
      return 'Démarrage API…'
    case 'ready':
      return 'API prête'
    case 'degraded':
      return 'API dégradée'
    case 'down':
      return 'API hors service'
  }
}
