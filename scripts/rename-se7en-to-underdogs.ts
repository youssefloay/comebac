/**
 * Script pour renommer l'équipe Se7en en Underdogs partout
 */

const OLD_NAME = 'Se7en'
const NEW_NAME = 'Underdogs'

async function renameTeam() {
  console.log(`🔄 Renommage de l'équipe: ${OLD_NAME} → ${NEW_NAME}\n`)

  try {
    const response = await fetch('http://localhost:3000/api/admin/sync-team-names', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅', data.message)
      console.log('\n📊 Détails:')
      console.log('   - Joueurs mis à jour:', data.playersUpdated || 0)
      console.log('   - Matchs mis à jour:', data.matchesUpdated || 0)
      console.log('   - Résultats mis à jour:', data.resultsUpdated || 0)
      console.log('   - Inscriptions mises à jour:', data.registrationsUpdated || 0)
    } else {
      console.log('❌ Erreur:', data.error)
    }
  } catch (error) {
    console.error('❌ Erreur de connexion:', error)
    console.log('\n💡 Assurez-vous que le serveur Next.js est démarré (npm run dev)')
  }
}

renameTeam()
