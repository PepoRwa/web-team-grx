const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.team.gowrax.me'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function apiFetch<T>(
  path: string,
  accessToken: string,
  options: RequestInit = {},
): Promise<T> {
  const maxAttempts = options.method && options.method !== 'GET' ? 1 : 2
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(`${API_URL}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
          ...options.headers,
        },
      })

      const data = (await res.json().catch(() => ({}))) as T & {
        error?: string
        code?: string
      }

      if (!res.ok) {
        const err = new ApiError(data.error ?? 'Erreur API', res.status, data.code)
        const isGet = !options.method || options.method === 'GET'
        const canRetryNotMember =
          attempt < maxAttempts &&
          isGet &&
          res.status === 403 &&
          data.code === 'NOT_MEMBER'

        // Cas "rôles Discord pas encore synchros" : on retente une fois après avoir
        // demandé au bot une resync. Évite la boucle 403 en log.
        if (canRetryNotMember) {
          await fetch(`${API_URL}/auth/resync-roles`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }).catch(() => {})
          await new Promise((r) => setTimeout(r, 1200))
          lastError = err
          continue
        }

        if (attempt < maxAttempts && (res.status >= 500 || res.status === 429)) {
          await new Promise((r) => setTimeout(r, 800 * attempt))
          lastError = err
          continue
        }
        throw err
      }

      return data
    } catch (err) {
      if (err instanceof ApiError) throw err
      lastError = err instanceof Error ? err : new Error('Erreur réseau')
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 800 * attempt))
        continue
      }
    }
  }

  throw lastError ?? new Error('Erreur API')
}

export interface UserPermissions {
  discordId: string
  roleIds: string[]
  roles: { roleId: string; name: string; category: string; permissionLevel: number }[]
  isMember: boolean
  isCEO: boolean
  isTeamManager: boolean
  isHeadCoach: boolean
  isCoach: boolean
  isStaff: boolean
  isCaptain: boolean
  isFounder: boolean
  rosters: string[]
  canTransmit: boolean
  canModerate: boolean
  canAccessSite: boolean
  canScout: boolean
  canAdmin: boolean
}

export interface HubUser {
  discordId: string
  username: string | null
  displayName: string | null
  publicName: string | null
  avatarUrl: string | null
  twitchUsername: string | null
  trackerUrl: string | null
  riotId: string | null
  steamId: string | null
  game: string
  onboardingCompletedAt: string | null
}

export interface SyncResponse {
  user: HubUser
  permissions: UserPermissions
  roleSyncRequested: boolean
}

export async function syncSession(accessToken: string) {
  return apiFetch<SyncResponse>('/auth/sync', accessToken, { method: 'POST' })
}

export async function getMe(accessToken: string) {
  return apiFetch<{ user: HubUser; permissions: UserPermissions }>(
    '/auth/me',
    accessToken,
  )
}

export async function resyncRoles(accessToken: string) {
  return apiFetch<{ ok: boolean }>('/auth/resync-roles', accessToken, {
    method: 'POST',
  })
}

export async function checkApiHealth() {
  const res = await fetch(`${API_URL}/health`)
  return res.json() as Promise<{ status: string; checks: { mysql: string } }>
}

// ─── Launch ───────────────────────────────────────────────────────────────────

export type LaunchPhase = 'countdown' | 'celebration' | 'live'

export interface LaunchStatus {
  phase: LaunchPhase
  isActive: boolean
  opensAt: string
  celebrationEndsAt: string | null
  secondsRemaining: number
  progress: number
  ceoMessageTitle: string | null
  ceoMessageBody: string | null
  manualUnlock: boolean
}

export async function getLaunchStatus() {
  const res = await fetch(`${API_URL}/launch/status`)
  const data = (await res.json().catch(() => ({}))) as {
    status?: LaunchStatus
    error?: string
  }
  if (!res.ok) throw new ApiError(data.error ?? 'Erreur launch', res.status)
  return data as { status: LaunchStatus }
}

// ─── Saison / objectif ────────────────────────────────────────────────────────

export interface SeasonBanner {
  title: string
  description: string | null
  deadline: string | null
  icon: string | null
  updatedAt: string
}

export async function getSeasonBanner(accessToken: string) {
  return apiFetch<{ banner: SeasonBanner | null }>('/season', accessToken)
}

// ─── VODs ───────────────────────────────────────────────────────────────────

export type VodStatus = 'win' | 'loss' | 'draw'

export interface VodPlayer {
  discordId: string
  username: string | null
}

export interface Vod {
  id: number
  authorDiscordId: string
  authorUsername: string | null
  title: string
  link: string
  map: string
  matchDate: string
  status: VodStatus
  score: string
  opponent: string | null
  isPro: boolean
  descriptionPro: string | null
  playersPresent: string[]
  players: VodPlayer[]
  reviewedAt: string | null
  reviewedByDiscordId: string | null
  notifyDiscord: boolean
  createdAt: string
  updatedAt: string
}

export interface VodComment {
  id: number
  vodId: number
  authorDiscordId: string
  authorUsername: string | null
  content: string
  isPrivate: boolean
  createdAt: string
}

export interface VodListResponse {
  items: Vod[]
  total: number
  page: number
  limit: number
}

export async function listVods(
  accessToken: string,
  params: { page?: number; limit?: number; isPro?: boolean; search?: string } = {},
) {
  const qs = new URLSearchParams()
  if (params.page) qs.set('page', String(params.page))
  if (params.limit) qs.set('limit', String(params.limit))
  if (params.isPro !== undefined) qs.set('isPro', String(params.isPro))
  if (params.search) qs.set('search', params.search)
  const q = qs.toString()
  return apiFetch<VodListResponse>(`/vods${q ? `?${q}` : ''}`, accessToken)
}

export async function getVod(accessToken: string, id: number) {
  return apiFetch<{ vod: Vod }>(`/vods/${id}`, accessToken)
}

export async function getVodComments(accessToken: string, id: number) {
  return apiFetch<{ comments: VodComment[] }>(`/vods/${id}/comments`, accessToken)
}

export async function addVodComment(
  accessToken: string,
  vodId: number,
  content: string,
  isPrivate = false,
) {
  return apiFetch<{ comments: VodComment[] }>(`/vods/${vodId}/comments`, accessToken, {
    method: 'POST',
    body: JSON.stringify({ content, isPrivate }),
  })
}

export interface VodInput {
  title: string
  link: string
  map: string
  matchDate: string
  status: VodStatus
  score: string
  opponent?: string | null
  isPro?: boolean
  descriptionPro?: string | null
  playersPresent?: string[]
  notifyDiscord?: boolean
}

export async function createVod(accessToken: string, data: VodInput) {
  return apiFetch<{ vod: Vod }>('/vods', accessToken, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateVod(accessToken: string, id: number, data: Partial<VodInput>) {
  return apiFetch<{ vod: Vod }>(`/vods/${id}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteVod(accessToken: string, id: number) {
  return apiFetch<{ ok: boolean }>(`/vods/${id}`, accessToken, { method: 'DELETE' })
}

// ─── Profils ──────────────────────────────────────────────────────────────────

export type ProfileGame = 'valorant' | 'cs2' | 'other'

export interface Profile {
  discordId: string
  username: string | null
  displayName: string | null
  publicName: string | null
  avatarUrl: string | null
  twitchUsername: string | null
  trackerUrl: string | null
  riotId: string | null
  steamId: string | null
  game: ProfileGame
  notifyVodDm: boolean
  notifyStratDm: boolean
  onboardingCompletedAt: string | null
  createdAt: string
  updatedAt: string
  roles: { roleId: string; name: string; category: string }[]
}

export interface ProfileUpdate {
  displayName?: string | null
  trackerUrl?: string | null
  riotId?: string | null
  steamId?: string | null
  game?: ProfileGame
  notifyVodDm?: boolean
  notifyStratDm?: boolean
  completeOnboarding?: boolean
}

export async function listProfiles(accessToken: string) {
  return apiFetch<{ profiles: Profile[] }>('/profiles', accessToken)
}

export async function getMyProfile(accessToken: string) {
  return apiFetch<{ profile: Profile }>('/profiles/me', accessToken)
}

export async function getProfile(accessToken: string, discordId: string) {
  return apiFetch<{ profile: Profile }>(`/profiles/${discordId}`, accessToken)
}

export async function updateMyProfile(accessToken: string, data: ProfileUpdate) {
  return apiFetch<{ profile: Profile }>('/profiles/me', accessToken, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

// ─── RGPD — export de ses données ───────────────────────────────────────────

/** Télécharge l'export RGPD (JSON) du membre connecté et déclenche le download. */
export async function downloadMyData(accessToken: string): Promise<void> {
  const res = await fetch(`${API_URL}/profiles/me/export`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string }
    throw new ApiError(data.error ?? 'Export impossible', res.status, data.code)
  }
  const blob = await res.blob()
  triggerDownload(blob, 'mes-donnees-gowrax.json')
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

// ─── Admin fondateur ────────────────────────────────────────────────────────

export interface AdminUser extends Profile {
  email: string | null
  emailUpdatedAt: string | null
  supabaseUserId: string | null
  isDisabled: boolean
  disabledAt: string | null
  disabledByDiscordId: string | null
  disabledReason: string | null
  lastLoginAt: string | null
  roleCount: number
}

export interface AdminUserDetail extends AdminUser {
  contributions: {
    vods: number
    comments: number
    strats: number
    scouting: number
    announcements: number
  }
}

export interface AuditEntry {
  id: number
  actorDiscordId: string
  action: string
  targetDiscordId: string | null
  detail: unknown
  createdAt: string
}

export async function adminListUsers(
  accessToken: string,
  opts: { search?: string; includeDisabled?: boolean } = {},
) {
  const params = new URLSearchParams()
  if (opts.search) params.set('search', opts.search)
  if (opts.includeDisabled) params.set('includeDisabled', 'true')
  const qs = params.toString()
  return apiFetch<{ users: AdminUser[] }>(`/admin/users${qs ? `?${qs}` : ''}`, accessToken)
}

export async function adminGetUser(accessToken: string, discordId: string) {
  return apiFetch<{ user: AdminUserDetail }>(
    `/admin/users/${encodeURIComponent(discordId)}`,
    accessToken,
  )
}

export async function adminSetAccess(
  accessToken: string,
  discordId: string,
  disabled: boolean,
  reason?: string,
) {
  return apiFetch<{ user: AdminUser & { emailSent?: boolean } }>(
    `/admin/users/${encodeURIComponent(discordId)}/access`,
    accessToken,
    {
      method: 'PATCH',
      body: JSON.stringify({ disabled, reason }),
    },
  )
}

export async function adminBackfillEmails(accessToken: string) {
  return apiFetch<{ scanned: number; updated: number }>('/admin/backfill-emails', accessToken, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

export async function adminSendTestEmail(accessToken: string) {
  return apiFetch<{ sent: boolean; to: string }>('/admin/test-email', accessToken, {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

export async function adminListAudit(accessToken: string, target?: string) {
  const qs = target ? `?${new URLSearchParams({ target }).toString()}` : ''
  return apiFetch<{ entries: AuditEntry[] }>(`/admin/audit${qs}`, accessToken)
}

/** Télécharge l'export RGPD complet d'un membre (fondateur). */
export async function adminDownloadUserData(accessToken: string, discordId: string): Promise<void> {
  const res = await fetch(`${API_URL}/admin/users/${encodeURIComponent(discordId)}/export`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string }
    throw new ApiError(data.error ?? 'Export impossible', res.status, data.code)
  }
  const blob = await res.blob()
  triggerDownload(blob, `gowrax-user-${discordId}.json`)
}

// ─── Strat-Book ─────────────────────────────────────────────────────────────

export type StratSide = 'attack' | 'defense'
export type StratStatus = 'published' | 'proposed'

export interface Strat {
  id: number
  title: string
  description: string | null
  map: string
  side: StratSide
  valoplantUrl: string | null
  vodUrl: string | null
  imagePath: string | null
  imageUrl: string | null
  authorDiscordId: string
  authorUsername: string | null
  status: StratStatus
  createdAt: string
  updatedAt: string
}

export interface StratInput {
  title: string
  description?: string | null
  map: string
  side: StratSide
  valoplantUrl?: string | null
  vodUrl?: string | null
  status?: StratStatus
}

export async function listStrats(
  accessToken: string,
  params: {
    map?: string
    side?: StratSide
    search?: string
    status?: StratStatus
  } = {},
) {
  const qs = new URLSearchParams()
  if (params.map) qs.set('map', params.map)
  if (params.side) qs.set('side', params.side)
  if (params.search) qs.set('search', params.search)
  if (params.status) qs.set('status', params.status)
  const q = qs.toString()
  return apiFetch<{ strats: Strat[] }>(`/strats${q ? `?${q}` : ''}`, accessToken)
}

export async function getStrat(accessToken: string, id: number) {
  return apiFetch<{ strat: Strat }>(`/strats/${id}`, accessToken)
}

export async function createStrat(accessToken: string, data: StratInput) {
  return apiFetch<{ strat: Strat }>('/strats', accessToken, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateStrat(accessToken: string, id: number, data: Partial<StratInput>) {
  return apiFetch<{ strat: Strat }>(`/strats/${id}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteStrat(accessToken: string, id: number) {
  return apiFetch<{ ok: boolean }>(`/strats/${id}`, accessToken, { method: 'DELETE' })
}

export async function uploadStratImage(accessToken: string, stratId: number, file: File) {
  const form = new FormData()
  form.append('image', file)
  const res = await fetch(`${API_URL}/strats/${stratId}/image`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  })
  const data = (await res.json().catch(() => ({}))) as { strat?: Strat; error?: string }
  if (!res.ok) throw new ApiError(data.error ?? 'Upload échoué', res.status)
  return data as { strat: Strat }
}

// ─── Annonces site ───────────────────────────────────────────────────────────

export interface SiteAnnouncement {
  id: number
  authorDiscordId: string
  authorDisplayName: string
  authorAvatarUrl: string | null
  authorRoleLabel: string
  authorRoleColor: string
  title: string
  body: string
  isFeatured: boolean
  version: number
  isRead: boolean
  createdAt: string
  updatedAt: string
}

export async function listAnnouncements(accessToken: string) {
  return apiFetch<{ announcements: SiteAnnouncement[]; unreadCount: number }>(
    '/announcements',
    accessToken,
  )
}

export async function listFeaturedUnread(accessToken: string) {
  return apiFetch<{ announcements: SiteAnnouncement[] }>(
    '/announcements/featured/unread',
    accessToken,
  )
}

export async function markAnnouncementRead(accessToken: string, id: number) {
  return apiFetch<{ ok: boolean }>(`/announcements/${id}/read`, accessToken, {
    method: 'PATCH',
  })
}

// ─── Transmissions (CEO / TM) ───────────────────────────────────────────────

export type TransmissionTarget = 'discord' | 'site' | 'both'

export interface TransmissionChannel {
  key: string
  label: string
}

export async function listTransmissionChannels(accessToken: string) {
  return apiFetch<{ channels: TransmissionChannel[] }>('/transmissions/channels', accessToken)
}

export async function sendTransmission(
  accessToken: string,
  data: {
    target: TransmissionTarget
    channelKey?: string
    title: string
    body: string
    mentionRoleId?: string | null
    featured?: boolean
  },
) {
  return apiFetch<{ ok: boolean; discord?: boolean; site?: { id: number } }>(
    '/transmissions/send',
    accessToken,
    { method: 'POST', body: JSON.stringify(data) },
  )
}

// ─── Scouting ───────────────────────────────────────────────────────────────

export type ScoutingRole = 'duellist' | 'initiator' | 'controller' | 'sentinel' | 'flex'
export type ScoutingVerificationStatus = 'pending' | 'verified'

export interface ScoutingAgentPoolEntry {
  agent: string
  pickRate: number | null
}

export interface ScoutingTeamStats {
  verifiedCount: number
  pendingCount: number
  avgAcs: number | null
  avgKda: number | null
  avgWinrate: number | null
  avgRank: number | null
  medianRank: number | null
  rankStdDev: number | null
  strongestPlayerId: number | null
  weakestPlayerId: number | null
  trustScore: number | null
}

export interface ScoutingTournament {
  id: number
  name: string
  startDate: string | null
  endDate: string | null
  format: string | null
  rulesUrl: string | null
  notes: string | null
  createdByDiscordId: string
  createdAt: string
  updatedAt: string
}

export interface ScoutingTeam {
  id: number
  name: string
  tag: string | null
  notes: string | null
  createdByDiscordId: string
  createdAt: string
  updatedAt: string
  stats: ScoutingTeamStats | null
  seed?: string | null
  linkNotes?: string | null
  playerCount?: number
}

export interface ScoutingPlayer {
  id: number
  teamId: number
  riotId: string
  riotTag: string
  riotDisplay: string
  role: ScoutingRole | null
  isStarter: boolean | null
  currentRank: string | null
  peakRankCurrent: string | null
  peakRankPrev: string | null
  endRankPrev: string | null
  currentRankValue: number | null
  gamesThisSeason: number | null
  recentWinrate: number | null
  avgAcs: number | null
  avgKda: number | null
  agentPool: ScoutingAgentPoolEntry[] | null
  formerTeam: string | null
  notes: string | null
  verificationStatus: ScoutingVerificationStatus
  updatedByDiscordId: string
  updatedByUsername: string | null
  verifiedByDiscordId: string | null
  verifiedByUsername: string | null
  verifiedAt: string | null
  trustFactor: number | null
  createdAt: string
  updatedAt: string
}

export interface ScoutingTournamentInput {
  name: string
  startDate?: string | null
  endDate?: string | null
  format?: string | null
  rulesUrl?: string | null
  notes?: string | null
}

export interface ScoutingTeamInput {
  name: string
  tag?: string | null
  notes?: string | null
}

export interface ScoutingLinkTeamInput {
  teamId?: number
  name?: string
  tag?: string | null
  notes?: string | null
  seed?: string | null
  linkNotes?: string | null
}

export interface ScoutingPlayerInput {
  riotId: string
  riotTag: string
  role?: ScoutingRole | null
  isStarter?: boolean | null
  currentRank?: string | null
  peakRankCurrent?: string | null
  peakRankPrev?: string | null
  endRankPrev?: string | null
  gamesThisSeason?: number | null
  recentWinrate?: number | null
  avgAcs?: number | null
  avgKda?: number | null
  agentPool?: ScoutingAgentPoolEntry[] | null
  formerTeam?: string | null
  notes?: string | null
}

export async function listScoutingTournaments(accessToken: string) {
  return apiFetch<{ tournaments: ScoutingTournament[] }>('/scouting/tournaments', accessToken)
}

export async function getScoutingTournament(accessToken: string, id: number) {
  return apiFetch<{ tournament: ScoutingTournament; teams: ScoutingTeam[] }>(
    `/scouting/tournaments/${id}`,
    accessToken,
  )
}

export async function createScoutingTournament(accessToken: string, data: ScoutingTournamentInput) {
  return apiFetch<{ tournament: ScoutingTournament }>('/scouting/tournaments', accessToken, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateScoutingTournament(
  accessToken: string,
  id: number,
  data: Partial<ScoutingTournamentInput>,
) {
  return apiFetch<{ tournament: ScoutingTournament }>(`/scouting/tournaments/${id}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteScoutingTournament(accessToken: string, id: number) {
  return apiFetch<void>(`/scouting/tournaments/${id}`, accessToken, { method: 'DELETE' })
}

export async function linkScoutingTeamToTournament(
  accessToken: string,
  tournamentId: number,
  data: ScoutingLinkTeamInput,
) {
  return apiFetch<{ team: ScoutingTeam }>(
    `/scouting/tournaments/${tournamentId}/teams`,
    accessToken,
    { method: 'POST', body: JSON.stringify(data) },
  )
}

export async function unlinkScoutingTeamFromTournament(
  accessToken: string,
  tournamentId: number,
  teamId: number,
) {
  return apiFetch<void>(
    `/scouting/tournaments/${tournamentId}/teams/${teamId}`,
    accessToken,
    { method: 'DELETE' },
  )
}

export async function listScoutingTeams(accessToken: string, search?: string) {
  const qs = search ? `?search=${encodeURIComponent(search)}` : ''
  return apiFetch<{ teams: ScoutingTeam[] }>(`/scouting/teams${qs}`, accessToken)
}

export async function getScoutingTeam(accessToken: string, id: number) {
  return apiFetch<{ team: ScoutingTeam; players: ScoutingPlayer[] }>(
    `/scouting/teams/${id}`,
    accessToken,
  )
}

export async function createScoutingTeam(accessToken: string, data: ScoutingTeamInput) {
  return apiFetch<{ team: ScoutingTeam }>('/scouting/teams', accessToken, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateScoutingTeam(
  accessToken: string,
  id: number,
  data: Partial<ScoutingTeamInput>,
) {
  return apiFetch<{ team: ScoutingTeam }>(`/scouting/teams/${id}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteScoutingTeam(accessToken: string, id: number) {
  return apiFetch<void>(`/scouting/teams/${id}`, accessToken, { method: 'DELETE' })
}

export async function getScoutingPlayer(accessToken: string, id: number) {
  return apiFetch<{ player: ScoutingPlayer }>(`/scouting/players/${id}`, accessToken)
}

export async function createScoutingPlayer(
  accessToken: string,
  teamId: number,
  data: ScoutingPlayerInput,
) {
  return apiFetch<{ player: ScoutingPlayer }>(`/scouting/teams/${teamId}/players`, accessToken, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateScoutingPlayer(
  accessToken: string,
  id: number,
  data: Partial<ScoutingPlayerInput>,
) {
  return apiFetch<{ player: ScoutingPlayer }>(`/scouting/players/${id}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function verifyScoutingPlayer(accessToken: string, id: number) {
  return apiFetch<{ player: ScoutingPlayer }>(`/scouting/players/${id}/verify`, accessToken, {
    method: 'POST',
  })
}

export async function deleteScoutingPlayer(accessToken: string, id: number) {
  return apiFetch<void>(`/scouting/players/${id}`, accessToken, { method: 'DELETE' })
}

export interface ScoutingAiAnalysis {
  teamId: number
  tournamentId: number | null
  model: string
  generatedAt: string
  text: string
}

export async function analyzeScoutingTeam(
  accessToken: string,
  teamId: number,
  tournamentId?: number,
) {
  return apiFetch<{ analysis: ScoutingAiAnalysis }>(
    `/scouting/teams/${teamId}/analyze`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify(tournamentId ? { tournamentId } : {}),
    },
  )
}
