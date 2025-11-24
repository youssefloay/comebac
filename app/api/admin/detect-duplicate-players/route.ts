import { NextRequest, NextResponse } from 'next/server'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface PlayerInfo {
  firstName: string
  lastName: string
  email: string
  nickname?: string
  teamId: string
  teamName: string
  source: 'playerAccounts' | 'teams'
  sourceId: string
  playerId?: string
}

export async function GET() {
  try {
    const allPlayers: PlayerInfo[] = []
    
    // 1. Collecter tous les joueurs de playerAccounts (comptes validés)
    const playerAccountsSnap = await getDocs(collection(db, 'playerAccounts'))
    playerAccountsSnap.docs.forEach(doc => {
      const data = doc.data()
      const email = (data.email || '').toLowerCase().trim()
      const firstName = (data.firstName || '').toLowerCase().trim()
      const lastName = (data.lastName || '').toLowerCase().trim()
      
      if ((!email && (!firstName || !lastName)) || (!firstName || !lastName)) return
      
      // Inclure même si pas de teamId - on vérifiera dans teams aussi
      const teamId = data.teamId || ''
      const teamName = data.teamName || 'Équipe inconnue'
      
      // Si pas de teamId, chercher dans teams pour trouver l'équipe
      if (!teamId) {
        // On va chercher dans teams plus tard, mais on garde le joueur quand même
      }
      
      allPlayers.push({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        nickname: data.nickname || '',
        teamId: teamId,
        teamName: teamName,
        source: 'playerAccounts',
        sourceId: doc.id,
        playerId: doc.id
      })
    })
    
    // 2. Collecter tous les joueurs de teams (équipes validées uniquement)
    const teamsSnap = await getDocs(collection(db, 'teams'))
    teamsSnap.docs.forEach(teamDoc => {
      const teamData = teamDoc.data()
      
      if (teamData.players && Array.isArray(teamData.players)) {
        teamData.players.forEach((player: any, index: number) => {
          const email = (player.email || '').toLowerCase().trim()
          const firstName = (player.firstName || '').toLowerCase().trim()
          const lastName = (player.lastName || '').toLowerCase().trim()
          
          if (email || (firstName && lastName)) {
            // Vérifier si ce joueur existe déjà dans allPlayers avec le même email mais une autre équipe
            const existingPlayer = allPlayers.find(p => {
              const pEmail = (p.email || '').toLowerCase().trim()
              return pEmail && pEmail === email && p.teamId !== teamDoc.id
            })
            
            // Toujours ajouter, même si existe déjà (pour détecter les doublons)
            allPlayers.push({
              firstName: player.firstName || '',
              lastName: player.lastName || '',
              email: player.email || '',
              nickname: player.nickname || '',
              teamId: teamDoc.id,
              teamName: teamData.name || 'Équipe inconnue',
              source: 'teams',
              sourceId: teamDoc.id,
              playerId: `player_${index}`
            })
          }
        })
      }
    })
    
    // Détecter les doublons : même email OU même nom+prénom dans différentes équipes
    const duplicatesMap = new Map<string, PlayerInfo[]>()
    
    // Grouper les joueurs par email d'abord (plus fiable)
    const playersByEmail = new Map<string, PlayerInfo[]>()
    const playersByName = new Map<string, PlayerInfo[]>()
    
    allPlayers.forEach(player => {
      const email = (player.email || '').toLowerCase().trim()
      const firstName = (player.firstName || '').toLowerCase().trim()
      const lastName = (player.lastName || '').toLowerCase().trim()
      
      if (!firstName || !lastName) return
      
      // Grouper par email
      if (email) {
        if (!playersByEmail.has(email)) {
          playersByEmail.set(email, [])
        }
        playersByEmail.get(email)!.push(player)
      }
      
      // Grouper par nom+prénom
      const nameKey = `${firstName}_${lastName}`
      if (!playersByName.has(nameKey)) {
        playersByName.set(nameKey, [])
      }
      playersByName.get(nameKey)!.push(player)
    })
    
    // Vérifier les doublons par email
    playersByEmail.forEach((players, email) => {
      if (players.length > 1) {
        const uniqueTeams = new Set(players.map(p => p.teamId).filter(id => id))
        if (uniqueTeams.size > 1) {
          // Filtrer pour ne garder que ceux avec des teamId différents
          const teamsWithPlayers = new Map<string, PlayerInfo[]>()
          players.forEach(p => {
            if (p.teamId) {
              if (!teamsWithPlayers.has(p.teamId)) {
                teamsWithPlayers.set(p.teamId, [])
              }
              teamsWithPlayers.get(p.teamId)!.push(p)
            }
          })
          
          if (teamsWithPlayers.size > 1) {
            // Prendre un joueur de chaque équipe
            const uniqueTeamPlayers: PlayerInfo[] = []
            teamsWithPlayers.forEach((teamPlayers) => {
              uniqueTeamPlayers.push(teamPlayers[0]) // Prendre le premier de chaque équipe
            })
            duplicatesMap.set(email, uniqueTeamPlayers)
          }
        }
      }
    })
    
    // Vérifier aussi par nom+prénom (si pas déjà détecté par email)
    playersByName.forEach((players, nameKey) => {
      if (players.length > 1) {
        const uniqueTeams = new Set(players.map(p => p.teamId).filter(id => id))
        if (uniqueTeams.size > 1) {
          // Vérifier si déjà détecté par email
          const emailKey = players[0].email?.toLowerCase().trim()
          if (!emailKey || !duplicatesMap.has(emailKey)) {
            const teamsWithPlayers = new Map<string, PlayerInfo[]>()
            players.forEach(p => {
              if (p.teamId) {
                if (!teamsWithPlayers.has(p.teamId)) {
                  teamsWithPlayers.set(p.teamId, [])
                }
                teamsWithPlayers.get(p.teamId)!.push(p)
              }
            })
            
            if (teamsWithPlayers.size > 1) {
              const uniqueTeamPlayers: PlayerInfo[] = []
              teamsWithPlayers.forEach((teamPlayers) => {
                uniqueTeamPlayers.push(teamPlayers[0])
              })
              duplicatesMap.set(nameKey, uniqueTeamPlayers)
            }
          }
        }
      }
    })
    
    // Convertir en format de réponse
    const duplicates: Array<{
      key: string
      players: PlayerInfo[]
    }> = []
    
    duplicatesMap.forEach((players, key) => {
      duplicates.push({ key, players })
    })
    
    return NextResponse.json({
      success: true,
      duplicates,
      count: duplicates.length
    })
  } catch (error: any) {
    console.error('Erreur détection joueurs dupliqués:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la détection' },
      { status: 500 }
    )
  }
}

