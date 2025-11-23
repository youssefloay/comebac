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
      teamGrade: registration.teamGrade,
      captain: registration.captain,
      coach: registration.coach || null,
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

    // Si l'inscription est approuvée, mettre à jour aussi l'équipe dans la collection teams
    if (data.status === 'approved') {
      try {
        // Chercher l'équipe correspondante dans teams
        const teamsSnap = await adminDb.collection('teams')
          .where('name', '==', data.teamName)
          .limit(1)
          .get()

        if (!teamsSnap.empty) {
          const teamDoc = teamsSnap.docs[0]
          const teamUpdateData: any = {
            name: registration.teamName,
            schoolName: registration.schoolName,
            teamGrade: registration.teamGrade,
            captain: registration.captain,
            updatedAt: Timestamp.now()
          }

          // Ajouter ou mettre à jour l'entraîneur
          if (registration.coach && registration.coach.firstName && registration.coach.lastName) {
            teamUpdateData.coach = {
              firstName: registration.coach.firstName,
              lastName: registration.coach.lastName,
              email: registration.coach.email || '',
              phone: registration.coach.phone || '',
              birthDate: registration.coach.birthDate || ''
            }
          }

          // Mettre à jour les joueurs dans l'équipe
          const updatedPlayers = registration.players.map((p: any) => ({
            name: `${p.firstName} ${p.lastName}`,
            firstName: p.firstName,
            lastName: p.lastName,
            nickname: p.nickname || '',
            number: parseInt(p.jerseyNumber) || 0,
            position: p.position,
            email: p.email,
            phone: p.phone,
            birthDate: p.birthDate || '',
            age: calculateAge(p.birthDate),
            height: parseFloat(p.height) || 0,
            tshirtSize: p.tshirtSize || 'M',
            strongFoot: p.foot === 'Droitier' ? 'Droit' : p.foot === 'Gaucher' ? 'Gauche' : 'Ambidextre',
            isCaptain: p.isCaptain || false
          }))

          teamUpdateData.players = updatedPlayers

          await adminDb.collection('teams').doc(teamDoc.id).update(teamUpdateData)
        }
      } catch (teamError) {
        console.error('Erreur lors de la mise à jour de l\'équipe:', teamError)
        // On continue même si la mise à jour de l'équipe échoue
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Modifications enregistrées avec succès'
    })
  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
