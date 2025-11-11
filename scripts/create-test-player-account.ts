import { getAuth } from 'firebase-admin/auth'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { readFileSync } from 'fs'
import { collection, addDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

// Load environment variables from .env.local
const envContent = readFileSync('.env.local', 'utf-8')
const envVars: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    let value = match[2].trim()
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1)
    }
    envVars[key] = value
  }
})

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: envVars.FIREBASE_PROJECT_ID,
      clientEmail: envVars.FIREBASE_CLIENT_EMAIL,
      privateKey: envVars.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

async function createTestPlayerAccount() {
  try {
    const auth = getAuth()
    const email = 'test.player@comebac.com'
    const password = 'TestPlayer123'

    console.log('🔧 Création du compte joueur de test...')

    // Vérifier si l'utilisateur existe déjà
    try {
      const existingUser = await auth.getUserByEmail(email)
      console.log('ℹ️ Utilisateur existe déjà, suppression...')
      await auth.deleteUser(existingUser.uid)
    } catch (error: any) {
      if (error.code !== 'auth/user-not-found') {
        throw error
      }
    }

    // Créer le compte Firebase Auth
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      emailVerified: true,
      displayName: 'Test Player',
    })

    console.log('✅ Compte Firebase Auth créé:', userRecord.uid)

    // Créer le profil joueur dans playerAccounts
    await addDoc(collection(db, 'playerAccounts'), {
      uid: userRecord.uid,
      email: email,
      firstName: 'Test',
      lastName: 'Player',
      nickname: 'TP',
      teamId: 'test-team-id',
      teamName: 'Test FC',
      position: 'Attaquant',
      jerseyNumber: 99,
      phone: '+20 123 456 7890',
      grade: '1ère',
      createdAt: new Date(),
      stats: {
        matchesPlayed: 5,
        goals: 3,
        assists: 2,
        yellowCards: 1,
        redCards: 0
      }
    })

    console.log('✅ Profil joueur créé dans playerAccounts')
    console.log('\n📧 Identifiants de connexion:')
    console.log('Email:', email)
    console.log('Mot de passe:', password)
    console.log('\n🎮 Connectez-vous avec ces identifiants pour voir le dashboard joueur!')

  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

createTestPlayerAccount()
