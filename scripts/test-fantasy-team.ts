/**
 * Script de test pour vérifier l'équipe Fantasy "YOUSSEF"
 * Teste l'affichage des joueurs, capitaine, formation, etc.
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables from .env.local
const envPath = join(process.cwd(), '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const envVars: Record<string, string> = {}

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    const key = match[1].trim()
    let value = match[2].trim()
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    envVars[key] = value
  }
})

// Initialize Firebase Admin
if (getApps().length === 0) {
  const projectId = envVars.FIREBASE_PROJECT_ID
  const clientEmail = envVars.FIREBASE_CLIENT_EMAIL
  const privateKey = envVars.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    console.error('❌ Variables d\'environnement Firebase manquantes!')
    console.error('Vérifiez que .env.local contient:')
    console.error('- FIREBASE_PROJECT_ID')
    console.error('- FIREBASE_CLIENT_EMAIL')
    console.error('- FIREBASE_PRIVATE_KEY')
    process.exit(1)
  }

  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey
    })
  })
}

const db = getFirestore()

interface TestResult {
  test: string
  passed: boolean
  message: string
  data?: any
}

const results: TestResult[] = []

function logTest(test: string, passed: boolean, message: string, data?: any) {
  results.push({ test, passed, message, data })
  const icon = passed ? '✅' : '❌'
  console.log(`${icon} ${test}: ${message}`)
  if (data) {
    console.log('   Data:', JSON.stringify(data, null, 2))
  }
}

async function testFantasyTeam() {
  console.log('\n🧪 TEST DE L\'ÉQUIPE FANTASY "YOUSSEF"\n')
  console.log('=' .repeat(60))

  try {
    // Test 1: Récupérer l'équipe "YOUSSEF"
    console.log('\n📋 Test 1: Récupération de l\'équipe depuis Firestore')
    const teamsSnapshot = await db.collection('fantasy_teams')
      .where('teamName', '==', 'YOUSSEF')
      .limit(1)
      .get()

    if (teamsSnapshot.empty) {
      logTest('Récupération équipe', false, 'Équipe "YOUSSEF" non trouvée dans Firestore')
      return
    }

    const teamDoc = teamsSnapshot.docs[0]
    const team = teamDoc.data()
    logTest('Récupération équipe', true, `Équipe trouvée avec ID: ${teamDoc.id}`)

    // Test 2: Vérifier les données de base
    console.log('\n📊 Test 2: Vérification des données de base')
    logTest('Nom équipe', team.teamName === 'YOUSSEF', `Nom: ${team.teamName}`)
    logTest('Formation', !!team.formation, `Formation: ${team.formation}`)
    logTest('Budget', typeof team.budget === 'number', `Budget: ${team.budget}M€`)
    logTest('Budget restant', typeof team.budgetRemaining === 'number', `Restant: ${team.budgetRemaining}M€`)
    logTest('Points totaux', typeof team.totalPoints === 'number', `Points: ${team.totalPoints}`)
    logTest('Capitaine', !!team.captainId, `Capitaine ID: ${team.captainId}`)

    // Test 3: Vérifier les joueurs
    console.log('\n👥 Test 3: Vérification des joueurs')
    const players = team.players || []
    logTest('Nombre de joueurs', players.length === 7, `${players.length} joueurs (attendu: 7)`)

    if (players.length > 0) {
      console.log('\n   Liste des joueurs:')
      
      // Récupérer les détails de chaque joueur
      const playerDetails = await Promise.all(
        players.map(async (p: any) => {
          try {
            const playerDoc = await db.collection('players').doc(p.playerId).get()
            if (playerDoc.exists) {
              const playerData = playerDoc.data()
              return {
                id: p.playerId,
                name: playerData?.name || 'Nom inconnu',
                position: p.position,
                price: p.price,
                isCaptain: p.isCaptain,
                points: p.points || 0
              }
            }
            return {
              id: p.playerId,
              name: '⚠️ Joueur non trouvé',
              position: p.position,
              price: p.price,
              isCaptain: p.isCaptain,
              points: p.points || 0
            }
          } catch (err) {
            return {
              id: p.playerId,
              name: '❌ Erreur',
              position: p.position,
              price: p.price,
              isCaptain: p.isCaptain,
              points: p.points || 0
            }
          }
        })
      )

      // Afficher chaque joueur
      playerDetails.forEach((player, index) => {
        const captainBadge = player.isCaptain ? '👑 ' : '   '
        console.log(`   ${captainBadge}${index + 1}. ${player.name} (${player.position}) - ${player.price}M€ - ${player.points} pts`)
      })

      // Test 4: Vérifier les positions
      console.log('\n⚽ Test 4: Vérification de la composition')
      const positionCounts = {
        Gardien: players.filter((p: any) => p.position === 'Gardien').length,
        Défenseur: players.filter((p: any) => p.position === 'Défenseur').length,
        Milieu: players.filter((p: any) => p.position === 'Milieu').length,
        Attaquant: players.filter((p: any) => p.position === 'Attaquant').length
      }

      console.log(`   Gardiens: ${positionCounts.Gardien}`)
      console.log(`   Défenseurs: ${positionCounts.Défenseur}`)
      console.log(`   Milieux: ${positionCounts.Milieu}`)
      console.log(`   Attaquants: ${positionCounts.Attaquant}`)

      logTest('Gardien', positionCounts.Gardien === 1, `${positionCounts.Gardien} gardien (attendu: 1)`)
      
      const totalFieldPlayers = positionCounts.Défenseur + positionCounts.Milieu + positionCounts.Attaquant
      logTest('Joueurs de champ', totalFieldPlayers === 6, `${totalFieldPlayers} joueurs de champ (attendu: 6)`)

      // Test 5: Vérifier le capitaine
      console.log('\n👑 Test 5: Vérification du capitaine')
      const captains = players.filter((p: any) => p.isCaptain)
      logTest('Un seul capitaine', captains.length === 1, `${captains.length} capitaine(s)`)
      
      if (captains.length === 1) {
        const captainPlayer = playerDetails.find(p => p.isCaptain)
        if (captainPlayer) {
          console.log(`   Capitaine: ${captainPlayer.name} (${captainPlayer.position})`)
          logTest('Capitaine trouvé', true, `${captainPlayer.name}`)
        }
      }

      // Test 6: Vérifier que tous les noms sont affichés
      console.log('\n📝 Test 6: Vérification des noms de joueurs')
      const missingNames = playerDetails.filter(p => p.name === 'Nom inconnu' || p.name === '⚠️ Joueur non trouvé' || p.name === '❌ Erreur')
      logTest('Tous les noms affichés', missingNames.length === 0, 
        missingNames.length === 0 
          ? 'Tous les joueurs ont un nom' 
          : `${missingNames.length} joueur(s) sans nom`)

      if (missingNames.length > 0) {
        console.log('   ⚠️ Joueurs problématiques:')
        missingNames.forEach(p => {
          console.log(`      - ID: ${p.id}, Position: ${p.position}`)
        })
      }

      // Test 7: Vérifier le budget
      console.log('\n💰 Test 7: Vérification du budget')
      const totalCost = players.reduce((sum: number, p: any) => sum + (p.price || 0), 0)
      const budgetUsed = team.budget - team.budgetRemaining
      
      console.log(`   Budget initial: ${team.budget}M€`)
      console.log(`   Coût total joueurs: ${totalCost.toFixed(1)}M€`)
      console.log(`   Budget utilisé (calculé): ${budgetUsed.toFixed(1)}M€`)
      console.log(`   Budget restant: ${team.budgetRemaining.toFixed(1)}M€`)
      
      logTest('Budget cohérent', Math.abs(totalCost - budgetUsed) < 0.1, 
        `Différence: ${Math.abs(totalCost - budgetUsed).toFixed(2)}M€`)
      logTest('Budget respecté', totalCost <= team.budget, 
        totalCost <= team.budget ? 'Budget respecté' : 'Budget dépassé!')

    }

    // Test 8: Vérifier les timestamps
    console.log('\n🕐 Test 8: Vérification des timestamps')
    logTest('Date création', !!team.createdAt, team.createdAt ? `Créé le: ${new Date(team.createdAt.seconds * 1000).toLocaleString('fr-FR')}` : 'Pas de date')
    logTest('Date mise à jour', !!team.updatedAt, team.updatedAt ? `MAJ le: ${new Date(team.updatedAt.seconds * 1000).toLocaleString('fr-FR')}` : 'Pas de date')

    // Test 9: Vérifier les stats Fantasy
    console.log('\n📈 Test 9: Vérification des stats Fantasy')
    logTest('Rang', typeof team.rank === 'number', `Rang: ${team.rank || 'Non classé'}`)
    logTest('Rang hebdo', typeof team.weeklyRank === 'number', `Rang hebdo: ${team.weeklyRank || 'Non classé'}`)
    logTest('Transferts', typeof team.transfers === 'number', `Transferts: ${team.transfers || 0}`)
    logTest('Wildcard', typeof team.wildcardUsed === 'boolean', `Wildcard utilisé: ${team.wildcardUsed ? 'Oui' : 'Non'}`)

  } catch (error) {
    console.error('\n❌ ERREUR LORS DES TESTS:', error)
    logTest('Exécution tests', false, `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
  }

  // Résumé
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 RÉSUMÉ DES TESTS\n')
  
  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length

  console.log(`✅ Tests réussis: ${passed}/${total}`)
  console.log(`❌ Tests échoués: ${failed}/${total}`)
  console.log(`📈 Taux de réussite: ${((passed / total) * 100).toFixed(1)}%`)

  if (failed > 0) {
    console.log('\n❌ Tests échoués:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.test}: ${r.message}`)
    })
  }

  console.log('\n' + '='.repeat(60))
  
  if (failed === 0) {
    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS! L\'équipe Fantasy fonctionne parfaitement!\n')
    process.exit(0)
  } else {
    console.log('\n⚠️ Certains tests ont échoué. Vérifiez les détails ci-dessus.\n')
    process.exit(1)
  }
}

// Exécuter les tests
testFantasyTeam()
