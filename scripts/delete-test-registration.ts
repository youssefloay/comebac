/**
 * Script pour supprimer une inscription test
 */

async function deleteTestRegistration() {
  const teamName = prompt('Nom de l\'équipe à supprimer:')
  
  if (!teamName) {
    console.log('❌ Aucun nom fourni')
    return
  }

  if (!confirm(`Supprimer l'inscription "${teamName}"?`)) {
    console.log('❌ Annulé')
    return
  }

  console.log(`🗑️ Suppression de l'inscription: ${teamName}\n`)

  try {
    const response = await fetch('http://localhost:3000/api/admin/delete-registration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ teamName })
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

function confirm(question: string): boolean {
  const readline = require('readline')
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise((resolve) => {
    rl.question(question + ' (y/n) ', (answer: string) => {
      rl.close()
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes')
    })
  }) as any
}

deleteTestRegistration()
