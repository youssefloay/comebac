import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase-admin'
import { generateWelcomeEmail, sendEmail } from '@/lib/email-service'
import { getPasswordResetActionCodeSettings } from '@/lib/password-reset'

export async function POST(request: NextRequest) {
  try {
    const { playerEmail, playerName, teamName } = await request.json()

    if (!playerEmail || !playerName || !teamName) {
      return NextResponse.json(
        { error: 'playerEmail, playerName et teamName requis' },
        { status: 400 }
      )
    }

    // Vérifier si le compte Firebase existe
    let firebaseUser
    try {
      firebaseUser = await adminAuth.getUserByEmail(playerEmail)
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json(
          { error: 'Compte Firebase non trouvé pour cet email' },
          { status: 404 }
        )
      }
      throw error
    }

    // Générer un lien de réinitialisation de mot de passe
    const resetLink = await adminAuth.generatePasswordResetLink(playerEmail, getPasswordResetActionCodeSettings(playerEmail))

    // Envoyer l'email
    const emailData = generateWelcomeEmail(
      playerName,
      teamName,
      resetLink,
      playerEmail
    )

    const emailResult = await sendEmail(emailData)

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: `✅ Email envoyé à ${playerName} (${playerEmail})`
      })
    } else {
      return NextResponse.json(
        { error: `Erreur lors de l'envoi: ${emailResult.error}` },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
