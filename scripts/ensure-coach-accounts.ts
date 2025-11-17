#!/usr/bin/env node

/**
 * Script pour s'assurer que chaque coach possède un compte Firebase Auth
 * et un profil utilisateur (userProfiles) avec role=coach.
 *
 * Usage:
 *   npx tsx scripts/ensure-coach-accounts.ts
 *
 * Pré-requis:
 *   - Variables FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 *     renseignées (par ex. dans .env.local).
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { getAuth } from 'firebase-admin/auth'

config({ path: resolve(process.cwd(), '.env.local') })

const requiredEnv = ['FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY']
const missing = requiredEnv.filter(key => !process.env[key])
if (missing.length > 0) {
  console.error(`❌ Variables manquantes: ${missing.join(', ')}`)
  process.exit(1)
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n')
    })
  })
}

const db = getFirestore()
const auth = getAuth()

interface CoachData {
  email?: string
  firstName?: string
  lastName?: string
  teamId?: string
  teamName?: string
  phone?: string
  uid?: string
}

async function ensureCoach(docId: string, data: CoachData) {
  const email = data.email?.trim().toLowerCase()
  if (!email) {
    console.warn(`⚠️  Coach ${docId} ignoré (email manquant)`)
    return { updated: false, createdAuth: false, profileCreated: false }
  }

  let userRecord
  let createdAuth = false
  try {
    userRecord = await auth.getUserByEmail(email)
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      userRecord = await auth.createUser({
        email,
        displayName: `${data.firstName || ''} ${data.lastName || ''}`.trim() || email,
        emailVerified: false
      })
      createdAuth = true
      console.log(`✅ Utilisateur Auth créé pour ${email}`)
    } else {
      throw err
    }
  }

  if (!data.uid || data.uid !== userRecord.uid) {
    await db.collection('coachAccounts').doc(docId).update({
      uid: userRecord.uid,
      email,
      updatedAt: new Date()
    })
  }

  // S'assurer qu'un profil existe
  const profileSnap = await db.collection('userProfiles')
    .where('uid', '==', userRecord.uid)
    .limit(1)
    .get()

  let profileCreated = false
  if (profileSnap.empty) {
    const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim() || email
    await db.collection('userProfiles').add({
      uid: userRecord.uid,
      email,
      fullName,
      username: email.split('@')[0],
      role: 'coach',
      phone: data.phone || '',
      teamId: data.teamId || null,
      teamName: data.teamName || null,
      createdAt: new Date(),
      updatedAt: new Date()
    })
    profileCreated = true
    console.log(`🆕 Profil coach créé pour ${email}`)
  }

  return { updated: true, createdAuth, profileCreated }
}

async function main() {
  console.log('🔄 Vérification des coachs...')
  const coachesSnap = await db.collection('coachAccounts').get()
  console.log(`📁 ${coachesSnap.size} coach(s) détectés`)

  let success = 0
  let createdAuth = 0
  let profileCreated = 0

  for (const doc of coachesSnap.docs) {
    try {
      const result = await ensureCoach(doc.id, doc.data() as CoachData)
      if (result.updated) success++
      if (result.createdAuth) createdAuth++
      if (result.profileCreated) profileCreated++
    } catch (error) {
      console.error(`❌ Erreur pour ${doc.id}:`, (error as Error).message)
    }
  }

  console.log('\n📊 Résumé')
  console.log(`   ✅ Coachs synchronisés: ${success}`)
  console.log(`   🆕 Comptes Auth créés: ${createdAuth}`)
  console.log(`   🧾 Profils créés: ${profileCreated}`)
  console.log('\nTerminé ✅')
}

main().catch(err => {
  console.error('❌ Script interrompu:', err)
  process.exit(1)
})
