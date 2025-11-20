import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

// Initialize Firebase Admin SDK
let adminApp: App | null = null

if (!getApps().length) {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY

  // Vérifier que toutes les variables nécessaires sont présentes
  if (!projectId || !clientEmail || !privateKey) {
    console.warn('⚠️ Firebase Admin: Variables d\'environnement manquantes (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). Certaines fonctionnalités peuvent ne pas fonctionner.')
  } else {
    try {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'scolar-league.firebasestorage.app',
      })
    } catch (error) {
      console.error('❌ Erreur initialisation Firebase Admin:', error)
    }
  }
} else {
  adminApp = getApps()[0]
}

export { adminApp }

// Exporter adminAuth seulement si adminApp est initialisé
export const adminAuth = adminApp ? getAuth(adminApp) : null

// Obtenir l'instance Firestore seulement si adminApp est initialisé
let _adminDb: ReturnType<typeof getFirestore> | null = null

if (adminApp) {
  try {
    _adminDb = getFirestore()
    
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
  } catch (error) {
    console.error('❌ Erreur initialisation Firestore Admin:', error)
  }
}

export const adminDb = _adminDb
