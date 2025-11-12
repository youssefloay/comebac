import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
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

export async function POST(request: Request) {
  try {
    const { teamId } = await request.json()

    if (!teamId) {
      return NextResponse.json({ 
        error: 'teamId requis' 
      }, { status: 400 })
    }

    const auth = getAuth()
    const sentEmails: string[] = []
    const errors: string[] = []

    // Récupérer les joueurs de l'équipe
    const playersQuery = query(
      collection(db, 'playerAccounts'),
      where('teamId', '==', teamId)
    )
    const playersSnap = await getDocs(playersQuery)

    if (playersSnap.empty) {
      return NextResponse.json({ 
        error: 'Aucun joueur trouvé pour cette équipe' 
      }, { status: 404 })
    }

    // Récupérer les infos de l'équipe
    const teamsSnap = await getDocs(collection(db, 'teams'))
    const team = teamsSnap.docs.find(doc => doc.id === teamId)
    const teamName = team?.data().name || 'Équipe'

    for (const playerDoc of playersSnap.docs) {
      const player = playerDoc.data()
      
      try {
        // Générer un nouveau lien de réinitialisation
        const resetLink = await auth.generatePasswordResetLink(player.email)

        // Envoyer l'email
        const emailContent = generateWelcomeEmail(
          `${player.firstName} ${player.lastName}`,
          teamName,
          resetLink
        )
        
        const emailResult = await sendEmail({
          to: player.email,
          subject: emailContent.subject,
          html: emailContent.html
        })
        
        if (emailResult.success) {
          console.log(`✅ Email renvoyé à ${player.email}`)
          sentEmails.push(player.email)
        } else {
          console.error(`❌ Échec d'envoi pour ${player.email}`)
          errors.push(`${player.email}: Échec d'envoi`)
        }
      } catch (error: any) {
        console.error(`Erreur pour ${player.email}:`, error)
        errors.push(`${player.email}: ${error.message}`)
      }
    }

    return NextResponse.json({ 
      success: true,
      message: `${sentEmails.length} email(s) renvoyé(s)`,
      sentEmails,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Erreur lors du renvoi des emails:', error)
    return NextResponse.json({ 
      error: 'Erreur lors du renvoi des emails' 
    }, { status: 500 })
  }
}
