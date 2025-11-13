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

// Email de bienvenue pour les entraîneurs
export async function sendCoachWelcomeEmail({
  email,
  firstName,
  lastName,
  teamName,
  resetLink
}: {
  email: string
  firstName: string
  lastName: string
  teamName: string
  resetLink: string
}) {
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
          background: linear-gradient(135deg, #F97316 0%, #DC2626 100%);
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
          background: linear-gradient(135deg, #F97316 0%, #DC2626 100%);
          color: white;
          padding: 15px 30px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: bold;
          margin: 20px 0;
        }
        .info-box {
          background: white;
          border-left: 4px solid #F97316;
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
        <h1 style="margin: 0; font-size: 28px;">🏆 Bienvenue Coach !</h1>
        <p style="margin: 10px 0 0 0; opacity: 0.9;">ComeBac League</p>
      </div>
      
      <div class="content">
        <h2 style="color: #F97316; margin-top: 0;">Bonjour ${firstName} ${lastName},</h2>
        
        <p>Félicitations ! Votre équipe <strong>${teamName}</strong> a été validée et votre compte entraîneur a été créé avec succès.</p>
        
        <div class="info-box">
          <p style="margin: 0;"><strong>📧 Votre email :</strong> ${email}</p>
        </div>
        
        <p><strong>Pour commencer :</strong></p>
        <ol>
          <li>Cliquez sur le bouton ci-dessous pour créer votre mot de passe</li>
          <li>Connectez-vous à votre espace entraîneur</li>
          <li>Gérez votre équipe et créez vos compositions</li>
        </ol>
        
        <div style="text-align: center;">
          <a href="${resetLink}" class="button">
            🔐 Créer mon mot de passe
          </a>
        </div>
        
        <div class="info-box">
          <p style="margin: 0;"><strong>⚠️ Important :</strong> Ce lien est valable pendant 1 heure. Si vous ne créez pas votre mot de passe maintenant, vous pourrez toujours utiliser la fonction "Mot de passe oublié" sur la page de connexion.</p>
        </div>
        
        <p><strong>En tant qu'entraîneur, vous pouvez :</strong></p>
        <ul>
          <li>✅ Gérer les statuts de vos joueurs (Titulaire, Remplaçant, Blessé, Suspendu)</li>
          <li>✅ Créer et valider les compositions officielles</li>
          <li>✅ Consulter les statistiques de votre équipe</li>
          <li>✅ Voir le calendrier des matchs</li>
          <li>✅ Basculer en mode utilisateur pour voir l'interface publique</li>
        </ul>
        
        <p>Si vous avez des questions, n'hésitez pas à contacter l'administration.</p>
        
        <p style="margin-top: 30px;">
          Sportivement,<br>
          <strong>L'équipe ComeBac League</strong>
        </p>
      </div>
      
      <div class="footer">
        <p>ComeBac League - Ligue de Football Scolaire</p>
        <p style="font-size: 12px; color: #9ca3af;">
          Cet email a été envoyé automatiquement, merci de ne pas y répondre.
        </p>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: `🏆 Bienvenue Coach - Votre compte ComeBac League`,
    html
  })
}
