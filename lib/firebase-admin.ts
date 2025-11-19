import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export const adminAuth = getAuth()

// Obtenir l'instance Firestore
const _adminDb = getFirestore()

// Configurer Firestore pour ignorer les propriétés undefined
// Cette configuration doit être faite avant toute utilisation
// Utiliser un try-catch car settings() ne peut être appelé qu'une seule fois
try {
  _adminDb.settings({
    ignoreUndefinedProperties: true
  })
} catch (error: any) {
  // Si settings() a déjà été appelé, ignorer l'erreur silencieusement
  // C'est normal si le module est importé plusieurs fois
}

export const adminDb = _adminDb
