// Service d'envoi d'emails pour les comptes joueurs
import { Resend } from 'resend'
import { getPlayerWelcomeEmailHtml, getCoachWelcomeEmailHtml } from './email-templates'

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
    console.log('📤 Envoi email à:', data.to, '| Sujet:', data.subject)
    
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'ComeBac League <onboarding@resend.dev>',
      to: data.to,
      subject: data.subject,
      html: data.html
    })

    console.log('✅ Email envoyé avec succès à', data.to, '| ID:', result.data?.id)
    return { success: true, data: result }
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error)
    console.error('❌ Message d\'erreur:', error.message)
    console.error('❌ Détails:', JSON.stringify(error, null, 2))
    return { success: false, error: error.message || error }
  }
}

export function generateWelcomeEmail(playerName: string, teamName: string, resetLink: string, playerEmail: string) {
  return {
    to: playerEmail,
    subject: `⚽ Bienvenue dans ComeBac League - Activez votre compte`,
    html: getPlayerWelcomeEmailHtml(playerName, teamName, resetLink, playerEmail)
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
  return sendEmail({
    to: email,
    subject: `🏆 Bienvenue Coach - Activez votre compte ComeBac League`,
    html: getCoachWelcomeEmailHtml(email, firstName, lastName, teamName, resetLink)
  })
}
