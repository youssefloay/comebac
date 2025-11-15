import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

export async function POST(request: Request) {
  try {
    const { token, registration } = await request.json()

    if (!token || !registration) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 })
    }

    // Chercher l'inscription avec ce token
    const registrationsSnap = await adminDb.collection('teamRegistrations')
      .where('updateToken', '==', token)
      .limit(1)
      .get()

    if (registrationsSnap.empty) {
      return NextResponse.json({ error: 'Lien invalide' }, { status: 404 })
    }

    const doc = registrationsSnap.docs[0]
    const data = doc.data()

    // Vérifier si le token est actif
    if (data.updateTokenActive === false) {
      return NextResponse.json({ error: 'Lien désactivé par l\'administrateur' }, { status: 403 })
    }

    // Calculer l'âge pour chaque joueur
    const calculateAge = (birthDate: string): number => {
      if (!birthDate) return 0
      const today = new Date()
      const birth = new Date(birthDate)
      let age = today.getFullYear() - birth.getFullYear()
      const monthDiff = today.getMonth() - birth.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--
      }
      return age
    }

    // Mettre à jour l'inscription
    await adminDb.collection('teamRegistrations').doc(doc.id).update({
      teamName: registration.teamName,
      schoolName: registration.schoolName,
      captain: registration.captain,
      players: registration.players.map((p: any) => ({
        ...p,
        age: calculateAge(p.birthDate),
        height: parseFloat(p.height) || 0,
        jerseyNumber: parseInt(p.jerseyNumber) || 0
      })),
      lastUpdatedAt: Timestamp.now(),
      lastUpdatedBy: 'captain',
      needsAdminValidation: true // Flag pour que l'admin valide les modifications
    })

    return NextResponse.json({
      success: true,
      message: 'Modifications enregistrées avec succès'
    })
  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
