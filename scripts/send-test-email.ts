import { Resend } from 'resend'
import { getPlayerWelcomeEmailHtml } from '../lib/email-templates'
import { config } from 'dotenv'
import { resolve } from 'path'

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

async function sendTestEmail() {
  const testEmail = 'ft-b7fa36-29d379a9@ft.glockdb.com'
  
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY non configurée dans les variables d\'environnement')
    console.error('Vérifiez que le fichier .env.local ou .env contient RESEND_API_KEY')
    process.exit(1)
  }

  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    console.log(`📤 Envoi d'un email de test avec le template joueur à ${testEmail}...`)
    
    // Générer un lien de test (dans un vrai cas, ce serait un lien de réinitialisation)
    const testResetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.comebac.com'}/login?test=true`
    
    // Utiliser le template joueur professionnel
    const playerName = 'Test Joueur'
    const teamName = 'Équipe Test'
    const html = getPlayerWelcomeEmailHtml(playerName, teamName, testResetLink, testEmail)
    
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'ComeBac League <onboarding@resend.dev>',
      to: testEmail,
      subject: '⚽ Bienvenue dans ComeBac League - Activez votre compte',
      html: html
    })

    console.log('✅ Email envoyé avec succès!')
    console.log('📧 ID:', result.data?.id)
    console.log('📬 Destinataire:', testEmail)
    console.log('📝 Template: Joueur professionnel')
    
  } catch (error: any) {
    console.error('❌ Erreur lors de l\'envoi:', error)
    console.error('Détails:', error.message)
    process.exit(1)
  }
}

sendTestEmail()

