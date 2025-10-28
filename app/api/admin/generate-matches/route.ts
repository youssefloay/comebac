import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, addDoc, Timestamp, query, where } from 'firebase/firestore'

export async function POST() {
  try {
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

    // Vérifier que chaque équipe a au moins 8 joueurs (5 titulaires + 3 remplaçants)
    const teamsWithPlayers = []
    for (const team of teams) {
      const playersQuery = query(collection(db, 'players'), where('teamId', '==', team.id))
      const playersSnapshot = await getDocs(playersQuery)
      
      if (playersSnapshot.docs.length < 8) {
        return NextResponse.json({ 
          error: `L'équipe "${team.name}" doit avoir au moins 8 joueurs (5 titulaires + 3 remplaçants)` 
        }, { status: 400 })
      }
      
      teamsWithPlayers.push({
        ...team,
        playersCount: playersSnapshot.docs.length
      })
    }

    // Supprimer les anciens matchs
    const existingMatchesSnapshot = await getDocs(collection(db, 'matches'))
    const deletePromises = existingMatchesSnapshot.docs.map(doc => doc.ref.delete())
    await Promise.all(deletePromises)

    // Générer tous les matchs (chaque équipe joue contre chaque autre équipe à domicile et à l'extérieur)
    const matches = []
    const startDate = new Date()
    let matchDate = new Date(startDate)
    
    for (let i = 0; i < teams.length; i++) {
      for (let j = 0; j < teams.length; j++) {
        if (i !== j) {
          // Match aller-retour
          matches.push({
            homeTeamId: teams[i].id,
            awayTeamId: teams[j].id,
            date: new Date(matchDate),
            status: 'scheduled',
            homeTeamName: teams[i].name,
            awayTeamName: teams[j].name,
            round: Math.floor(matches.length / teams.length) + 1
          })
          
          // Espacer les matchs de 3 jours
          matchDate.setDate(matchDate.getDate() + 3)
        }
      }
    }

    // Mélanger les matchs pour un calendrier plus réaliste
    for (let i = matches.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [matches[i], matches[j]] = [matches[j], matches[i]]
    }

    // Réassigner les dates après mélange
    matchDate = new Date(startDate)
    matches.forEach((match, index) => {
      match.date = new Date(matchDate)
      match.round = Math.floor(index / (teams.length / 2)) + 1
      matchDate.setDate(matchDate.getDate() + 2) // 2 jours entre chaque match
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