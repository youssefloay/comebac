/**
 * Script pour vérifier l'email exact de Karim Ashour dans Firebase Auth
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), '.env.local') })

// Initialiser Firebase Admin
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

const adminAuth = getAuth()
const adminDb = getFirestore()

const UID = 'K8UnN8f6ovS3VAGhPhbCZRWDJs63'

async function verifyEmail() {
  console.log('🔍 Vérification de l\'email exact')
  console.log('='.repeat(60))
  console.log()

  try {
    // 1. Récupérer l'utilisateur par UID
    const user = await adminAuth.getUser(UID)
    console.log('1️⃣ Firebase Auth:')
    console.log(`   UID: ${user.uid}`)
    console.log(`   Email: "${user.email}"`)
    console.log(`   Email (lowercase): "${user.email?.toLowerCase()}"`)
    console.log()

    // 2. Vérifier dans coachAccounts
    console.log('2️⃣ coachAccounts:')
    const coachAccountsSnap = await adminDb.collection('coachAccounts')
      .where('email', '==', user.email)
      .get()
    
    if (!coachAccountsSnap.empty) {
      console.log(`   ✅ Trouvé avec email exact: "${user.email}"`)
      coachAccountsSnap.docs.forEach(doc => {
        const data = doc.data()
        console.log(`   ID: ${doc.id}`)
        console.log(`   Email dans DB: "${data.email}"`)
        console.log(`   Nom: ${data.firstName} ${data.lastName}`)
      })
    } else {
      console.log(`   ❌ Non trouvé avec email exact: "${user.email}"`)
      
      // Essayer avec lowercase
      const coachAccountsSnap2 = await adminDb.collection('coachAccounts')
        .get()
      
      const matching = coachAccountsSnap2.docs.find(doc => {
        const data = doc.data()
        return data.email?.toLowerCase() === user.email?.toLowerCase()
      })
      
      if (matching) {
        const data = matching.data()
        console.log(`   ⚠️  Trouvé avec email en lowercase: "${data.email}"`)
        console.log(`   ID: ${matching.id}`)
        console.log(`   Problème: Les emails ne correspondent pas exactement!`)
        console.log(`   Solution: Mettre à jour l'email dans coachAccounts`)
        
        // Mettre à jour l'email dans coachAccounts
        await matching.ref.update({ email: user.email })
        console.log(`   ✅ Email mis à jour dans coachAccounts`)
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

verifyEmail().catch(console.error)

