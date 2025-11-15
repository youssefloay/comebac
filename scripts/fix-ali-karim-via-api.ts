/**
 * Script pour mettre à jour l'email d'Ali Karim via l'API
 */

const OLD_EMAIL = 'eliali@gmail.com'
const NEW_EMAIL = 'boseliali@gmail.com'
const PLAYER_NAME = 'Ali Karim'
const TEAM_NAME = 'Se7en'

async function fixAliKarimEmail() {
  console.log('🔄 Mise à jour de l\'email d\'Ali Karim via API')
  console.log(`   ${OLD_EMAIL} → ${NEW_EMAIL}\n`)

  try {
    const response = await fetch('http://localhost:3000/api/admin/update-player-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        oldEmail: OLD_EMAIL,
        newEmail: NEW_EMAIL,
        playerName: PLAYER_NAME,
        teamName: TEAM_NAME
      })
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅', data.message)
      if (data.warning) {
        console.log('⚠️', data.warning)
      }
    } else {
      console.log('❌ Erreur:', data.error)
    }
  } catch (error) {
    console.error('❌ Erreur de connexion:', error)
    console.log('\n💡 Assurez-vous que le serveur Next.js est démarré (npm run dev)')
  }
}

fixAliKarimEmail()
