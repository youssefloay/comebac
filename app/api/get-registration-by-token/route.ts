import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Token requis' }, { status: 400 })
    }

    // Chercher l'inscription avec ce token
    const registrationsSnap = await adminDb.collection('teamRegistrations')
      .where('updateToken', '==', token)
      .where('updateTokenUsed', '==', false)
      .limit(1)
      .get()

    if (registrationsSnap.empty) {
      return NextResponse.json({ error: 'Lien invalide ou déjà utilisé' }, { status: 404 })
    }

    const doc = registrationsSnap.docs[0]
    const data = doc.data()

    // Vérifier si le token est expiré
    if (data.updateTokenExpiresAt && data.updateTokenExpiresAt.toDate() < new Date()) {
      return NextResponse.json({ error: 'Lien expiré' }, { status: 410 })
    }

    return NextResponse.json({
      success: true,
      registration: {
        teamName: data.teamName,
        schoolName: data.schoolName,
        teamGrade: data.teamGrade,
        captain: data.captain,
        players: data.players
      }
    })
  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
