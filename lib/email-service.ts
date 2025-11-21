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
  const startTime = Date.now()
  
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

    // Déterminer l'expéditeur
    // IMPORTANT: Utiliser un domaine vérifié dans Resend pour une livraison rapide
    // Si comebac.com n'est pas vérifié, utiliser le domaine par défaut de Resend
    const emailFrom = process.env.EMAIL_FROM || 'ComeBac League <onboarding@resend.dev>'
    
    // Envoyer l'email avec Resend
    console.log('📤 Envoi email à:', data.to, '| Sujet:', data.subject)
    console.log('📤 Expéditeur:', emailFrom)
    console.log('⏱️  Début envoi:', new Date().toISOString())
    
    const result = await resend.emails.send({
      from: emailFrom,
      to: data.to,
      subject: data.subject,
      html: data.html,
      // Options pour améliorer la livraison
      headers: {
        'X-Priority': '1', // Priorité haute
        'X-Mailer': 'ComeBac League'
      }
    })

    const elapsedTime = Date.now() - startTime
    console.log(`✅ Email envoyé avec succès à ${data.to} | ID: ${result.data?.id} | Temps: ${elapsedTime}ms`)
    
    return { 
      success: true, 
      data: result,
      elapsedTime: elapsedTime,
      sentAt: new Date().toISOString()
    }
  } catch (error: any) {
    const elapsedTime = Date.now() - startTime
    console.error('❌ Erreur lors de l\'envoi de l\'email:', error)
    console.error('❌ Message d\'erreur:', error.message)
    console.error('❌ Détails:', JSON.stringify(error, null, 2))
    console.error(`⏱️  Temps écoulé avant erreur: ${elapsedTime}ms`)
    return { 
      success: false, 
      error: error.message || error,
      elapsedTime: elapsedTime
    }
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
