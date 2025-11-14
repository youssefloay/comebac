#!/usr/bin/env node

/**
 * Script pour envoyer des emails de rappel aux comptes jamais connectés
 * 
 * Usage:
 *   npm run send-never-logged-in-emails          # Mode dry-run (simulation)
 *   npm run send-never-logged-in-emails -- --send # Envoi réel des emails
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), '.env.local') })

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

async function main() {
  const args = process.argv.slice(2)
  const shouldSend = args.includes('--send')
  const dryRun = !shouldSend

  console.log('🚀 Script d\'envoi d\'emails aux comptes jamais connectés')
  console.log('=' .repeat(60))
  console.log(`Mode: ${dryRun ? '🔍 DRY RUN (simulation)' : '📧 ENVOI RÉEL'}`)
  console.log('=' .repeat(60))
  console.log()

  if (dryRun) {
    console.log('ℹ️  Mode simulation activé - aucun email ne sera envoyé')
    console.log('ℹ️  Pour envoyer les emails, utilisez: npm run send-never-logged-in-emails -- --send')
    console.log()
  }

  try {
    const response = await fetch(`${API_URL}/api/admin/send-never-logged-in-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dryRun })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur lors de la requête')
    }

    const data = await response.json()

    console.log(`✅ Traitement terminé`)
    console.log(`📊 Total de comptes jamais connectés: ${data.totalFound}`)
    console.log()

    if (data.results.length > 0) {
      console.log('📋 Résultats:')
      console.log('─'.repeat(60))
      
      const byStatus = data.results.reduce((acc: any, result: any) => {
        acc[result.status] = (acc[result.status] || 0) + 1
        return acc
      }, {})

      Object.entries(byStatus).forEach(([status, count]) => {
        const emoji = status === 'sent' ? '✅' : status === 'dry-run' ? '🔍' : '❌'
        console.log(`${emoji} ${status}: ${count}`)
      })

      console.log()
      console.log('📝 Détails:')
      console.log('─'.repeat(60))
      
      data.results.forEach((result: any, index: number) => {
        const emoji = result.type === 'coach' ? '🏆' : '⚽'
        const statusEmoji = result.status === 'sent' ? '✅' : result.status === 'dry-run' ? '🔍' : '❌'
        
        console.log(`${index + 1}. ${statusEmoji} ${emoji} ${result.name}`)
        console.log(`   Email: ${result.email}`)
        console.log(`   Équipe: ${result.teamName}`)
        console.log(`   Type: ${result.type}`)
        console.log(`   Créé le: ${new Date(result.createdAt).toLocaleDateString('fr-FR')}`)
        if (result.error) {
          console.log(`   ❌ Erreur: ${result.error}`)
        }
        console.log()
      })
    } else {
      console.log('✨ Aucun compte jamais connecté trouvé!')
    }

    if (dryRun && data.totalFound > 0) {
      console.log('=' .repeat(60))
      console.log('💡 Pour envoyer les emails, exécutez:')
      console.log('   npm run send-never-logged-in-emails -- --send')
      console.log('=' .repeat(60))
    }

  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  }
}

main()
