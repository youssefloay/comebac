// Script pour tester l'envoi d'email au capitaine
// Usage: npx tsx scripts/test-captain-email.ts

const testEmail = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/send-captain-invite-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        captainEmail: 'lijex11759@delaeb.com',
        captainName: 'Test Captain',
        teamName: 'Test Team',
        token: 'test123',
        hasCoach: false
      })
    })

    const data = await response.json()
    
    if (response.ok) {
      console.log('✅ Email envoyé avec succès!')
      console.log('Réponse:', data)
    } else {
      console.error('❌ Erreur:', data)
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error)
  }
}

testEmail()
