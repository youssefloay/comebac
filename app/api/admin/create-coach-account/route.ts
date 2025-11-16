import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { sendCoachWelcomeEmail } from '@/lib/email-service'
import { getPasswordResetActionCodeSettings } from '@/lib/password-reset'

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const auth = getAuth()

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, lastName, teamName } = await request.json()

    if (!email || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Email, prénom et nom requis' },
        { status: 400 }
      )
    }

    console.log(`📧 Création du compte entraîneur pour: ${email}`)

    try {
      // Vérifier si l'utilisateur existe déjà
      let userRecord
      try {
        userRecord = await auth.getUserByEmail(email)
        console.log(`ℹ️  Utilisateur existe déjà: ${email}`)
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          // Créer l'utilisateur
          userRecord = await auth.createUser({
            email: email,
            emailVerified: false,
            displayName: `${firstName} ${lastName}`,
          })
          console.log(`✅ Utilisateur créé: ${email}`)
        } else {
          throw error
        }
      }

      // Générer le lien de réinitialisation de mot de passe
      const resetLink = await auth.generatePasswordResetLink(email, getPasswordResetActionCodeSettings(email))
      console.log(`🔗 Lien de réinitialisation généré pour: ${email}`)

      // Envoyer l'email de bienvenue
      try {
        await sendCoachWelcomeEmail({
          email,
          firstName,
          lastName,
          teamName: teamName || 'votre équipe',
          resetLink
        })
        console.log(`📨 Email envoyé à: ${email}`)
      } catch (emailError) {
        console.error(`❌ Erreur envoi email à ${email}:`, emailError)
        // On continue même si l'email échoue
      }

      return NextResponse.json({
        success: true,
        message: 'Compte entraîneur créé avec succès',
        email
      })

    } catch (error: any) {
      console.error(`❌ Erreur pour ${email}:`, error)
      return NextResponse.json(
        { 
          error: 'Erreur lors de la création du compte',
          details: error.message 
        },
        { status: 500 }
      )
    }

  } catch (error: any) {
    console.error('❌ Erreur générale:', error)
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    )
  }
}
