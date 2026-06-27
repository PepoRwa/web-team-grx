export const VALORANT_MAPS = [
  'Ascent',
  'Bind',
  'Breeze',
  'Fracture',
  'Haven',
  'Icebox',
  'Lotus',
  'Pearl',
  'Split',
  'Sunset',
  'Abyss',
  'Corrode',
] as const

export function displayPlayerName(player: { discordId: string; username: string | null }) {
  return player.username ?? `…${player.discordId.slice(-4)}`
}
