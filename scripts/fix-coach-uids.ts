#!/usr/bin/env node

/**
 * Script pour compléter les uid manquants dans coachAccounts
 * Usage : npx tsx scripts/fix-coach-uids.ts
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

config({ path: resolve(process.cwd(), '.env.local') })

if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  console.error('❌ Variables FIREBASE_* manquantes. Vérifiez votre .env.local')
  process.exit(1)
}

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  })
}

const db = getFirestore()
const auth = getAuth()

async function fixCoachUids() {
  console.log('🔍 Recherche des coachs sans UID...')

  const snap = await db.collection('coachAccounts').get()
  console.log(`📁 ${snap.size} coach(s) trouvés`)

  let updated = 0
  let alreadyOk = 0
  let missingEmail = 0
  let notFound = 0

  for (const doc of snap.docs) {
    const data = doc.data()

    if (data.uid) {
      alreadyOk++
      continue
    }

    const email = data.email?.trim()
    if (!email) {
      missingEmail++
      console.warn(`⚠️  Coach ${doc.id} sans email, ignoré`)
      continue
    }

    try {
      const user = await auth.getUserByEmail(email)
      await doc.ref.update({
        uid: user.uid,
        email: user.email, // normalisé si besoin
        updatedAt: new Date(),
      })
      updated++
      console.log(`✅ UID ajouté pour ${email} -> ${user.uid}`)
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        notFound++
        console.warn(`❌ Aucun utilisateur Auth pour ${email}`)
      } else {
        console.error(`❌ Erreur pour ${email}:`, error.message)
      }
    }
  }

  console.log('\n📊 Résumé')
  console.log(`   ✅ Mis à jour : ${updated}`)
  console.log(`   ➖ Déjà OK : ${alreadyOk}`)
  console.log(`   ⚠️ Sans email : ${missingEmail}`)
  console.log(`   ❌ Auth introuvable : ${notFound}`)
  console.log('\nTerminé ✅')
}

fixCoachUids().catch(err => {
  console.error('❌ Script interrompu:', err)
  process.exit(1)
})
