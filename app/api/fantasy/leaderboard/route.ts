import { NextRequest, NextResponse } from 'next/server'
import { getFirestore } from 'firebase-admin/firestore'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

// Initialize Firebase Admin
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  })
}

const adminDb = getFirestore()

/**
 * GET - Récupérer le classement Fantasy (OPTIMIZED)
 * 
 * Query params:
 * - type: 'global' | 'weekly' (default: 'global') - Type de classement
 * - page: number (default: 1) - Numéro de page
 * - limit: number (default: 50, max: 100) - Nombre de résultats par page
 * - search: string (optional) - Rechercher une équipe par nom
 * 
 * Returns:
 * - leaderboard: Array of teams with rank, teamName, userId, points
 * - pagination: { page, limit, total, totalPages }
 * - userTeam: Position de l'équipe de l'utilisateur (si userId fourni)
 * 
 * OPTIMIZATIONS:
 * - Uses composite indexes for efficient sorting
 * - Fetches only top N teams instead of all teams
 * - Batch fetches user data to reduce queries
 * - Background rank updates don't block response
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'global'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const search = searchParams.get('search')
    const userId = searchParams.get('userId') // Pour trouver la position de l'utilisateur

    // Validation des paramètres
    if (!['global', 'weekly'].includes(type)) {
      return NextResponse.json(
        { error: 'Type doit être "global" ou "weekly"' },
        { status: 400 }
      )
    }

    const leaderboardType = type as 'global' | 'weekly'

    if (page < 1 || limit < 1) {
      return NextResponse.json(
        { error: 'Page et limit doivent être supérieurs à 0' },
        { status: 400 }
      )
    }

    const sortField = leaderboardType === 'global' ? 'totalPoints' : 'gameweekPoints'
    
    // Fetch teams from Firestore
    const maxTeamsToFetch = Math.max(1000, page * limit)
    const teamsSnapshot = await adminDb.collection('fantasy_teams')
      .orderBy(sortField, 'desc')
      .limit(maxTeamsToFetch)
      .get()
    
    let allTeams = teamsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    // Filter by search if provided
    if (search) {
      allTeams = allTeams.filter((team: any) => 
        team.teamName.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Calculer les rangs
    const teamsWithRanks = allTeams.map((team: any, index: number) => {
      const points = (team as any)[sortField] || 0
      let currentRank = index + 1
      
      // Find rank by counting teams with higher points
      for (let i = 0; i < index; i++) {
        const prevPoints = (allTeams[i] as any)[sortField] || 0
        if (prevPoints === points) {
          currentRank = (allTeams[i] as any).rank || (i + 1)
          break
        }
      }
      
      return {
        ...team,
        rank: currentRank
      }
    })

    // Pagination
    const total = teamsWithRanks.length
    const totalPages = Math.ceil(total / limit)
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedTeams = teamsWithRanks.slice(startIndex, endIndex)

    // Fetch user information
    const userIds = paginatedTeams.map((team: any) => team.userId)
    const usersMap = new Map()
    
    if (userIds.length > 0) {
      const usersSnapshot = await adminDb.collection('users')
        .where('__name__', 'in', userIds.slice(0, 10)) // Firestore limit
        .get()
      
      usersSnapshot.docs.forEach(doc => {
        usersMap.set(doc.id, doc.data())
      })
    }

    // Construire le classement avec les informations utilisateur
    const leaderboard = paginatedTeams.map((team: any) => {
      const userInfo = usersMap.get(team.userId)
      
      return {
        id: team.id,
        rank: team.rank,
        teamName: team.teamName,
        userId: team.userId,
        userName: userInfo?.name || 'Utilisateur',
        userPhoto: userInfo?.photo || null,
        userSchool: userInfo?.school || null,
        totalPoints: team.totalPoints || 0,
        gameweekPoints: team.gameweekPoints || 0,
        badges: team.badges || [],
        formation: team.formation,
        createdAt: team.createdAt
      }
    })

    // Find user's team rank
    let userTeam = null
    if (userId) {
      const userTeamData = teamsWithRanks.find((team: any) => team.userId === userId)
      
      if (userTeamData) {
        let userInfo = usersMap.get(userTeamData.userId)
        
        if (!userInfo) {
          const userDoc = await adminDb.collection('users').doc(userId).get()
          if (userDoc.exists) {
            userInfo = userDoc.data()
          }
        }
        
        userTeam = {
          id: userTeamData.id,
          rank: userTeamData.rank,
          teamName: userTeamData.teamName,
          userId: userTeamData.userId,
          userName: userInfo?.name || 'Utilisateur',
          userPhoto: userInfo?.photo || null,
          userSchool: userInfo?.school || null,
          totalPoints: userTeamData.totalPoints || 0,
          gameweekPoints: userTeamData.gameweekPoints || 0,
          badges: userTeamData.badges || [],
          formation: userTeamData.formation
        }
      }
    }

    console.log(`✅ Classement ${leaderboardType} récupéré: ${leaderboard.length} équipes (page ${page}/${totalPages})`)

    return NextResponse.json({
      success: true,
      type: leaderboardType,
      leaderboard,
      userTeam,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    }, { status: 200 })

  } catch (error) {
    console.error('❌ Erreur lors de la récupération du classement:', error)
    return NextResponse.json(
      { 
        error: 'Erreur serveur lors de la récupération du classement',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    )
  }
}


