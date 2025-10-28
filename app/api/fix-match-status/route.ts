import { NextResponse } from 'next/server'
import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore'

// Configuration Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Initialiser Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)

export async function POST() {
  try {
    // Récupérer tous les matchs
    const matchesSnapshot = await getDocs(collection(db, 'matches'))
    const matches = matchesSnapshot.docs.map(doc => ({
      id: doc.id,
      ref: doc.ref,
      ...doc.data()
    })) as any[]
    
    // Récupérer tous les résultats
    const resultsSnapshot = await getDocs(collection(db, 'matchResults'))
    const results = resultsSnapshot.docs.map(doc => doc.data()) as any[]
    
    // Trouver les matchs qui ont des résultats mais ne sont pas marqués comme terminés
    const matchesToUpdate = matches.filter(match => {
      const hasResult = results.some(result => result.matchId === match.id)
      const isNotCompleted = match.status !== 'completed'
      return hasResult && isNotCompleted
    })
    
    if (matchesToUpdate.length === 0) {
      return NextResponse.json({ 
        message: 'Tous les matchs avec résultats sont déjà marqués comme terminés.',
        details: {
          totalMatches: matches.length,
          matchesWithResults: results.length,
          alreadyCompleted: matches.filter(m => m.status === 'completed').length
        }
      })
    }
    
    // Mettre à jour le statut des matchs
    let updatedCount = 0
    for (const match of matchesToUpdate) {
      await updateDoc(doc(db, 'matches', match.id), {
        status: 'completed',
        updatedAt: Timestamp.now()
      })
      updatedCount++
    }
    
    return NextResponse.json({ 
      message: `${updatedCount} matchs mis à jour vers le statut "terminé"!`,
      details: {
        totalMatches: matches.length,
        matchesWithResults: results.length,
        updated: updatedCount,
        completedBefore: matches.filter(m => m.status === 'completed').length,
        completedAfter: matches.filter(m => m.status === 'completed').length + updatedCount
      }
    })
    
  } catch (error) {
    console.error('Erreur lors de la correction du statut:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la correction du statut: ' + (error instanceof Error ? error.message : 'Erreur inconnue')
    }, { status: 500 })
  }
}