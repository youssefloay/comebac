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

export function generateWelcomeEmail(playerName: string, teamName: string, resetLink: string, playerEmail: string) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.comebac.com'
  
  return {
    to: playerEmail,
    subject: `Bienvenue dans ComeBac League`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background-color: #f9fafb;
            padding: 20px;
          }
          .container { 
            max-width: 560px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          }
          .header { 
            background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
            padding: 32px 24px;
            text-align: center;
          }
          .logo {
            width: 64px;
            height: 64px;
            margin: 0 auto 16px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
          }
          .header h1 {
            color: white;
            font-size: 24px;
            font-weight: 600;
            margin: 0;
          }
          .content { 
            padding: 32px 24px;
          }
          .content p {
            color: #4b5563;
            margin-bottom: 16px;
            font-size: 15px;
          }
          .button-container {
            text-align: center;
            margin: 24px 0;
          }
          .button { 
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6 0%, #10b981 100%);
            color: white !important;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 15px;
          }
          .alert {
            background: #fef3c7;
            border-left: 3px solid #f59e0b;
            padding: 14px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .alert p {
            color: #92400e;
            margin: 0;
            font-size: 14px;
          }
          .info {
            background: #eff6ff;
            border-left: 3px solid #3b82f6;
            padding: 14px;
            border-radius: 6px;
            margin: 20px 0;
          }
          .info p {
            color: #1e40af;
            margin: 0;
            font-size: 14px;
          }
          .info a {
            color: #2563eb;
            text-decoration: underline;
          }
          .footer {
            background: #f9fafb;
            padding: 24px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
          }
          .footer p {
            color: #6b7280;
            font-size: 13px;
            margin: 6px 0;
          }
          .contact {
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid #e5e7eb;
          }
          .contact p {
            font-size: 13px;
            margin: 4px 0;
          }
          .contact a {
            color: #2563eb;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">⚽</div>
            <h1>Bienvenue dans ComeBac League</h1>
          </div>
          
          <div class="content">
            <p>Bonjour <strong>${playerName}</strong>,</p>
            
            <p>Votre équipe <strong>${teamName}</strong> a été validée. Créez votre mot de passe pour accéder à votre espace joueur:</p>
            
            <div class="button-container">
              <a href="${resetLink}" class="button">Créer mon mot de passe</a>
            </div>
            
            <div class="alert">
              <p><strong>⏰ Ce lien expire dans 1 heure</strong></p>
            </div>
            
            <div class="info">
              <p><strong>Lien expiré?</strong></p>
              <p style="margin-top: 8px;">
                1. Allez sur <a href="${appUrl}/login">${appUrl}/login</a><br>
                2. Entrez votre email: <strong>${playerEmail}</strong><br>
                3. Cliquez sur "Mot de passe oublié"
              </p>
            </div>
            
            <div class="contact">
              <p style="color: #4b5563; font-weight: 600;">Besoin d'aide?</p>
              <p>📧 <a href="mailto:contact@comebac.com">contact@comebac.com</a></p>
              <p>📱 <a href="https://wa.me/33634051384">WhatsApp: +33 6 34 05 13 84</a></p>
              <p>📷 <a href="https://instagram.com/comebac.league">Instagram: @comebac.league</a></p>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>ComeBac League</strong></p>
            <p>Championnat de Football Scolaire</p>
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
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.comebac.com'
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          background-color: #f9fafb;
          padding: 20px;
        }
        .container {
          max-width: 560px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }
        .header {
          background: linear-gradient(135deg, #f97316 0%, #dc2626 100%);
          padding: 32px 24px;
          text-align: center;
        }
        .logo {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
        }
        .header h1 {
          color: white;
          font-size: 24px;
          font-weight: 600;
          margin: 0;
        }
        .content {
          padding: 32px 24px;
        }
        .content p {
          color: #4b5563;
          margin-bottom: 16px;
          font-size: 15px;
        }
        .button-container {
          text-align: center;
          margin: 24px 0;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #f97316 0%, #dc2626 100%);
          color: white !important;
          padding: 14px 32px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 15px;
        }
        .alert {
          background: #fef3c7;
          border-left: 3px solid #f59e0b;
          padding: 14px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .alert p {
          color: #92400e;
          margin: 0;
          font-size: 14px;
        }
        .info {
          background: #fff7ed;
          border-left: 3px solid #f97316;
          padding: 14px;
          border-radius: 6px;
          margin: 20px 0;
        }
        .info p {
          color: #9a3412;
          margin: 0;
          font-size: 14px;
        }
        .info a {
          color: #ea580c;
          text-decoration: underline;
        }
        .footer {
          background: #f9fafb;
          padding: 24px;
          text-align: center;
          border-top: 1px solid #e5e7eb;
        }
        .footer p {
          color: #6b7280;
          font-size: 13px;
          margin: 6px 0;
        }
        .contact {
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #e5e7eb;
        }
        .contact p {
          font-size: 13px;
          margin: 4px 0;
        }
        .contact a {
          color: #ea580c;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🏆</div>
          <h1>Bienvenue Coach</h1>
        </div>
        
        <div class="content">
          <p>Bonjour <strong>${firstName} ${lastName}</strong>,</p>
          
          <p>Votre équipe <strong>${teamName}</strong> a été validée. Créez votre mot de passe pour accéder à votre espace coach:</p>
          
          <div class="button-container">
            <a href="${resetLink}" class="button">Créer mon mot de passe</a>
          </div>
          
          <div class="alert">
            <p><strong>⏰ Ce lien expire dans 1 heure</strong></p>
          </div>
          
          <div class="info">
            <p><strong>Lien expiré?</strong></p>
            <p style="margin-top: 8px;">
              1. Allez sur <a href="${appUrl}/login">${appUrl}/login</a><br>
              2. Entrez votre email: <strong>${email}</strong><br>
              3. Cliquez sur "Mot de passe oublié"
            </p>
          </div>
          
          <p><strong>Vos fonctionnalités:</strong></p>
          <p style="font-size: 14px; color: #6b7280;">
            • Gérer les statuts des joueurs<br>
            • Créer les compositions officielles<br>
            • Consulter les statistiques<br>
            • Voir le calendrier des matchs
          </p>
          
          <div class="contact">
            <p style="color: #4b5563; font-weight: 600;">Besoin d'aide?</p>
            <p>📧 <a href="mailto:contact@comebac.com">contact@comebac.com</a></p>
            <p>📱 <a href="https://wa.me/33634051384">WhatsApp: +33 6 34 05 13 84</a></p>
            <p>📷 <a href="https://instagram.com/comebac.league">Instagram: @comebac.league</a></p>
          </div>
        </div>
        
        <div class="footer">
          <p><strong>ComeBac League</strong></p>
          <p>Championnat de Football Scolaire</p>
        </div>
      </div>
    </body>
    </html>
  `

  return sendEmail({
    to: email,
    subject: `Bienvenue Coach - ComeBac League`,
    html
  })
}
