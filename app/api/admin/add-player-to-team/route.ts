import { NextRequest, NextResponse } from 'next/server'
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { getPasswordResetActionCodeSettings } from '@/lib/password-reset'
import { generateWelcomeEmail, sendCoachWelcomeEmail, sendEmail } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const { teamId, player, isCoach } = await request.json()

    if (!teamId || !player) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Vérifier que l'équipe existe
    const teamDoc = await getDoc(doc(db, 'teams', teamId))
    if (!teamDoc.exists()) {
      return NextResponse.json({ error: 'Équipe non trouvée' }, { status: 404 })
    }

    const teamData = teamDoc.data()

    // 1. Ajouter dans la collection players avec les infos de l'équipe
    await addDoc(collection(db, 'players'), {
      name: `${player.firstName} ${player.lastName}`,
      number: isCoach ? 0 : player.jerseyNumber,
      position: isCoach ? 'Entraîneur' : player.position,
      teamId: teamId,
      nationality: 'Égypte',
      isCaptain: false,
      isCoach: isCoach || false,
      email: player.email,
      phone: player.phone,
      firstName: player.firstName,
      lastName: player.lastName,
      nickname: player.nickname || '',
      birthDate: player.birthDate || '',
      height: player.height || 0,
      tshirtSize: player.tshirtSize || 'M',
      strongFoot: player.foot === 'Droitier' ? 'Droit' : player.foot === 'Gaucher' ? 'Gauche' : 'Ambidextre',
      // Auto-remplir les infos communes de l'équipe
      school: teamData.schoolName || teamData.school || '',
      grade: teamData.teamGrade || '',
      overall: isCoach ? 0 : 75,
      seasonStats: {
        goals: 0,
        assists: 0,
        matches: 0,
        yellowCards: 0,
        redCards: 0
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })

    // 2. Créer le compte et envoyer l'email
    if (isCoach) {
      // Créer compte coach
      const coachQuery = query(
        collection(db, 'coachAccounts'),
        where('email', '==', player.email)
      )
      const coachSnap = await getDocs(coachQuery)

      let coachDocId: string

      let userRecord
      try {
        const { adminAuth } = await import('@/lib/firebase-admin')
        
        // Créer ou récupérer compte Firebase Auth
        try {
          userRecord = await adminAuth.getUserByEmail(player.email)
        } catch (error: any) {
          if (error.code === 'auth/user-not-found') {
            userRecord = await adminAuth.createUser({
              email: player.email,
              password: Math.random().toString(36).slice(-12) + 'Aa1!',
              displayName: `${player.firstName} ${player.lastName}`
            })
          } else {
            throw error
          }
        }
      } catch (authError) {
        console.error('❌ Erreur création compte Auth:', authError)
      }

      if (coachSnap.empty) {
        // Créer le coachAccount avec l'UID si disponible
        const coachDocRef = await addDoc(collection(db, 'coachAccounts'), {
          email: player.email,
          firstName: player.firstName,
          lastName: player.lastName,
          phone: player.phone || '',
          birthDate: player.birthDate || '',
          teamId: teamId,
          teamName: teamData.name,
          uid: userRecord?.uid || null,
          // Auto-remplir les infos communes de l'équipe
          schoolName: teamData.schoolName || teamData.school || '',
          grade: teamData.teamGrade || '',
          photo: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        coachDocId = coachDocRef.id
        console.log('✅ Coach account créé dans coachAccounts, envoi email...')

        // Envoyer email coach avec le bon template
        if (userRecord) {
          try {
            const { adminAuth } = await import('@/lib/firebase-admin')
            
            // Générer lien de réinitialisation
            const resetLink = await adminAuth.generatePasswordResetLink(player.email, getPasswordResetActionCodeSettings(player.email))

            // Envoyer email avec le template professionnel
            await sendCoachWelcomeEmail({
              email: player.email,
              firstName: player.firstName,
              lastName: player.lastName,
              teamName: teamData.name,
              resetLink
            })
            
            console.log('✅ Email coach envoyé avec le bon template')
          } catch (emailError) {
            console.error('❌ Erreur envoi email coach:', emailError)
          }
        }
      } else {
        coachDocId = coachSnap.docs[0].id
        // Mettre à jour l'UID si manquant
        if (userRecord && !coachSnap.docs[0].data().uid) {
          await updateDoc(coachSnap.docs[0].ref, {
            uid: userRecord.uid,
            updatedAt: serverTimestamp()
          })
          console.log('✅ UID mis à jour dans coachAccounts')
        }
        console.log('ℹ️ Coach account existe déjà dans coachAccounts:', coachDocId)
      }

      // Mettre à jour le document teams avec les informations du coach
      await updateDoc(doc(db, 'teams', teamId), {
        coachId: coachDocId,
        coachFirstName: player.firstName,
        coachLastName: player.lastName,
        coachEmail: player.email,
        coach: {
          firstName: player.firstName,
          lastName: player.lastName,
          birthDate: player.birthDate || '',
          email: player.email,
          phone: player.phone || ''
        },
        updatedAt: serverTimestamp()
      })
      console.log('✅ Document teams mis à jour avec les informations du coach')
    } else {
      // Créer compte joueur
      console.log(`📝 Traitement du joueur ${player.firstName} ${player.lastName} (${player.email})...`)
      
      try {
        const { adminAuth } = await import('@/lib/firebase-admin')
        const { adminDb } = await import('@/lib/firebase-admin')
        
        // Vérifier si le compte playerAccounts existe déjà
        const playerQuery = query(
          collection(db, 'playerAccounts'),
          where('email', '==', player.email)
        )
        const playerSnap = await getDocs(playerQuery)
        
        // Créer ou récupérer compte Firebase Auth
        let userRecord
        let isNewAuthAccount = false
        try {
          userRecord = await adminAuth.getUserByEmail(player.email)
          console.log(`ℹ️ Compte Firebase Auth existant trouvé: ${userRecord.uid}`)
        } catch (error: any) {
          if (error.code === 'auth/user-not-found') {
            userRecord = await adminAuth.createUser({
              email: player.email,
              password: Math.random().toString(36).slice(-12) + 'Aa1!',
              displayName: `${player.firstName} ${player.lastName}`
            })
            isNewAuthAccount = true
            console.log(`✅ Nouveau compte Firebase Auth créé: ${userRecord.uid}`)
          } else {
            throw error
          }
        }

        // Créer ou mettre à jour dans playerAccounts
        if (playerSnap.empty) {
          console.log('📝 Création du document playerAccounts...')
          await adminDb.collection('playerAccounts').doc(userRecord.uid).set({
            uid: userRecord.uid,
            email: player.email,
            firstName: player.firstName,
            lastName: player.lastName,
            nickname: player.nickname || '',
            phone: player.phone || '',
            position: player.position,
            jerseyNumber: player.jerseyNumber,
            teamId: teamId,
            teamName: teamData.name,
            // Auto-remplir les infos communes de l'équipe
            schoolName: teamData.schoolName || teamData.school || '',
            grade: teamData.teamGrade || '',
            birthDate: player.birthDate || '',
            height: player.height || 0,
            tshirtSize: player.tshirtSize || 'M',
            foot: player.foot,
            role: 'player',
            createdAt: new Date(),
            updatedAt: new Date()
          })
          console.log('✅ Document playerAccounts créé')
        } else {
          console.log('ℹ️ Document playerAccounts existe déjà, mise à jour...')
          const existingDoc = playerSnap.docs[0]
          await adminDb.collection('playerAccounts').doc(existingDoc.id).update({
            teamId: teamId,
            teamName: teamData.name,
            schoolName: teamData.schoolName || teamData.school || '',
            grade: teamData.teamGrade || '',
            updatedAt: new Date()
          })
          console.log('✅ Document playerAccounts mis à jour')
        }

        // TOUJOURS envoyer l'email, même si le compte existe déjà
        console.log('📧 Génération du lien de réinitialisation et envoi de l\'email...')
        const resetLink = await adminAuth.generatePasswordResetLink(player.email, getPasswordResetActionCodeSettings(player.email))
        console.log('✅ Lien de réinitialisation généré')

        const playerName = `${player.firstName} ${player.lastName}`
        const emailData = generateWelcomeEmail(playerName, teamData.name, resetLink, player.email)
        const emailResult = await sendEmail(emailData)
        
        if (emailResult.success) {
          console.log(`✅ Email envoyé avec succès à ${player.email}`)
        } else {
          console.error(`❌ Erreur lors de l'envoi de l'email à ${player.email}:`, emailResult.error)
          // Ne pas faire échouer toute l'opération si l'email échoue
        }
      } catch (error: any) {
        console.error('❌ Erreur lors de la création/mise à jour du compte joueur:', error)
        // Essayer quand même d'envoyer l'email si possible
        try {
          const { adminAuth } = await import('@/lib/firebase-admin')
          const resetLink = await adminAuth.generatePasswordResetLink(player.email, getPasswordResetActionCodeSettings(player.email))
          const playerName = `${player.firstName} ${player.lastName}`
          const emailData = generateWelcomeEmail(playerName, teamData.name, resetLink, player.email)
          await sendEmail(emailData)
          console.log('✅ Email envoyé malgré l\'erreur précédente')
        } catch (emailError) {
          console.error('❌ Impossible d\'envoyer l\'email:', emailError)
        }
        throw error
      }
    }

    // Déterminer le message de retour
    let emailStatus = ''
    if (!isCoach) {
      // Pour les joueurs, on a déjà loggé le statut de l'email dans le bloc try/catch
      emailStatus = ' Email envoyé!'
    } else {
      // Pour les coaches, l'email est envoyé dans le bloc coach
      emailStatus = ' Email envoyé!'
    }

    return NextResponse.json({ 
      success: true, 
      message: `${isCoach ? 'Entraîneur' : 'Joueur'} ajouté avec succès.${emailStatus}` 
    })

  } catch (error: any) {
    console.error('Erreur ajout joueur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
