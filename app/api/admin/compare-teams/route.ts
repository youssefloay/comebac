import { NextRequest, NextResponse } from 'next/server'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'

interface PlayerInfo {
  firstName: string
  lastName: string
  email: string
  nickname?: string
  jerseyNumber?: string | number
  position?: string
}

interface TeamComparison {
  team1: {
    id: string
    name: string
    players: PlayerInfo[]
  }
  team2: {
    id: string
    name: string
    players: PlayerInfo[]
  }
  commonPlayers: PlayerInfo[]
  team1Only: PlayerInfo[]
  team2Only: PlayerInfo[]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const compareAll = searchParams.get('compareAll') === 'true'
    const team1Name = searchParams.get('team1')
    const team2Name = searchParams.get('team2')
    const searchByEmail = searchParams.get('searchByEmail') !== 'false' // Par défaut true
    const searchByName = searchParams.get('searchByName') !== 'false' // Par défaut true

    if (!searchByEmail && !searchByName) {
      return NextResponse.json(
        { error: 'Au moins un critère de recherche doit être sélectionné' },
        { status: 400 }
      )
    }

    // Récupérer toutes les équipes
    const teamsSnap = await getDocs(collection(db, 'teams'))
    const teams = teamsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Fonction helper pour comparer deux équipes
    const compareTwoTeams = async (team1: any, team2: any, team1Name: string, team2Name: string, searchByEmail: boolean, searchByName: boolean): Promise<TeamComparison> => {
      const getTeamPlayers = (team: any): PlayerInfo[] => {
        const players: PlayerInfo[] = []
        
        if (team.players && Array.isArray(team.players)) {
          team.players.forEach((player: any) => {
            players.push({
              firstName: player.firstName || '',
              lastName: player.lastName || '',
              email: (player.email || '').toLowerCase().trim(),
              nickname: player.nickname || '',
              jerseyNumber: player.jerseyNumber || '',
              position: player.position || ''
            })
          })
        }
        return players
      }

      let team1Players = getTeamPlayers(team1)
      let team2Players = getTeamPlayers(team2)

      // Récupérer aussi les joueurs depuis playerAccounts
      const playerAccountsSnap = await getDocs(collection(db, 'playerAccounts'))
      playerAccountsSnap.docs.forEach(doc => {
        const data = doc.data()
        if (data.teamId === team1.id) {
          const email = (data.email || '').toLowerCase().trim()
          const exists = team1Players.some(p => 
            p.email === email || 
            (p.firstName.toLowerCase() === (data.firstName || '').toLowerCase() &&
             p.lastName.toLowerCase() === (data.lastName || '').toLowerCase())
          )
          if (!exists) {
            team1Players.push({
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              email: email,
              nickname: data.nickname || '',
              jerseyNumber: data.jerseyNumber || '',
              position: data.position || ''
            })
          }
        }
        if (data.teamId === team2.id) {
          const email = (data.email || '').toLowerCase().trim()
          const exists = team2Players.some(p => 
            p.email === email || 
            (p.firstName.toLowerCase() === (data.firstName || '').toLowerCase() &&
             p.lastName.toLowerCase() === (data.lastName || '').toLowerCase())
          )
          if (!exists) {
            team2Players.push({
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              email: email,
              nickname: data.nickname || '',
              jerseyNumber: data.jerseyNumber || '',
              position: data.position || ''
            })
          }
        }
      })

      // Fonction pour vérifier si deux joueurs sont identiques selon les critères sélectionnés
      const isSamePlayer = (p1: PlayerInfo, p2: PlayerInfo): boolean => {
        const email1 = (p1.email || '').toLowerCase().trim()
        const email2 = (p2.email || '').toLowerCase().trim()
        const firstName1 = (p1.firstName || '').toLowerCase().trim()
        const firstName2 = (p2.firstName || '').toLowerCase().trim()
        const lastName1 = (p1.lastName || '').toLowerCase().trim()
        const lastName2 = (p2.lastName || '').toLowerCase().trim()

        let matches = false

        if (searchByEmail && email1 && email2 && email1 === email2) {
          matches = true
        }

        if (searchByName && firstName1 && firstName2 && lastName1 && lastName2 &&
            firstName1 === firstName2 && lastName1 === lastName2) {
          matches = true
        }

        return matches
      }

      const commonPlayers: PlayerInfo[] = []
      const team1Only: PlayerInfo[] = []
      const team2Only: PlayerInfo[] = []

      team1Players.forEach(player1 => {
        const found = team2Players.find(player2 => isSamePlayer(player1, player2))
        if (found) {
          commonPlayers.push(player1)
        } else {
          team1Only.push(player1)
        }
      })

      team2Players.forEach(player2 => {
        const found = team1Players.find(player1 => isSamePlayer(player1, player2))
        if (!found) {
          team2Only.push(player2)
        }
      })

      return {
        team1: {
          id: team1.id,
          name: team1.name || team1Name,
          players: team1Players
        },
        team2: {
          id: team2.id,
          name: team2.name || team2Name,
          players: team2Players
        },
        commonPlayers,
        team1Only,
        team2Only
      }
    }

    // Si on compare toutes les équipes
    if (compareAll) {
      const comparisons: TeamComparison[] = []
      
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          const team1 = teams[i]
          const team2 = teams[j]
          
          const comparison = await compareTwoTeams(team1, team2, team1.name || '', team2.name || '', searchByEmail, searchByName)
          if (comparison.commonPlayers.length > 0) {
            comparisons.push(comparison)
          }
        }
      }
      
      return NextResponse.json({
        success: true,
        comparisons,
        count: comparisons.length
      })
    }

    // Comparaison de deux équipes spécifiques
    if (!team1Name || !team2Name) {
      return NextResponse.json(
        { error: 'Les noms des deux équipes sont requis (team1 et team2)' },
        { status: 400 }
      )
    }

    // Trouver les équipes par nom (insensible à la casse)
    const team1 = teams.find(t => 
      (t.name || '').toLowerCase().trim() === team1Name.toLowerCase().trim()
    )
    const team2 = teams.find(t => 
      (t.name || '').toLowerCase().trim() === team2Name.toLowerCase().trim()
    )

    if (!team1) {
      return NextResponse.json(
        { error: `Équipe "${team1Name}" non trouvée` },
        { status: 404 }
      )
    }

    if (!team2) {
      return NextResponse.json(
        { error: `Équipe "${team2Name}" non trouvée` },
        { status: 404 }
      )
    }

    const comparison = await compareTwoTeams(team1, team2, team1Name, team2Name, searchByEmail, searchByName)

    return NextResponse.json({
      success: true,
      comparison
    })
  } catch (error: any) {
    console.error('Erreur comparaison équipes:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la comparaison' },
      { status: 500 }
    )
  }
}

