import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, addDoc, Timestamp, query, where } from 'firebase/firestore'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { startDate, time, matchesPerDay = 1 } = body

    if (!startDate || !time) {
      return NextResponse.json({ 
        error: 'Date et heure requises' 
      }, { status: 400 })
    }

    // Récupérer toutes les équipes
    const teamsSnapshot = await getDocs(collection(db, 'teams'))
    const teams = teamsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

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

    // Générer tous les matchs (chaque équipe joue contre chaque autre équipe à domicile et à l'extérieur)
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

    // Réassigner les dates après mélange
    // matchesPerDay matchs par jeudi
    let matchDate = new Date(startDate)
    let matchCounter = 0
    
    matches.forEach((match, index) => {
      match.date = new Date(matchDate)
      match.round = Math.floor(index / matchesPerDay) + 1
      
      matchCounter++
      
      // Si on a atteint le nombre de matchs par jour, passer au jeudi suivant
      if (matchCounter >= matchesPerDay) {
        matchDate.setDate(matchDate.getDate() + 7) // Prochain jeudi
        matchCounter = 0
      }
    })

    // Sauvegarder les matchs dans Firestore
    const savePromises = matches.map(match => 
      addDoc(collection(db, 'matches'), {
        ...match,
        date: Timestamp.fromDate(match.date),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      })
    )
    
    await Promise.all(savePromises)

    return NextResponse.json({ 
      success: true, 
      message: `${matches.length} matchs générés avec succès pour ${teams.length} équipes`,
      matchesCount: matches.length,
      teamsCount: teams.length,
      teamsWithPlayers: teamsWithPlayers.map(t => ({
        name: t.name,
        playersCount: t.playersCount
      }))
    })
  } catch (error) {
    console.error('Error generating matches:', error)
    return NextResponse.json({ error: 'Failed to generate matches' }, { status: 500 })
  }
}