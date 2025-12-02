import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

config({ path: resolve(process.cwd(), '.env.local') })

if (getApps().length === 0) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  }

  initializeApp({
    credential: cert(serviceAccount)
  })
}

const db = getFirestore()

async function checkIbraheemElzomor() {
  console.log('🔍 Vérification complète de Ibraheem / Ibrahim El Zomor...\n')

  const emailVariants = [
    'ebrahemelzomor11@gmail.com',
    'ibrahimelzomor',
    'ibraheemelzomor',
    'elzomor'
  ]
  const nameParts = ['ibrahim', 'ibraheem', 'ebrahem', 'el', 'zomor', 'elzomor']

  // 1. playerAccounts
  console.log('📋 1. playerAccounts:')
  const paSnap = await db.collection('playerAccounts').get()
  const paMatches = paSnap.docs.filter(doc => {
    const d = doc.data()
    const fullName = `${(d.firstName || '').toLowerCase()} ${(d.lastName || '').toLowerCase()}`.trim()
    const email = (d.email || '').toLowerCase()
    const matchesEmail = emailVariants.some(v => email.includes(v.toLowerCase()))
    const matchesName = nameParts.every(p => fullName.includes(p) || fullName.includes(p.replace(' ', '')))
    const containsElzomor = fullName.includes('zomor') || fullName.includes('elzomor')
    return matchesEmail || containsElzomor || matchesName
  })

  if (paMatches.length === 0) {
    console.log('   ❌ Aucun joueur trouvé dans playerAccounts\n')
  } else {
    paMatches.forEach(doc => {
      const d = doc.data()
      console.log(`   📝 PlayerAccount (ID: ${doc.id}):`)
      console.log(`      Nom: ${d.firstName} ${d.lastName}`)
      console.log(`      Email: ${d.email || 'N/A'}`)
      console.log(`      teamName: ${d.teamName || 'N/A'}`)
      console.log(`      teamId: ${d.teamId || 'N/A'}`)
      console.log('')
    })
  }

  // 2. teams.players
  console.log('📋 2. teams.players:')
  const teamsSnap = await db.collection('teams').get()
  let teamsWithPlayer = 0
  teamsSnap.docs.forEach(teamDoc => {
    const team = teamDoc.data()
    const players = team.players || []
    const hasPlayer = players.some((p: any) => {
      const fullName = `${(p.firstName || '').toLowerCase()} ${(p.lastName || '').toLowerCase()}`.trim()
      const email = (p.email || '').toLowerCase()
      return emailVariants.some(v => email.includes(v.toLowerCase())) ||
             fullName.includes('zomor') || fullName.includes('elzomor')
    })
    if (hasPlayer) {
      teamsWithPlayer++
      console.log(`   🏟️  Équipe: ${team.name} (ID: ${teamDoc.id})`)
      players.forEach((p: any, idx: number) => {
        const fullName = `${(p.firstName || '').toLowerCase()} ${(p.lastName || '').toLowerCase()}`.trim()
        const email = (p.email || '').toLowerCase()
        if (
          emailVariants.some(v => email.includes(v.toLowerCase())) ||
          fullName.includes('zomor') || fullName.includes('elzomor')
        ) {
          console.log(`      -> Joueur #${idx + 1}: ${p.firstName} ${p.lastName} (${p.email || 'N/A'})`)
        }
      })
      console.log('')
    }
  })
  if (teamsWithPlayer === 0) {
    console.log('   ❌ Aucun joueur trouvé dans teams.players\n')
  }

  // 3. teamRegistrations.players
  console.log('📋 3. teamRegistrations.players:')
  const regSnap = await db.collection('teamRegistrations').get()
  let regsWithPlayer = 0
  regSnap.docs.forEach(regDoc => {
    const reg = regDoc.data()
    const players = reg.players || []
    const hasPlayer = players.some((p: any) => {
      const fullName = `${(p.firstName || '').toLowerCase()} ${(p.lastName || '').toLowerCase()}`.trim()
      const email = (p.email || '').toLowerCase()
      return emailVariants.some(v => email.includes(v.toLowerCase())) ||
             fullName.includes('zomor') || fullName.includes('elzomor')
    })
    if (hasPlayer) {
      regsWithPlayer++
      console.log(`   📄 Inscription: ${reg.teamName || 'N/A'} (ID: ${regDoc.id})`)
      players.forEach((p: any, idx: number) => {
        const fullName = `${(p.firstName || '').toLowerCase()} ${(p.lastName || '').toLowerCase()}`.trim()
        const email = (p.email || '').toLowerCase()
        if (
          emailVariants.some(v => email.includes(v.toLowerCase())) ||
          fullName.includes('zomor') || fullName.includes('elzomor')
        ) {
          console.log(`      -> Joueur #${idx + 1}: ${p.firstName} ${p.lastName} (${p.email || 'N/A'})`)
        }
      })
      console.log('')
    }
  })
  if (regsWithPlayer === 0) {
    console.log('   ❌ Aucun joueur trouvé dans teamRegistrations\n')
  }

  console.log('\n' + '='.repeat(60))
  console.log('✅ Vérification terminée')
  console.log('='.repeat(60) + '\n')
}

checkIbraheemElzomor()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })


