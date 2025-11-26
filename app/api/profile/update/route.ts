import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const { userId, userType, updates } = await request.json()

    if (!userId || !userType || !updates) {
      return NextResponse.json(
        { error: 'Données manquantes' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur existe et a le droit de modifier
    let userRecord
    try {
      userRecord = await adminAuth.getUser(userId)
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Définir les champs autorisés selon le type
    const allowedFields: Record<string, string[]> = {
      player: ['phone', 'photo', 'foot', 'tshirtSize', 'birthDate', 'position', 'height'],
      coach: ['phone', 'photo', 'tshirtSize']
    }

    const fields = allowedFields[userType]
    if (!fields) {
      return NextResponse.json(
        { error: 'Type d\'utilisateur invalide' },
        { status: 400 }
      )
    }

    // Filtrer les updates pour ne garder que les champs autorisés
    const filteredUpdates: any = {}
    for (const field of fields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field]
      }
    }

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json(
        { error: 'Aucun champ autorisé à modifier' },
        { status: 400 }
      )
    }

    // Ajouter updatedAt
    filteredUpdates.updatedAt = new Date()

    // Mettre à jour dans la bonne collection
    if (userType === 'player') {
      // Trouver le playerAccount par uid ou email
      const playerAccountsSnap = await adminDb
        .collection('playerAccounts')
        .where('uid', '==', userId)
        .limit(1)
        .get()

      let playerAccountDoc
      let playerAccountsByEmailSnap

      if (playerAccountsSnap.empty) {
        // Essayer par email
        playerAccountsByEmailSnap = await adminDb
          .collection('playerAccounts')
          .where('email', '==', userRecord.email)
          .limit(1)
          .get()

        if (playerAccountsByEmailSnap.empty) {
          return NextResponse.json(
            { error: 'Compte joueur non trouvé' },
            { status: 404 }
          )
        }

        playerAccountDoc = playerAccountsByEmailSnap.docs[0]
        await playerAccountDoc.ref.update(filteredUpdates)
      } else {
        playerAccountDoc = playerAccountsSnap.docs[0]
        await playerAccountDoc.ref.update(filteredUpdates)
      }

      // Récupérer le playerAccount pour obtenir teamId et teamName
      const playerAccountData = playerAccountDoc.data()
      const teamId = playerAccountData?.teamId
      const teamName = playerAccountData?.teamName

      // Mettre à jour aussi dans la collection players
      if (updates.position || updates.height || updates.foot || updates.tshirtSize || updates.birthDate) {
        const playersSnap = await adminDb
          .collection('players')
          .where('email', '==', userRecord.email)
          .get()

        for (const playerDoc of playersSnap.docs) {
          const playerUpdates: any = {}
          if (updates.position) playerUpdates.position = updates.position
          if (updates.height) playerUpdates.height = updates.height
          if (updates.tshirtSize) playerUpdates.tshirtSize = updates.tshirtSize
          if (updates.birthDate) playerUpdates.birthDate = updates.birthDate
          if (updates.foot) {
            playerUpdates.strongFoot = updates.foot === 'Droitier' ? 'Droit' : 
                                      updates.foot === 'Gaucher' ? 'Gauche' : 'Ambidextre'
          }
          playerUpdates.updatedAt = new Date()
          if (Object.keys(playerUpdates).length > 0) {
            await playerDoc.ref.update(playerUpdates)
          }
        }
      }

      // Mettre à jour dans teams.players si l'équipe existe
      if (teamId && (updates.position || updates.height || updates.foot || updates.tshirtSize || updates.birthDate)) {
        try {
          const teamDoc = await adminDb.collection('teams').doc(teamId).get()
          if (teamDoc.exists) {
            const teamData = teamDoc.data()
            const players = teamData?.players || []
            const playerIndex = players.findIndex((p: any) => p.email === userRecord.email)
            
            if (playerIndex >= 0) {
              if (updates.position) players[playerIndex].position = updates.position
              if (updates.height) players[playerIndex].height = updates.height
              if (updates.tshirtSize) players[playerIndex].tshirtSize = updates.tshirtSize
              if (updates.birthDate) {
                players[playerIndex].birthDate = updates.birthDate
                // Recalculer l'âge si nécessaire
                if (updates.birthDate) {
                  const today = new Date()
                  const birth = new Date(updates.birthDate)
                  let age = today.getFullYear() - birth.getFullYear()
                  const monthDiff = today.getMonth() - birth.getMonth()
                  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                    age--
                  }
                  players[playerIndex].age = age
                }
              }
              if (updates.foot) {
                players[playerIndex].strongFoot = updates.foot === 'Droitier' ? 'Droit' : 
                                                  updates.foot === 'Gaucher' ? 'Gauche' : 'Ambidextre'
                players[playerIndex].foot = updates.foot
              }
              
              await adminDb.collection('teams').doc(teamId).update({
                players: players,
                updatedAt: new Date()
              })
            }
          }
        } catch (teamError) {
          console.error('Erreur mise à jour teams.players:', teamError)
          // On continue même si la mise à jour de l'équipe échoue
        }
      }

      // Mettre à jour dans teamRegistrations si l'inscription existe
      if (teamId && (updates.tshirtSize || updates.birthDate || updates.height || updates.position || updates.foot)) {
        try {
          const registrationsSnap = await adminDb.collection('teamRegistrations')
            .where('teamId', '==', teamId)
            .limit(1)
            .get()
          
          if (!registrationsSnap.empty) {
            const registrationDoc = registrationsSnap.docs[0]
            const registrationData = registrationDoc.data()
            const players = registrationData?.players || []
            const playerIndex = players.findIndex((p: any) => p.email === userRecord.email)
            
            if (playerIndex >= 0) {
              if (updates.tshirtSize) players[playerIndex].tshirtSize = updates.tshirtSize
              if (updates.birthDate) {
                players[playerIndex].birthDate = updates.birthDate
                // Recalculer l'âge si nécessaire
                if (updates.birthDate) {
                  const today = new Date()
                  const birth = new Date(updates.birthDate)
                  let age = today.getFullYear() - birth.getFullYear()
                  const monthDiff = today.getMonth() - birth.getMonth()
                  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
                    age--
                  }
                  players[playerIndex].age = age
                }
              }
              if (updates.height) players[playerIndex].height = updates.height
              if (updates.position) players[playerIndex].position = updates.position
              if (updates.foot) players[playerIndex].foot = updates.foot
              
              await registrationDoc.ref.update({
                players: players,
                lastUpdatedAt: new Date()
              })
            }
          }
        } catch (registrationError) {
          console.error('Erreur mise à jour teamRegistrations:', registrationError)
          // On continue même si la mise à jour de l'inscription échoue
        }
      }
    } else if (userType === 'coach') {
      // Trouver le coachAccount par uid ou email
      const coachAccountsSnap = await adminDb
        .collection('coachAccounts')
        .where('uid', '==', userId)
        .limit(1)
        .get()

      if (coachAccountsSnap.empty) {
        // Essayer par email
        const coachAccountsByEmailSnap = await adminDb
          .collection('coachAccounts')
          .where('email', '==', userRecord.email)
          .limit(1)
          .get()

        if (coachAccountsByEmailSnap.empty) {
          return NextResponse.json(
            { error: 'Compte coach non trouvé' },
            { status: 404 }
          )
        }

        await coachAccountsByEmailSnap.docs[0].ref.update(filteredUpdates)
      } else {
        await coachAccountsSnap.docs[0].ref.update(filteredUpdates)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès'
    })
  } catch (error: any) {
    console.error('Erreur mise à jour profil:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

