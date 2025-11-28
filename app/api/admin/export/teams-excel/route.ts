import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import * as XLSX from 'xlsx'

// Mapping des colonnes avec leurs labels et fonctions d'extraction
const columnDefinitions: Record<string, { label: string, extract: (player: any) => any }> = {
  nickname: {
    label: 'Surnom',
    extract: (p: any) => p.nickname || 'N/A'
  },
  fullName: {
    label: 'Nom complet',
    extract: (p: any) => {
      const firstName = p.firstName || ''
      const lastName = p.lastName || ''
      return `${firstName} ${lastName}`.trim() || 'N/A'
    }
  },
  number: {
    label: 'Numéro',
    extract: (p: any) => p.jerseyNumber || p.number || 'N/A'
  },
  tshirtSize: {
    label: 'Taille T-shirt',
    extract: (p: any) => p.tshirtSize || 'N/A'
  },
  email: {
    label: 'Email',
    extract: (p: any) => p.email || 'N/A'
  },
  phone: {
    label: 'Téléphone',
    extract: (p: any) => p.phone || p.phoneNumber || 'N/A'
  },
  position: {
    label: 'Position',
    extract: (p: any) => p.position || 'N/A'
  },
  height: {
    label: 'Taille (cm)',
    extract: (p: any) => p.height || p.heightCm || 'N/A'
  },
  birthDate: {
    label: 'Date de naissance',
    extract: (p: any) => {
      if (p.birthDate) {
        if (p.birthDate.toDate) {
          return p.birthDate.toDate().toLocaleDateString('fr-FR')
        }
        if (typeof p.birthDate === 'string') {
          return p.birthDate
        }
      }
      return 'N/A'
    }
  },
  teamName: {
    label: 'Équipe',
    extract: (p: any) => p.teamName || 'N/A'
  },
  grade: {
    label: 'Classe',
    extract: (p: any) => p.grade || p.class || 'N/A'
  },
  foot: {
    label: 'Pied fort',
    extract: (p: any) => p.foot || p.preferredFoot || 'N/A'
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId') // Support ancien format
    const teamIdsParam = searchParams.get('teamIds') // Nouveau format avec plusieurs IDs
    const columnsParam = searchParams.get('columns') // Colonnes sélectionnées
    
    // Déterminer les IDs d'équipes à exporter
    let selectedTeamIds: string[] = []
    if (teamIdsParam) {
      selectedTeamIds = teamIdsParam.split(',').filter(id => id.trim().length > 0)
    } else if (teamId) {
      selectedTeamIds = [teamId]
    }
    
    // Déterminer les colonnes à exporter
    let selectedColumns: string[] = []
    if (columnsParam) {
      selectedColumns = columnsParam.split(',').filter(col => col.trim().length > 0 && columnDefinitions[col.trim()])
    } else {
      // Par défaut: nickname, number, tshirtSize
      selectedColumns = ['nickname', 'number', 'tshirtSize']
    }
    
    if (selectedColumns.length === 0) {
      return NextResponse.json(
        { error: 'Aucune colonne valide sélectionnée' },
        { status: 400 }
      )
    }
    
    console.log('📊 Début export Excel équipes...', selectedTeamIds.length > 0 ? `pour ${selectedTeamIds.length} équipe(s)` : 'toutes les équipes')
    console.log('📊 Colonnes sélectionnées:', selectedColumns)
    
    // Récupérer toutes les équipes, joueurs et playerAccounts en une seule fois
    const [teamsSnap, playersSnap, playerAccountsSnap] = await Promise.all([
      getDocs(collection(db, 'teams')),
      getDocs(collection(db, 'players')),
      getDocs(collection(db, 'playerAccounts'))
    ])

    let teams = teamsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[]

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
    })) as any[]

    const allPlayerAccounts = playerAccountsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[]

    console.log(`📊 ${teams.length} équipe(s) trouvée(s)`)
    console.log(`📊 ${allPlayers.length} joueurs trouvés`)
    console.log(`📊 ${allPlayerAccounts.length} comptes joueurs trouvés`)

    // Créer un Set des emails valides depuis playerAccounts (joueurs actifs/non supprimés)
    // C'est la source de vérité : si un joueur n'est pas dans playerAccounts, il est supprimé
    const validPlayerEmails = new Set<string>()
    const validPlayerKeys = new Set<string>() // Pour les joueurs sans email
    
    allPlayerAccounts.forEach((account: any) => {
      const email = (account.email || '').toLowerCase().trim()
      if (email) {
        validPlayerEmails.add(email)
      } else {
        // Pour les joueurs sans email, utiliser firstName+lastName+number comme clé
        const nameKey = `${(account.firstName || '').toLowerCase()}_${(account.lastName || '').toLowerCase()}_${account.jerseyNumber || account.number || ''}`
        if (nameKey !== '__') {
          validPlayerKeys.add(nameKey)
        }
      }
    })
    
    console.log(`📊 ${validPlayerEmails.size} joueurs actifs avec email`)
    console.log(`📊 ${validPlayerKeys.size} joueurs actifs sans email`)

    // Créer un nouveau workbook
    const workbook = XLSX.utils.book_new()

    // Pour chaque équipe, créer une feuille
    for (const team of teams) {
      const teamName = team.name || `Equipe_${team.id}`
      const teamPlayersMap = new Map<string, any>() // Utiliser email comme clé unique
      
      console.log(`📊 Traitement équipe: ${teamName}`)

      // Fonction pour fusionner les données d'un joueur
      const mergePlayerData = (existing: any, newData: any) => {
        if (!existing) return { ...newData, teamName: teamName }
        
        // Fusionner les données, en gardant les valeurs existantes si elles sont meilleures
        const merged = { ...existing }
        Object.keys(newData).forEach(key => {
          if (newData[key] && newData[key] !== 'N/A' && (!merged[key] || merged[key] === 'N/A')) {
            merged[key] = newData[key]
          }
        })
        merged.teamName = teamName
        return merged
      }

      // PRIORITÉ 1: Récupérer les joueurs depuis playerAccounts (source de vérité)
      // Seuls les joueurs dans playerAccounts sont considérés comme actifs
      allPlayerAccounts
        .filter((account: any) => {
          // Filtrer par équipe
          const matchesTeam = account.teamId === team.id || account.teamName === team.name
          // Exclure les joueurs avec status 'inactive' si présent
          const isActive = account.status !== 'inactive'
          return matchesTeam && isActive
        })
        .forEach((account: any) => {
          const email = (account.email || '').toLowerCase().trim()
          if (!email) {
            // Si pas d'email, utiliser firstName+lastName+number comme clé de secours
            const nameKey = `${(account.firstName || '').toLowerCase()}_${(account.lastName || '').toLowerCase()}_${account.jerseyNumber || account.number || ''}`
            if (nameKey !== '__') {
              const existing = teamPlayersMap.get(nameKey)
              teamPlayersMap.set(nameKey, mergePlayerData(existing, account))
            }
            return
          }
          
          const existing = teamPlayersMap.get(email)
          teamPlayersMap.set(email, mergePlayerData(existing, account))
        })

      // PRIORITÉ 2: Compléter avec les joueurs depuis teams.players
      // MAIS seulement s'ils existent dans playerAccounts (joueurs actifs)
      if (team.players && Array.isArray(team.players) && team.players.length > 0) {
        team.players.forEach((player: any) => {
          const email = (player.email || '').toLowerCase().trim()
          if (!email) {
            const nameKey = `${(player.firstName || '').toLowerCase()}_${(player.lastName || '').toLowerCase()}_${player.jerseyNumber || player.number || ''}`
            // Vérifier que le joueur existe dans playerAccounts (actif)
            if (nameKey !== '__' && validPlayerKeys.has(nameKey)) {
              // Ne l'ajouter que s'il n'est pas déjà dans la map (pour éviter les doublons)
              if (!teamPlayersMap.has(nameKey)) {
                const existing = teamPlayersMap.get(nameKey)
                teamPlayersMap.set(nameKey, mergePlayerData(existing, player))
              }
            }
            return
          }
          
          // Vérifier que le joueur existe dans playerAccounts (actif)
          if (validPlayerEmails.has(email)) {
            // Ne l'ajouter que s'il n'est pas déjà dans la map (pour éviter les doublons)
            if (!teamPlayersMap.has(email)) {
              const existing = teamPlayersMap.get(email)
              teamPlayersMap.set(email, mergePlayerData(existing, player))
            }
          }
        })
      }

      // PRIORITÉ 3: Compléter avec la collection players
      // MAIS seulement s'ils existent dans playerAccounts (joueurs actifs)
      allPlayers
        .filter((player: any) => {
          const matchesTeam = (player.teamId === team.id || player.teamName === team.name)
          const email = (player.email || '').toLowerCase().trim()
          if (email) {
            return matchesTeam && validPlayerEmails.has(email)
          } else {
            const nameKey = `${(player.firstName || '').toLowerCase()}_${(player.lastName || '').toLowerCase()}_${player.jerseyNumber || player.number || ''}`
            return matchesTeam && nameKey !== '__' && validPlayerKeys.has(nameKey)
          }
        })
        .forEach((player: any) => {
          const email = (player.email || '').toLowerCase().trim()
          if (!email) {
            const nameKey = `${(player.firstName || '').toLowerCase()}_${(player.lastName || '').toLowerCase()}_${player.jerseyNumber || player.number || ''}`
            if (nameKey !== '__' && !teamPlayersMap.has(nameKey)) {
              const existing = teamPlayersMap.get(nameKey)
              teamPlayersMap.set(nameKey, mergePlayerData(existing, player))
            }
            return
          }
          
          // Ne l'ajouter que s'il n'est pas déjà dans la map
          if (!teamPlayersMap.has(email)) {
            const existing = teamPlayersMap.get(email)
            teamPlayersMap.set(email, mergePlayerData(existing, player))
          }
        })

      // Convertir la Map en Array
      const teamPlayers = Array.from(teamPlayersMap.values())

      // Trier par numéro si disponible
      teamPlayers.sort((a, b) => {
        const numA = a.jerseyNumber || a.number
        const numB = b.jerseyNumber || b.number
        const parsedA = typeof numA === 'number' ? numA : (typeof numA === 'string' ? parseInt(numA) || 999 : 999)
        const parsedB = typeof numB === 'number' ? numB : (typeof numB === 'string' ? parseInt(numB) || 999 : 999)
        return parsedA - parsedB
      })

      // Créer les headers selon les colonnes sélectionnées
      const headers = selectedColumns.map(col => columnDefinitions[col].label)
      
      // Créer les données pour la feuille
      const sheetData = [
        headers,
        ...teamPlayers.map(player => 
          selectedColumns.map(col => {
            const extractor = columnDefinitions[col].extract
            return extractor(player)
          })
        )
      ]

      // Si aucune donnée, ajouter une ligne vide
      if (teamPlayers.length === 0) {
        sheetData.push(selectedColumns.map(() => 'Aucun joueur'))
      }

      // Créer la feuille
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData)

      // Définir la largeur des colonnes dynamiquement
      worksheet['!cols'] = selectedColumns.map(col => {
        // Largeurs par défaut selon le type de colonne
        const widths: Record<string, number> = {
          nickname: 20,
          fullName: 25,
          number: 10,
          tshirtSize: 15,
          email: 30,
          phone: 15,
          position: 12,
          height: 12,
          birthDate: 15,
          teamName: 20,
          grade: 10,
          foot: 10
        }
        return { wch: widths[col] || 15 }
      })

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

