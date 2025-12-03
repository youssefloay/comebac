import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

// GET - Get lineups for a preseason match
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get('matchId')

    if (!matchId) {
      return NextResponse.json(
        { error: 'matchId is required' },
        { status: 400 }
      )
    }

    // Récupérer les compositions depuis la collection lineups
    const lineupsSnapshot = await adminDb!.collection('lineups')
      .where('matchId', '==', matchId)
      .get()

    const lineups = lineupsSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        matchId: data.matchId,
        teamId: data.teamId,
        starters: data.starters || [],
        substitutes: data.substitutes || [],
        formation: data.formation || '',
        validated: data.validated || false,
        validatedAt: data.validatedAt?.toDate ? data.validatedAt.toDate() : (data.validatedAt ? new Date(data.validatedAt) : null),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : null),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : null),
      }
    })

    // Récupérer les informations des joueurs pour chaque composition
    const enrichedLineups = await Promise.all(
      lineups.map(async (lineup) => {
        try {
          // Récupérer les joueurs titulaires
          const startersData = await Promise.all(
            lineup.starters.map(async (playerId: string) => {
              try {
                // Essayer d'abord avec l'ID comme document ID dans playerAccounts
                try {
                  const playerAccountsDoc = await adminDb!.collection('playerAccounts')
                    .doc(playerId)
                    .get()
                  
                  if (playerAccountsDoc.exists) {
                    const data = playerAccountsDoc.data()!
                    return {
                      id: playerAccountsDoc.id,
                      name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                      firstName: data.firstName,
                      lastName: data.lastName,
                      nickname: data.nickname,
                      number: data.jerseyNumber || data.number || 0,
                      position: data.position || '',
                      photo: data.photo,
                    }
                  }
                } catch {}

                // Essayer avec l'ID comme document ID dans players
                try {
                  const playersDoc = await adminDb!.collection('players')
                    .doc(playerId)
                    .get()
                  
                  if (playersDoc.exists) {
                    const data = playersDoc.data()!
                    return {
                      id: playersDoc.id,
                      name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                      firstName: data.firstName,
                      lastName: data.lastName,
                      nickname: data.nickname,
                      number: data.number || data.jerseyNumber || 0,
                      position: data.position || '',
                      photo: data.photo,
                    }
                  }
                } catch {}

                return null
              } catch (error) {
                console.error(`Error fetching player ${playerId}:`, error)
                return null
              }
            })
          )

          // Récupérer les remplaçants
          const substitutesData = await Promise.all(
            lineup.substitutes.map(async (playerId: string) => {
              try {
                // Essayer d'abord avec l'ID comme document ID dans playerAccounts
                try {
                  const playerAccountsDoc = await adminDb!.collection('playerAccounts')
                    .doc(playerId)
                    .get()
                  
                  if (playerAccountsDoc.exists) {
                    const data = playerAccountsDoc.data()!
                    return {
                      id: playerAccountsDoc.id,
                      name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                      firstName: data.firstName,
                      lastName: data.lastName,
                      nickname: data.nickname,
                      number: data.jerseyNumber || data.number || 0,
                      position: data.position || '',
                      photo: data.photo,
                    }
                  }
                } catch {}

                // Essayer avec l'ID comme document ID dans players
                try {
                  const playersDoc = await adminDb!.collection('players')
                    .doc(playerId)
                    .get()
                  
                  if (playersDoc.exists) {
                    const data = playersDoc.data()!
                    return {
                      id: playersDoc.id,
                      name: data.name || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                      firstName: data.firstName,
                      lastName: data.lastName,
                      nickname: data.nickname,
                      number: data.number || data.jerseyNumber || 0,
                      position: data.position || '',
                      photo: data.photo,
                    }
                  }
                } catch {}

                return null
              } catch (error) {
                console.error(`Error fetching player ${playerId}:`, error)
                return null
              }
            })
          )

          return {
            ...lineup,
            startersData: startersData.filter(Boolean),
            substitutesData: substitutesData.filter(Boolean),
          }
        } catch (error) {
          console.error(`Error enriching lineup ${lineup.id}:`, error)
          return {
            ...lineup,
            startersData: [],
            substitutesData: [],
          }
        }
      })
    )

    return NextResponse.json({ lineups: enrichedLineups })
  } catch (error: any) {
    console.error('Error fetching lineups:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch lineups' },
      { status: 500 }
    )
  }
}

