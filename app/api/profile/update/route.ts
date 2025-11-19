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
      coach: ['phone', 'photo']
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

      if (playerAccountsSnap.empty) {
        // Essayer par email
        const playerAccountsByEmailSnap = await adminDb
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

        await playerAccountsByEmailSnap.docs[0].ref.update(filteredUpdates)
      } else {
        await playerAccountsSnap.docs[0].ref.update(filteredUpdates)
      }

      // Mettre à jour aussi dans la collection players si nécessaire
      if (updates.position || updates.height || updates.foot) {
        const playersSnap = await adminDb
          .collection('players')
          .where('email', '==', userRecord.email)
          .get()

        for (const playerDoc of playersSnap.docs) {
          const playerUpdates: any = {}
          if (updates.position) playerUpdates.position = updates.position
          if (updates.height) playerUpdates.height = updates.height
          if (updates.foot) {
            playerUpdates.strongFoot = updates.foot === 'Droitier' ? 'Droit' : 
                                      updates.foot === 'Gaucher' ? 'Gauche' : 'Ambidextre'
          }
          if (Object.keys(playerUpdates).length > 0) {
            await playerDoc.ref.update(playerUpdates)
          }
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

