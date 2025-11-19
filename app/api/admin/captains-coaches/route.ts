import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const adminDb = getFirestore()

export interface CaptainCoachData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: 'captain' | 'coach'
  teamId: string
  teamName: string
}

export async function GET() {
  try {
    const captains: CaptainCoachData[] = []
    const coaches: CaptainCoachData[] = []

    // Récupérer toutes les équipes
    const teamsSnap = await adminDb.collection('teams').get()
    const teamsMap = new Map<string, string>()
    teamsSnap.docs.forEach(doc => {
      teamsMap.set(doc.id, doc.data().name || 'Équipe sans nom')
    })

    // Récupérer tous les joueurs avec isCaptain = true depuis la collection players
    const playersCollection = await adminDb.collection('players').get()
    
    // Créer un map pour enrichir avec les données de playerAccounts
    const playerAccountsSnap = await adminDb.collection('playerAccounts').get()
    const playerAccountsMap = new Map<string, any>()
    
    for (const accountDoc of playerAccountsSnap.docs) {
      const accountData = accountDoc.data()
      const email = accountData.email?.toLowerCase().trim()
      const teamId = accountData.teamId
      if (email && teamId) {
        const key = `${email}::${teamId}`
        playerAccountsMap.set(key, accountData)
      }
    }
    
    // Identifier les capitaines directement depuis players
    for (const playerDoc of playersCollection.docs) {
      const playerData = playerDoc.data()
      const teamId = playerData.teamId
      
      if (playerData.isCaptain === true && teamId) {
        const email = playerData.email?.toLowerCase().trim()
        const key = email ? `${email}::${teamId}` : null
        
        // Essayer de récupérer les données depuis playerAccounts
        let firstName = playerData.firstName || ''
        let lastName = playerData.lastName || ''
        let phone = playerData.phone || ''
        let finalEmail = playerData.email || ''
        
        if (key && playerAccountsMap.has(key)) {
          const accountData = playerAccountsMap.get(key)
          firstName = accountData.firstName || firstName
          lastName = accountData.lastName || lastName
          phone = accountData.phone || phone
          finalEmail = accountData.email || finalEmail
        }
        
        // Si pas de nom dans players, utiliser le champ name
        if (!firstName && !lastName && playerData.name) {
          const nameParts = playerData.name.split(' ')
          firstName = nameParts[0] || ''
          lastName = nameParts.slice(1).join(' ') || ''
        }
        
        captains.push({
          id: playerDoc.id,
          firstName: firstName,
          lastName: lastName,
          email: finalEmail,
          phone: phone,
          role: 'captain',
          teamId: teamId,
          teamName: teamsMap.get(teamId) || 'Équipe inconnue'
        })
      }
    }

    // Récupérer tous les coachs
    const coachesSnap = await adminDb.collection('coachAccounts').get()
    
    for (const coachDoc of coachesSnap.docs) {
      const coachData = coachDoc.data()
      const teamId = coachData.teamId
      
      if (!teamId) continue

      coaches.push({
        id: coachDoc.id,
        firstName: coachData.firstName || '',
        lastName: coachData.lastName || '',
        email: coachData.email || '',
        phone: coachData.phone || '',
        role: 'coach',
        teamId: teamId,
        teamName: teamsMap.get(teamId) || 'Équipe inconnue'
      })
    }

    return NextResponse.json({
      success: true,
      captains,
      coaches,
      total: captains.length + coaches.length
    })
  } catch (error: any) {
    console.error('Error fetching captains and coaches:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

