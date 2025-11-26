/**
 * Fonction utilitaire pour synchroniser un joueur dans toutes les collections
 * Utilisée lors des modifications de formulaires d'inscription
 */

import { adminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

interface PlayerData {
  firstName: string
  lastName: string
  nickname?: string
  email: string
  phone?: string
  birthDate?: string
  age?: number
  height?: number
  tshirtSize?: string
  position?: string
  foot?: string
  jerseyNumber?: number | string
  number?: number | string
  grade?: string
  isCaptain?: boolean
}

interface SyncPlayerOptions {
  player: PlayerData
  teamId: string
  teamName: string
  schoolName?: string
  teamGrade?: string
  createPlayerAccount?: boolean // Si true, crée aussi dans playerAccounts même si inexistant
}

/**
 * Synchronise un joueur dans teams.players, players, et playerAccounts
 */
export async function syncPlayerToCollections(options: SyncPlayerOptions) {
  const { player, teamId, teamName, schoolName, teamGrade, createPlayerAccount = true } = options

  const email = player.email.toLowerCase().trim()
  const jerseyNumber = typeof player.jerseyNumber === 'string' 
    ? parseInt(player.jerseyNumber) || 0 
    : player.jerseyNumber || 0
  const number = typeof player.number === 'string' 
    ? parseInt(player.number) || 0 
    : player.number || jerseyNumber

  // Calculer l'âge si nécessaire
  const calculateAge = (birthDate?: string): number => {
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

  const age = player.age && player.age > 0 ? player.age : calculateAge(player.birthDate)

  // 1. Mettre à jour teams.players
  try {
    const teamDoc = await adminDb.collection('teams').doc(teamId).get()
    if (teamDoc.exists) {
      const teamData = teamDoc.data()
      const players = teamData?.players || []
      
      // Chercher si le joueur existe déjà dans l'équipe
      const playerIndex = players.findIndex((p: any) => p.email === email)
      
      const playerForTeam = {
        name: `${player.firstName} ${player.lastName}`,
        firstName: player.firstName,
        lastName: player.lastName,
        nickname: player.nickname || '',
        number: number,
        jerseyNumber: number,
        position: player.position || '',
        email: email,
        phone: player.phone || '',
        birthDate: player.birthDate || '',
        age: age,
        height: player.height || 0,
        tshirtSize: player.tshirtSize || 'M',
        strongFoot: player.foot === 'Droitier' ? 'Droit' : player.foot === 'Gaucher' ? 'Gauche' : 'Ambidextre',
        foot: player.foot || '',
        isCaptain: player.isCaptain || false
      }

      if (playerIndex >= 0) {
        // Mettre à jour le joueur existant
        players[playerIndex] = playerForTeam
      } else {
        // Ajouter le nouveau joueur
        players.push(playerForTeam)
      }

      await adminDb.collection('teams').doc(teamId).update({
        players: players,
        updatedAt: Timestamp.now()
      })
      console.log(`✅ teams.players mis à jour pour ${email}`)
    }
  } catch (error) {
    console.error(`❌ Erreur mise à jour teams.players pour ${email}:`, error)
  }

  // 2. Mettre à jour ou créer dans players
  try {
    const playersSnap = await adminDb.collection('players')
      .where('email', '==', email)
      .get()

    const playerDataForCollection: any = {
      name: `${player.firstName} ${player.lastName}`,
      firstName: player.firstName,
      lastName: player.lastName,
      nickname: player.nickname || '',
      number: number,
      jerseyNumber: number,
      position: player.position || '',
      teamId: teamId,
      teamName: teamName,
      nationality: 'Égypte',
      isCaptain: player.isCaptain || false,
      email: email,
      phone: player.phone || '',
      birthDate: player.birthDate || '',
      height: player.height || 0,
      tshirtSize: player.tshirtSize || 'M',
      strongFoot: player.foot === 'Droitier' ? 'Droit' : player.foot === 'Gaucher' ? 'Gauche' : 'Ambidextre',
      grade: player.grade || teamGrade,
      school: schoolName,
      updatedAt: Timestamp.now()
    }

    if (age > 0) {
      playerDataForCollection.age = age
    }

    if (!playersSnap.empty) {
      // Mettre à jour tous les documents existants (au cas où il y aurait des doublons)
      for (const doc of playersSnap.docs) {
        await doc.ref.update(playerDataForCollection)
      }
      console.log(`✅ players mis à jour pour ${email}`)
    } else {
      // Créer un nouveau document
      await adminDb.collection('players').add({
        ...playerDataForCollection,
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
      console.log(`✅ players créé pour ${email}`)
    }
  } catch (error) {
    console.error(`❌ Erreur mise à jour players pour ${email}:`, error)
  }

  // 3. Mettre à jour ou créer dans playerAccounts
  if (createPlayerAccount) {
    try {
      const accountsSnap = await adminDb.collection('playerAccounts')
        .where('email', '==', email)
        .get()

      const accountData: any = {
        firstName: player.firstName,
        lastName: player.lastName,
        nickname: player.nickname || '',
        email: email,
        phone: player.phone || '',
        position: player.position || '',
        jerseyNumber: number,
        number: number,
        teamId: teamId,
        teamName: teamName,
        birthDate: player.birthDate || '',
        height: player.height || 0,
        tshirtSize: player.tshirtSize || 'M',
        foot: player.foot || '',
        grade: player.grade || teamGrade,
        updatedAt: Timestamp.now()
      }

      if (!accountsSnap.empty) {
        // Mettre à jour tous les comptes existants
        for (const doc of accountsSnap.docs) {
          await doc.ref.update(accountData)
        }
        console.log(`✅ playerAccounts mis à jour pour ${email}`)
      } else {
        // Créer un nouveau compte
        await adminDb.collection('playerAccounts').add({
          ...accountData,
          createdAt: Timestamp.now()
        })
        console.log(`✅ playerAccounts créé pour ${email}`)
      }
    } catch (error) {
      console.error(`❌ Erreur mise à jour playerAccounts pour ${email}:`, error)
    }
  }
}

/**
 * Synchronise tous les joueurs d'une équipe dans toutes les collections
 */
export async function syncAllTeamPlayersToCollections(
  players: PlayerData[],
  teamId: string,
  teamName: string,
  schoolName?: string,
  teamGrade?: string,
  createPlayerAccounts: boolean = true
) {
  console.log(`🔄 Synchronisation de ${players.length} joueur(s) pour l'équipe "${teamName}"...`)
  
  for (const player of players) {
    await syncPlayerToCollections({
      player,
      teamId,
      teamName,
      schoolName,
      teamGrade,
      createPlayerAccount: createPlayerAccounts
    })
  }
  
  console.log(`✅ Synchronisation terminée pour l'équipe "${teamName}"`)
}

