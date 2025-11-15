import { NextRequest, NextResponse } from 'next/server'
import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    let updated = 0
    const updates: Array<{ collection: string; count: number }> = []

    // Charger toutes les équipes
    const teamsSnap = await getDocs(collection(db, 'teams'))
    const teamsMap = new Map<string, string>()
    
    teamsSnap.docs.forEach(doc => {
      teamsMap.set(doc.id, doc.data().name)
    })

    console.log(`📦 ${teamsMap.size} équipes chargées`)

    // Mettre à jour playerAccounts
    const playersSnap = await getDocs(collection(db, 'playerAccounts'))
    let playerUpdates = 0
    for (const playerDoc of playersSnap.docs) {
      const data = playerDoc.data()
      if (data.teamId && teamsMap.has(data.teamId)) {
        const correctTeamName = teamsMap.get(data.teamId)!
        if (data.teamName !== correctTeamName) {
          await updateDoc(doc(db, 'playerAccounts', playerDoc.id), {
            teamName: correctTeamName
          })
          console.log(`✅ Player ${data.firstName} ${data.lastName}: "${data.teamName}" → "${correctTeamName}"`)
          playerUpdates++
          updated++
        }
      }
    }
    updates.push({ collection: 'playerAccounts', count: playerUpdates })

    // Mettre à jour coachAccounts
    const coachesSnap = await getDocs(collection(db, 'coachAccounts'))
    let coachUpdates = 0
    for (const coachDoc of coachesSnap.docs) {
      const data = coachDoc.data()
      if (data.teamId && teamsMap.has(data.teamId)) {
        const correctTeamName = teamsMap.get(data.teamId)!
        if (data.teamName !== correctTeamName) {
          await updateDoc(doc(db, 'coachAccounts', coachDoc.id), {
            teamName: correctTeamName
          })
          console.log(`✅ Coach ${data.firstName} ${data.lastName}: "${data.teamName}" → "${correctTeamName}"`)
          coachUpdates++
          updated++
        }
      }
    }
    updates.push({ collection: 'coachAccounts', count: coachUpdates })

    // Mettre à jour players
    const playersCollSnap = await getDocs(collection(db, 'players'))
    let playersCollUpdates = 0
    for (const playerDoc of playersCollSnap.docs) {
      const data = playerDoc.data()
      if (data.teamId && teamsMap.has(data.teamId)) {
        const correctTeamName = teamsMap.get(data.teamId)!
        if (data.teamName !== correctTeamName) {
          await updateDoc(doc(db, 'players', playerDoc.id), {
            teamName: correctTeamName
          })
          playersCollUpdates++
          updated++
        }
      }
    }
    updates.push({ collection: 'players', count: playersCollUpdates })

    // Mettre à jour matches
    const matchesSnap = await getDocs(collection(db, 'matches'))
    let matchUpdates = 0
    for (const matchDoc of matchesSnap.docs) {
      const data = matchDoc.data()
      let needsUpdate = false
      const updateData: any = {}

      if (data.homeTeamId && teamsMap.has(data.homeTeamId)) {
        const correctName = teamsMap.get(data.homeTeamId)!
        if (data.homeTeam !== correctName) {
          updateData.homeTeam = correctName
          needsUpdate = true
        }
      }

      if (data.awayTeamId && teamsMap.has(data.awayTeamId)) {
        const correctName = teamsMap.get(data.awayTeamId)!
        if (data.awayTeam !== correctName) {
          updateData.awayTeam = correctName
          needsUpdate = true
        }
      }

      if (needsUpdate) {
        await updateDoc(doc(db, 'matches', matchDoc.id), updateData)
        matchUpdates++
        updated++
      }
    }
    updates.push({ collection: 'matches', count: matchUpdates })

    // Mettre à jour results
    const resultsSnap = await getDocs(collection(db, 'results'))
    let resultUpdates = 0
    for (const resultDoc of resultsSnap.docs) {
      const data = resultDoc.data()
      let needsUpdate = false
      const updateData: any = {}

      if (data.homeTeamId && teamsMap.has(data.homeTeamId)) {
        const correctName = teamsMap.get(data.homeTeamId)!
        if (data.homeTeam !== correctName) {
          updateData.homeTeam = correctName
          needsUpdate = true
        }
      }

      if (data.awayTeamId && teamsMap.has(data.awayTeamId)) {
        const correctName = teamsMap.get(data.awayTeamId)!
        if (data.awayTeam !== correctName) {
          updateData.awayTeam = correctName
          needsUpdate = true
        }
      }

      if (needsUpdate) {
        await updateDoc(doc(db, 'results', resultDoc.id), updateData)
        resultUpdates++
        updated++
      }
    }
    updates.push({ collection: 'results', count: resultUpdates })

    // Mettre à jour teamRegistrations
    const registrationsSnap = await getDocs(collection(db, 'teamRegistrations'))
    let registrationUpdates = 0
    for (const regDoc of registrationsSnap.docs) {
      const data = regDoc.data()
      
      // Trouver l'équipe correspondante par nom
      let teamId: string | null = null
      for (const [id, name] of teamsMap.entries()) {
        if (data.teamName === name) {
          teamId = id
          break
        }
      }
      
      // Si on a trouvé l'équipe et qu'elle a un nouveau nom
      if (teamId && teamsMap.has(teamId)) {
        const correctName = teamsMap.get(teamId)!
        if (data.teamName !== correctName) {
          await updateDoc(doc(db, 'teamRegistrations', regDoc.id), {
            teamName: correctName
          })
          console.log(`✅ Registration: "${data.teamName}" → "${correctName}"`)
          registrationUpdates++
          updated++
        }
      }
    }
    updates.push({ collection: 'teamRegistrations', count: registrationUpdates })

    return NextResponse.json({
      success: true,
      message: `✅ ${updated} document(s) mis à jour avec les noms d'équipes corrects`,
      updates
    })

  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
