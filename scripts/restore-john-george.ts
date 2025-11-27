import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

config({ path: resolve(process.cwd(), '.env.local') })

if (getApps().length === 0) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  }

  initializeApp({
    credential: cert(serviceAccount)
  })
}

const db = getFirestore()

async function restoreJohnGeorge() {
  console.log('🔧 Restauration de John George dans teamRegistrations...\n')
  
  const regId = 'RNQIMG9wbPPBwUhTmgy1'
  const regDoc = await db.collection('teamRegistrations').doc(regId).get()
  
  if (!regDoc.exists) {
    console.error('❌ Inscription non trouvée')
    return
  }
  
  const regData = regDoc.data()
  const players = regData?.players || []
  
  console.log(`📊 ${players.length} joueurs actuels\n`)
  
  // Vérifier si John George existe déjà
  const hasJohnGeorge = players.some((p: any) => 
    p.firstName === 'John' && p.lastName === 'George'
  )
  
  const hasRamyJohn = players.some((p: any) => 
    p.firstName === 'Ramy' && p.lastName === 'John'
  )
  
  console.log(`   John George présent: ${hasJohnGeorge}`)
  console.log(`   Ramy John présent: ${hasRamyJohn}`)
  
  if (!hasJohnGeorge && hasRamyJohn) {
    // Ajouter John George (sans email pour l'instant, il faudra le demander)
    console.log('\n📝 Ajout de John George...')
    
    // Chercher dans les backups ou autres sources pour trouver son email
    // Pour l'instant, on va créer un email temporaire ou le laisser sans email
    // mais avec un identifiant unique
    
    const updatedPlayers = [...players, {
      firstName: 'John',
      lastName: 'George',
      email: '', // À compléter plus tard
      nickname: 'John',
      jerseyNumber: 1,
      number: 1
    }]
    
    await regDoc.ref.update({
      players: updatedPlayers,
      updatedAt: new Date()
    })
    
    console.log('✅ John George ajouté (sans email - à compléter)')
  } else if (hasJohnGeorge) {
    console.log('✅ John George est déjà présent')
  }
  
  console.log('\n✅ Restauration terminée')
  console.log('\n⚠️  NOTE: John George n\'a pas d\'email. Il faudra:')
  console.log('   1. Demander son email au capitaine/coach')
  console.log('   2. Ou le créer dans playerAccounts avec un email')
}

restoreJohnGeorge()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

