#!/usr/bin/env node

/**
 * Script pour supprimer complètement une équipe
 * 
 * Usage:
 *   npm run delete-team
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import * as readline from 'readline'

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), '.env.local') })

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve))
}

async function main() {
  console.log('🗑️  Script de suppression complète d\'équipe')
  console.log('=' .repeat(60))
  console.log()

  try {
    // Récupérer la liste des équipes
    console.log('📋 Récupération de la liste des équipes...')
    const response = await fetch(`${API_URL}/api/admin/teams`)
    
    if (!response.ok) {
      throw new Error('Impossible de récupérer les équipes')
    }

    const teams = await response.json()

    if (teams.length === 0) {
      console.log('❌ Aucune équipe trouvée')
      rl.close()
      return
    }

    console.log()
    console.log('Équipes disponibles:')
    console.log('─'.repeat(60))
    teams.forEach((team: any, index: number) => {
      console.log(`${index + 1}. ${team.name} (ID: ${team.id})`)
    })
    console.log()

    const teamIndex = await question('Entrez le numéro de l\'équipe à supprimer (ou 0 pour annuler): ')
    const index = parseInt(teamIndex) - 1

    if (index < 0 || index >= teams.length) {
      console.log('❌ Annulé')
      rl.close()
      return
    }

    const selectedTeam = teams[index]
    console.log()
    console.log('⚠️  ATTENTION: Vous allez supprimer COMPLÈTEMENT:')
    console.log(`   Équipe: ${selectedTeam.name}`)
    console.log(`   ID: ${selectedTeam.id}`)
    console.log()
    console.log('Cela supprimera DÉFINITIVEMENT:')
    console.log('   ✅ Tous les joueurs de l\'équipe')
    console.log('   ✅ Tous les coaches de l\'équipe')
    console.log('   ✅ Tous les comptes Firebase Auth (joueurs + coaches)')
    console.log('   ✅ Tous les matchs de l\'équipe')
    console.log('   ✅ Toutes les statistiques')
    console.log('   ✅ Tous les résultats')
    console.log('   ✅ Toutes les compositions')
    console.log('   ✅ Tous les favoris')
    console.log()
    console.log('⚠️  Cette action est IRRÉVERSIBLE!')
    console.log()

    const confirmation1 = await question('Tapez "SUPPRIMER" en majuscules pour confirmer: ')
    
    if (confirmation1 !== 'SUPPRIMER') {
      console.log('❌ Annulé')
      rl.close()
      return
    }

    const confirmation2 = await question(`Tapez le nom de l'équipe "${selectedTeam.name}" pour confirmer: `)
    
    if (confirmation2 !== selectedTeam.name) {
      console.log('❌ Le nom ne correspond pas. Annulé.')
      rl.close()
      return
    }

    console.log()
    console.log('🗑️  Suppression en cours...')
    console.log()

    const deleteResponse = await fetch(`${API_URL}/api/admin/delete-team-complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        teamId: selectedTeam.id,
        teamName: selectedTeam.name
      })
    })

    if (!deleteResponse.ok) {
      const error = await deleteResponse.json()
      throw new Error(error.error || 'Erreur lors de la suppression')
    }

    const result = await deleteResponse.json()
    const report = result.report

    console.log('✅ Suppression terminée!')
    console.log()
    console.log('📊 Résumé de la suppression:')
    console.log('─'.repeat(60))
    console.log(`Équipe: ${report.teamName}`)
    console.log()
    console.log('Éléments supprimés:')
    console.log(`  👥 Joueurs: ${report.players.length}`)
    report.players.forEach((player: any) => {
      console.log(`     - ${player.name} (${player.email})`)
    })
    console.log()
    console.log(`  🏆 Coaches: ${report.coaches.length}`)
    report.coaches.forEach((coach: any) => {
      console.log(`     - ${coach.name} (${coach.email})`)
    })
    console.log()
    console.log(`  🔐 Comptes Firebase: ${report.firebaseAccounts.length}`)
    report.firebaseAccounts.forEach((account: any) => {
      console.log(`     - ${account.email} (${account.type})`)
    })
    console.log()
    console.log(`  📊 Statistiques: ${report.statistics}`)
    console.log(`  ⚽ Matchs: ${report.matches}`)
    console.log(`  📈 Résultats: ${report.results}`)
    console.log(`  📝 Compositions: ${report.lineups}`)
    console.log(`  ⭐ Favoris: ${report.favorites}`)

    if (report.errors.length > 0) {
      console.log()
      console.log(`⚠️  Erreurs rencontrées: ${report.errors.length}`)
      report.errors.forEach((error: any) => {
        console.log(`   - ${error.type}: ${error.error}`)
      })
    }

    console.log()
    console.log('=' .repeat(60))
    console.log('✅ Suppression complète terminée avec succès!')

  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  } finally {
    rl.close()
  }
}

main()
