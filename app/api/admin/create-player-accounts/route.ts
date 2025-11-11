import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { doc, getDoc, collection, addDoc } from 'firebase/firestore'
import { getAuth } from 'firebase-admin/auth'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { sendEmail, generateWelcomeEmail } from '@/lib/email-service'

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

interface Player {
  firstName: string
  lastName: string
  email: string
  phone: string
  position: string
  jerseyNumber: number
  height: number
  foot: string
  grade?: string
  nickname?: string
  birthDate?: string
  age?: number
  tshirtSize?: string
}

export async function POST(request: Request) {
  try {
    const { teamId, players } = await request.json()

    if (!teamId || !players || !Array.isArray(players)) {
      return NextResponse.json({ 
        error: 'teamId et players requis' 
      }, { status: 400 })
    }

    const auth = getAuth()
    const createdAccounts: string[] = []
    const errors: string[] = []

    // Récupérer les infos de l'équipe
    const teamDoc = await getDoc(doc(db, 'teams', teamId))
    if (!teamDoc.exists()) {
      return NextResponse.json({ 
        error: 'Équipe non trouvée' 
      }, { status: 404 })
    }
    const teamData = teamDoc.data()

    for (const player of players as Player[]) {
      try {
        // Créer le compte Firebase Auth
        const userRecord = await auth.createUser({
          email: player.email,
          emailVerified: false,
          displayName: `${player.firstName} ${player.lastName}`,
        })

        // Générer un lien de réinitialisation de mot de passe
        const resetLink = await auth.generatePasswordResetLink(player.email)

        // Enregistrer les infos du joueur dans une collection playerAccounts
        await addDoc(collection(db, 'playerAccounts'), {
          uid: userRecord.uid,
          email: player.email,
          firstName: player.firstName,
          lastName: player.lastName,
          nickname: player.nickname,
          teamId: teamId,
          teamName: teamData.name,
          position: player.position,
          jerseyNumber: player.jerseyNumber,
          phone: player.phone,
          grade: player.grade,
          createdAt: new Date(),
          passwordResetLink: resetLink,
          accountStatus: 'pending_password'
        })

        // Envoyer l'email de bienvenue avec le lien de création de mot de passe
        try {
          const emailContent = generateWelcomeEmail(
            `${player.firstName} ${player.lastName}`,
            teamData.name,
            resetLink
          )
          
          await sendEmail({
            to: player.email,
            subject: emailContent.subject,
            html: emailContent.html
          })
          
          console.log(`✅ Email envoyé à ${player.email}`)
        } catch (emailError) {
          console.error(`❌ Erreur d'envoi d'email pour ${player.email}:`, emailError)
          // On continue même si l'email échoue
        }

        createdAccounts.push(player.email)
      } catch (error: any) {
        console.error(`Erreur pour ${player.email}:`, error)
        
        // Si l'utilisateur existe déjà, on continue
        if (error.code === 'auth/email-already-exists') {
          errors.push(`${player.email}: Compte déjà existant`)
        } else {
          errors.push(`${player.email}: ${error.message}`)
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `${createdAccounts.length} compte(s) créé(s)`,
      createdAccounts,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Erreur lors de la création des comptes:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la création des comptes joueurs' 
    }, { status: 500 })
  }
}
