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
  captainRosters: ('high_roster' | 'game_changers' | 'high_roster_cs2')[]
  isFounder: boolean
  rosters: string[]
  canTransmit: boolean
  canModerate: boolean
  canAccessSite: boolean
  canTryoutRead: boolean
  canTryoutWrite: boolean
  canAdmin: boolean
  canManageCaptains: boolean
  canEditTeamProfiles: boolean
}
