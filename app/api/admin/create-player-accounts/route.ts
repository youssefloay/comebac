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
        let userRecord
        let resetLink
        let isExistingUser = false

        // Vérifier si l'utilisateur existe déjà
        try {
          userRecord = await auth.getUserByEmail(player.email)
          isExistingUser = true
          console.log(`ℹ️ Utilisateur existant trouvé: ${player.email}`)
          
          // Générer un lien de réinitialisation pour l'utilisateur existant
          resetLink = await auth.generatePasswordResetLink(player.email)
        } catch (error: any) {
          if (error.code === 'auth/user-not-found') {
            // Créer un nouveau compte Firebase Auth
            userRecord = await auth.createUser({
              email: player.email,
              emailVerified: false,
              displayName: `${player.firstName} ${player.lastName}`,
            })
            console.log(`✅ Nouveau compte créé: ${player.email}`)
            
            // Générer un lien de réinitialisation de mot de passe
            resetLink = await auth.generatePasswordResetLink(player.email)
          } else {
            throw error
          }
        }

        // Enregistrer les infos du joueur dans playerAccounts
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
          accountStatus: isExistingUser ? 'active' : 'pending_password',
          stats: {
            matchesPlayed: 0,
            goals: 0,
            assists: 0,
            yellowCards: 0,
            redCards: 0
          }
        })

        // Envoyer l'email approprié
        try {
          if (isExistingUser) {
            // Email pour utilisateur existant
            const emailResult = await sendEmail({
              to: player.email,
              subject: `Vous êtes maintenant joueur dans ${teamData.name} - ComeBac League`,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                    .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="header">
                      <h1>⚽ Nouveau Rôle: Joueur!</h1>
                    </div>
                    <div class="content">
                      <h2>Bonjour ${player.firstName},</h2>
                      <p>Bonne nouvelle! Vous avez été ajouté comme joueur dans l'équipe <strong>${teamData.name}</strong>.</p>
                      
                      <p><strong>Vos informations joueur:</strong></p>
                      <ul>
                        <li>Position: ${player.position}</li>
                        <li>Numéro: ${player.jerseyNumber}</li>
                        <li>Équipe: ${teamData.name}</li>
                      </ul>
                      
                      <p>Vous pouvez maintenant accéder à votre espace joueur avec votre compte existant!</p>
                      
                      <div style="text-align: center;">
                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/player" class="button">
                          Accéder à mon espace joueur
                        </a>
                      </div>
                      
                      <p>💡 <strong>Astuce:</strong> Utilisez le menu en haut à droite pour basculer entre votre espace utilisateur et votre espace joueur.</p>
                      
                      <p>Bonne chance pour la saison!</p>
                      <p>L'équipe ComeBac League</p>
                    </div>
                  </div>
                </body>
                </html>
              `
            })
            
            if (emailResult.success) {
              console.log(`✅ Email envoyé à l'utilisateur existant: ${player.email}`)
            }
          } else {
            // Email pour nouveau compte
            const emailContent = generateWelcomeEmail(
              `${player.firstName} ${player.lastName}`,
              teamData.name,
              resetLink
            )
            
            const emailResult = await sendEmail({
              to: player.email,
              subject: emailContent.subject,
              html: emailContent.html
            })
            
            if (emailResult.success) {
              console.log(`✅ Email envoyé au nouveau compte: ${player.email}`)
            }
          }
        } catch (emailError) {
          console.error(`❌ Erreur d'envoi d'email pour ${player.email}:`, emailError)
          // On continue même si l'email échoue
        }

        createdAccounts.push(player.email)
      } catch (error: any) {
        console.error(`Erreur pour ${player.email}:`, error)
        errors.push(`${player.email}: ${error.message}`)
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
