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

async function fixIbraheemPrimeOnly() {
  console.log('🔧 Nettoyage de Ibraheem / Ibrahim El Zomor pour qu’il soit UNIQUEMENT dans Prime...\n')

  const primeTeamId = '78SNvdRXVTI2tcgdkEfO'
  const primeTeamName = 'Prime'
  const emailMain = 'ibrahimelzomor11@gmail.com'
  const emailAlt = 'ebrahemelzomor11@gmail.com'

  // 1. Corriger / fusionner les playerAccounts
  console.log('📋 1. playerAccounts')
  const paSnap = await db.collection('playerAccounts').get()
  const paDocs = paSnap.docs.filter(doc => {
    const d = doc.data()
    const email = (d.email || '').toLowerCase()
    const fullName = `${(d.firstName || '').toLowerCase()} ${(d.lastName || '').toLowerCase()}`.trim()
    return email.includes('elzomor') || fullName.includes('elzomor')
  })

  if (paDocs.length === 0) {
    console.log('   ❌ Aucun playerAccount trouvé\n')
  } else {
    let keptId: string | null = null
    for (const doc of paDocs) {
      const d = doc.data()
      const email = (d.email || '').toLowerCase()
      const fullName = `${d.firstName || ''} ${d.lastName || ''}`.trim()
      console.log(`   📝 ${fullName} (${d.email || 'N/A'}) [${doc.id}]`)

      if (!keptId && (email === emailMain || email === emailAlt)) {
        // On garde ce doc comme référence et on le met sur Prime proprement
        keptId = doc.id
        console.log('      👉 Gardé comme compte principal')
        await doc.ref.update({
          email: emailMain,
          firstName: d.firstName || 'Ibrahim',
          lastName: d.lastName || 'Elzomor',
          teamId: primeTeamId,
          teamName: primeTeamName
        })
        console.log('      ✅ Mis à jour sur Prime (playerAccounts)')
      } else if (keptId && doc.id !== keptId) {
        console.log('      🗑️  Suppression du doublon dans playerAccounts')
        await doc.ref.delete()
      }
    }
    console.log('')
  }

  // 2. Nettoyer teams.players pour ne le garder que dans Prime
  console.log('📋 2. teams.players')
  const teamsSnap = await db.collection('teams').get()
  for (const teamDoc of teamsSnap.docs) {
    const team = teamDoc.data()
    const players = team.players || []
    const beforeCount = players.length

    const filtered = players.filter((p: any) => {
      const email = (p.email || '').toLowerCase()
      const isElzomor =
        email.includes('elzomor') ||
        `${(p.firstName || '').toLowerCase()} ${(p.lastName || '').toLowerCase()}`.includes('elzomor')

      if (!isElzomor) return true

      // On garde seulement si c'est Prime
      const keepHere = teamDoc.id === primeTeamId
      if (!keepHere) {
        console.log(`   🗑️  Suppression depuis équipe ${team.name} (${teamDoc.id}) : ${p.firstName} ${p.lastName} (${p.email || 'N/A'})`)
      } else {
        // Normaliser email principal dans Prime
        p.email = emailMain
      }
      return keepHere
    })

    if (filtered.length !== beforeCount) {
      await teamDoc.ref.update({ players: filtered })
      console.log(`   ✅ Mise à jour de l’équipe ${team.name} (${teamDoc.id})`)
    }
  }
  console.log('')

  // 3. Nettoyer teamRegistrations.players pour ne le garder que dans Prime
  console.log('📋 3. teamRegistrations.players')
  const regSnap = await db.collection('teamRegistrations').get()
  for (const regDoc of regSnap.docs) {
    const reg = regDoc.data()
    const players = reg.players || []
    const beforeCount = players.length

    const filtered = players.filter((p: any) => {
      const email = (p.email || '').toLowerCase()
      const isElzomor =
        email.includes('elzomor') ||
        `${(p.firstName || '').toLowerCase()} ${(p.lastName || '').toLowerCase()}`.toLowerCase().includes('elzomor')

      if (!isElzomor) return true

      const keepHere = reg.teamId === primeTeamId || reg.teamName === primeTeamName
      if (!keepHere) {
        console.log(`   🗑️  Suppression depuis inscription ${reg.teamName || 'N/A'} (${regDoc.id}) : ${p.firstName} ${p.lastName} (${p.email || 'N/A'})`)
      } else {
        // Normaliser
        p.email = emailMain
      }
      return keepHere
    })

    if (filtered.length !== beforeCount) {
      await regDoc.ref.update({ players: filtered })
      console.log(`   ✅ Mise à jour de l’inscription ${reg.teamName || 'N/A'} (${regDoc.id})`)
    }
  }

  console.log('\n✅ Nettoyage terminé. Ibraheem / Ibrahim El Zomor ne doit plus apparaître que dans Prime.')
}

fixIbraheemPrimeOnly()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })


