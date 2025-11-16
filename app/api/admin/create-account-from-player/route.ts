import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { generateWelcomeEmail, sendEmail } from '@/lib/email-service'
import { getPasswordResetActionCodeSettings } from '@/lib/password-reset'

export async function POST(request: NextRequest) {
  try {
    const { playerId } = await request.json()

    if (!playerId) {
      return NextResponse.json({ error: 'Identifiant joueur requis' }, { status: 400 })
    }

    const playerRef = adminDb.collection('playerAccounts').doc(playerId)
    const playerSnap = await playerRef.get()

    if (!playerSnap.exists) {
      return NextResponse.json({ error: 'Joueur introuvable' }, { status: 404 })
    }

    const playerData = playerSnap.data() as Record<string, any>
    const email = playerData.email

    if (!email) {
      return NextResponse.json({ error: 'Email manquant pour ce joueur' }, { status: 400 })
    }

    // Vérifier si un utilisateur existe déjà
    try {
      await adminAuth.getUserByEmail(email)
      return NextResponse.json({ error: 'Un compte existe déjà pour cet email' }, { status: 400 })
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error
      }
    }

    const displayName = `${playerData.firstName || ''} ${playerData.lastName || ''}`.trim() || playerData.nickname || email

    // Créer l'utilisateur Auth
    const userRecord = await adminAuth.createUser({
      email,
      password: Math.random().toString(36).slice(-12) + 'Aa1!',
      displayName
    })

    // Mettre à jour le document playerAccounts avec l'UID
    await playerRef.update({
      uid: userRecord.uid,
      role: playerData.role || 'player',
      updatedAt: new Date()
    })

    // Récupérer le nom de l'équipe
    let teamName = playerData.teamName || 'votre équipe'
    if (!teamName && playerData.teamId) {
      try {
        const teamDoc = await adminDb.collection('teams').doc(playerData.teamId).get()
        if (teamDoc.exists) {
          teamName = teamDoc.data()?.name || teamName
        } else {
          const regDoc = await adminDb.collection('teamRegistrations').doc(playerData.teamId).get()
          if (regDoc.exists) {
            teamName = regDoc.data()?.teamName || teamName
          }
        }
      } catch (error) {
        console.warn('⚠️ Impossible de récupérer le nom de l\'équipe:', error)
      }
    }

    // Générer lien de réinitialisation et envoyer l'email d'activation
    const resetLink = await adminAuth.generatePasswordResetLink(email, getPasswordResetActionCodeSettings(email))
    const playerName = displayName || 'joueur'
    const emailData = generateWelcomeEmail(playerName, teamName, resetLink, email)
    await sendEmail(emailData)

    return NextResponse.json({
      success: true,
      message: `Compte créé et email d'activation envoyé à ${email}`
    })
  } catch (error: any) {
    console.error('❌ Erreur création compte joueur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
