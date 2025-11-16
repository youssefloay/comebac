import { NextRequest, NextResponse } from 'next/server'
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

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

      if (coachSnap.empty) {
        await addDoc(collection(db, 'coachAccounts'), {
          email: player.email,
          firstName: player.firstName,
          lastName: player.lastName,
          phone: player.phone || '',
          birthDate: player.birthDate || '',
          teamId: teamId,
          teamName: teamData.name,
          // Auto-remplir les infos communes de l'équipe
          schoolName: teamData.schoolName || teamData.school || '',
          grade: teamData.teamGrade || '',
          photo: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })

        console.log('✅ Coach account créé, envoi email...')

        // Envoyer email coach via l'API générique
        try {
          const { adminAuth } = await import('@/lib/firebase-admin')
          const { sendEmail } = await import('@/lib/email-service')
          
          // Créer compte Firebase Auth
          let userRecord
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

          // Générer lien de réinitialisation
          const resetLink = await adminAuth.generatePasswordResetLink(player.email)

          // Envoyer email
          await sendEmail({
            to: player.email,
            subject: '🏆 Bienvenue Coach sur ComeBac League!',
            html: `
              <!DOCTYPE html>
              <html>
              <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Bienvenue ${player.firstName}!</h2>
                <p>Votre compte coach a été créé pour l'équipe <strong>${teamData.name}</strong>.</p>
                <p>Cliquez sur le lien ci-dessous pour créer votre mot de passe:</p>
                <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #F97316; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
                  Créer mon mot de passe
                </a>
                <p style="color: #666; font-size: 14px;">Ce lien expire dans 1 heure.</p>
              </body>
              </html>
            `
          })
          
          console.log('✅ Email coach envoyé')
        } catch (emailError) {
          console.error('❌ Erreur envoi email coach:', emailError)
        }
      }
    } else {
      // Créer compte joueur
      const playerQuery = query(
        collection(db, 'playerAccounts'),
        where('email', '==', player.email)
      )
      const playerSnap = await getDocs(playerQuery)

      if (playerSnap.empty) {
        console.log('✅ Création compte joueur et envoi email...')
        
        try {
          const { adminAuth } = await import('@/lib/firebase-admin')
          const { adminDb } = await import('@/lib/firebase-admin')
          const { sendEmail } = await import('@/lib/email-service')
          
          // Créer compte Firebase Auth
          let userRecord
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

          // Créer dans playerAccounts avec les infos de l'équipe
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

          // Générer lien de réinitialisation
          const resetLink = await adminAuth.generatePasswordResetLink(player.email)

          // Envoyer email
          await sendEmail({
            to: player.email,
            subject: '🎉 Bienvenue sur ComeBac League!',
            html: `
              <!DOCTYPE html>
              <html>
              <body style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Bienvenue ${player.firstName}!</h2>
                <p>Ton compte joueur a été créé pour l'équipe <strong>${teamData.name}</strong>.</p>
                <p>Clique sur le lien ci-dessous pour créer ton mot de passe:</p>
                <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
                  Créer mon mot de passe
                </a>
                <p style="color: #666; font-size: 14px;">Ce lien expire dans 1 heure.</p>
              </body>
              </html>
            `
          })
          
          console.log('✅ Email joueur envoyé')
        } catch (emailError) {
          console.error('❌ Erreur création compte joueur:', emailError)
          throw emailError
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `${isCoach ? 'Entraîneur' : 'Joueur'} ajouté avec succès et email envoyé!` 
    })

  } catch (error: any) {
    console.error('Erreur ajout joueur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
