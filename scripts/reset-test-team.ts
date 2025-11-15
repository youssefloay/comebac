/**
 * Script pour remettre l'équipe test en statut pending_players
 */

async function resetTestTeam() {
  const teamName = prompt('Nom de l\'équipe à réinitialiser:')
  
  if (!teamName) {
    console.log('❌ Aucun nom fourni')
    return
  }

  console.log(`🔄 Réinitialisation de l'équipe: ${teamName}\n`)

  try {
    const response = await fetch('http://localhost:3000/api/admin/reset-team-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teamName,
        newStatus: 'pending_players'
      })
    })

    const data = await response.json()

    if (response.ok) {
      console.log('✅', data.message)
    } else {
      console.log('❌ Erreur:', data.error)
    }
  } catch (error) {
    console.error('❌ Erreur de connexion:', error)
    console.log('\n💡 Assurez-vous que le serveur Next.js est démarré (npm run dev)')
  }
}

// Fonction prompt pour Node.js
function prompt(question: string): string | null {
  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question(question + ' ', (answer: string) => {
      rl.close()
      resolve(answer || null)
    })
  }) as any
}

resetTestTeam()
