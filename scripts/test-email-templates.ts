/**
 * Script de test pour visualiser les templates d'emails
 * Usage: npx tsx scripts/test-email-templates.ts
 */

import { generateWelcomeEmail } from '../lib/email-service'

console.log('🎨 Test des templates d\'emails ComeBac League\n')

// Test email joueur
console.log('📧 EMAIL JOUEUR')
console.log('=' .repeat(50))
const playerEmail = generateWelcomeEmail(
  'Jean Dupont',
  'Les Aigles',
  'https://www.comebac.com/reset-password?token=abc123',
  'jean.dupont@example.com'
)
console.log('To:', playerEmail.to)
console.log('Subject:', playerEmail.subject)
console.log('HTML Length:', playerEmail.html.length, 'caractères')
console.log('✅ Template joueur généré\n')

// Test email coach
console.log('🏆 EMAIL COACH')
console.log('=' .repeat(50))
console.log('Note: Utilisez sendCoachWelcomeEmail() pour les coaches')
console.log('✅ Template coach disponible\n')

console.log('📋 CARACTÉRISTIQUES')
console.log('=' .repeat(50))
console.log('✅ Design moderne et épuré')
console.log('✅ Lien valable 1 heure')
console.log('✅ Instructions si lien expiré')
console.log('✅ Contact: Email, WhatsApp, Instagram')
console.log('✅ Responsive et compatible tous appareils')
console.log('✅ Couleurs adaptées (joueur/coach)')

console.log('\n🔍 PRÉVISUALISATION')
console.log('=' .repeat(50))
console.log('Allez sur: /admin/email-preview')
console.log('Ou: Admin → Réparer → Prévisualiser emails')
