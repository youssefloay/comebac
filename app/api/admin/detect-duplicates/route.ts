import { NextRequest, NextResponse } from 'next/server'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'

// Fonction pour normaliser les noms (enlever accents, espaces, mettre en minuscule)
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
    .replace(/[^a-z0-9]/g, '') // Garder seulement lettres et chiffres
}

// Fonction pour calculer la similarité entre deux chaînes (Levenshtein distance simplifiée)
function similarity(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2
  const shorter = s1.length > s2.length ? s2 : s1
  
  if (longer.length === 0) return 1.0
  
  const editDistance = levenshteinDistance(longer, shorter)
  return (longer.length - editDistance) / longer.length
}

function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = []
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j
      } else if (j > 0) {
        let newValue = costs[j - 1]
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
        }
        costs[j - 1] = lastValue
        lastValue = newValue
      }
    }
    if (i > 0) costs[s2.length] = lastValue
  }
  return costs[s2.length]
}

export async function GET(request: NextRequest) {
  try {
    // Charger toutes les collections
    const [playersSnap, coachesSnap, usersSnap, profilesSnap, teamsSnap] = await Promise.all([
      getDocs(collection(db, 'playerAccounts')),
      getDocs(collection(db, 'coachAccounts')),
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'userProfiles')),
      getDocs(collection(db, 'teams'))
    ])

    console.log(`📦 Collections chargées:`)
    console.log(`   - playerAccounts: ${playersSnap.size} documents`)
    console.log(`   - coachAccounts: ${coachesSnap.size} documents`)
    console.log(`   - users: ${usersSnap.size} documents`)
    console.log(`   - userProfiles: ${profilesSnap.size} documents`)
    console.log(`   - teams: ${teamsSnap.size} documents`)

    // Créer une map des équipes
    const teamsMap = new Map()
    teamsSnap.docs.forEach(doc => {
      teamsMap.set(doc.id, doc.data().name)
    })

    // Créer une map email -> comptes
    const emailMap = new Map<string, Array<{
      collection: string
      id: string
      email: string
      firstName?: string
      lastName?: string
      fullName?: string
      displayName?: string
      type: string
      teamName?: string
      teamId?: string
      position?: string
      jerseyNumber?: number
      uid?: string
      createdAt?: any
      lastLogin?: any
      hasLoggedIn?: boolean
      emailVerified?: boolean
    }>>()

    // Ajouter les joueurs
    playersSnap.docs.forEach(doc => {
      const data = doc.data()
      // Normaliser l'email : minuscule + trim
      const email = data.email?.toLowerCase().trim()
      if (!email) return

      if (!emailMap.has(email)) {
        emailMap.set(email, [])
      }
      emailMap.get(email)!.push({
        collection: 'playerAccounts',
        id: doc.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        type: 'player',
        teamName: teamsMap.get(data.teamId),
        teamId: data.teamId,
        position: data.position,
        jerseyNumber: data.jerseyNumber,
        uid: data.uid,
        createdAt: data.createdAt,
        lastLogin: data.lastLogin,
        hasLoggedIn: !!data.lastLogin,
        emailVerified: true
      })
    })

    // Ajouter les entraîneurs
    coachesSnap.docs.forEach(doc => {
      const data = doc.data()
      // Normaliser l'email : minuscule + trim
      const email = data.email?.toLowerCase().trim()
      if (!email) return

      if (!emailMap.has(email)) {
        emailMap.set(email, [])
      }
      emailMap.get(email)!.push({
        collection: 'coachAccounts',
        id: doc.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        type: 'coach',
        teamName: teamsMap.get(data.teamId),
        teamId: data.teamId,
        uid: data.uid,
        createdAt: data.createdAt,
        lastLogin: data.lastLogin,
        hasLoggedIn: !!data.lastLogin,
        emailVerified: true
      })
    })

    // Ajouter les utilisateurs
    usersSnap.docs.forEach(doc => {
      const data = doc.data()
      // Normaliser l'email : minuscule + trim
      const email = data.email?.toLowerCase().trim()
      if (!email) return

      if (!emailMap.has(email)) {
        emailMap.set(email, [])
      }
      emailMap.get(email)!.push({
        collection: 'users',
        id: doc.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        displayName: data.displayName,
        type: 'user',
        uid: data.uid || doc.id,
        createdAt: data.createdAt,
        lastLogin: data.lastLogin,
        hasLoggedIn: !!data.lastLogin,
        emailVerified: data.emailVerified
      })
    })

    // Ajouter les profils
    profilesSnap.docs.forEach(doc => {
      const data = doc.data()
      // Normaliser l'email : minuscule + trim
      const email = data.email?.toLowerCase().trim()
      if (!email) return

      // Extraire firstName et lastName du fullName
      const fullName = data.fullName || ''
      const nameParts = fullName.split(' ')
      const firstName = nameParts[0] || ''
      const lastName = nameParts.slice(1).join(' ') || ''

      if (!emailMap.has(email)) {
        emailMap.set(email, [])
      }
      emailMap.get(email)!.push({
        collection: 'userProfiles',
        id: doc.id,
        email: data.email,
        firstName: firstName,
        lastName: lastName,
        fullName: data.fullName,
        type: 'profile',
        uid: data.uid || doc.id,
        createdAt: data.createdAt,
        lastLogin: data.lastLogin,
        hasLoggedIn: !!data.lastLogin,
        emailVerified: true
      })
    })

    // Trouver les doublons (emails avec plus d'un compte)
    const duplicates: Array<{
      email?: string
      reason: string
      count: number
      accounts: Array<any>
    }> = []

    // 1. Doublons par email exact
    console.log(`📧 Vérification des emails en double...`)
    console.log(`📊 Total emails uniques dans la map: ${emailMap.size}`)
    
    // Chercher spécifiquement yassin
    const yassinEmail = 'yassinelhosseiny686@gmail.com'
    if (emailMap.has(yassinEmail)) {
      const yassinAccounts = emailMap.get(yassinEmail)!
      console.log(`🔍 Email yassin trouvé! ${yassinAccounts.length} compte(s)`)
      yassinAccounts.forEach(acc => {
        console.log(`   - ${acc.firstName} ${acc.lastName} (${acc.collection})`)
      })
    } else {
      console.log(`❌ Email yassin PAS trouvé dans la map!`)
    }
    
    let emailDuplicatesCount = 0
    emailMap.forEach((accounts, email) => {
      if (accounts.length > 1) {
        console.log(`✅ Email en double trouvé: ${email} (${accounts.length} comptes)`)
        console.log(`   Collections: ${accounts.map(a => a.collection).join(', ')}`)
        duplicates.push({
          email,
          reason: 'Email identique',
          count: accounts.length,
          accounts
        })
        emailDuplicatesCount++
      }
    })
    console.log(`📊 Total emails en double: ${emailDuplicatesCount}`)

    // 2. Doublons par nom similaire (Demetri vs Demetry)
    const allAccounts = Array.from(emailMap.values()).flat()
    const similarGroups: Array<Array<any>> = []

    console.log(`🔍 Analyse de ${allAccounts.length} comptes pour noms similaires...`)
    
    // Afficher quelques exemples de noms
    const sampleNames = allAccounts.slice(0, 5).map(acc => {
      const fullName = `${acc.firstName || ''} ${acc.lastName || ''}`.trim()
      return `"${fullName}" → "${normalizeName(fullName)}"`
    })
    console.log('📝 Exemples de noms:', sampleNames.join(', '))

    // Comparer tous les comptes entre eux
    for (let i = 0; i < allAccounts.length; i++) {
      const account1 = allAccounts[i]
      const fullName1 = `${account1.firstName || ''} ${account1.lastName || ''}`.trim()
      if (!fullName1 || fullName1.length < 3) continue

      const normalizedName1 = normalizeName(fullName1)
      
      // Chercher si ce compte appartient déjà à un groupe
      let existingGroup = similarGroups.find(group => 
        group.some(acc => acc.id === account1.id)
      )

      if (!existingGroup) {
        existingGroup = [account1]
        similarGroups.push(existingGroup)
      }

      // Comparer avec tous les autres comptes
      for (let j = i + 1; j < allAccounts.length; j++) {
        const account2 = allAccounts[j]
        const fullName2 = `${account2.firstName || ''} ${account2.lastName || ''}`.trim()
        if (!fullName2 || fullName2.length < 3) continue

        const normalizedName2 = normalizeName(fullName2)
        
        // Calculer la similarité
        const similarityScore = similarity(normalizedName1, normalizedName2)
        
        // Log pour déboguer - chercher spécifiquement "demetri"
        if (normalizedName1.includes('demetri') || normalizedName2.includes('demetri') || 
            normalizedName1.includes('demetry') || normalizedName2.includes('demetry')) {
          console.log(`🔎 DEMETRI trouvé! Similarité ${Math.round(similarityScore * 100)}%: "${fullName1}" vs "${fullName2}"`)
          console.log(`   Normalisé: "${normalizedName1}" vs "${normalizedName2}"`)
        }
        
        // Log pour toutes les similarités > 75%
        if (similarityScore > 0.75) {
          console.log(`📊 Similarité ${Math.round(similarityScore * 100)}%: "${fullName1}" vs "${fullName2}"`)
          console.log(`   Normalisé: "${normalizedName1}" vs "${normalizedName2}"`)
        }
        
        // Si similarité > 80% (ex: "karim demetri" vs "karim demetry" = 93%)
        if (similarityScore > 0.80 && similarityScore < 1.0) {
          // Vérifier que ce sont des comptes différents (ID différent)
          if (account1.id !== account2.id) {
            // Vérifier si emails différents OU collections différentes
            const sameEmail = account1.email.toLowerCase() === account2.email.toLowerCase()
            const differentCollection = account1.collection !== account2.collection
            
            if (!sameEmail || differentCollection) {
              console.log(`✅ Doublon détecté: ${fullName1} (${account1.collection}) vs ${fullName2} (${account2.collection}) - ${Math.round(similarityScore * 100)}%`)
              // Ajouter au groupe si pas déjà présent
              if (!existingGroup.some(acc => acc.id === account2.id)) {
                existingGroup.push(account2)
              }
            } else {
              console.log(`⚠️ Même email ET même collection, ignoré: ${fullName1} vs ${fullName2}`)
            }
          }
        }
      }
    }

    // Ajouter les groupes de noms similaires aux doublons
    similarGroups.forEach(group => {
      if (group.length > 1) {
        // Vérifier que ce n'est pas déjà un doublon d'email
        const emails = group.map(a => a.email.toLowerCase())
        const uniqueEmails = new Set(emails)
        
        if (uniqueEmails.size > 1) {
          // Calculer le score de similarité moyen
          let totalSimilarity = 0
          let comparisons = 0
          for (let i = 0; i < group.length; i++) {
            for (let j = i + 1; j < group.length; j++) {
              const name1 = normalizeName(`${group[i].firstName || ''} ${group[i].lastName || ''}`)
              const name2 = normalizeName(`${group[j].firstName || ''} ${group[j].lastName || ''}`)
              totalSimilarity += similarity(name1, name2)
              comparisons++
            }
          }
          const avgSimilarity = Math.round((totalSimilarity / comparisons) * 100)

          duplicates.push({
            reason: `Noms similaires à ${avgSimilarity}% (possiblement la même personne)`,
            count: group.length,
            accounts: group
          })
        }
      }
    })

    // Trier par nombre de doublons (du plus au moins)
    duplicates.sort((a, b) => b.count - a.count)

    return NextResponse.json({
      success: true,
      totalEmails: emailMap.size,
      duplicatesCount: duplicates.length,
      duplicates,
      summary: {
        totalAccounts: playersSnap.size + coachesSnap.size + usersSnap.size + profilesSnap.size,
        players: playersSnap.size,
        coaches: coachesSnap.size,
        users: usersSnap.size,
        profiles: profilesSnap.size
      }
    })

  } catch (error: any) {
    console.error('Erreur lors de la détection des doublons:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
