/**
 * Script de vérification des templates d'emails
 * Vérifie que les nouveaux templates sont bien en place
 */

import * as fs from 'fs'

console.log('🔍 Vérification des templates d\'emails\n')

// Vérifier lib/email-service.ts
const emailService = fs.readFileSync('lib/email-service.ts', 'utf-8')

console.log('📧 lib/email-service.ts')
console.log('=' .repeat(60))

// Vérifier le sujet de l'email joueur
if (emailService.includes('subject: `Bienvenue dans ComeBac League`')) {
  console.log('✅ Sujet email joueur: OK')
} else {
  console.log('❌ Sujet email joueur: ANCIEN')
}

// Vérifier le sujet de l'email coach
if (emailService.includes('subject: `Bienvenue Coach - ComeBac League`')) {
  console.log('✅ Sujet email coach: OK')
} else {
  console.log('❌ Sujet email coach: ANCIEN')
}

// Vérifier le design moderne
if (emailService.includes('border-radius: 12px')) {
  console.log('✅ Design moderne (coins arrondis): OK')
} else {
  console.log('❌ Design moderne: ANCIEN')
}

// Vérifier les informations de contact
if (emailService.includes('WhatsApp: +33 6 34 05 13 84')) {
  console.log('✅ Contact WhatsApp: OK')
} else {
  console.log('❌ Contact WhatsApp: MANQUANT')
}

if (emailService.includes('Instagram: @comebac.league')) {
  console.log('✅ Contact Instagram: OK')
} else {
  console.log('❌ Contact Instagram: MANQUANT')
}

// Vérifier l'alerte d'expiration
if (emailService.includes('Ce lien expire dans 1 heure')) {
  console.log('✅ Alerte expiration 1h: OK')
} else {
  console.log('❌ Alerte expiration: MANQUANTE')
}

// Vérifier les instructions si lien expiré
if (emailService.includes('Lien expiré?')) {
  console.log('✅ Instructions lien expiré: OK')
} else {
  console.log('❌ Instructions lien expiré: MANQUANTES')
}

console.log('\n📱 components/dashboard/tabs/maintenance-tab.tsx')
console.log('=' .repeat(60))

// Vérifier le bouton de prévisualisation
const maintenanceTab = fs.readFileSync('components/dashboard/tabs/maintenance-tab.tsx', 'utf-8')

if (maintenanceTab.includes('Prévisualiser emails')) {
  console.log('✅ Bouton "Prévisualiser emails": OK')
} else {
  console.log('❌ Bouton "Prévisualiser emails": MANQUANT')
}

if (maintenanceTab.includes('/admin/email-preview')) {
  console.log('✅ Lien vers page de prévisualisation: OK')
} else {
  console.log('❌ Lien vers page de prévisualisation: MANQUANT')
}

console.log('\n🎨 app/admin/email-preview/page.tsx')
console.log('=' .repeat(60))

// Vérifier la page de prévisualisation
const emailPreview = fs.readFileSync('app/admin/email-preview/page.tsx', 'utf-8')

if (emailPreview.includes('Templates d\'Emails')) {
  console.log('✅ Titre moderne: OK')
} else {
  console.log('❌ Titre moderne: ANCIEN')
}

if (emailPreview.includes('Email Joueur') && emailPreview.includes('Email Coach')) {
  console.log('✅ Boutons de bascule: OK')
} else {
  console.log('❌ Boutons de bascule: ANCIENS')
}

console.log('\n📊 RÉSULTAT FINAL')
console.log('=' .repeat(60))

const checks = [
  emailService.includes('subject: `Bienvenue dans ComeBac League`'),
  emailService.includes('subject: `Bienvenue Coach - ComeBac League`'),
  emailService.includes('border-radius: 12px'),
  emailService.includes('WhatsApp: +33 6 34 05 13 84'),
  emailService.includes('Instagram: @comebac.league'),
  emailService.includes('Ce lien expire dans 1 heure'),
  emailService.includes('Lien expiré?'),
  maintenanceTab.includes('Prévisualiser emails'),
  maintenanceTab.includes('/admin/email-preview'),
  emailPreview.includes('Templates d\'Emails')
]

const passed = checks.filter(c => c).length
const total = checks.length

if (passed === total) {
  console.log(`✅ TOUS LES TESTS PASSÉS (${passed}/${total})`)
  console.log('\n🎉 Les nouveaux templates sont bien en place!')
  console.log('\n💡 Si vous ne les voyez pas dans le navigateur:')
  console.log('   1. Videz le cache du navigateur (Cmd+Shift+R sur Mac)')
  console.log('   2. Redémarrez le serveur de développement')
  console.log('   3. Allez sur: /admin/email-preview')
} else {
  console.log(`⚠️ CERTAINS TESTS ONT ÉCHOUÉ (${passed}/${total})`)
  console.log('\n❌ Certains changements ne sont pas appliqués')
}
