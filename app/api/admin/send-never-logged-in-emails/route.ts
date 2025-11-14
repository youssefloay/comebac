import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { sendEmail } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const { dryRun = false } = await request.json()

    // Récupérer tous les utilisateurs Firebase
    const listUsersResult = await adminAuth.listUsers()
    const neverLoggedInUsers = listUsersResult.users.filter(
      user => !user.metadata.lastSignInTime
    )

    console.log(`📊 Trouvé ${neverLoggedInUsers.length} comptes jamais connectés`)

    const results = []

    for (const user of neverLoggedInUsers) {
      try {
        // Récupérer les infos depuis Firestore
        let userData: any = null
        let userType = 'unknown'
        let teamName = 'votre équipe'

        // Chercher dans les joueurs
        const playerDoc = await adminDb.collection('players').doc(user.uid).get()
        if (playerDoc.exists) {
          userData = playerDoc.data()
          userType = 'player'
          
          // Récupérer le nom de l'équipe
          if (userData?.teamId) {
            const teamDoc = await adminDb.collection('teams').doc(userData.teamId).get()
            if (teamDoc.exists) {
              teamName = teamDoc.data()?.name || teamName
            }
          }
        } else {
          // Chercher dans les coaches
          const coachDoc = await adminDb.collection('coaches').doc(user.uid).get()
          if (coachDoc.exists) {
            userData = coachDoc.data()
            userType = 'coach'
            
            // Récupérer le nom de l'équipe
            if (userData?.teamId) {
              const teamDoc = await adminDb.collection('teams').doc(userData.teamId).get()
              if (teamDoc.exists) {
                teamName = teamDoc.data()?.name || teamName
              }
            }
          }
        }

        const firstName = userData?.firstName || userData?.name || 'Utilisateur'
        const lastName = userData?.lastName || ''
        const fullName = `${firstName} ${lastName}`.trim()

        // Générer un lien de réinitialisation de mot de passe
        const resetLink = await adminAuth.generatePasswordResetLink(user.email!)

        if (dryRun) {
          results.push({
            email: user.email,
            name: fullName,
            type: userType,
            teamName,
            status: 'dry-run',
            createdAt: user.metadata.creationTime
          })
        } else {
          // Envoyer l'email
          const emailResult = await sendReminderEmail({
            email: user.email!,
            name: fullName,
            teamName,
            resetLink,
            userType
          })

          results.push({
            email: user.email,
            name: fullName,
            type: userType,
            teamName,
            status: emailResult.success ? 'sent' : 'failed',
            error: emailResult.error,
            createdAt: user.metadata.creationTime
          })
        }
      } catch (error: any) {
        console.error(`Erreur pour ${user.email}:`, error)
        results.push({
          email: user.email,
          status: 'error',
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      totalFound: neverLoggedInUsers.length,
      results,
      dryRun
    })
  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

async function sendReminderEmail({
  email,
  name,
  teamName,
  resetLink,
  userType
}: {
  email: string
  name: string
  teamName: string
  resetLink: string
  userType: string
}) {
  const isCoach = userType === 'coach'
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          background: linear-gradient(135deg, ${isCoach ? '#F97316 0%, #DC2626' : '#10b981 0%, #3b82f6'} 100%);
          color: white;
          padding: 30px;
          border-radius: 10px 10px 0 0;
          text-align: center;
        }
        .content {
          background: #f9fafb;
          padding: 30px;
          border-radius: 0 0 10px 10px;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, ${isCoach ? '#F97316 0%, #DC2626' : '#10b981 0%, #3b82f6'} 100%);
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          margin: 20px 0;
        }
        .info-box {
          background: white;
          border-left: 4px solid ${isCoach ? '#F97316' : '#10b981'};
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 style="margin: 0; font-size: 28px;">${isCoach ? '🏆 Rappel Coach' : '⚽ Rappel Joueur'}</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">ComeBac League</p>
      </div>
      
      <div class="content">
        <h2 style="color: ${isCoach ? '#F97316' : '#10b981'}; margin-top: 0;">Bonjour ${name},</h2>
        
        <p>Nous avons remarqué que vous n'avez pas encore activé votre compte <strong>${teamName}</strong> sur ComeBac League.</p>
        
        <div class="info-box">
          <p style="margin: 0;"><strong>⚠️ Votre compte est prêt !</strong> Il ne vous reste plus qu'à créer votre mot de passe pour y accéder.</p>
        </div>
        
        <p><strong>Pour activer votre compte :</strong></p>
        <ol>
          <li>Cliquez sur le bouton ci-dessous</li>
          <li>Créez votre mot de passe</li>
          <li>Connectez-vous et profitez de toutes les fonctionnalités</li>
        </ol>
        
        <div style="text-align: center;">
          <a href="${resetLink}" class="button">
            🔐 Activer mon compte
          </a>
        </div>
        
        ${isCoach ? `
        <p><strong>En tant qu'entraîneur, vous pourrez :</strong></p>
        <ul>
          <li>✅ Gérer les statuts de vos joueurs</li>
          <li>✅ Créer et valider les compositions</li>
          <li>✅ Consulter les statistiques de votre équipe</li>
          <li>✅ Voir le calendrier des matchs</li>
        </ul>
        ` : `
        <p><strong>En tant que joueur, vous pourrez :</strong></p>
        <ul>
          <li>📊 Consulter vos statistiques personnelles</li>
          <li>🏆 Voir vos matchs à venir et passés</li>
          <li>🎖️ Débloquer des badges</li>
          <li>📱 Recevoir des notifications</li>
        </ul>
        `}
        
        <div class="info-box">
          <p style="margin: 0;"><strong>⏰ Ce lien est valable pendant 1 heure.</strong> Si vous ne l'utilisez pas maintenant, vous pourrez toujours utiliser "Mot de passe oublié" sur la page de connexion.</p>
        </div>
        
        <div class="info-box" style="border-left-color: #3b82f6;">
          <p style="margin: 0 0 10px 0;"><strong>💬 Besoin d'aide ?</strong></p>
          <p style="margin: 5px 0;">📧 Email : <a href="mailto:contact@comebac.com" style="color: #3b82f6;">contact@comebac.com</a></p>
          <p style="margin: 5px 0;">📱 WhatsApp : <a href="https://wa.me/33634051384" style="color: #25D366;">+33 6 34 05 13 84</a></p>
          <p style="margin: 5px 0;">📸 Instagram : <a href="https://www.instagram.com/comebac.league/" style="color: #E4405F;">@comebac.league</a></p>
        </div>
        
        <p style="margin-top: 30px;">
          Sportivement,<br>
          <strong>L'équipe ComeBac League</strong>
        </p>
      </div>
      
      <div class="footer">
        <p>ComeBac League - Ligue de Football Scolaire</p>
        <p style="font-size: 12px; color: #9ca3af;">
          Si vous n'avez pas demandé ce compte, ignorez cet email.
        </p>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: `${isCoach ? '🏆' : '⚽'} Activez votre compte ComeBac League`,
    html
  })
}
