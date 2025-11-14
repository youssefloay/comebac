#!/usr/bin/env node

/**
 * Script pour supprimer les notifications de test
 * 
 * Usage:
 *   npm run delete-test-notifications
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import * as readline from 'readline'

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

const db = getFirestore()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

async function main() {
  console.log('🗑️  Suppression des notifications de test')
  console.log('=' .repeat(60))
  console.log()

  try {
    // Chercher toutes les notifications de test
    const notificationsSnap = await db.collection('notifications')
      .where('title', '==', '🎉 Notification de test')
      .get()

    if (notificationsSnap.empty) {
      console.log('✅ Aucune notification de test trouvée')
      rl.close()
      return
    }

    console.log(`📋 ${notificationsSnap.size} notification(s) de test trouvée(s):`)
    console.log()

    notificationsSnap.forEach(doc => {
      const data = doc.data()
      const createdAt = data.createdAt?.toDate?.() || 'Date inconnue'
      console.log(`- ID: ${doc.id}`)
      console.log(`  Message: ${data.message}`)
      console.log(`  Créée le: ${createdAt}`)
      console.log(`  Lue: ${data.read ? 'Oui' : 'Non'}`)
      console.log()
    })

    const confirm = await question(`Supprimer ces ${notificationsSnap.size} notification(s)? (oui/non): `)
    if (confirm.toLowerCase() !== 'oui') {
      console.log('❌ Annulé')
      rl.close()
      return
    }

    console.log()
    console.log('🗑️  Suppression en cours...')
    console.log()

    // Supprimer toutes les notifications de test
    const batch = db.batch()
    notificationsSnap.forEach(doc => {
      batch.delete(doc.ref)
    })
    await batch.commit()

    console.log('✅ Toutes les notifications de test ont été supprimées!')
    console.log()

    // Chercher aussi d'autres variantes possibles
    console.log('🔍 Vérification d\'autres notifications de test...')
    
    const otherTestNotifs = await db.collection('notifications')
      .where('message', '==', 'Ceci est une notification de test')
      .get()

    if (!otherTestNotifs.empty) {
      console.log(`📋 ${otherTestNotifs.size} autre(s) notification(s) de test trouvée(s)`)
      
      const confirmOther = await question(`Supprimer ces notifications aussi? (oui/non): `)
      if (confirmOther.toLowerCase() === 'oui') {
        const batch2 = db.batch()
        otherTestNotifs.forEach(doc => {
          batch2.delete(doc.ref)
        })
        await batch2.commit()
        console.log('✅ Notifications supprimées!')
      }
    } else {
      console.log('✅ Aucune autre notification de test trouvée')
    }

    console.log()
    console.log('=' .repeat(60))
    console.log('✅ Nettoyage terminé!')

  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
    console.error(error)
    process.exit(1)
  } finally {
    rl.close()
  }
}

main()
