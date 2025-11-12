import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, generateWelcomeEmail } from '@/lib/email-service'
import { getAuth } from 'firebase-admin/auth'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

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
    const { playerEmail, playerName, teamName } = await request.json()

    if (!playerEmail || !playerName || !teamName) {
      return NextResponse.json(
        { error: 'Email, nom du joueur et nom de l\'équipe requis' },
        { status: 400 }
      )
    }

    const auth = getAuth()

    // Vérifier si l'utilisateur existe
    try {
      await auth.getUserByEmail(playerEmail)
      
      // Générer un nouveau lien de réinitialisation
      const resetLink = await auth.generatePasswordResetLink(playerEmail)
      
      // Envoyer l'email
      const emailContent = generateWelcomeEmail(playerName, teamName, resetLink)
      const emailResult = await sendEmail({
        to: playerEmail,
        subject: emailContent.subject,
        html: emailContent.html
      })

      if (emailResult.success) {
        return NextResponse.json({
          success: true,
          message: `Email renvoyé à ${playerName}`
        })
      } else {
        return NextResponse.json(
          { error: 'Erreur lors de l\'envoi de l\'email' },
          { status: 500 }
        )
      }
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        return NextResponse.json(
          { error: 'Utilisateur non trouvé' },
          { status: 404 }
        )
      }
      throw error
    }
  } catch (error) {
    console.error('Erreur lors du renvoi de l\'email:', error)
    return NextResponse.json(
      { error: 'Erreur lors du renvoi de l\'email' },
      { status: 500 }
    )
  }
}
