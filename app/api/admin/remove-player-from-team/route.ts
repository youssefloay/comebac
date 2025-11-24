import { NextRequest, NextResponse } from 'next/server'
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    const { source, sourceId, playerId, playerData } = await request.json()
    
    if (!source || !sourceId) {
      return NextResponse.json(
        { error: 'Source et sourceId requis' },
        { status: 400 }
      )
    }
    
    if (source === 'playerAccounts') {
      // Supprimer le compte joueur
      const playerDoc = doc(db, 'playerAccounts', sourceId)
      const playerSnap = await getDoc(playerDoc)
      
      if (!playerSnap.exists()) {
        return NextResponse.json(
          { error: 'Joueur non trouvé' },
          { status: 404 }
        )
      }
      
      // Supprimer le joueur de l'équipe dans teams
      const accountData = playerSnap.data()
      if (accountData.teamId) {
        const teamDoc = doc(db, 'teams', accountData.teamId)
        const teamSnap = await getDoc(teamDoc)
        
        if (teamSnap.exists()) {
          const teamData = teamSnap.data()
          if (teamData.players && Array.isArray(teamData.players)) {
            const updatedPlayers = teamData.players.filter(
              (p: any) => p.email !== accountData.email && p.id !== sourceId
            )
            await updateDoc(teamDoc, { players: updatedPlayers })
          }
        }
      }
      
      // Supprimer le document
      await updateDoc(playerDoc, {
        teamId: '',
        teamName: '',
        status: 'inactive'
      })
      
      return NextResponse.json({
        success: true,
        message: 'Joueur retiré de l\'équipe avec succès'
      })
    }
    
    if (source === 'teams') {
      const teamDoc = doc(db, 'teams', sourceId)
      const teamSnap = await getDoc(teamDoc)
      
      if (!teamSnap.exists()) {
        return NextResponse.json(
          { error: 'Équipe non trouvée' },
          { status: 404 }
        )
      }
      
      const teamData = teamSnap.data()
      
      if (teamData.players && Array.isArray(teamData.players)) {
        let updatedPlayers = teamData.players
        
        if (playerId && playerId.startsWith('player_')) {
          const idx = parseInt(playerId.split('_')[1])
          updatedPlayers = teamData.players.filter((_: any, index: number) => index !== idx)
        } else if (playerData) {
          // Filtrer par email ou nom+prénom
          updatedPlayers = teamData.players.filter((p: any) => {
            if (playerData.email) {
              return (p.email || '').toLowerCase() !== playerData.email.toLowerCase()
            }
            if (playerData.firstName && playerData.lastName) {
              return !(
                (p.firstName || '').toLowerCase() === playerData.firstName.toLowerCase() &&
                (p.lastName || '').toLowerCase() === playerData.lastName.toLowerCase()
              )
            }
            return true
          })
        }
        
        await updateDoc(teamDoc, {
          players: updatedPlayers
        })
        
        // Aussi retirer de playerAccounts si existe
        if (playerData && playerData.email) {
          const playerAccountsQuery = query(
            collection(db, 'playerAccounts'),
            where('email', '==', playerData.email)
          )
          const playerAccountsSnap = await getDocs(playerAccountsQuery)
          
          if (!playerAccountsSnap.empty) {
            const playerAccountDoc = playerAccountsSnap.docs[0]
            await updateDoc(doc(db, 'playerAccounts', playerAccountDoc.id), {
              teamId: '',
              teamName: ''
            })
          }
        }
        
        return NextResponse.json({
          success: true,
          message: 'Joueur retiré de l\'équipe avec succès'
        })
      }
    }
    
    return NextResponse.json(
      { error: 'Source non reconnue' },
      { status: 400 }
    )
  } catch (error: any) {
    console.error('Erreur retrait joueur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors du retrait' },
      { status: 500 }
    )
  }
}

