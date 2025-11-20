#!/usr/bin/env tsx

/**
 * Script pour tester l'envoi de l'email admin lors d'une inscription d'équipe.
 *
 * Usage:
 *   npx tsx scripts/test-team-registration-email.ts
 *
 * Optionnellement, définir TEST_APP_URL pour cibler un autre serveur (ex: production).
 */

import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(process.cwd(), '.env.local') })

const baseUrl = process.env.TEST_APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

async function testNotification() {
  console.log('🚀 Test de notification admin pour une nouvelle inscription d\'équipe')
  console.log(`🌐 Cible: ${baseUrl}/api/notify-admin`)
  console.log('─'.repeat(60))

  const testPayload = {
    teamName: 'Équipe Test Automation',
    schoolName: 'Lycée de Test',
    captainName: 'Alice Testeur',
    captainEmail: 'captain.test@example.com',
    playersCount: 10,
  }

  try {
    const response = await fetch(`${baseUrl}/api/notify-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload),
    })

    const data = await response.json().catch(() => ({}))

    if (response.ok) {
      console.log('✅ Requête acceptée par le serveur.')
      console.log('ℹ️  Détails:', data)
      console.log('\n📬 Vérifiez la boîte mail admin pour confirmer la réception.')
    } else {
      console.error('❌ Le serveur a renvoyé une erreur.')
      console.error('Status:', response.status, response.statusText)
      console.error('Réponse:', data)
    }
  } catch (error) {
    console.error('💥 Erreur lors de l\'appel API:', error)
    console.error('💡 Assurez-vous que `npm run dev` tourne et que TEST_APP_URL est correct.')
  }
}

testNotification()

