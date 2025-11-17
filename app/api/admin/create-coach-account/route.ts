import { NextRequest, NextResponse } from 'next/server'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { sendCoachWelcomeEmail } from '@/lib/email-service'
import { getPasswordResetActionCodeSettings } from '@/lib/password-reset'
import { adminDb } from '@/lib/firebase-admin'

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

    const normalizedEmail = email.trim().toLowerCase()

    // Empêcher les doublons joueur/coach
    const playerSnap = await adminDb
      .collection('playerAccounts')
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get()

    if (!playerSnap.empty) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé pour un compte joueur. Supprimez/convertissez-le avant de créer un compte coach.' },
        { status: 400 }
      )
    }

    console.log(`📧 Création du compte entraîneur pour: ${normalizedEmail}`)

    try {
      // Vérifier si l'utilisateur existe déjà
      let userRecord
      try {
        userRecord = await auth.getUserByEmail(normalizedEmail)
        console.log(`ℹ️  Utilisateur existe déjà: ${normalizedEmail}`)
      } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
          // Créer l'utilisateur
          userRecord = await auth.createUser({
            email: normalizedEmail,
            emailVerified: false,
            displayName: `${firstName} ${lastName}`,
          })
          console.log(`✅ Utilisateur créé: ${normalizedEmail}`)
        } else {
          throw error
        }
      }

      await syncCoachRecords({
        uid: userRecord.uid,
        email: normalizedEmail,
        firstName,
        lastName,
        teamName
      })

      // Générer le lien de réinitialisation de mot de passe
      const resetLink = await auth.generatePasswordResetLink(normalizedEmail, getPasswordResetActionCodeSettings(normalizedEmail))
      console.log(`🔗 Lien de réinitialisation généré pour: ${normalizedEmail}`)

      // Envoyer l'email de bienvenue
      try {
        await sendCoachWelcomeEmail({
          email: normalizedEmail,
          firstName,
          lastName,
          teamName: teamName || 'votre équipe',
          resetLink
        })
        console.log(`📨 Email envoyé à: ${normalizedEmail}`)
      } catch (emailError) {
        console.error(`❌ Erreur envoi email à ${normalizedEmail}:`, emailError)
        // On continue même si l'email échoue
      }

      return NextResponse.json({
        success: true,
        message: 'Compte entraîneur créé avec succès',
        email: normalizedEmail
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

async function syncCoachRecords({
  uid,
  email,
  firstName,
  lastName,
  teamName
}: {
  uid: string
  email: string
  firstName: string
  lastName: string
  teamName?: string
}) {
  const now = new Date()
  const fullName = `${firstName || ''} ${lastName || ''}`.trim() || email

  // Mettre à jour ou créer le compte coach
  const coachSnap = await adminDb
    .collection('coachAccounts')
    .where('email', '==', email)
    .limit(1)
    .get()

  if (!coachSnap.empty) {
    await coachSnap.docs[0].ref.update({
      uid,
      firstName,
      lastName,
      teamName: teamName || coachSnap.docs[0].data().teamName || null,
      updatedAt: now
    })
  } else {
    await adminDb.collection('coachAccounts').add({
      uid,
      email,
      firstName,
      lastName,
      teamName: teamName || null,
      createdAt: now,
      updatedAt: now
    })
  }

  // Synchroniser le profil utilisateur
  const profileSnap = await adminDb
    .collection('userProfiles')
    .where('email', '==', email)
    .limit(1)
    .get()

  const profileData = {
    uid,
    email,
    fullName,
    role: 'coach',
    teamName: teamName || null,
    updatedAt: now
  }

  if (!profileSnap.empty) {
    await profileSnap.docs[0].ref.update(profileData)
  } else {
    await adminDb.collection('userProfiles').add({
      ...profileData,
      createdAt: now
    })
  }

  // Supprimer les entrées "users" dupliquées
  const duplicateUsers = await adminDb
    .collection('users')
    .where('email', '==', email)
    .get()

  for (const doc of duplicateUsers.docs) {
    await doc.ref.delete()
    console.log(`🧹 Doublon supprimé dans users: ${doc.id}`)
  }
}
