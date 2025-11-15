/**
 * Script pour mettre à jour la fiche d'inscription de Se7en → Underdogs
 */

async function fixRegistration() {
  console.log('🔄 Mise à jour de la fiche d\'inscription Se7en → Underdogs\n')

  try {
    const response = await fetch('http://localhost:3000/api/admin/update-team-name-in-registration', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        oldName: 'Se7en',
        newName: 'Underdogs'
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

fixRegistration()
