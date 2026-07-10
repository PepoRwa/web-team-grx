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
  canTryoutRead: boolean
  canTryoutWrite: boolean
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

// ─── Try Outs ─────────────────────────────────────────────────────────────────

export type TryoutGame = 'valorant' | 'cs2' | 'other'
export type TryoutTargetRoster = 'high_roster' | 'game_changers' | 'high_roster_cs2'
export type TryoutCampaignStatus = 'draft' | 'active' | 'closed'
export type TryoutPipelineStatus =
  | 'new'
  | 'contacted'
  | 'scrim_scheduled'
  | 'in_trial'
  | 'shortlist'
  | 'rejected'
  | 'offered'
  | 'joined'
  | 'withdrawn'
export type TryoutCandidateSource =
  | 'discord_ticket'
  | 'referral'
  | 'open_application'
  | 'staff_scout'
  | 'other'
export type TryoutSessionType = 'scrim' | 'review' | 'interview' | 'other'
export type TryoutSessionOutcome = 'pending' | 'positive' | 'neutral' | 'negative'
export type TryoutRecommendation = 'strong_yes' | 'yes' | 'neutral' | 'no' | 'strong_no'

export interface TryoutCampaign {
  id: number
  name: string
  game: TryoutGame
  targetRoster: TryoutTargetRoster
  status: TryoutCampaignStatus
  startDate: string | null
  endDate: string | null
  slotsTarget: number | null
  notes: string | null
  createdByDiscordId: string
  createdAt: string
  updatedAt: string
}

export interface TryoutCandidate {
  id: number
  riotId: string
  riotTag: string
  displayName: string | null
  trackerUrl: string | null
  discordId: string | null
  role: ScoutingRole | null
  currentRank: string | null
  peakRankCurrent: string | null
  peakRankPrev: string | null
  endRankPrev: string | null
  gamesThisSeason: number | null
  recentWinrate: number | null
  avgAcs: number | null
  avgKda: number | null
  agentPool: ScoutingAgentPoolEntry[] | null
  source: TryoutCandidateSource
  notes: string | null
  createdByDiscordId: string
  createdAt: string
  updatedAt: string
  campaignId?: number
  status?: TryoutPipelineStatus
  priority?: number | null
  campaignNotes?: string | null
  campaigns?: TryoutCampaign[]
  sessions?: TryoutSession[]
  evaluations?: TryoutEvaluation[]
  evaluationCount?: number
}

export interface TryoutSession {
  id: number
  campaignId: number
  candidateId: number
  sessionType: TryoutSessionType
  scheduledAt: string | null
  map: string | null
  staffPresent: string[] | null
  vodId: number | null
  outcome: TryoutSessionOutcome
  notes: string | null
  createdByDiscordId: string
  createdAt: string
  updatedAt: string
}

export interface TryoutEvaluation {
  id: number
  candidateId: number
  sessionId: number | null
  evaluatorDiscordId: string
  scores: Record<string, number> | null
  recommendation: TryoutRecommendation
  comment: string | null
  createdAt: string
  updatedAt: string
}

export interface TryoutCampaignInput {
  name: string
  game?: TryoutGame
  targetRoster: TryoutTargetRoster
  status?: TryoutCampaignStatus
  startDate?: string | null
  endDate?: string | null
  slotsTarget?: number | null
  notes?: string | null
}

export interface TryoutCandidateInput {
  riotId: string
  riotTag: string
  displayName?: string | null
  trackerUrl?: string | null
  discordId?: string | null
  role?: ScoutingRole | null
  currentRank?: string | null
  peakRankCurrent?: string | null
  peakRankPrev?: string | null
  endRankPrev?: string | null
  gamesThisSeason?: number | null
  recentWinrate?: number | null
  avgAcs?: number | null
  avgKda?: number | null
  agentPool?: ScoutingAgentPoolEntry[] | null
  source?: TryoutCandidateSource
  notes?: string | null
  campaignId?: number
  status?: TryoutPipelineStatus
  priority?: number | null
  campaignNotes?: string | null
}

export interface TryoutSessionInput {
  campaignId: number
  sessionType?: TryoutSessionType
  scheduledAt?: string | null
  map?: string | null
  staffPresent?: string[] | null
  vodId?: number | null
  outcome?: TryoutSessionOutcome
  notes?: string | null
}

export interface TryoutEvaluationInput {
  sessionId?: number | null
  scores?: Record<string, number> | null
  recommendation?: TryoutRecommendation
  comment?: string | null
}

export async function getTryoutStats(accessToken: string) {
  return apiFetch<{ activeCampaigns: number; activeCandidates: number }>(
    '/tryouts/stats',
    accessToken,
  )
}

export async function listTryoutCampaigns(
  accessToken: string,
  opts?: { status?: TryoutCampaignStatus },
) {
  const qs = opts?.status ? `?status=${opts.status}` : ''
  return apiFetch<{ campaigns: TryoutCampaign[] }>(`/tryouts/campaigns${qs}`, accessToken)
}

export async function getTryoutCampaign(accessToken: string, id: number) {
  return apiFetch<{ campaign: TryoutCampaign; statusCounts: Record<string, number> }>(
    `/tryouts/campaigns/${id}`,
    accessToken,
  )
}

export async function getTryoutCampaignBoard(accessToken: string, id: number) {
  return apiFetch<{
    campaign: TryoutCampaign
    columns: { status: TryoutPipelineStatus; candidates: TryoutCandidate[] }[]
  }>(`/tryouts/campaigns/${id}/board`, accessToken)
}

export async function createTryoutCampaign(accessToken: string, data: TryoutCampaignInput) {
  return apiFetch<{ campaign: TryoutCampaign }>('/tryouts/campaigns', accessToken, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateTryoutCampaign(
  accessToken: string,
  id: number,
  data: Partial<TryoutCampaignInput>,
) {
  return apiFetch<{ campaign: TryoutCampaign }>(`/tryouts/campaigns/${id}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteTryoutCampaign(accessToken: string, id: number) {
  return apiFetch<void>(`/tryouts/campaigns/${id}`, accessToken, { method: 'DELETE' })
}

export async function listTryoutCandidates(
  accessToken: string,
  opts?: { campaignId?: number; status?: TryoutPipelineStatus; search?: string },
) {
  const params = new URLSearchParams()
  if (opts?.campaignId) params.set('campaignId', String(opts.campaignId))
  if (opts?.status) params.set('status', opts.status)
  if (opts?.search) params.set('search', opts.search)
  const qs = params.toString() ? `?${params}` : ''
  return apiFetch<{ candidates: TryoutCandidate[] }>(`/tryouts/candidates${qs}`, accessToken)
}

export async function getTryoutCandidate(
  accessToken: string,
  id: number,
  campaignId?: number,
) {
  const qs = campaignId ? `?campaignId=${campaignId}` : ''
  return apiFetch<{ candidate: TryoutCandidate }>(`/tryouts/candidates/${id}${qs}`, accessToken)
}

export async function createTryoutCandidate(accessToken: string, data: TryoutCandidateInput) {
  return apiFetch<{ candidate: TryoutCandidate }>('/tryouts/candidates', accessToken, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateTryoutCandidate(
  accessToken: string,
  id: number,
  data: Partial<TryoutCandidateInput>,
) {
  return apiFetch<{ candidate: TryoutCandidate }>(`/tryouts/candidates/${id}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function linkTryoutCandidateToCampaign(
  accessToken: string,
  campaignId: number,
  data: Partial<TryoutCandidateInput> & { candidateId?: number },
) {
  return apiFetch<{ candidate: TryoutCandidate }>(
    `/tryouts/campaigns/${campaignId}/candidates`,
    accessToken,
    { method: 'POST', body: JSON.stringify(data) },
  )
}

export async function createTryoutSession(
  accessToken: string,
  candidateId: number,
  data: TryoutSessionInput,
) {
  return apiFetch<{ session: TryoutSession }>(
    `/tryouts/candidates/${candidateId}/sessions`,
    accessToken,
    { method: 'POST', body: JSON.stringify(data) },
  )
}

export async function updateTryoutSession(
  accessToken: string,
  sessionId: number,
  data: Partial<Omit<TryoutSessionInput, 'campaignId'>>,
) {
  return apiFetch<{ session: TryoutSession }>(`/tryouts/sessions/${sessionId}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function createTryoutEvaluation(
  accessToken: string,
  candidateId: number,
  data: TryoutEvaluationInput,
) {
  return apiFetch<{ evaluation: TryoutEvaluation }>(
    `/tryouts/candidates/${candidateId}/evaluations`,
    accessToken,
    { method: 'POST', body: JSON.stringify(data) },
  )
}

// ─── Module asso ─────────────────────────────────────────────────────────────

export type AssoModule =
  | 'membres'
  | 'documents'
  | 'cotisations'
  | 'assemblees'
  | 'parametres'

export interface AssoAccess {
  hasAccess: boolean
  isBureau: boolean
  dossierId: number | null
  modules?: Record<AssoModule, AssoAccessLevel> | null
  canManagePermissions?: boolean
  documents?: {
    canAccess: boolean
    canUpload: boolean
    accessibleFolders: AssoDocumentFolder[]
    documentsLevel: AssoAccessLevel
  } | null
}

export type AssoDocumentFolder =
  | 'statuts'
  | 'pv_ag'
  | 'pv_bureau'
  | 'conventions'
  | 'interne'

export type AssoAccessLevel = 'aucun' | 'lecture' | 'edition' | 'admin'

export interface AssoDocument {
  id: number
  folder: AssoDocumentFolder
  name: string
  fileType: string
  sizeLabel: string
  uploadedAt: string
  hasFile: boolean
}

export interface AssoDocumentsMeta {
  accessibleFolders: AssoDocumentFolder[]
  canUpload: boolean
  documentsLevel: AssoAccessLevel
  canManagePermissions: boolean
}

export type AssoDossierStatus = 'actif' | 'inactif'
export type AssoCotisationType = 'complete' | 'partielle' | 'dispense'
export type AssoCotisationStatus = 'paye' | 'en_attente' | 'expire' | 'dispense'

export type StructureRoleKind = 'joueur' | 'staff_sportif' | 'staff_com' | 'medias' | 'autre'
export type PlayerDivision = 'ascendants' | 'valkyries' | 'cs2'

export interface StructureRole {
  kind: StructureRoleKind
  division?: PlayerDivision
  function?: string
  label?: string
}

export interface LegalGuardian {
  firstName: string
  lastName: string
  relation: string
  phone: string
  email: string
}

export interface AssoDossier {
  id: number
  discordId: string | null
  siteAccess: boolean
  status: AssoDossierStatus
  linkedAt: string | null
  linkedByDiscordId: string | null
  firstName: string
  lastName: string
  pseudo: string
  email: string | null
  phone: string | null
  trackerUrl: string | null
  riotId: string | null
  discordPseudo: string | null
  dateOfBirth: string | null
  birthPlace: string | null
  nationality: string | null
  residenceCountry: string | null
  cotisationType: AssoCotisationType
  cotisationStatus: AssoCotisationStatus
  cotisationExemptionRef?: string | null
  cotisationExemptionNote?: string | null
  structureRoles?: StructureRole[] | null
  charteAcceptedAt?: string | null
  charteVersion?: string | null
  legalGuardian?: LegalGuardian | null
  joinedAt: string
  createdAt: string
  updatedAt: string
  teamTrackerUrl?: string | null
}

export interface AssoLinkCandidate {
  discordId: string
  username: string | null
  displayName: string | null
  avatarUrl: string | null
  email: string | null
  riotId: string | null
  teamTrackerUrl: string | null
  alreadyLinked: boolean
  linkedDossierId: number | null
}

export type AssoDossierInput = {
  discordId?: string | null
  siteAccess?: boolean
  firstName: string
  lastName: string
  pseudo: string
  email?: string | null
  phone?: string | null
  trackerUrl?: string | null
  riotId?: string | null
  discordPseudo?: string | null
  dateOfBirth?: string | null
  birthPlace?: string | null
  nationality?: string | null
  residenceCountry?: string | null
  cotisationType?: AssoCotisationType
  cotisationStatus?: AssoCotisationStatus
  cotisationExemptionRef?: string | null
  cotisationExemptionNote?: string | null
  structureRoles?: StructureRole[]
  charteAccepted?: boolean
  charteVersion?: string | null
  legalGuardian?: LegalGuardian | null
  joinedAt?: string
  status?: AssoDossierStatus
}

export async function getAssoAccess(accessToken: string) {
  return apiFetch<AssoAccess>('/asso/access', accessToken)
}

export async function getMyAssoDossier(accessToken: string) {
  return apiFetch<{ dossier: AssoDossier }>('/asso/me', accessToken)
}

export async function listAssoDossiers(accessToken: string) {
  return apiFetch<{ dossiers: AssoDossier[] }>('/asso/dossiers', accessToken)
}

export async function getAssoDossier(accessToken: string, id: number) {
  return apiFetch<{ dossier: AssoDossier }>(`/asso/dossiers/${id}`, accessToken)
}

export async function listAssoLinkCandidates(accessToken: string, search?: string) {
  const qs = search ? `?${new URLSearchParams({ search }).toString()}` : ''
  return apiFetch<{ candidates: AssoLinkCandidate[] }>(
    `/asso/link-candidates${qs}`,
    accessToken,
  )
}

export async function createAssoDossier(accessToken: string, data: AssoDossierInput) {
  return apiFetch<{ dossier: AssoDossier }>('/asso/dossiers', accessToken, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateAssoDossier(
  accessToken: string,
  id: number,
  data: Partial<AssoDossierInput>,
) {
  return apiFetch<{ dossier: AssoDossier }>(`/asso/dossiers/${id}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function linkAssoDiscord(
  accessToken: string,
  dossierId: number,
  discordId: string,
  siteAccess = true,
) {
  return apiFetch<{ dossier: AssoDossier }>(
    `/asso/dossiers/${dossierId}/link-discord`,
    accessToken,
    { method: 'POST', body: JSON.stringify({ discordId, siteAccess }) },
  )
}

export async function unlinkAssoDiscord(accessToken: string, dossierId: number) {
  return apiFetch<{ dossier: AssoDossier }>(
    `/asso/dossiers/${dossierId}/unlink-discord`,
    accessToken,
    { method: 'POST', body: JSON.stringify({}) },
  )
}

export async function getAssoDocumentsMeta(accessToken: string) {
  return apiFetch<AssoDocumentsMeta>('/asso/documents/meta', accessToken)
}

export async function listAssoDocuments(accessToken: string) {
  return apiFetch<{ documents: AssoDocument[] }>('/asso/documents', accessToken)
}

export async function downloadAssoDocument(accessToken: string, id: number) {
  return apiFetch<{ url: string; name: string }>(
    `/asso/documents/${id}/download`,
    accessToken,
  )
}

export async function uploadAssoDocument(
  accessToken: string,
  folder: AssoDocumentFolder,
  file: File,
) {
  const form = new FormData()
  form.append('folder', folder)
  form.append('file', file)

  const res = await fetch(`${API_URL}/asso/documents/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  })

  const data = (await res.json().catch(() => ({}))) as {
    document?: AssoDocument
    error?: string
    code?: string
  }

  if (!res.ok) {
    throw new ApiError(data.error ?? 'Échec upload', res.status, data.code)
  }

  return data.document!
}

export async function deleteAssoDocument(accessToken: string, id: number) {
  return apiFetch<{ ok: boolean }>(`/asso/documents/${id}`, accessToken, {
    method: 'DELETE',
  })
}

export interface AssoModulePermission {
  discordId: string
  module: AssoModule
  accessLevel: AssoAccessLevel
  grantedByDiscordId: string
  grantedAt: string
}

export interface AssoDocumentFolderGrant {
  discordId: string
  folder: 'pv_ag' | 'pv_bureau'
  grantedByDiscordId: string
  grantedAt: string
}

export async function listAssoDocumentPermissions(accessToken: string) {
  return apiFetch<{
    permissions: AssoModulePermission[]
    folderGrants: AssoDocumentFolderGrant[]
  }>('/asso/permissions/documents', accessToken)
}

export async function setAssoDocumentPermission(
  accessToken: string,
  discordId: string,
  accessLevel: AssoAccessLevel,
) {
  return apiFetch<{ permission: AssoModulePermission }>(
    '/asso/permissions/documents',
    accessToken,
    { method: 'PUT', body: JSON.stringify({ discordId, accessLevel }) },
  )
}

export async function grantAssoDocumentFolder(
  accessToken: string,
  discordId: string,
  folder: 'pv_ag' | 'pv_bureau',
) {
  return apiFetch<{ ok: boolean }>('/asso/documents/folder-grants', accessToken, {
    method: 'POST',
    body: JSON.stringify({ discordId, folder }),
  })
}

export async function revokeAssoDocumentFolder(
  accessToken: string,
  discordId: string,
  folder: 'pv_ag' | 'pv_bureau',
) {
  return apiFetch<{ ok: boolean }>('/asso/documents/folder-grants', accessToken, {
    method: 'DELETE',
    body: JSON.stringify({ discordId, folder }),
  })
}

export interface CotisationRow {
  id: number
  pseudo: string
  firstName: string
  lastName: string
  memberStatus: AssoDossierStatus
  cotisationType: AssoCotisationType
  cotisationStatus: AssoCotisationStatus
  cotisationExemptionRef: string | null
  cotisationExemptionNote: string | null
  joinedAt: string
}

export interface CotisationsOverview {
  fiscalYear: number
  counts: Record<AssoCotisationStatus, number>
  rows: CotisationRow[]
  canEdit: boolean
  cotisationsLevel: AssoAccessLevel
}

export async function getAssoCotisations(accessToken: string) {
  return apiFetch<{ overview: CotisationsOverview }>('/asso/cotisations', accessToken)
}

export async function updateAssoCotisation(
  accessToken: string,
  dossierId: number,
  data: {
    cotisationType?: AssoCotisationType
    cotisationStatus?: AssoCotisationStatus
    cotisationExemptionRef?: string | null
    cotisationExemptionNote?: string | null
  },
) {
  return apiFetch<{ row: CotisationRow }>(`/asso/cotisations/${dossierId}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export interface AssoAssociationSettings {
  name: string
  tagline?: string
  objetSocial?: string
  legalForm?: string
  rna?: string
  siren?: string
  siret?: string
  dateCreation?: string
  datePublicationJo?: string
  fiscalYear: string
  address?: string
  postalCode?: string
  city?: string
  country?: string
  email?: string
  phone?: string
  website?: string
  discordUrl?: string
  presidentName?: string
  treasurerName?: string
  secretaryName?: string
  bankName?: string
  ibanMasked?: string
  insuranceRef?: string
  agrementJeunesse?: string
}

export async function getAssoSettings(accessToken: string) {
  return apiFetch<{ settings: AssoAssociationSettings }>('/asso/settings', accessToken)
}

export async function updateAssoSettings(
  accessToken: string,
  data: Partial<AssoAssociationSettings>,
) {
  return apiFetch<{ settings: AssoAssociationSettings }>('/asso/settings', accessToken, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export type AssoAssemblyStatus = 'a_venir' | 'terminee'

export interface AssoAssembly {
  id: number
  title: string
  date: string
  agenda: string[]
  status: AssoAssemblyStatus
  pvDocumentId: number | null
  pvDocumentName: string | null
}

export async function listAssoAssemblies(accessToken: string) {
  return apiFetch<{ assemblies: AssoAssembly[]; canEdit: boolean }>(
    '/asso/assemblies',
    accessToken,
  )
}

export async function createAssoAssembly(
  accessToken: string,
  data: {
    title: string
    date: string
    agenda: string[] | string
    status: AssoAssemblyStatus
    pvDocumentId?: number | null
  },
) {
  return apiFetch<{ assembly: AssoAssembly }>('/asso/assemblies', accessToken, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateAssoAssembly(
  accessToken: string,
  id: number,
  data: {
    title: string
    date: string
    agenda: string[] | string
    status: AssoAssemblyStatus
    pvDocumentId?: number | null
  },
) {
  return apiFetch<{ assembly: AssoAssembly }>(`/asso/assemblies/${id}`, accessToken, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deleteAssoAssembly(accessToken: string, id: number) {
  return apiFetch<{ ok: boolean }>(`/asso/assemblies/${id}`, accessToken, {
    method: 'DELETE',
  })
}

export interface AssoPermissionProfile {
  id: string
  label: string
  description: string
  grantsBureau?: boolean
}

export interface AssoBureauGrant {
  discordId: string
  grantedByDiscordId: string
  grantedAt: string
}

export async function listAssoPermissions(accessToken: string) {
  return apiFetch<{
    permissions: AssoModulePermission[]
    folderGrants: AssoDocumentFolderGrant[]
    bureauGrants: AssoBureauGrant[]
  }>('/asso/permissions', accessToken)
}

export async function listAssoPermissionProfiles(accessToken: string) {
  return apiFetch<{ profiles: AssoPermissionProfile[] }>(
    '/asso/permissions/profiles',
    accessToken,
  )
}

export async function setAssoModulePermission(
  accessToken: string,
  discordId: string,
  module: AssoModule,
  accessLevel: AssoAccessLevel,
) {
  return apiFetch<{ permission: AssoModulePermission }>('/asso/permissions', accessToken, {
    method: 'PUT',
    body: JSON.stringify({ discordId, module, accessLevel }),
  })
}

export async function applyAssoPermissionProfile(
  accessToken: string,
  discordId: string,
  profileId: string,
) {
  return apiFetch<{ ok: boolean }>('/asso/permissions/profile', accessToken, {
    method: 'POST',
    body: JSON.stringify({ discordId, profileId }),
  })
}

export async function grantAssoBureau(accessToken: string, discordId: string) {
  return apiFetch<{ ok: boolean }>('/asso/bureau/grants', accessToken, {
    method: 'POST',
    body: JSON.stringify({ discordId }),
  })
}

export async function revokeAssoBureau(accessToken: string, discordId: string) {
  return apiFetch<{ ok: boolean }>('/asso/bureau/grants', accessToken, {
    method: 'DELETE',
    body: JSON.stringify({ discordId }),
  })
}

export async function exportMyAssoRgpd(accessToken: string) {
  const res = await fetch(`${API_URL}/asso/me/export`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string }
    throw new ApiError(data.error ?? 'Export impossible', res.status, data.code)
  }
  return res.blob()
}

export async function exportAssoDossierRgpd(accessToken: string, dossierId: number) {
  const res = await fetch(`${API_URL}/asso/dossiers/${dossierId}/rgpd-export`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string; code?: string }
    throw new ApiError(data.error ?? 'Export impossible', res.status, data.code)
  }
  return res.blob()
}

