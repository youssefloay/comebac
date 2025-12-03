import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

// PATCH - Mettre à jour une période (admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ periodId: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
    }
    const { periodId } = await params
    const updates = await request.json()

    // Convertir les dates en Timestamp si nécessaire
    const updateData: any = { ...updates }
    if (updates.startDate && typeof updates.startDate === 'string') {
      updateData.startDate = Timestamp.fromDate(new Date(updates.startDate))
    }
    if (updates.endDate && typeof updates.endDate === 'string') {
      updateData.endDate = Timestamp.fromDate(new Date(updates.endDate))
    }

    await adminDb.collection('shopPeriods').doc(periodId).update(updateData)

    // Si on ouvre cette période, mettre à jour shopSettings
    if (updates.status === 'open') {
      // Récupérer la période pour avoir les dates
      const periodDoc = await adminDb.collection('shopPeriods').doc(periodId).get()
      const periodData = periodDoc.data()

      await adminDb.collection('shopSettings').doc('main').update({
        'currentPeriod.id': periodId,
        'currentPeriod.isOpen': true,
        'currentPeriod.status': 'open',
        'currentPeriod.startDate': periodData?.startDate || updateData.startDate,
        'currentPeriod.endDate': periodData?.endDate || updateData.endDate
      })
    }

    // Si on ferme cette période, mettre à jour shopSettings
    if (updates.status === 'closed' || updates.status === 'production') {
      await adminDb.collection('shopSettings').doc('main').update({
        'currentPeriod.isOpen': false,
        'currentPeriod.status': updates.status
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating period:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour de la période' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une période (admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ periodId: string }> }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
    }

    const { periodId } = await params

    // Vérifier si c'est la période active
    const settingsDoc = await adminDb.collection('shopSettings').doc('main').get()
    const settings = settingsDoc.data()

    if (settings?.currentPeriod?.id === periodId) {
      // Réinitialiser les settings si on supprime la période active
      await adminDb.collection('shopSettings').doc('main').update({
        'currentPeriod.id': null,
        'currentPeriod.isOpen': false,
        'currentPeriod.status': 'upcoming',
        'currentPeriod.startDate': null,
        'currentPeriod.endDate': null
      })
    }

    // Supprimer la période
    await adminDb.collection('shopPeriods').doc(periodId).delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting period:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression de la période' },
      { status: 500 }
    )
  }
}
