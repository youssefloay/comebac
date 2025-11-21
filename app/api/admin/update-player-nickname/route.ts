import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const { email, oldNickname, newNickname } = await request.json()

    if (!email || !newNickname) {
      return NextResponse.json(
        { error: 'email et newNickname requis' },
        { status: 400 }
      )
    }

    console.log(`🔄 Mise à jour nickname: ${email}`)
    console.log(`   Ancien: "${oldNickname || 'N/A'}"`)
    console.log(`   Nouveau: "${newNickname}"`)

    const updates: string[] = []

    // 1. Mettre à jour dans playerAccounts
    console.log('\n1️⃣ Mise à jour dans playerAccounts...')
    const accountsSnap = await adminDb!.collection('playerAccounts')
      .where('email', '==', email)
      .get()
    
    if (!accountsSnap.empty) {
      for (const doc of accountsSnap.docs) {
        const data = doc.data()
        // Mettre à jour si oldNickname est fourni et correspond, ou si le nickname actuel est différent
        if (!oldNickname || data.nickname === oldNickname || data.nickname !== newNickname) {
          await doc.ref.update({ nickname: newNickname })
          console.log(`   ✅ Compte joueur mis à jour: ${data.firstName} ${data.lastName}`)
          updates.push(`playerAccounts: ${doc.id}`)
        }
      }
    } else {
      console.log('   ⚠️ Aucun compte joueur trouvé')
    }

    // 2. Mettre à jour dans players
    console.log('\n2️⃣ Mise à jour dans players...')
    const playersSnap = await adminDb!.collection('players')
      .where('email', '==', email)
      .get()
    
    if (!playersSnap.empty) {
      for (const doc of playersSnap.docs) {
        const data = doc.data()
        if (!oldNickname || data.nickname === oldNickname || data.nickname !== newNickname) {
          await doc.ref.update({ nickname: newNickname })
          console.log(`   ✅ Joueur mis à jour: ${data.name}`)
          updates.push(`players: ${doc.id}`)
        }
      }
    } else {
      console.log('   ⚠️ Aucun joueur trouvé')
    }

    // 3. Mettre à jour dans teamRegistrations
    console.log('\n3️⃣ Mise à jour dans teamRegistrations...')
    const registrationsSnap = await adminDb!.collection('teamRegistrations').get()
    
    let registrationsUpdated = 0
    for (const doc of registrationsSnap.docs) {
      const data = doc.data()
      let updated = false
      
      if (data.players && Array.isArray(data.players)) {
        const players = data.players.map((player: any) => {
          if (player.email === email && (!oldNickname || player.nickname === oldNickname || player.nickname !== newNickname)) {
            updated = true
            return { ...player, nickname: newNickname }
          }
          return player
        })
        
        if (updated) {
          await doc.ref.update({ players })
          console.log(`   ✅ Inscription mise à jour: ${data.teamName}`)
          registrationsUpdated++
          updates.push(`teamRegistrations: ${doc.id}`)
        }
      }
    }
    
    if (registrationsUpdated === 0) {
      console.log('   ℹ️  Aucune inscription à mettre à jour')
    }

    // 4. Mettre à jour dans teams
    console.log('\n4️⃣ Mise à jour dans teams...')
    const teamsSnap = await adminDb!.collection('teams').get()
    
    let teamsUpdated = 0
    for (const doc of teamsSnap.docs) {
      const data = doc.data()
      let updated = false
      
      if (data.players && Array.isArray(data.players)) {
        const players = data.players.map((player: any) => {
          if (player.email === email && (!oldNickname || player.nickname === oldNickname || player.nickname !== newNickname)) {
            updated = true
            return { ...player, nickname: newNickname }
          }
          return player
        })
        
        if (updated) {
          await doc.ref.update({ players })
          console.log(`   ✅ Équipe mise à jour: ${data.name}`)
          teamsUpdated++
          updates.push(`teams: ${doc.id}`)
        }
      }
    }
    
    if (teamsUpdated === 0) {
      console.log('   ℹ️  Aucune équipe à mettre à jour')
    }

    console.log(`\n✅ TERMINÉ! ${updates.length} document(s) mis à jour`)

    return NextResponse.json({
      success: true,
      updated: updates.length,
      updates
    })

  } catch (error: any) {
    console.error('❌ Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la mise à jour' },
      { status: 500 }
    )
  }
}

