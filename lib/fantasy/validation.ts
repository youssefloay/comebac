import { Formation, FantasyPlayer, Position, ValidationResult } from '@/lib/types/fantasy'

/**
 * Configuration des formations disponibles
 * Format: 1 Gardien + 6 joueurs de champ = 7 joueurs total
 * [Gardiens, Défenseurs, Milieux, Attaquants]
 */
const FORMATION_REQUIREMENTS: Record<Formation, { GK: number; DEF: number; MID: number; ATT: number }> = {
  '4-2-0': { GK: 1, DEF: 4, MID: 2, ATT: 0 },
  '3-3-0': { GK: 1, DEF: 3, MID: 3, ATT: 0 },
  '3-2-1': { GK: 1, DEF: 3, MID: 2, ATT: 1 },
  '2-3-1': { GK: 1, DEF: 2, MID: 3, ATT: 1 },
  '2-2-2': { GK: 1, DEF: 2, MID: 2, ATT: 2 },
}

/**
 * Budget initial pour une équipe Fantasy
 */
export const INITIAL_BUDGET = 100

/**
 * Nombre maximum de joueurs d'une même équipe
 */
export const MAX_PLAYERS_PER_TEAM = 3

/**
 * Nombre total de joueurs dans une équipe Fantasy
 */
export const TOTAL_SQUAD_SIZE = 7

/**
 * Compte le nombre de joueurs par position
 */
function countPositions(players: FantasyPlayer[]): Record<string, number> {
  const counts: Record<string, number> = {
    Gardien: 0,
    Défenseur: 0,
    Milieu: 0,
    Attaquant: 0,
  }

  for (const player of players) {
    counts[player.position] = (counts[player.position] || 0) + 1
  }

  return counts
}

/**
 * Compte le nombre de joueurs par équipe réelle
 * Note: Nécessite que les joueurs aient une propriété teamId
 */
function countByTeam(players: FantasyPlayer[]): Record<string, number> {
  const counts: Record<string, number> = {}

  for (const player of players) {
    // On suppose que le playerId contient l'info de l'équipe ou qu'on a accès aux données
    // Pour l'instant, on retourne un objet vide car on n'a pas accès aux données complètes
    // Cette fonction sera complétée lors de l'intégration avec les données réelles
  }

  return counts
}

/**
 * Vérifie si la composition correspond à la formation choisie
 */
function matchesFormation(
  positions: Record<string, number>,
  formation: Formation
): boolean {
  const required = FORMATION_REQUIREMENTS[formation]

  return (
    positions.Gardien === required.GK &&
    positions.Défenseur === required.DEF &&
    positions.Milieu === required.MID &&
    positions.Attaquant === required.ATT
  )
}

/**
 * Valide la composition d'une équipe Fantasy
 * Vérifie le nombre de joueurs, la formation, et la limite par équipe
 */
export function validateSquad(
  players: FantasyPlayer[],
  formation: Formation
): ValidationResult {
  const errors: string[] = []

  // Vérifier le nombre total de joueurs
  if (players.length !== TOTAL_SQUAD_SIZE) {
    errors.push(`Vous devez sélectionner exactement ${TOTAL_SQUAD_SIZE} joueurs (actuellement: ${players.length})`)
  }

  // Vérifier la formation
  const positions = countPositions(players)
  if (!matchesFormation(positions, formation)) {
    const required = FORMATION_REQUIREMENTS[formation]
    errors.push(
      `La composition ne correspond pas à la formation ${formation}. ` +
      `Requis: ${required.GK} GK, ${required.DEF} DEF, ${required.MID} MID, ${required.ATT} ATT. ` +
      `Actuel: ${positions.Gardien} GK, ${positions.Défenseur} DEF, ${positions.Milieu} MID, ${positions.Attaquant} ATT`
    )
  }

  // Vérifier qu'il y a exactement un capitaine
  const captains = players.filter(p => p.isCaptain)
  if (captains.length === 0) {
    errors.push('Vous devez désigner un capitaine')
  } else if (captains.length > 1) {
    errors.push('Vous ne pouvez avoir qu\'un seul capitaine')
  }

  // Vérifier les doublons de joueurs
  const playerIds = players.map(p => p.playerId)
  const uniquePlayerIds = new Set(playerIds)
  if (playerIds.length !== uniquePlayerIds.size) {
    errors.push('Vous ne pouvez pas sélectionner le même joueur plusieurs fois')
  }

  // Note: La vérification de la limite par équipe sera implémentée
  // lors de l'intégration avec les données réelles des joueurs
  // car nous avons besoin d'accéder aux informations de l'équipe de chaque joueur

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Valide le budget d'une équipe Fantasy
 * Vérifie que le coût total ne dépasse pas le budget disponible
 */
export function validateBudget(
  players: FantasyPlayer[],
  budget: number = INITIAL_BUDGET
): ValidationResult {
  const errors: string[] = []

  // Calculer le coût total
  const totalCost = players.reduce((sum, player) => sum + player.price, 0)

  // Vérifier que le budget n'est pas dépassé
  if (totalCost > budget) {
    const overspend = (totalCost - budget).toFixed(1)
    errors.push(
      `Budget dépassé de ${overspend}M€. ` +
      `Coût total: ${totalCost.toFixed(1)}M€, Budget disponible: ${budget.toFixed(1)}M€`
    )
  }

  // Vérifier que tous les prix sont valides
  const invalidPrices = players.filter(p => p.price <= 0 || isNaN(p.price))
  if (invalidPrices.length > 0) {
    errors.push('Certains joueurs ont un prix invalide')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Valide une formation
 * Vérifie que la formation existe et est valide
 */
export function validateFormation(formation: Formation): ValidationResult {
  const errors: string[] = []

  // Vérifier que la formation existe
  if (!FORMATION_REQUIREMENTS[formation]) {
    errors.push(
      `Formation invalide: ${formation}. ` +
      `Formations disponibles: ${Object.keys(FORMATION_REQUIREMENTS).join(', ')}`
    )
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Valide qu'un joueur peut être ajouté à l'équipe
 * Vérifie la position, le budget, et les contraintes
 */
export function validatePlayerAddition(
  currentPlayers: FantasyPlayer[],
  newPlayer: FantasyPlayer,
  formation: Formation,
  budget: number
): ValidationResult {
  const errors: string[] = []

  // Vérifier que le joueur n'est pas déjà dans l'équipe
  if (currentPlayers.some(p => p.playerId === newPlayer.playerId)) {
    errors.push('Ce joueur est déjà dans votre équipe')
  }

  // Vérifier le budget
  const currentCost = currentPlayers.reduce((sum, p) => sum + p.price, 0)
  const newCost = currentCost + newPlayer.price
  if (newCost > budget) {
    errors.push(
      `Budget insuffisant. ` +
      `Coût actuel: ${currentCost.toFixed(1)}M€, ` +
      `Prix du joueur: ${newPlayer.price.toFixed(1)}M€, ` +
      `Budget disponible: ${budget.toFixed(1)}M€`
    )
  }

  // Vérifier que l'ajout ne dépasse pas les limites de formation
  const updatedPlayers = [...currentPlayers, newPlayer]
  const positions = countPositions(updatedPlayers)
  const required = FORMATION_REQUIREMENTS[formation]

  const positionKey = newPlayer.position
  const maxForPosition = required[positionKey === 'Gardien' ? 'GK' : 
                                   positionKey === 'Défenseur' ? 'DEF' :
                                   positionKey === 'Milieu' ? 'MID' : 'ATT']

  if (positions[positionKey] > maxForPosition) {
    errors.push(
      `Vous avez déjà le nombre maximum de ${positionKey}s pour la formation ${formation} ` +
      `(${maxForPosition} maximum)`
    )
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Valide un transfert
 * Vérifie que le joueur sortant et entrant ont la même position
 * et que le budget permet le transfert
 */
export function validateTransfer(
  playerOut: FantasyPlayer,
  playerIn: FantasyPlayer,
  budgetRemaining: number
): ValidationResult {
  const errors: string[] = []

  // Vérifier que les positions correspondent
  if (playerOut.position !== playerIn.position) {
    errors.push(
      `Les joueurs doivent avoir la même position. ` +
      `Joueur sortant: ${playerOut.position}, Joueur entrant: ${playerIn.position}`
    )
  }

  // Vérifier le budget
  const priceDifference = playerIn.price - playerOut.price
  if (priceDifference > budgetRemaining) {
    errors.push(
      `Budget insuffisant pour ce transfert. ` +
      `Différence de prix: ${priceDifference.toFixed(1)}M€, ` +
      `Budget disponible: ${budgetRemaining.toFixed(1)}M€`
    )
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Valide le nom d'une équipe Fantasy
 */
export function validateTeamName(teamName: string): ValidationResult {
  const errors: string[] = []

  if (!teamName || teamName.trim().length === 0) {
    errors.push('Le nom d\'équipe est requis')
  } else if (teamName.length < 3) {
    errors.push('Le nom d\'équipe doit contenir au moins 3 caractères')
  } else if (teamName.length > 30) {
    errors.push('Le nom d\'équipe ne peut pas dépasser 30 caractères')
  }

  // Vérifier les caractères invalides
  const invalidChars = /[<>{}[\]\\\/]/
  if (invalidChars.test(teamName)) {
    errors.push('Le nom d\'équipe contient des caractères invalides')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Valide une équipe Fantasy complète avant création/sauvegarde
 * Combine toutes les validations
 */
export function validateFantasyTeam(
  teamName: string,
  players: FantasyPlayer[],
  formation: Formation,
  budget: number = INITIAL_BUDGET
): ValidationResult {
  const errors: string[] = []

  // Valider le nom
  const nameValidation = validateTeamName(teamName)
  if (!nameValidation.valid) {
    errors.push(...nameValidation.errors)
  }

  // Valider la formation
  const formationValidation = validateFormation(formation)
  if (!formationValidation.valid) {
    errors.push(...formationValidation.errors)
  }

  // Valider la composition
  const squadValidation = validateSquad(players, formation)
  if (!squadValidation.valid) {
    errors.push(...squadValidation.errors)
  }

  // Valider le budget
  const budgetValidation = validateBudget(players, budget)
  if (!budgetValidation.valid) {
    errors.push(...budgetValidation.errors)
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
