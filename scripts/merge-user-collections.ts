import { config } from 'dotenv'
import { resolve } from 'path'
import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

// Charger les variables d'environnement
config({ path: resolve(process.cwd(), '.env.local') })

// Initialiser Firebase Admin
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

/**
 * Script pour fusionner intelligemment users et userProfiles
 * Garde la meilleure source de données et supprime les doublons
 */
async function mergeUserCollections() {
  console.log('🔧 Fusion intelligente de users et userProfiles...\n')
  
  const stats = {
    usersUpdated: 0,
    profilesMerged: 0,
    profilesDeleted: 0,
    errors: [] as string[]
  }
  
  try {
    // 1. Charger tous les users et userProfiles
    const usersSnap = await db.collection('users').get()
    const profilesSnap = await db.collection('userProfiles').get()
    
    console.log(`📊 ${usersSnap.size} documents dans users`)
    console.log(`📊 ${profilesSnap.size} documents dans userProfiles\n`)
    
    // 2. Créer un map des profils par email et UID
    const profilesByEmail = new Map<string, any>()
    const profilesByUid = new Map<string, any>()
    
    profilesSnap.forEach(doc => {
      const data = doc.data()
      const email = data.email?.toLowerCase()?.trim()
      const uid = data.uid || doc.id
      
      if (email) {
        if (!profilesByEmail.has(email)) {
          profilesByEmail.set(email, [])
        }
        profilesByEmail.get(email)!.push({ id: doc.id, ...data })
      }
      
      if (uid) {
        if (!profilesByUid.has(uid)) {
          profilesByUid.set(uid, [])
        }
        profilesByUid.get(uid)!.push({ id: doc.id, ...data })
      }
    })
    
    // 3. Pour chaque user, fusionner avec son profil
    for (const userDoc of usersSnap.docs) {
      const userData = userDoc.data()
      const email = userData.email?.toLowerCase()?.trim()
      const uid = userDoc.id
      
      if (!email) continue
      
      // Chercher le profil correspondant
      let profile = profilesByUid.get(uid)?.[0]
      if (!profile) {
        profile = profilesByEmail.get(email)?.[0]
      }
      
      if (profile) {
        // Fusionner les données : user comme base, profil pour compléter
        const updates: any = {}
        
        // Prendre le meilleur de chaque source
        if (profile.data?.fullName && !userData.displayName) {
          updates.displayName = profile.data.fullName
        }
        if (profile.data?.role && !userData.role) {
          updates.role = profile.data.role
        }
        if (profile.data?.teamId && !userData.teamId) {
          updates.teamId = profile.data.teamId
        }
        if (profile.data?.teamName && !userData.teamName) {
          updates.teamName = profile.data.teamName
        }
        
        // Mettre à jour user avec les données du profil
        if (Object.keys(updates).length > 0) {
          try {
            await userDoc.ref.update({
              ...updates,
              updatedAt: new Date(),
              mergedFromProfile: true,
              mergedAt: new Date()
            })
            stats.usersUpdated++
            console.log(`   ✅ User ${email} mis à jour avec données du profil`)
          } catch (error: any) {
            stats.errors.push(`Erreur update user ${email}: ${error.message}`)
          }
        }
        
        // Supprimer le profil après fusion (garder user comme source unique)
        try {
          await db.collection('userProfiles').doc(profile.id).delete()
          stats.profilesDeleted++
          stats.profilesMerged++
          console.log(`   🗑️  Profil ${profile.id} supprimé (fusionné dans users)`)
        } catch (error: any) {
          stats.errors.push(`Erreur suppression profil ${profile.id}: ${error.message}`)
        }
      }
    }
    
    // 4. Gérer les profils orphelins (sans user correspondant)
    console.log('\n📋 Gestion des profils orphelins...')
    const userIds = new Set(usersSnap.docs.map(doc => doc.id))
    const userEmails = new Set(usersSnap.docs.map(doc => doc.data().email?.toLowerCase()?.trim()).filter(Boolean))
    
    let orphanProfiles = 0
    for (const profileDoc of profilesSnap.docs) {
      const profileData = profileDoc.data()
      const uid = profileData.uid || profileDoc.id
      const email = profileData.email?.toLowerCase()?.trim()
      
      // Vérifier si c'est un orphelin
      const hasUser = userIds.has(uid) || (email && userEmails.has(email))
      
      if (!hasUser && email) {
        // Créer un user à partir du profil orphelin
        try {
          const { firstName, lastName } = parseFullName(profileData.fullName)
          await db.collection('users').add({
            email: email,
            uid: uid,
            displayName: profileData.fullName || email,
            firstName: firstName,
            lastName: lastName,
            role: profileData.role || 'user',
            teamId: profileData.teamId,
            teamName: profileData.teamName,
            createdAt: profileData.createdAt || new Date(),
            createdFromProfile: true,
            updatedAt: new Date()
          })
          
          // Supprimer le profil
          await db.collection('userProfiles').doc(profileDoc.id).delete()
          orphanProfiles++
          stats.profilesMerged++
          console.log(`   ✅ Profil orphelin ${email} converti en user`)
        } catch (error: any) {
          stats.errors.push(`Erreur conversion profil ${profileDoc.id}: ${error.message}`)
        }
      }
    }
    
    // Résumé
    console.log('\n📊 Résumé de la fusion:\n')
    console.log(`✅ Users mis à jour: ${stats.usersUpdated}`)
    console.log(`🔄 Profils fusionnés: ${stats.profilesMerged}`)
    console.log(`🗑️  Profils supprimés: ${stats.profilesDeleted}`)
    console.log(`📝 Profils orphelins convertis: ${orphanProfiles}`)
    
    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Erreurs (${stats.errors.length}):`)
      stats.errors.slice(0, 10).forEach(error => console.log(`   - ${error}`))
    }
    
    console.log('\n✅ Fusion terminée!')
    console.log('   Les utilisateurs n\'auront plus qu\'une seule entrée dans users.')
    console.log('   userProfiles peut maintenant être considéré comme obsolète.')
    
  } catch (error: any) {
    console.error('❌ Erreur lors de la fusion:', error)
    throw error
  }
}

function parseFullName(fullName?: string): { firstName?: string; lastName?: string } {
  if (!fullName) return {}
  const parts = fullName.trim().split(' ')
  if (parts.length === 0) return {}
  const [firstName, ...rest] = parts
  return { firstName, lastName: rest.join(' ') || undefined }
}

console.log('⚠️  Ce script va fusionner users et userProfiles')
console.log('   - Mettre à jour users avec les données de userProfiles')
console.log('   - Supprimer les profils après fusion')
console.log('   - Convertir les profils orphelins en users')
console.log('\n   Appuyez sur Ctrl+C pour annuler, ou attendez 5 secondes...\n')

setTimeout(() => {
  mergeUserCollections()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('❌ Erreur:', error)
      process.exit(1)
    })
}, 5000)

