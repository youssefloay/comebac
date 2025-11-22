import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from './firebase'

/**
 * Récupère la liste des équipes participantes depuis les matchs générés
 * @returns Array d'IDs d'équipes participantes, ou null si aucun match n'a été généré
 */
export async function getParticipatingTeamIds(): Promise<string[] | null> {
  try {
    // Récupérer un match récent pour obtenir les équipes participantes
    const matchesQuery = query(
      collection(db, 'matches'),
      where('participatingTeamIds', '!=', null)
    )
    const matchesSnapshot = await getDocs(matchesQuery)
    
    if (matchesSnapshot.empty) {
      return null
    }
    
    // Prendre les équipes participantes du premier match trouvé
    // (tous les matchs d'un même tournoi ont les mêmes équipes participantes)
    const firstMatch = matchesSnapshot.docs[0]
    const participatingTeamIds = firstMatch.data().participatingTeamIds as string[]
    
    return participatingTeamIds || null
  } catch (error) {
    console.error('Error getting participating team IDs:', error)
    return null
  }
}

/**
 * Filtre les équipes pour ne garder que celles qui participent au tournoi
 * @param teams Array d'équipes à filtrer
 * @param participatingTeamIds IDs des équipes participantes (null = toutes les équipes)
 * @returns Array d'équipes filtrées
 */
export function filterParticipatingTeams<T extends { id: string }>(
  teams: T[],
  participatingTeamIds: string[] | null
): T[] {
  if (!participatingTeamIds || participatingTeamIds.length === 0) {
    return teams // Si aucune équipe participante définie, retourner toutes les équipes
  }
  
  return teams.filter(team => participatingTeamIds.includes(team.id))
}

