/**
 * Script pour envoyer des emails de test des nouveaux templates
 * Usage: npx tsx scripts/send-test-emails.ts
 */

import { generateWelcomeEmail, sendCoachWelcomeEmail } from '../lib/email-service'

async function sendTestEmails() {
  console.log('📧 Envoi des emails de test à contact@comebac.com\n')

  const testEmail = 'contact@comebac.com'

  // Email de test pour joueur
  console.log('1️⃣ Envoi email joueur...')
  const playerEmail = generateWelcomeEmail(
    'Jean Dupont',
    'Les Aigles',
    'https://www.comebac.com/reset-password?token=test123',
    testEmail
  )

  try {
    const { sendEmail } = await import('../lib/email-service')
    const result1 = await sendEmail(playerEmail)
    
    if (result1.success) {
      console.log('✅ Email joueur envoyé avec succès!')
    } else {
      console.log('❌ Erreur:', result1.error)
    }
  } catch (error) {
    console.log('❌ Erreur:', error)
  }

  // Attendre 2 secondes entre les emails
  await new Promise(resolve => setTimeout(resolve, 2000))

  // Email de test pour coach
  console.log('\n2️⃣ Envoi email coach...')
  try {
    const result2 = await sendCoachWelcomeEmail({
      email: testEmail,
      firstName: 'Marie',
      lastName: 'Martin',
      teamName: 'Les Lions',
      resetLink: 'https://www.comebac.com/reset-password?token=test456'
    })
    
    if (result2.success) {
      console.log('✅ Email coach envoyé avec succès!')
    } else {
      console.log('❌ Erreur:', result2.error)
    }
  } catch (error) {
    console.log('❌ Erreur:', error)
  }

  console.log('\n📬 Vérifiez votre boîte mail: contact@comebac.com')
  console.log('\n📋 Vous devriez recevoir 2 emails:')
  console.log('   1. Email Joueur (gradient bleu→vert, logo ⚽)')
  console.log('   2. Email Coach (gradient orange→rouge, logo 🏆)')
  console.log('\n✨ Caractéristiques des nouveaux templates:')
  console.log('   ✅ Design moderne et épuré')
  console.log('   ✅ Lien valable 1 heure')
  console.log('   ✅ Instructions si lien expiré')
  console.log('   ✅ Contact: Email, WhatsApp, Instagram')
}

sendTestEmails().catch(console.error)
