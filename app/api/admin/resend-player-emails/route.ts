import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { generateWelcomeEmail, sendEmail } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const { teamId } = await request.json()
    
    console.log('📧 Renvoi des emails pour teamId:', teamId)

    if (!teamId) {
      return NextResponse.json(
        { error: 'teamId requis' },
        { status: 400 }
      )
    }

    // Récupérer l'équipe
    const teamDoc = await adminDb.collection('teams').doc(teamId).get()
    if (!teamDoc.exists) {
      return NextResponse.json(
        { error: 'Équipe non trouvée' },
        { status: 404 }
      )
    }

    const teamData = teamDoc.data()
    const teamName = teamData?.name || 'votre équipe'
    
    console.log('✅ Équipe trouvée:', teamName)

    // Récupérer tous les joueurs de l'équipe
    const playersSnapshot = await adminDb
      .collection('players')
      .where('teamId', '==', teamId)
      .get()

    if (playersSnapshot.empty) {
      console.log('❌ Aucun joueur trouvé')
      return NextResponse.json(
        { error: 'Aucun joueur trouvé pour cette équipe' },
        { status: 404 }
      )
    }
    
    console.log(`📊 ${playersSnapshot.size} joueur(s) trouvé(s)`)

    const results = []
    let sentCount = 0
    let errorCount = 0

    for (const playerDoc of playersSnapshot.docs) {
      const player = playerDoc.data()
      
      // Ignorer les entraîneurs
      if (player.isCoach) {
        continue
      }

      const playerEmail = player.email
      const playerName = player.name || `${player.firstName} ${player.lastName}`

      if (!playerEmail) {
        results.push({
          player: playerName,
          status: 'skipped',
          reason: 'Pas d\'email'
        })
        continue
      }

      try {
        // Vérifier si le compte Firebase existe
        let firebaseUser
        try {
          firebaseUser = await adminAuth.getUserByEmail(playerEmail)
        } catch (error: any) {
          if (error.code === 'auth/user-not-found') {
            results.push({
              player: playerName,
              email: playerEmail,
              status: 'skipped',
              reason: 'Compte Firebase non trouvé'
            })
            continue
          }
          throw error
        }

        // Générer un lien de réinitialisation de mot de passe
        const resetLink = await adminAuth.generatePasswordResetLink(playerEmail)

        // Envoyer l'email
        const emailData = generateWelcomeEmail(
          playerName,
          teamName,
          resetLink,
          playerEmail
        )

        const emailResult = await sendEmail(emailData)
        
        console.log(`📧 Email pour ${playerName} (${playerEmail}):`, emailResult.success ? '✅ Envoyé' : '❌ Erreur')

        if (emailResult.success) {
          sentCount++
          results.push({
            player: playerName,
            email: playerEmail,
            status: 'sent'
          })
        } else {
          errorCount++
          console.error(`❌ Erreur email ${playerEmail}:`, emailResult.error)
          results.push({
            player: playerName,
            email: playerEmail,
            status: 'error',
            error: emailResult.error
          })
        }
      } catch (error: any) {
        errorCount++
        results.push({
          player: playerName,
          email: playerEmail,
          status: 'error',
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `✅ ${sentCount} email(s) envoyé(s)${errorCount > 0 ? `, ${errorCount} erreur(s)` : ''}`,
      sentCount,
      errorCount,
      results
    })
  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
