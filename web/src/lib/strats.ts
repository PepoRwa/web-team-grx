export { VALORANT_MAPS } from './vods'

export function sideLabel(side: 'attack' | 'defense') {
  return side === 'attack' ? 'Attaque' : 'Défense'
}

export function statusLabel(status: 'published' | 'proposed') {
  return status === 'published' ? 'Publiée' : 'Proposée'
}
