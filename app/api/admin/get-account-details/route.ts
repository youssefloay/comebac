import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accountId = searchParams.get('accountId')
    const accountType = searchParams.get('accountType')

    if (!accountId || !accountType) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
    }

    let accountDoc
    if (accountType === 'player') {
      accountDoc = await adminDb.collection('playerAccounts').doc(accountId).get()
    } else if (accountType === 'coach') {
      accountDoc = await adminDb.collection('coachAccounts').doc(accountId).get()
    } else {
      return NextResponse.json({ error: 'Type de compte invalide' }, { status: 400 })
    }

    if (!accountDoc.exists) {
      return NextResponse.json({ error: 'Compte non trouvé' }, { status: 404 })
    }

    const data = accountDoc.data()
    
    // Convertir les Timestamps en ISO strings pour la sérialisation JSON
    const accountData: any = {
      id: accountDoc.id,
      ...data
    }

    // Convertir les dates si elles existent
    if (data.birthDate) {
      if (data.birthDate.toDate) {
        accountData.birthDate = data.birthDate.toDate().toISOString().split('T')[0]
      } else if (typeof data.birthDate === 'string') {
        accountData.birthDate = data.birthDate.split('T')[0]
      }
    }

    if (data.createdAt) {
      if (data.createdAt.toDate) {
        accountData.createdAt = data.createdAt.toDate().toISOString()
      }
    }

    if (data.updatedAt) {
      if (data.updatedAt.toDate) {
        accountData.updatedAt = data.updatedAt.toDate().toISOString()
      }
    }

    return NextResponse.json(accountData)

  } catch (error: any) {
    console.error('❌ Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

