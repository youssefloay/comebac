import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const { accountId, accountType, uid, teamId, updates } = await request.json()

    if (!accountId || !accountType || !updates) {
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      )
    }

    // Si l'email change, on doit d'abord récupérer l'ancien email pour synchroniser
    let oldEmail: string | null = null
    if (updates.email !== undefined) {
      try {
        if (accountType === 'player') {
          const playerDoc = await adminDb.collection('playerAccounts').doc(accountId).get()
          if (playerDoc.exists) {
            oldEmail = playerDoc.data()?.email
          }
        } else if (accountType === 'coach') {
          const coachDoc = await adminDb.collection('coachAccounts').doc(accountId).get()
          if (coachDoc.exists) {
            oldEmail = coachDoc.data()?.email
          }
        }
      } catch (error) {
        console.error('Erreur récupération ancien email:', error)
      }
    }

    // Si l'email change et qu'on a l'ancien email, synchroniser partout
    let emailSyncResult: any = null
    if (updates.email && oldEmail && oldEmail.toLowerCase().trim() !== updates.email.toLowerCase().trim()) {
      console.log(`🔄 Email change détecté: ${oldEmail} → ${updates.email}, synchronisation...`)
      try {
        // Importer et appeler la fonction de synchronisation directement
        const { syncEmailEverywhere } = await import('./sync-email-logic')
        emailSyncResult = await syncEmailEverywhere(oldEmail, updates.email)
        console.log(`✅ Email synchronisé:`, emailSyncResult.summary)
        updatedCollections.push(`Email synchronisé dans ${emailSyncResult.updates.length} collection(s)`)
      } catch (error: any) {
        console.error('⚠️ Erreur lors de la synchronisation email:', error.message)
        // On continue quand même avec la mise à jour normale
      }
    }

    const batch = adminDb.batch()
    const updatedCollections: string[] = []

    // Préparer les données à mettre à jour
    const updateData: any = {
      updatedAt: new Date().toISOString()
    }

    if (updates.firstName !== undefined) updateData.firstName = updates.firstName
    if (updates.lastName !== undefined) updateData.lastName = updates.lastName
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.email !== undefined) updateData.email = updates.email
    if (updates.phone !== undefined) updateData.phone = updates.phone
    if (updates.birthDate !== undefined) updateData.birthDate = updates.birthDate || null
    if (updates.nickname !== undefined) updateData.nickname = updates.nickname || ''
    if (updates.height !== undefined) updateData.height = updates.height || null
    if (updates.tshirtSize !== undefined) updateData.tshirtSize = updates.tshirtSize
    if (updates.foot !== undefined) updateData.foot = updates.foot
    if (updates.teamName !== undefined) updateData.teamName = updates.teamName
    if (updates.position !== undefined) updateData.position = updates.position
    if (updates.jerseyNumber !== undefined) updateData.jerseyNumber = updates.jerseyNumber
    if (updates.role !== undefined) updateData.role = updates.role

    // 1. Mettre à jour la collection principale selon le type
    if (accountType === 'coach') {
      const coachRef = adminDb.collection('coachAccounts').doc(accountId)
      batch.update(coachRef, updateData)
      updatedCollections.push('coachAccounts')
    } else if (accountType === 'player') {
      const playerRef = adminDb.collection('playerAccounts').doc(accountId)
      batch.update(playerRef, updateData)
      updatedCollections.push('playerAccounts')
    } else if (accountType === 'user' || accountType === 'admin') {
      const userRef = adminDb.collection('users').doc(accountId)
      batch.update(userRef, updateData)
      updatedCollections.push('users')
    }

    // 2. Mettre à jour dans la collection players si c'est un joueur
    if (accountType === 'player') {
      const playersSnapshot = await adminDb.collection('players')
        .where('email', '==', updates.email || '')
        .get()
      
      if (!playersSnapshot.empty) {
        playersSnapshot.forEach(doc => {
          const playerUpdate: any = {
            ...(updates.firstName && { firstName: updates.firstName }),
            ...(updates.lastName && { lastName: updates.lastName }),
            ...(updates.firstName && updates.lastName && { name: `${updates.firstName} ${updates.lastName}` }),
            ...(updates.email && { email: updates.email }),
            ...(updates.phone && { phone: updates.phone }),
            ...(updates.position && { position: updates.position }),
            ...(updates.jerseyNumber !== undefined && { number: updates.jerseyNumber, jerseyNumber: updates.jerseyNumber }),
            ...(updates.nickname !== undefined && { nickname: updates.nickname || '' }),
            ...(updates.birthDate !== undefined && { birthDate: updates.birthDate }),
            ...(updates.height !== undefined && { height: updates.height })
          }
          if (Object.keys(playerUpdate).length > 0) {
            batch.update(doc.ref, playerUpdate)
          }
        })
        updatedCollections.push('players')
      }
    }

    // 3. Mettre à jour dans userProfiles si l'utilisateur existe
    if (uid) {
      const profilesSnapshot = await adminDb.collection('userProfiles')
        .where('uid', '==', uid)
        .get()
      
      if (!profilesSnapshot.empty) {
        profilesSnapshot.forEach(doc => {
          const profileData: any = { ...updateData }
          if (updates.firstName && updates.lastName) {
            profileData.fullName = `${updates.firstName} ${updates.lastName}`
          }
          batch.update(doc.ref, profileData)
        })
        updatedCollections.push('userProfiles')
      }
    }

    // 4. Mettre à jour dans l'équipe si teamId existe
    if (teamId) {
      const teamRef = adminDb.collection('teams').doc(teamId)
      const teamDoc = await teamRef.get()
      
      if (teamDoc.exists) {
        const teamData = teamDoc.data()
        
        // Mettre à jour le nom de l'équipe si modifié
        if (updates.teamName && teamData?.name !== updates.teamName) {
          batch.update(teamRef, { name: updates.teamName })
          updatedCollections.push('teams (name)')
        }

        // Mettre à jour le coach dans l'équipe
        if (accountType === 'coach' && teamData?.coachId === accountId) {
          // Récupérer les données complètes du coach depuis coachAccounts
          const coachDoc = await adminDb.collection('coachAccounts').doc(accountId).get()
          const coachData = coachDoc.exists ? coachDoc.data() : null
          
          const coachUpdate: any = {}
          if (updates.firstName) coachUpdate.coachFirstName = updates.firstName
          if (updates.lastName) coachUpdate.coachLastName = updates.lastName
          if (updates.email) coachUpdate.coachEmail = updates.email
          
          // Mettre à jour l'objet coach complet
          if (coachData) {
            coachUpdate.coach = {
              firstName: updates.firstName || coachData.firstName || '',
              lastName: updates.lastName || coachData.lastName || '',
              birthDate: updates.birthDate || coachData.birthDate || '',
              email: updates.email || coachData.email || '',
              phone: updates.phone || coachData.phone || ''
            }
          }
          
          if (Object.keys(coachUpdate).length > 0) {
            batch.update(teamRef, coachUpdate)
            updatedCollections.push('teams (coach)')
          }
        }

        // Mettre à jour le joueur dans l'équipe
        if (accountType === 'player' && teamData?.players) {
          const playerIndex = teamData.players.findIndex((p: any) => p.id === accountId || p.email === updates.email)
          if (playerIndex !== -1) {
            const updatedPlayers = [...teamData.players]
            updatedPlayers[playerIndex] = {
              ...updatedPlayers[playerIndex],
              ...(updates.firstName && { firstName: updates.firstName }),
              ...(updates.lastName && { lastName: updates.lastName }),
              ...(updates.email && { email: updates.email }),
              ...(updates.position && { position: updates.position }),
              ...(updates.jerseyNumber !== undefined && { jerseyNumber: updates.jerseyNumber }),
              ...(updates.nickname !== undefined && { nickname: updates.nickname || '' })
            }
            batch.update(teamRef, { players: updatedPlayers })
            updatedCollections.push('teams (players)')
          }
        }
      }
    }

    // 5. Mettre à jour dans toutes les équipes si le nom d'équipe a changé
    if (updates.teamName) {
      const teamsSnapshot = await adminDb.collection('teams')
        .where('name', '==', updates.teamName)
        .get()
      
      // Récupérer les données complètes du coach si nécessaire
      let coachData: any = null
      if (accountType === 'coach') {
        const coachDoc = await adminDb.collection('coachAccounts').doc(accountId).get()
        coachData = coachDoc.exists ? coachDoc.data() : null
      }
      
      if (!teamsSnapshot.empty) {
        teamsSnapshot.forEach(doc => {
          const teamData = doc.data()
          
          // Mettre à jour le coach
          if (accountType === 'coach' && teamData.coachId === accountId) {
            const coachUpdate: any = {}
            if (updates.firstName) coachUpdate.coachFirstName = updates.firstName
            if (updates.lastName) coachUpdate.coachLastName = updates.lastName
            if (updates.email) coachUpdate.coachEmail = updates.email
            
            // Mettre à jour l'objet coach complet
            if (coachData) {
              coachUpdate.coach = {
                firstName: updates.firstName || coachData.firstName || '',
                lastName: updates.lastName || coachData.lastName || '',
                birthDate: updates.birthDate || coachData.birthDate || '',
                email: updates.email || coachData.email || '',
                phone: updates.phone || coachData.phone || ''
              }
            }
            
            if (Object.keys(coachUpdate).length > 0) {
              batch.update(doc.ref, coachUpdate)
            }
          }
          
          // Mettre à jour les joueurs
          if (accountType === 'player' && teamData.players) {
            const playerIndex = teamData.players.findIndex((p: any) => p.id === accountId || p.email === updates.email)
            if (playerIndex !== -1) {
              const updatedPlayers = [...teamData.players]
              updatedPlayers[playerIndex] = {
                ...updatedPlayers[playerIndex],
                ...(updates.firstName && { firstName: updates.firstName }),
                ...(updates.lastName && { lastName: updates.lastName }),
                ...(updates.email && { email: updates.email }),
                ...(updates.position && { position: updates.position }),
                ...(updates.jerseyNumber !== undefined && { jerseyNumber: updates.jerseyNumber }),
                ...(updates.nickname !== undefined && { nickname: updates.nickname || '' })
              }
              batch.update(doc.ref, { players: updatedPlayers })
            }
          }
        })
      }
    }

    // 6. Mettre à jour dans les compositions (lineups)
    if (accountType === 'player') {
      const lineupsSnapshot = await adminDb.collection('lineups').get()
      
      lineupsSnapshot.forEach(doc => {
        const lineupData = doc.data()
        let needsUpdate = false
        const updatedLineup: any = {}

        // Mettre à jour dans les joueurs titulaires
        if (lineupData.starters) {
          const updatedStarters = lineupData.starters.map((player: any) => {
            if (player.id === accountId) {
              needsUpdate = true
              return {
                ...player,
                ...(updates.firstName && { firstName: updates.firstName }),
                ...(updates.lastName && { lastName: updates.lastName }),
                ...(updates.position && { position: updates.position }),
                ...(updates.jerseyNumber !== undefined && { jerseyNumber: updates.jerseyNumber })
              }
            }
            return player
          })
          if (needsUpdate) updatedLineup.starters = updatedStarters
        }

        // Mettre à jour dans les remplaçants
        if (lineupData.substitutes) {
          const updatedSubstitutes = lineupData.substitutes.map((player: any) => {
            if (player.id === accountId) {
              needsUpdate = true
              return {
                ...player,
                ...(updates.firstName && { firstName: updates.firstName }),
                ...(updates.lastName && { lastName: updates.lastName }),
                ...(updates.position && { position: updates.position }),
                ...(updates.jerseyNumber !== undefined && { jerseyNumber: updates.jerseyNumber })
              }
            }
            return player
          })
          if (needsUpdate) updatedLineup.substitutes = updatedSubstitutes
        }

        if (needsUpdate) {
          batch.update(doc.ref, updatedLineup)
        }
      })
      
      if (lineupsSnapshot.size > 0) {
        updatedCollections.push('lineups')
      }
    }

    // 7. Mettre à jour dans les résultats (results)
    const resultsSnapshot = await adminDb.collection('results').get()
    
    resultsSnapshot.forEach(doc => {
      const resultData = doc.data()
      let needsUpdate = false
      const updatedResult: any = {}

      // Mettre à jour le nom de l'équipe
      if (updates.teamName) {
        if (resultData.team1Name === teamId || resultData.team1 === teamId) {
          updatedResult.team1Name = updates.teamName
          needsUpdate = true
        }
        if (resultData.team2Name === teamId || resultData.team2 === teamId) {
          updatedResult.team2Name = updates.teamName
          needsUpdate = true
        }
      }

      // Mettre à jour les buteurs
      if (accountType === 'player' && resultData.scorers) {
        const updatedScorers = resultData.scorers.map((scorer: any) => {
          if (scorer.playerId === accountId) {
            needsUpdate = true
            return {
              ...scorer,
              ...(updates.firstName && updates.lastName && { 
                playerName: `${updates.firstName} ${updates.lastName}` 
              })
            }
          }
          return scorer
        })
        if (needsUpdate) updatedResult.scorers = updatedScorers
      }

      if (needsUpdate) {
        batch.update(doc.ref, updatedResult)
      }
    })
    
    if (resultsSnapshot.size > 0) {
      updatedCollections.push('results')
    }

    // 8. Mettre à jour dans les statistiques (statistics)
    if (accountType === 'player') {
      const statsSnapshot = await adminDb.collection('statistics')
        .where('playerId', '==', accountId)
        .get()
      
      if (!statsSnapshot.empty) {
        statsSnapshot.forEach(doc => {
          const statsUpdate: any = {}
          if (updates.firstName && updates.lastName) {
            statsUpdate.playerName = `${updates.firstName} ${updates.lastName}`
          }
          if (updates.teamName) statsUpdate.teamName = updates.teamName
          
          if (Object.keys(statsUpdate).length > 0) {
            batch.update(doc.ref, statsUpdate)
          }
        })
        updatedCollections.push('statistics')
      }
    }

    // Exécuter toutes les mises à jour
    await batch.commit()

    let message = 'Compte mis à jour avec succès'
    if (emailSyncResult) {
      message += `\n📧 Email synchronisé dans ${emailSyncResult.updates.length} collection(s) (Firebase Auth, playerAccounts, players, teams, teamRegistrations, etc.)`
    }

    return NextResponse.json({
      success: true,
      message,
      updatedCollections: [...new Set(updatedCollections)],
      emailSynced: !!emailSyncResult,
      emailSyncSummary: emailSyncResult?.summary
    })

  } catch (error: any) {
    console.error('Erreur lors de la mise à jour:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
