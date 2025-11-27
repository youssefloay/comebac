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

async function fixJohnGeorge() {
  console.log('🔍 Vérification de John George dans Ego Fc...\n')
  
  const regId = 'RNQIMG9wbPPBwUhTmgy1'
  const regDoc = await db.collection('teamRegistrations').doc(regId).get()
  
  if (!regDoc.exists) {
    console.error('❌ Inscription non trouvée')
    return
  }
  
  const regData = regDoc.data()
  const players = regData?.players || []
  
  console.log(`📊 ${players.length} joueurs dans l'inscription\n`)
  
  // Trouver John George
  const johnGeorge = players.find((p: any, i: number) => 
    (p.firstName === 'John' && p.lastName === 'George') ||
    (i === 6 && !p.email)
  )
  
  if (!johnGeorge) {
    console.log('❌ John George non trouvé')
    return
  }
  
  console.log('📝 Données de John George:')
  console.log(`   Prénom: ${johnGeorge.firstName}`)
  console.log(`   Nom: ${johnGeorge.lastName}`)
  console.log(`   Email: ${johnGeorge.email || 'MANQUANT'}`)
  console.log(`   Nickname: ${johnGeorge.nickname || 'N/A'}`)
  console.log(`   Numéro: ${johnGeorge.jerseyNumber || johnGeorge.number || 'N/A'}`)
  
  // Vérifier s'il y a un joueur similaire dans playerAccounts
  const teamId = '96nQ60wYDCUru3BOJie7'
  const paSnap = await db.collection('playerAccounts')
    .where('teamId', '==', teamId)
    .get()
  
  console.log('\n📋 Recherche dans playerAccounts...')
  const possibleMatches = paSnap.docs.filter(doc => {
    const data = doc.data()
    const firstName = data.firstName?.toLowerCase()
    const lastName = data.lastName?.toLowerCase()
    return (firstName === 'john' || firstName === 'ramy') && 
           (lastName === 'george' || lastName === 'john')
  })
  
  if (possibleMatches.length > 0) {
    console.log(`\n✅ ${possibleMatches.length} joueur(s) similaire(s) trouvé(s):`)
    possibleMatches.forEach(doc => {
      const data = doc.data()
      console.log(`   - ${data.firstName} ${data.lastName} (${data.email})`)
      
      // Si c'est Ramy John, mettre à jour teamRegistrations
      if (data.firstName === 'Ramy' && data.lastName === 'John' && data.email) {
        console.log(`\n📝 Mise à jour de teamRegistrations avec l'email de Ramy John...`)
        const updatedPlayers = players.map((p: any) => {
          if (p.firstName === 'John' && p.lastName === 'George' && !p.email) {
            return {
              ...p,
              email: data.email,
              firstName: 'Ramy',
              lastName: 'John'
            }
          }
          return p
        })
        
        regDoc.ref.update({
          players: updatedPlayers,
          updatedAt: new Date()
        }).then(() => {
          console.log('✅ teamRegistrations mis à jour')
        })
      }
    })
  } else {
    console.log('\n⚠️  Aucun joueur similaire trouvé dans playerAccounts')
    console.log('   John George semble être un doublon ou une erreur')
    console.log('   Voulez-vous le supprimer de teamRegistrations?')
  }
  
  console.log('\n✅ Vérification terminée')
}

fixJohnGeorge()
  .then(() => {
    setTimeout(() => process.exit(0), 3000)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

