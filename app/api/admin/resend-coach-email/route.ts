import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { sendCoachWelcomeEmail } from '@/lib/email-service'
import { getPasswordResetActionCodeSettings } from '@/lib/password-reset'

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

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, lastName, teamName } = await request.json()

    if (!email || !firstName || !lastName || !teamName) {
      return NextResponse.json(
        { error: 'Email, prénom, nom et nom d\'équipe requis' },
        { status: 400 }
      )
    }

    const auth = getAuth()

    // Générer le lien de réinitialisation de mot de passe
    const resetLink = await auth.generatePasswordResetLink(email, getPasswordResetActionCodeSettings(email))

    // Envoyer l'email pour entraîneur
    const emailResult = await sendCoachWelcomeEmail({
      email,
      firstName,
      lastName,
      teamName,
      resetLink
    })

    if (emailResult.success) {
      return NextResponse.json({
        success: true,
        message: `Email envoyé à ${firstName} ${lastName} (${email})`
      })
    } else {
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi de l\'email' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Erreur lors du renvoi de l\'email:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
