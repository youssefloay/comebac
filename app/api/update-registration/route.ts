import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { Timestamp, FieldValue } from 'firebase-admin/firestore'

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

          // Mettre à jour les joueurs dans la collection players
          const playersSnap = await adminDb.collection('players')
            .where('teamId', '==', teamDoc.id)
            .get()

          const existingPlayers = playersSnap.docs

          // Mettre à jour ou créer les joueurs
          for (let i = 0; i < registration.players.length; i++) {
            const player = registration.players[i]
            const existingPlayer = existingPlayers.find(p => p.data().email === player.email)

            const playerData: any = {
              name: `${player.firstName} ${player.lastName}`,
              number: parseInt(player.jerseyNumber) || 0,
              position: player.position,
              teamId: teamDoc.id,
              nationality: 'Égypte',
              isCaptain: i === 0, // Le premier joueur est le capitaine
              email: player.email,
              phone: player.phone,
              firstName: player.firstName,
              lastName: player.lastName,
              nickname: player.nickname || '',
              birthDate: player.birthDate || '',
              height: parseFloat(player.height) || 0,
              tshirtSize: player.tshirtSize || 'M',
              strongFoot: player.foot === 'Droitier' ? 'Droit' : player.foot === 'Gaucher' ? 'Gauche' : 'Ambidextre',
              grade: player.grade || registration.teamGrade,
              school: registration.schoolName,
              updatedAt: Timestamp.now()
            }

            if (player.age && player.age > 0) {
              playerData.age = player.age
            } else {
              playerData.age = calculateAge(player.birthDate)
            }

            if (existingPlayer) {
              // Mettre à jour le joueur existant
              await adminDb.collection('players').doc(existingPlayer.id).update(playerData)
            } else {
              // Créer un nouveau joueur
              await adminDb.collection('players').add({
                ...playerData,
                overall: 75,
                seasonStats: {
                  goals: 0,
                  assists: 0,
                  matches: 0,
                  yellowCards: 0,
                  redCards: 0
                },
                createdAt: Timestamp.now()
              })
            }
          }

          // Supprimer les joueurs en trop si on en a retiré
          if (existingPlayers.length > registration.players.length) {
            const currentPlayerEmails = registration.players.map((p: any) => p.email)
            for (const playerDoc of existingPlayers) {
              const playerData = playerDoc.data()
              if (!currentPlayerEmails.includes(playerData.email)) {
                await adminDb.collection('players').doc(playerDoc.id).delete()
              }
            }
          }

          // Mettre à jour les comptes joueurs (playerAccounts)
          // Chercher tous les comptes de l'équipe
          const playerAccountsSnap = await adminDb.collection('playerAccounts')
            .where('teamId', '==', teamDoc.id)
            .get()

          const existingTeamAccounts = playerAccountsSnap.docs

          for (let i = 0; i < registration.players.length; i++) {
            const player = registration.players[i]
            
            // Chercher d'abord dans les comptes de l'équipe
            let existingAccount = existingTeamAccounts.find(acc => acc.data().email === player.email)
            
            // Si pas trouvé, chercher dans toute la collection par email
            if (!existingAccount) {
              const accountByEmailSnap = await adminDb.collection('playerAccounts')
                .where('email', '==', player.email)
                .limit(1)
                .get()
              
              if (!accountByEmailSnap.empty) {
                existingAccount = accountByEmailSnap.docs[0]
              }
            }

            const accountData: any = {
              firstName: player.firstName,
              lastName: player.lastName,
              nickname: player.nickname || '',
              email: player.email,
              phone: player.phone,
              position: player.position,
              jerseyNumber: parseInt(player.jerseyNumber) || 0,
              teamId: teamDoc.id,
              teamName: registration.teamName,
              birthDate: player.birthDate || '',
              height: parseFloat(player.height) || 0,
              tshirtSize: player.tshirtSize || 'M',
              foot: player.foot,
              grade: player.grade || registration.teamGrade,
              updatedAt: Timestamp.now()
            }

            if (existingAccount) {
              // Mettre à jour le compte existant
              await adminDb.collection('playerAccounts').doc(existingAccount.id).update(accountData)
            } else {
              // Ne pas créer de nouveau compte ici - sera créé lors de la connexion ou par l'admin
              // On met juste à jour teams et players
            }
          }

          // Supprimer les comptes de l'équipe si on en a retiré des joueurs
          // Chercher TOUS les comptes liés à cette équipe (pas seulement ceux dans existingTeamAccounts)
          const allTeamAccountsSnap = await adminDb.collection('playerAccounts')
            .where('teamId', '==', teamDoc.id)
            .get()
          
          const currentPlayerEmails = registration.players.map((p: any) => p.email.toLowerCase())
          
          for (const accountDoc of allTeamAccountsSnap.docs) {
            const accountData = accountDoc.data()
            const accountEmail = accountData.email?.toLowerCase() || ''
            
            if (!currentPlayerEmails.includes(accountEmail)) {
              // Retirer le teamId mais ne pas supprimer le compte (le joueur pourrait être dans une autre équipe)
              await adminDb.collection('playerAccounts').doc(accountDoc.id).update({
                teamId: FieldValue.delete(),
                teamName: FieldValue.delete(),
                updatedAt: Timestamp.now()
              })
              console.log(`Retiré ${accountData.email} de l'équipe ${registration.teamName}`)
            }
          }
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
