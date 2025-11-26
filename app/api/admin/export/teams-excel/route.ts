import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import * as XLSX from 'xlsx'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId') // Support ancien format
    const teamIdsParam = searchParams.get('teamIds') // Nouveau format avec plusieurs IDs
    
    // Déterminer les IDs d'équipes à exporter
    let selectedTeamIds: string[] = []
    if (teamIdsParam) {
      selectedTeamIds = teamIdsParam.split(',').filter(id => id.trim().length > 0)
    } else if (teamId) {
      selectedTeamIds = [teamId]
    }
    
    console.log('📊 Début export Excel équipes...', selectedTeamIds.length > 0 ? `pour ${selectedTeamIds.length} équipe(s)` : 'toutes les équipes')
    
    // Récupérer toutes les équipes, joueurs et playerAccounts en une seule fois
    const [teamsSnap, playersSnap, playerAccountsSnap] = await Promise.all([
      getDocs(collection(db, 'teams')),
      getDocs(collection(db, 'players')),
      getDocs(collection(db, 'playerAccounts'))
    ])

    let teams = teamsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    // Si des teamIds sont spécifiés, filtrer pour ces équipes uniquement
    if (selectedTeamIds.length > 0) {
      teams = teams.filter(team => selectedTeamIds.includes(team.id))
      if (teams.length === 0) {
        return NextResponse.json(
          { error: 'Aucune équipe trouvée avec les IDs fournis' },
          { status: 404 }
        )
      }
    }

    const allPlayers = playersSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    const allPlayerAccounts = playerAccountsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))

    console.log(`📊 ${teams.length} équipe(s) trouvée(s)`)
    console.log(`📊 ${allPlayers.length} joueurs trouvés`)
    console.log(`📊 ${allPlayerAccounts.length} comptes joueurs trouvés`)

    // Créer un nouveau workbook
    const workbook = XLSX.utils.book_new()

    // Pour chaque équipe, créer une feuille
    for (const team of teams) {
      const teamName = team.name || `Equipe_${team.id}`
      const teamPlayers: Array<{nickname: string, number: string | number, tshirtSize: string}> = []
      const seenPlayers = new Set<string>() // Pour éviter les doublons
      
      console.log(`📊 Traitement équipe: ${teamName}`)

      // 1. Récupérer les joueurs depuis teams.players
      if (team.players && Array.isArray(team.players) && team.players.length > 0) {
        team.players.forEach((player: any) => {
          const nickname = player.nickname || `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'N/A'
          const number = player.jerseyNumber || player.number || 'N/A'
          const key = `${nickname}_${number}`
          
          if (!seenPlayers.has(key)) {
            seenPlayers.add(key)
            teamPlayers.push({
              nickname,
              number,
              tshirtSize: player.tshirtSize || 'N/A'
            })
          }
        })
      }

      // 2. Récupérer les joueurs depuis la collection players
      allPlayers
        .filter((player: any) => player.teamId === team.id || player.teamName === team.name)
        .forEach((player: any) => {
          const nickname = player.nickname || `${player.firstName || ''} ${player.lastName || ''}`.trim() || 'N/A'
          const number = player.jerseyNumber || player.number || 'N/A'
          const key = `${nickname}_${number}`
          
          if (!seenPlayers.has(key)) {
            seenPlayers.add(key)
            teamPlayers.push({
              nickname,
              number,
              tshirtSize: player.tshirtSize || 'N/A'
            })
          }
        })

      // 3. Récupérer les joueurs depuis playerAccounts
      allPlayerAccounts
        .filter((account: any) => account.teamId === team.id || account.teamName === team.name)
        .forEach((account: any) => {
          const nickname = account.nickname || `${account.firstName || ''} ${account.lastName || ''}`.trim() || 'N/A'
          const number = account.jerseyNumber || account.number || 'N/A'
          const key = `${nickname}_${number}`
          
          if (!seenPlayers.has(key)) {
            seenPlayers.add(key)
            teamPlayers.push({
              nickname,
              number,
              tshirtSize: account.tshirtSize || 'N/A'
            })
          }
        })

      // Trier par numéro
      teamPlayers.sort((a, b) => {
        const numA = typeof a.number === 'number' ? a.number : (typeof a.number === 'string' ? parseInt(a.number) || 999 : 999)
        const numB = typeof b.number === 'number' ? b.number : (typeof b.number === 'string' ? parseInt(b.number) || 999 : 999)
        return numA - numB
      })

      // Créer les données pour la feuille
      const sheetData = [
        ['Nickname', 'Number', 'Tshirt Size'], // Headers in English
        ...teamPlayers.map(player => [
          player.nickname,
          player.number,
          player.tshirtSize
        ])
      ]

      // Si aucune donnée, ajouter une ligne vide
      if (teamPlayers.length === 0) {
        sheetData.push(['No players', '', ''])
      }

      // Créer la feuille
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData)

      // Définir la largeur des colonnes
      worksheet['!cols'] = [
        { wch: 25 }, // Surnom
        { wch: 10 }, // Numéro
        { wch: 15 }  // Taille T-shirt
      ]

      // Nettoyer le nom de la feuille (supprimer les caractères invalides pour Excel)
      let sheetName = teamName
        .replace(/[\\\/\?\*\[\]:]/g, '_') // Remplacer les caractères invalides
        .trim()
      
      // Limiter à 31 caractères pour Excel
      if (sheetName.length > 31) {
        sheetName = sheetName.substring(0, 31)
      }
      
      // S'assurer qu'il y a un nom
      if (!sheetName || sheetName.length === 0) {
        sheetName = `Equipe_${team.id.substring(0, 20)}`
      }

      console.log(`📊 Feuille créée: ${sheetName} avec ${teamPlayers.length} joueurs`)

      // Ajouter la feuille au workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
    }

    console.log(`📊 Total de ${workbook.SheetNames.length} feuilles créées:`, workbook.SheetNames)

    // Vérifier qu'il y a au moins une feuille
    if (workbook.SheetNames.length === 0) {
      // Créer une feuille vide si aucune équipe
      const emptySheet = XLSX.utils.aoa_to_sheet([['Aucune équipe trouvée']])
      XLSX.utils.book_append_sheet(workbook, emptySheet, 'Aucune équipe')
    }

    // Générer le buffer Excel
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })
    
    console.log('📊 Export Excel terminé avec succès, taille du buffer:', excelBuffer.length, 'bytes')

    // Retourner le fichier
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="equipes_${new Date().toISOString().split('T')[0]}.xlsx"`
      }
    })
  } catch (error: any) {
    console.error('Erreur export équipes Excel:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'export', details: error.message },
      { status: 500 }
    )
  }
}

