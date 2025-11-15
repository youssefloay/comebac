import { NextRequest, NextResponse } from 'next/server'
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const { teamName } = await request.json()

    if (!teamName) {
      return NextResponse.json(
        { error: 'teamName requis' },
        { status: 400 }
      )
    }

    // Trouver l'inscription
    const registrationsRef = collection(db, 'teamRegistrations')
    const q = query(registrationsRef, where('teamName', '==', teamName))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Inscription non trouvée' },
        { status: 404 }
      )
    }

    // Supprimer
    await deleteDoc(doc(db, 'teamRegistrations', snapshot.docs[0].id))

    return NextResponse.json({
      success: true,
      message: `✅ Inscription "${teamName}" supprimée`
    })

  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
