import { execSync } from 'child_process'

async function setupTestData() {
  console.log('🚀 Configuration des données de test...')
  console.log('')
  
  try {
    console.log('📝 Étape 1: Génération des résultats de matchs')
    execSync('npx tsx scripts/generate-match-results.ts', { stdio: 'inherit' })
    
    console.log('')
    console.log('📊 Étape 2: Mise à jour des statistiques des équipes')
    execSync('npx tsx scripts/update-team-stats.ts', { stdio: 'inherit' })
    
    console.log('')
    console.log('🎉 Configuration terminée!')
    console.log('')
    console.log('✅ Vous pouvez maintenant tester:')
    console.log('   • Page d\'accueil avec les matchs et scores')
    console.log('   • Popup des détails de match (buts, passes, cartons)')
    console.log('   • Page des statistiques avec classement')
    console.log('   • Page du calendrier des matchs')
    console.log('')
    
  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error)
  }
}

setupTestData()