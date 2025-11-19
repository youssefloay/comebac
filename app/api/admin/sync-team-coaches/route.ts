import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Synchronisation des entraîneurs dans les équipes...')
    
    // Récupérer toutes les équipes
    const teamsSnap = await adminDb.collection('teams').get()
    console.log(`📋 ${teamsSnap.size} équipe(s) trouvée(s)`)
    
    let updated = 0
    let skipped = 0
    const results: Array<{ teamName: string; status: string; coachName?: string }> = []
    
    for (const teamDoc of teamsSnap.docs) {
      const teamData = teamDoc.data()
      const teamId = teamDoc.id
      const teamName = teamData.name
      
      // Vérifier si l'équipe a déjà un objet coach complet
      if (teamData.coach && teamData.coach.firstName && teamData.coach.lastName && teamData.coach.email) {
        console.log(`⏭️  ${teamName}: Coach déjà synchronisé`)
        skipped++
        results.push({ teamName, status: 'skipped', coachName: `${teamData.coach.firstName} ${teamData.coach.lastName}` })
        continue
      }
      
      // Chercher l'entraîneur de cette équipe dans coachAccounts
      const coachSnap = await adminDb.collection('coachAccounts')
        .where('teamId', '==', teamId)
        .limit(1)
        .get()
      
      if (coachSnap.empty) {
        console.log(`⚠️  ${teamName}: Aucun entraîneur trouvé`)
        skipped++
        results.push({ teamName, status: 'no_coach' })
        continue
      }
      
      const coachData = coachSnap.docs[0].data()
      const coachId = coachSnap.docs[0].id
      const coachName = `${coachData.firstName || ''} ${coachData.lastName || ''}`.trim()
      
      // Mettre à jour le document teams avec les informations du coach
      await adminDb.collection('teams').doc(teamId).update({
        coachId: coachId,
        coachFirstName: coachData.firstName || '',
        coachLastName: coachData.lastName || '',
        coachEmail: coachData.email || '',
        coach: {
          firstName: coachData.firstName || '',
          lastName: coachData.lastName || '',
          birthDate: coachData.birthDate || '',
          email: coachData.email || '',
          phone: coachData.phone || ''
        }
      })
      
      console.log(`✅ ${teamName}: Entraîneur synchronisé - ${coachName}`)
      updated++
      results.push({ teamName, status: 'updated', coachName })
    }
    
    return NextResponse.json({
      success: true,
      message: `Synchronisation terminée: ${updated} équipe(s) mise(s) à jour, ${skipped} ignorée(s)`,
      stats: {
        total: teamsSnap.size,
        updated,
        skipped
      },
      results
    })
    
  } catch (error: any) {
    console.error('❌ Erreur lors de la synchronisation:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

