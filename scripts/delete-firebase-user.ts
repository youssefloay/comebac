import { getAuth } from 'firebase-admin/auth'
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { readFileSync } from 'fs'

// Load environment variables from .env.local
const envContent = readFileSync('.env.local', 'utf-8')
const envVars: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    let value = match[2].trim()
    // Remove quotes if present
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

async function deleteUserByEmail(email: string) {
  try {
    const auth = getAuth()
    
    // Trouver l'utilisateur par email
    const user = await auth.getUserByEmail(email)
    
    // Supprimer l'utilisateur
    await auth.deleteUser(user.uid)
    
    console.log(`✅ Utilisateur ${email} supprimé avec succès (UID: ${user.uid})`)
  } catch (error: any) {
    if (error.code === 'auth/user-not-found') {
      console.log(`ℹ️ Utilisateur ${email} n'existe pas`)
    } else {
      console.error(`❌ Erreur lors de la suppression de ${email}:`, error)
    }
  }
}

// Supprimer youssefloay@gmail.com
deleteUserByEmail('youssefloay@gmail.com')
