// Script pour envoyer l'email à David
// Usage: npx tsx scripts/send-email-to-david.ts

async function sendEmailToDavid() {
  try {
    console.log('📧 Envoi de l\'email à david.noshy.h@gmail.com...')
    
    const response = await fetch('http://localhost:3000/api/admin/resend-player-emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        emails: ['david.noshy.h@gmail.com']
      })
    })
    
    const result = await response.json()
    
    if (response.ok) {
      console.log('✅', result.message)
      console.log('Résultats:', result.results)
    } else {
      console.error('❌ Erreur:', result.error)
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

sendEmailToDavid()
