import { NextRequest, NextResponse } from 'next/server'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Recherche des joueurs sans compte...')
    
    // 1. Récupérer tous les joueurs
    const playersSnap = await getDocs(collection(db, 'players'))
    const players = playersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    // 2. Récupérer tous les comptes joueurs
    const accountsSnap = await getDocs(collection(db, 'playerAccounts'))
    const accountEmails = accountsSnap.docs.map(doc => doc.data().email)
    
    // 3. Trouver les joueurs sans compte
    const playersWithoutAccount = players.filter(player => 
      player.email && 
      !player.isCoach && 
      !accountEmails.includes(player.email)
    )
    
    console.log(`📊 ${playersWithoutAccount.length} joueurs sans compte trouvés`)
    
    if (playersWithoutAccount.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Tous les joueurs ont déjà un compte!' 
      })
    }
    
    // 4. Créer les comptes manquants
    const results = []
    for (const player of playersWithoutAccount) {
      try {
        const response = await fetch(`${request.nextUrl.origin}/api/admin/create-player-accounts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teamId: player.teamId,
            players: [{
              firstName: player.firstName,
              lastName: player.lastName,
              nickname: player.nickname || '',
              email: player.email,
              phone: player.phone,
              position: player.position,
              jerseyNumber: player.number,
              birthDate: player.birthDate || '',
              height: player.height || 0,
              tshirtSize: player.tshirtSize || 'M',
              foot: player.strongFoot === 'Droit' ? 'Droitier' : player.strongFoot === 'Gauche' ? 'Gaucher' : 'Ambidextre'
            }]
          })
        })
        
        if (response.ok) {
          results.push({ player: `${player.firstName} ${player.lastName}`, success: true })
          console.log(`✅ Compte créé pour ${player.firstName} ${player.lastName}`)
        } else {
          const error = await response.json()
          results.push({ player: `${player.firstName} ${player.lastName}`, success: false, error: error.error })
          console.error(`❌ Erreur pour ${player.firstName}:`, error)
        }
      } catch (error: any) {
        results.push({ player: `${player.firstName} ${player.lastName}`, success: false, error: error.message })
        console.error(`❌ Erreur pour ${player.firstName}:`, error)
      }
    }
    
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
    
    return NextResponse.json({ 
      success: true, 
      message: `${successCount} comptes créés avec succès, ${failCount} erreurs`,
      results
    })

  } catch (error: any) {
    console.error('❌ Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
