#!/usr/bin/env node

/**
 * Script pour envoyer un email à Alex Mario Shossary
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), '.env.local') })

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

async function main() {
  const playerEmail = 'alexmarioshossary@gmail.com'
  
  console.log('🚀 Envoi d\'email à Alex Mario Shossary')
  console.log('=' .repeat(60))
  console.log(`Email: ${playerEmail}`)
  console.log()

  try {
    // D'abord, chercher les infos du joueur
    console.log('🔍 Recherche des informations du joueur...')
    
    const response = await fetch(`${API_URL}/api/admin/resend-player-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        emails: [playerEmail]
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Erreur lors de la requête')
    }

    const data = await response.json()
    
    console.log('✅ Résultat:')
    console.log(JSON.stringify(data, null, 2))

  } catch (error: any) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  }
}

main()
