/** Soft feature flags — miroir API (masquage UI). */
export const FEATURES = {
  strats: false,
  season: false,
  teamProfiles: false,
  vods: true,
  asso: true,
  tryouts: true,
  announcements: true,
  transmissions: true,
  captains: true,
  admin: true,
} as const

export type FeatureFlag = keyof typeof FEATURES

export function isFeatureEnabled(feature: FeatureFlag): boolean {
  return FEATURES[feature] !== false
}
