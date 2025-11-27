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

async function removeDuplicates() {
  console.log('🔧 Suppression des doublons dans Saints...\n')
  
  const teamId = 'MHBdumu4cSU6ExLRlrrj'
  
  // Récupérer tous les playerAccounts de Saints
  const allPA = await db.collection('playerAccounts')
    .where('teamId', '==', teamId)
    .get()
  
  console.log(`📊 ${allPA.size} joueurs trouvés dans playerAccounts\n`)
  
  // Grouper par email
  const byEmail = new Map<string, any[]>()
  
  allPA.docs.forEach(doc => {
    const data = doc.data()
    const email = data.email?.toLowerCase()?.trim()
    if (email) {
      if (!byEmail.has(email)) {
        byEmail.set(email, [])
      }
      byEmail.get(email)!.push({ id: doc.id, ...data })
    }
  })
  
  // Trouver les doublons
  const duplicates: any[] = []
  
  byEmail.forEach((docs, email) => {
    if (docs.length > 1) {
      console.log(`❌ Doublon trouvé pour ${email} (${docs.length} entrées):`)
      docs.forEach((doc, index) => {
        console.log(`   ${index + 1}. ID: ${doc.id} - ${doc.firstName} ${doc.lastName}`)
        console.log(`      Créé: ${doc.createdAt?.toDate() || 'N/A'}`)
        console.log(`      Modifié: ${doc.updatedAt?.toDate() || 'N/A'}`)
      })
      
      // Garder le plus récent (ou celui avec le plus de données)
      docs.sort((a, b) => {
        const aDate = a.updatedAt?.toDate() || a.createdAt?.toDate() || new Date(0)
        const bDate = b.updatedAt?.toDate() || b.createdAt?.toDate() || new Date(0)
        return bDate.getTime() - aDate.getTime()
      })
      
      const toKeep = docs[0]
      const toDelete = docs.slice(1)
      
      console.log(`   ✅ Garder: ${toKeep.id}`)
      toDelete.forEach(doc => {
        duplicates.push({ id: doc.id, email, name: `${doc.firstName} ${doc.lastName}` })
        console.log(`   🗑️  Supprimer: ${doc.id}`)
      })
      console.log('')
    }
  })
  
  if (duplicates.length === 0) {
    console.log('✅ Aucun doublon trouvé')
    return
  }
  
  // Supprimer les doublons
  console.log(`\n🗑️  Suppression de ${duplicates.length} doublon(s)...\n`)
  let deleted = 0
  
  for (const dup of duplicates) {
    try {
      await db.collection('playerAccounts').doc(dup.id).delete()
      deleted++
      console.log(`   ✅ Supprimé: ${dup.name} (${dup.email})`)
    } catch (error: any) {
      console.error(`   ❌ Erreur pour ${dup.id}: ${error.message}`)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 RÉSUMÉ\n')
  console.log(`✅ Doublons supprimés: ${deleted}`)
  console.log(`📊 Total joueurs Saints maintenant: ${(await db.collection('playerAccounts').where('teamId', '==', teamId).get()).size}`)
  console.log('\n' + '='.repeat(60))
  console.log('✅ Nettoyage terminé!')
}

removeDuplicates()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })

