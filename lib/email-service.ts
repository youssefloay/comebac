// Service d'envoi d'emails pour les comptes joueurs
import { Resend } from 'resend'

interface EmailData {
  to: string
  subject: string
  html: string
}

// Fonction pour obtenir l'instance Resend (lazy initialization)
function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    return null
  }
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendEmail(data: EmailData) {
  try {
    // Si pas de clé API, on log seulement
    if (!process.env.RESEND_API_KEY) {
      console.log('⚠️ RESEND_API_KEY non configurée - Email non envoyé')
      console.log('📧 Email à envoyer:')
      console.log('To:', data.to)
      console.log('Subject:', data.subject)
      return { success: false, error: 'API key not configured' }
    }

    // Obtenir le client Resend
    const resend = getResendClient()
    if (!resend) {
      throw new Error('Failed to initialize Resend client')
    }

    // Envoyer l'email avec Resend
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'ComeBac League <onboarding@resend.dev>',
      to: data.to,
      subject: data.subject,
      html: data.html
    })

    console.log('✅ Email envoyé avec succès à', data.to)
    return { success: true, data: result }
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error)
    return { success: false, error }
  }
}

export function generateWelcomeEmail(playerName: string, teamName: string, resetLink: string) {
  return {
    subject: `Bienvenue dans ComeBac League - Créez votre mot de passe`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .logo { width: 80px; height: 80px; margin: 0 auto 15px; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚽ Bienvenue dans ComeBac League!</h1>
          </div>
          <div class="content">
            <h2>Bonjour ${playerName},</h2>
            <p>Félicitations! Votre équipe <strong>${teamName}</strong> a été approuvée pour participer à la ComeBac League.</p>
            
            <p>Un compte joueur a été créé pour vous. Pour y accéder, vous devez d'abord créer votre mot de passe:</p>
            
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Créer mon mot de passe</a>
            </div>
            
            <p><strong>Une fois votre mot de passe créé, vous pourrez:</strong></p>
            <ul>
              <li>📊 Consulter vos statistiques personnelles</li>
              <li>🏆 Voir vos matchs à venir et passés</li>
              <li>🎖️ Débloquer des badges</li>
              <li>📱 Recevoir des notifications</li>
              <li>⚽ Suivre votre progression</li>
            </ul>
            
            <p><strong>Important:</strong> Ce lien est valable pendant 24 heures. Si vous ne créez pas votre mot de passe dans ce délai, contactez un administrateur.</p>
            
            <p>Bonne chance pour la saison!</p>
            
            <p>L'équipe ComeBac League</p>
          </div>
          <div class="footer">
            <p>ComeBac League - Championnat Scolaire</p>
            <p>Si vous n'avez pas demandé ce compte, ignorez cet email.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }
}
