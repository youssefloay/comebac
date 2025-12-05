import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    const { matchId, matchType, teamId, teamName, firstName, lastName, email, phone, userId } = body

    // Validation
    if (!matchId || !matchType || !teamId || !teamName || !firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Normaliser l'email et le téléphone
    const normalizedEmail = email.toLowerCase().trim()
    const normalizedPhone = phone.trim().replace(/\s+/g, '') // Supprimer les espaces du téléphone

    // Vérifier si une demande existe déjà pour ce match avec cet email
    const existingRequestByEmail = await adminDb.collection('spectatorRequests')
      .where('matchId', '==', matchId)
      .where('matchType', '==', matchType)
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get()

    if (!existingRequestByEmail.empty) {
      return NextResponse.json(
        { error: 'This email has already been used for a request for this match' },
        { status: 400 }
      )
    }

    // Vérifier si une demande existe déjà pour ce match avec ce numéro de téléphone
    const existingRequestByPhone = await adminDb.collection('spectatorRequests')
      .where('matchId', '==', matchId)
      .where('matchType', '==', matchType)
      .get()

    // Filtrer en mémoire car Firestore ne permet pas de chercher par téléphone normalisé facilement
    const phoneExists = existingRequestByPhone.docs.some(doc => {
      const requestPhone = doc.data().phone?.trim().replace(/\s+/g, '') || ''
      return requestPhone === normalizedPhone
    })

    if (phoneExists) {
      return NextResponse.json(
        { error: 'This phone number has already been used for a request for this match' },
        { status: 400 }
      )
    }

    // Vérifier la limite de spectateurs
    const limitDoc = await adminDb.collection('matchSpectatorLimits')
      .doc(`${matchType}_${matchId}`)
      .get()

    let limit = 100 // Limite par défaut
    if (limitDoc.exists) {
      limit = limitDoc.data()?.limit || 100
    }

    // Compter toutes les demandes (pending + approved) pour ce match
    // On ne compte pas les demandes rejetées
    const allRequests = await adminDb.collection('spectatorRequests')
      .where('matchId', '==', matchId)
      .where('matchType', '==', matchType)
      .get()

    // Filtrer pour ne garder que pending et approved
    const activeRequests = allRequests.docs.filter(doc => {
      const status = doc.data().status
      return status === 'pending' || status === 'approved'
    })

    if (activeRequests.length >= limit) {
      return NextResponse.json(
        { error: 'This match is full. No more spectator spots available.' },
        { status: 400 }
      )
    }

    // Créer la demande
    const requestData = {
      matchId,
      matchType,
      teamId,
      teamName,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      status: 'pending',
      checkedIn: false,
      userId: userId || null,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    }

    const docRef = await adminDb.collection('spectatorRequests').add(requestData)

    return NextResponse.json({
      id: docRef.id,
      message: 'Request submitted successfully',
      ...requestData
    })
  } catch (error: any) {
    console.error('Error creating spectator request:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to submit request' },
      { status: 500 }
    )
  }
}
