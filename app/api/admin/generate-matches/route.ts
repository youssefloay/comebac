import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, addDoc, Timestamp, query, where } from 'firebase/firestore'
import { generateMiniLeagueMatches } from '@/lib/match-generation'
import type { TournamentMode } from '@/lib/types'

export async function POST(request: Request) {
  let body: any = {}
  try {
    body = await request.json()
    const { 
      startDate, 
      time, 
      matchesPerDay = 1, 
      mode = 'CLASSIC', 
      teamIds = [], 
      isTest = false,
      timeMode = 'interval',
      timeInterval = 90,
      matchTimes = []
    } = body

    if (!startDate || !time) {
      return NextResponse.json({ 
        error: 'Date et heure requises' 
      }, { status: 400 })
    }

    const tournamentMode: TournamentMode = mode === 'MINI_LEAGUE' ? 'MINI_LEAGUE' : 'CLASSIC'

    // Vérifier que des équipes ont été sélectionnées
    if (!teamIds || teamIds.length === 0) {
      return NextResponse.json({ 
        error: 'Veuillez sélectionner au moins une équipe' 
      }, { status: 400 })
    }

    if (tournamentMode === 'MINI_LEAGUE' && teamIds.length !== 10) {
      return NextResponse.json({ 
        error: 'Le mode Mini-League nécessite exactement 10 équipes sélectionnées' 
      }, { status: 400 })
    }

    // Récupérer uniquement les équipes sélectionnées
    const teamsSnapshot = await getDocs(collection(db, 'teams'))
    const allTeams = teamsSnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name || '',
      ...doc.data()
    })) as Array<{ id: string; name: string; [key: string]: any }>

    const teams = allTeams.filter(team => teamIds.includes(team.id))

    if (teams.length !== teamIds.length) {
      return NextResponse.json({ 
        error: 'Certaines équipes sélectionnées n\'existent pas' 
      }, { status: 400 })
    }

    if (teams.length < 2) {
      return NextResponse.json({ 
        error: 'Il faut au moins 2 équipes pour générer des matchs' 
      }, { status: 400 })
    }

    // Vérifier que chaque équipe a au moins 7 joueurs (5 titulaires + 2 remplaçants minimum)
    const teamsWithPlayers = []
    for (const team of teams) {
      const playersQuery = query(collection(db, 'players'), where('teamId', '==', team.id))
      const playersSnapshot = await getDocs(playersQuery)
      
      if (playersSnapshot.docs.length < 7) {
        return NextResponse.json({ 
          error: `L'équipe "${team.name}" doit avoir au moins 7 joueurs (5 titulaires + 2 remplaçants minimum)` 
        }, { status: 400 })
      }
      
      teamsWithPlayers.push({
        ...team,
        playersCount: playersSnapshot.docs.length
      })
    }

    // Ne plus supprimer les matchs existants (ils sont archivés en fin de saison)

    // Générer les matchs selon le mode
    if (tournamentMode === 'MINI_LEAGUE') {
      // Mode Mini-League: générer les matchs de qualification (Jours 1-5)
      const selectedTeamIds = teams.map(t => t.id)
      const startDateObj = new Date(startDate)
      
      // Parse time and set it to the start date
      const [hours, minutes] = time.split(':').map(Number)
      startDateObj.setHours(hours, minutes, 0, 0)
      
      const matchIds = await generateMiniLeagueMatches(
        selectedTeamIds, 
        startDateObj, 
        undefined, 
        isTest,
        timeMode,
        timeInterval,
        matchTimes
      )
      
      return NextResponse.json({ 
        success: true, 
        message: `${matchIds.length} matchs de qualification générés avec succès pour ${teams.length} équipes (Jours 1-5). Les finales (Jour 6) seront générées après le Jour 5.`,
        matchesCount: matchIds.length,
        teamsCount: teams.length,
        mode: 'MINI_LEAGUE',
        teamsWithPlayers: teamsWithPlayers.map(t => ({
          name: t.name,
          playersCount: t.playersCount
        }))
      })
    } else {
      // Mode CLASSIC: génération classique (aller-retour)
      const matches = []
      
      for (let i = 0; i < teams.length; i++) {
        for (let j = 0; j < teams.length; j++) {
          if (i !== j) {
            // Match aller-retour
            matches.push({
              homeTeamId: teams[i].id,
              awayTeamId: teams[j].id,
              status: 'scheduled',
              homeTeamName: teams[i].name,
              awayTeamName: teams[j].name,
            })
          }
        }
      }

      // Mélanger les matchs pour un calendrier plus réaliste
      for (let i = matches.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [matches[i], matches[j]] = [matches[j], matches[i]]
      }

      // Fonction pour obtenir l'heure d'un match selon son index dans la journée
      const getMatchTime = (matchIndex: number, baseDate: Date): Date => {
        const matchDate = new Date(baseDate)
        
        if (timeMode === 'specific' && matchTimes && matchTimes.length > 0) {
          // Utiliser les heures spécifiques
          const timeIndex = matchIndex % matchTimes.length
          const [hours, minutes] = matchTimes[timeIndex].split(':').map(Number)
          matchDate.setHours(hours, minutes, 0, 0)
        } else {
          // Utiliser l'écart entre matchs
          const intervalMinutes = timeInterval || 90
          const [baseHours, baseMinutes] = time.split(':').map(Number)
          const totalMinutes = baseHours * 60 + baseMinutes + (matchIndex * intervalMinutes)
          const hours = Math.floor(totalMinutes / 60) % 24
          const minutes = totalMinutes % 60
          matchDate.setHours(hours, minutes, 0, 0)
        }
        
        return matchDate
      }

      // Réassigner les dates après mélange
      // matchesPerDay matchs par jeudi
      let matchDate = new Date(startDate)
      const [hours, minutes] = time.split(':').map(Number)
      matchDate.setHours(hours, minutes, 0, 0)
      let matchCounter = 0
      
      matches.forEach((match: any, index) => {
        const round = Math.floor(index / matchesPerDay) + 1
        const matchIndexInDay = index % matchesPerDay
        
        // Calculer la date de base pour cette journée
        const roundDate = new Date(startDate)
        roundDate.setDate(roundDate.getDate() + (round - 1) * 7) // Prochain jeudi
        
        // Utiliser la fonction getMatchTime pour obtenir l'heure correcte
        match.date = getMatchTime(matchIndexInDay, roundDate)
        match.round = round
        
        matchCounter++
      })

      // Sauvegarder les matchs dans Firestore avec les équipes participantes
      const savePromises = matches.map((match: any) => {
        const matchData: any = {
          homeTeamId: match.homeTeamId,
          awayTeamId: match.awayTeamId,
          date: Timestamp.fromDate(match.date),
          round: match.round,
          status: match.status || 'scheduled',
          tournamentMode: 'CLASSIC',
          isTest: isTest || false, // Mode test
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }

        // Ajouter participatingTeamIds seulement s'il est défini et non vide
        if (teamIds && teamIds.length > 0) {
          matchData.participatingTeamIds = teamIds
        }

        return addDoc(collection(db, 'matches'), matchData)
      })
      
      await Promise.all(savePromises)

      return NextResponse.json({ 
        success: true, 
        message: `${matches.length} matchs générés avec succès pour ${teams.length} équipes`,
        matchesCount: matches.length,
        teamsCount: teams.length,
        mode: 'CLASSIC',
        teamsWithPlayers: teamsWithPlayers.map(t => ({
          name: t.name,
          playersCount: t.playersCount
        }))
      })
    }
  } catch (error: any) {
    console.error('Error generating matches:', error)
    console.error('Error stack:', error?.stack)
    console.error('Error details:', {
      message: error?.message,
      name: error?.name,
      body: body
    })
    return NextResponse.json({ 
      error: error?.message || 'Failed to generate matches',
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    }, { status: 500 })
  }
}