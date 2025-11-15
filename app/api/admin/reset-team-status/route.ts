import { NextRequest, NextResponse } from 'next/server'
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const { teamName, newStatus } = await request.json()

    if (!teamName || !newStatus) {
      return NextResponse.json(
        { error: 'teamName et newStatus requis' },
        { status: 400 }
      )
    }

    // Trouver l'inscription
    const registrationsRef = collection(db, 'teamRegistrations')
    const q = query(registrationsRef, where('teamName', '==', teamName))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return NextResponse.json(
        { error: 'Équipe non trouvée' },
        { status: 404 }
      )
    }

    const docRef = snapshot.docs[0]
    
    // Mettre à jour le statut
    await updateDoc(doc(db, 'teamRegistrations', docRef.id), {
      status: newStatus
    })

    return NextResponse.json({
      success: true,
      message: `✅ Statut de "${teamName}" mis à jour: ${newStatus}`
    })

  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
