import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { getAuth } from 'firebase-admin/auth'
import { generateWelcomeEmail, sendEmail } from '@/lib/email-service'
import { getPasswordResetActionCodeSettings } from '@/lib/password-reset'

export async function POST(request: NextRequest) {
  try {
    const { teamName, player } = await request.json()
    
    if (!teamName || !player || !player.email) {
      return NextResponse.json({ 
        error: 'teamName et player (avec email) requis' 
      }, { status: 400 })
    }
    
    console.log(`🔍 Recherche de l'équipe ${teamName}...`)
    
    // 1. Trouver l'équipe
    const teamsSnap = await adminDb.collection('teams').get()
    let team = teamsSnap.docs.find(doc => 
      doc.data().name?.toLowerCase() === teamName.toLowerCase()
    )
    
    let teamId: string
    let finalTeamName: string
    
    if (!team) {
      // Chercher dans teamRegistrations
      const registrationsSnap = await adminDb.collection('teamRegistrations').get()
      const registration = registrationsSnap.docs.find(doc => 
        doc.data().teamName?.toLowerCase() === teamName.toLowerCase()
      )
      
      if (!registration) {
        return NextResponse.json({ 
          error: `Équipe "${teamName}" non trouvée`,
          availableTeams: teamsSnap.docs.map(d => d.data().name)
        }, { status: 404 })
      }
      
      teamId = registration.id
      finalTeamName = registration.data().teamName
    } else {
      teamId = team.id
      finalTeamName = team.data().name
    }
    
    console.log(`✅ Équipe trouvée: ${finalTeamName} (${teamId})`)
    
    const email = player.email
    const playerData = {
      firstName: player.firstName,
      lastName: player.lastName,
      nickname: player.nickname || '',
      email: email,
      phone: player.phone || '',
      birthDate: player.birthDate || '2000-01-01',
      height: player.height || 175,
      tshirtSize: player.tshirtSize || 'M',
      position: player.position || 'Milieu',
      foot: player.foot || 'Droitier',
      jerseyNumber: player.jerseyNumber || 0
    }
    
    // 2. Nettoyer les doublons dans players
    const playersSnap = await adminDb.collection('players')
      .where('email', '==', email)
      .get()
    
    if (!playersSnap.empty) {
      console.log(`⚠️  ${playersSnap.size} doublon(s) trouvé(s), suppression...`)
      for (const doc of playersSnap.docs) {
        await doc.ref.delete()
      }
    }
    
    // 3. Ajouter dans players
    console.log('📝 Ajout dans players...')
    await adminDb.collection('players').add({
      name: `${playerData.firstName} ${playerData.lastName}`,
      number: playerData.jerseyNumber,
      position: playerData.position,
      teamId: teamId,
      nationality: 'Égypte',
      isCaptain: false,
      email: playerData.email,
      phone: playerData.phone,
      firstName: playerData.firstName,
      lastName: playerData.lastName,
      nickname: playerData.nickname,
      birthDate: playerData.birthDate,
      height: playerData.height,
      tshirtSize: playerData.tshirtSize,
      strongFoot: playerData.foot === 'Droitier' ? 'Droit' : playerData.foot === 'Gaucher' ? 'Gauche' : 'Ambidextre',
      overall: 75,
      seasonStats: {
        goals: 0,
        assists: 0,
        matches: 0,
        yellowCards: 0,
        redCards: 0
      },
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    // 4. Nettoyer les doublons dans playerAccounts
    const accountsSnap = await adminDb.collection('playerAccounts')
      .where('email', '==', email)
      .get()
    
    if (!accountsSnap.empty) {
      console.log(`⚠️  ${accountsSnap.size} compte(s) en doublon, suppression...`)
      for (const doc of accountsSnap.docs) {
        await doc.ref.delete()
      }
    }
    
    // 5. Créer le compte dans playerAccounts
    console.log('📝 Création du compte...')
    await adminDb.collection('playerAccounts').add({
      email: playerData.email,
      firstName: playerData.firstName,
      lastName: playerData.lastName,
      phone: playerData.phone,
      birthDate: playerData.birthDate,
      teamId: teamId,
      teamName: finalTeamName,
      photo: '',
      isActingCoach: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    
    // 6. Créer/Vérifier le compte Firebase Auth
    const auth = getAuth()
    try {
      await auth.getUserByEmail(email)
      console.log('✅ Compte Firebase Auth existe')
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        await auth.createUser({
          email: email,
          emailVerified: false,
          password: Math.random().toString(36).slice(-8) + 'Aa1!',
          displayName: `${playerData.firstName} ${playerData.lastName}`
        })
        console.log('✅ Compte Firebase Auth créé')
      }
    }
    
    // 7. Envoyer l'email
    console.log('📧 Envoi de l\'email...')
    try {
      const resetLink = await auth.generatePasswordResetLink(email, getPasswordResetActionCodeSettings(email))
      const emailData = generateWelcomeEmail(
        `${playerData.firstName} ${playerData.lastName}`,
        finalTeamName,
        resetLink,
        email
      )
      
      const emailResult = await sendEmail(emailData)
      
      return NextResponse.json({
        success: true,
        message: `${playerData.firstName} ${playerData.lastName} ajouté à ${finalTeamName}`,
        player: {
          name: `${playerData.firstName} ${playerData.lastName}`,
          email: email,
          team: finalTeamName,
          number: playerData.jerseyNumber
        },
        emailSent: emailResult.success,
        emailError: emailResult.success ? null : emailResult.error
      })
    } catch (emailError: any) {
      return NextResponse.json({
        success: true,
        message: `${playerData.firstName} ${playerData.lastName} ajouté à ${finalTeamName} (erreur email)`,
        player: {
          name: `${playerData.firstName} ${playerData.lastName}`,
          email: email,
          team: finalTeamName,
          number: playerData.jerseyNumber
        },
        emailSent: false,
        emailError: emailError.message
      })
    }
    
  } catch (error: any) {
    console.error('❌ Erreur:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
