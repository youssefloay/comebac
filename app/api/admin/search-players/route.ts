import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore'

interface SearchFilters {
  position?: string
  teamId?: string
  schoolName?: string
  teamGrade?: string
  status?: 'active' | 'inactive' | 'neverLoggedIn'
  minGoals?: number
  minAssists?: number
  minMatches?: number
  searchTerm?: string
  sortBy?: 'goals' | 'assists' | 'matches' | 'name' | 'team'
  sortOrder?: 'asc' | 'desc'
  limit?: number
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    const filters: SearchFilters = {
      position: searchParams.get('position') || undefined,
      teamId: searchParams.get('teamId') || undefined,
      schoolName: searchParams.get('schoolName') || undefined,
      teamGrade: searchParams.get('teamGrade') || undefined,
      status: (searchParams.get('status') as any) || undefined,
      minGoals: searchParams.get('minGoals') ? parseInt(searchParams.get('minGoals')!) : undefined,
      minAssists: searchParams.get('minAssists') ? parseInt(searchParams.get('minAssists')!) : undefined,
      minMatches: searchParams.get('minMatches') ? parseInt(searchParams.get('minMatches')!) : undefined,
      searchTerm: searchParams.get('searchTerm') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'name',
      sortOrder: (searchParams.get('sortOrder') as any) || 'asc',
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined
    }

    // Récupérer tous les joueurs
    const playersSnap = await getDocs(collection(db, 'players'))
    let players = playersSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Récupérer les comptes joueurs pour les statuts
    const playerAccountsSnap = await getDocs(collection(db, 'playerAccounts'))
    const playerAccounts = playerAccountsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Récupérer les équipes pour les filtres
    const teamsSnap = await getDocs(collection(db, 'teams'))
    const teams = teamsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Récupérer les statistiques
    const statsSnap = await getDocs(collection(db, 'teamStatistics'))
    const statistics = statsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Enrichir les joueurs avec les données des équipes, comptes et statistiques
    players = players.map(player => {
      const team = teams.find(t => t.id === player.teamId)
      const account = playerAccounts.find(pa => pa.email === player.email || pa.teamId === player.teamId)
      const playerStats = statistics.find(s => s.playerId === player.id || s.playerEmail === player.email)
      
      return {
        ...player,
        teamName: team?.name || '',
        schoolName: team?.schoolName || '',
        teamGrade: team?.teamGrade || '',
        neverLoggedIn: account ? !account.uid : true,
        isActive: account?.uid ? true : false,
        goals: playerStats?.goals || 0,
        assists: playerStats?.assists || 0,
        matchesPlayed: playerStats?.matchesPlayed || 0
      }
    })

    // Appliquer les filtres
    let filteredPlayers = players

    // Filtre par position
    if (filters.position) {
      filteredPlayers = filteredPlayers.filter(p => 
        p.position === filters.position ||
        (p as any).alternativePositions?.includes(filters.position)
      )
    }

    // Filtre par équipe
    if (filters.teamId) {
      filteredPlayers = filteredPlayers.filter(p => p.teamId === filters.teamId)
    }

    // Filtre par école
    if (filters.schoolName) {
      filteredPlayers = filteredPlayers.filter(p => (p as any).schoolName === filters.schoolName)
    }

    // Filtre par classe
    if (filters.teamGrade) {
      filteredPlayers = filteredPlayers.filter(p => (p as any).teamGrade === filters.teamGrade)
    }

    // Filtre par statut
    if (filters.status) {
      if (filters.status === 'neverLoggedIn') {
        filteredPlayers = filteredPlayers.filter(p => (p as any).neverLoggedIn)
      } else if (filters.status === 'active') {
        filteredPlayers = filteredPlayers.filter(p => (p as any).isActive)
      } else if (filters.status === 'inactive') {
        filteredPlayers = filteredPlayers.filter(p => !(p as any).isActive && !(p as any).neverLoggedIn)
      }
    }

    // Filtre par statistiques
    if (filters.minGoals !== undefined) {
      filteredPlayers = filteredPlayers.filter(p => (p as any).goals >= filters.minGoals!)
    }

    if (filters.minAssists !== undefined) {
      filteredPlayers = filteredPlayers.filter(p => (p as any).assists >= filters.minAssists!)
    }

    if (filters.minMatches !== undefined) {
      filteredPlayers = filteredPlayers.filter(p => (p as any).matchesPlayed >= filters.minMatches!)
    }

    // Recherche textuelle
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      filteredPlayers = filteredPlayers.filter(p => 
        (p.firstName || '').toLowerCase().includes(term) ||
        (p.lastName || '').toLowerCase().includes(term) ||
        (p.name || '').toLowerCase().includes(term) ||
        (p.email || '').toLowerCase().includes(term) ||
        ((p as any).teamName || '').toLowerCase().includes(term) ||
        ((p as any).schoolName || '').toLowerCase().includes(term) ||
        ((p as any).nickname || '').toLowerCase().includes(term)
      )
    }

    // Trier
    filteredPlayers.sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (filters.sortBy) {
        case 'goals':
          aValue = (a as any).goals || 0
          bValue = (b as any).goals || 0
          break
        case 'assists':
          aValue = (a as any).assists || 0
          bValue = (b as any).assists || 0
          break
        case 'matches':
          aValue = (a as any).matchesPlayed || 0
          bValue = (b as any).matchesPlayed || 0
          break
        case 'team':
          aValue = (a as any).teamName || ''
          bValue = (b as any).teamName || ''
          break
        case 'name':
        default:
          aValue = `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.name || ''
          bValue = `${b.firstName || ''} ${b.lastName || ''}`.trim() || b.name || ''
          break
      }

      if (filters.sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      }
    })

    // Limiter les résultats
    if (filters.limit) {
      filteredPlayers = filteredPlayers.slice(0, filters.limit)
    }

    return NextResponse.json({
      success: true,
      players: filteredPlayers,
      total: filteredPlayers.length,
      filters: filters
    })

  } catch (error: any) {
    console.error('Erreur recherche joueurs:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Erreur lors de la recherche', 
        details: error.message 
      },
      { status: 500 }
    )
  }
}

