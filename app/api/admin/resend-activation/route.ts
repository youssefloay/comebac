import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { generateWelcomeEmail, sendCoachWelcomeEmail, sendEmail } from '@/lib/email-service'
import { getPasswordResetActionCodeSettings } from '@/lib/password-reset'

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email requis' },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur existe
    let user
    try {
      user = await adminAuth.getUserByEmail(email)
    } catch (error) {
      return NextResponse.json(
        { error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }

    // Générer un lien de réinitialisation de mot de passe
    const resetLink = await adminAuth.generatePasswordResetLink(email, getPasswordResetActionCodeSettings(email))

    // Chercher les infos joueur / coach pour personnaliser
    let emailResult
    let matchedType: 'player' | 'coach' | 'unknown' = 'unknown'

    const playerSnap = await adminDb
      .collection('playerAccounts')
      .where('email', '==', email)
      .limit(1)
      .get()

    if (!playerSnap.empty) {
      const data = playerSnap.docs[0].data() as any
      matchedType = 'player'
      let teamName = data.teamName || 'votre équipe'
      if (!teamName && data.teamId) {
        const teamDoc = await adminDb.collection('teams').doc(data.teamId).get()
        if (teamDoc.exists) {
          teamName = teamDoc.data()?.name || teamName
        }
      }
      const playerName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || name || user.displayName || 'Joueur'
      emailResult = await sendEmail(generateWelcomeEmail(playerName, teamName, resetLink, email))
    } else {
      const coachSnap = await adminDb
        .collection('coachAccounts')
        .where('email', '==', email)
        .limit(1)
        .get()

      if (!coachSnap.empty) {
        const data = coachSnap.docs[0].data() as any
        matchedType = 'coach'
        await sendCoachWelcomeEmail({
          email,
          firstName: data.firstName || name || user.displayName || 'Coach',
          lastName: data.lastName || '',
          teamName: data.teamName || 'votre équipe',
          resetLink
        })
        emailResult = { success: true }
      }
    }

    if (!emailResult) {
      // Fallback sur un template générique mais avec logo
      const fallbackName = name || user.displayName || 'Joueur'
      emailResult = await sendEmail(generateWelcomeEmail(fallbackName, 'ComeBac League', resetLink, email))
    }

    if (!emailResult?.success) {
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      )
    }

    console.log(`✅ Email d'activation renvoyé à ${email}`)

    return NextResponse.json({
      success: true,
      message: 'Email d\'activation envoyé'
    })

  } catch (error: any) {
    console.error('❌ Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
