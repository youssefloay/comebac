/**
 * Script pour vérifier les noms d'équipe dans toutes les collections
 */

async function checkTeamNames() {
  console.log('🔍 Vérification des noms d\'équipe dans toutes les collections\n')

  try {
    const response = await fetch('http://localhost:3000/api/admin/check-team-names', {
      method: 'GET'
    })

    const data = await response.json()

    if (response.ok) {
      console.log('📊 Résultats:\n')
      
      if (data.teams) {
        console.log('🏆 TEAMS:')
        data.teams.forEach((team: any) => {
          console.log(`   ${team.id}: "${team.name}"`)
        })
        console.log('')
      }
      
      if (data.registrations) {
        console.log('📝 TEAM REGISTRATIONS:')
        data.registrations.forEach((reg: any) => {
          console.log(`   ${reg.id}: "${reg.teamName}" (status: ${reg.status})`)
        })
        console.log('')
      }
      
      if (data.players) {
        console.log('👥 PLAYERS (échantillon):')
        data.players.slice(0, 5).forEach((player: any) => {
          console.log(`   ${player.name}: teamName="${player.teamName || 'N/A'}"`)
        })
        if (data.players.length > 5) {
          console.log(`   ... et ${data.players.length - 5} autres`)
        }
        console.log('')
      }
      
      if (data.playerAccounts) {
        console.log('🎮 PLAYER ACCOUNTS (échantillon):')
        data.playerAccounts.slice(0, 5).forEach((acc: any) => {
          console.log(`   ${acc.firstName} ${acc.lastName}: teamName="${acc.teamName}"`)
        })
        if (data.playerAccounts.length > 5) {
          console.log(`   ... et ${data.playerAccounts.length - 5} autres`)
        }
      }
    } else {
      console.log('❌ Erreur:', data.error)
    }
  } catch (error) {
    console.error('❌ Erreur de connexion:', error)
    console.log('\n💡 Assurez-vous que le serveur Next.js est démarré (npm run dev)')
  }
}

checkTeamNames()
