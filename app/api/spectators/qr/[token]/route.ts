import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

// GET - Valider un QR code et faire le check-in
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> | { token: string } }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
    }

    const { token } = await Promise.resolve(params)

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Chercher la demande avec ce token
    const requestsSnapshot = await adminDb.collection('spectatorRequests')
      .where('qrCodeToken', '==', token)
      .limit(1)
      .get()

    if (requestsSnapshot.empty) {
      return NextResponse.json(
        { 
          error: 'Invalid QR code',
          valid: false 
        },
        { status: 404 }
      )
    }

    const requestDoc = requestsSnapshot.docs[0]
    const requestData = requestDoc.data()

    // Vérifier que la demande est approuvée
    if (requestData.status !== 'approved') {
      return NextResponse.json(
        {
          error: 'Request is not approved',
          valid: false,
          status: requestData.status
        },
        { status: 400 }
      )
    }

    // Vérifier si déjà check-in
    if (requestData.checkedIn === true) {
      return NextResponse.json({
        valid: true,
        alreadyCheckedIn: true,
        request: {
          id: requestDoc.id,
          firstName: requestData.firstName,
          lastName: requestData.lastName,
          email: requestData.email,
          phone: requestData.phone,
          teamName: requestData.teamName,
          matchId: requestData.matchId,
          matchType: requestData.matchType,
          photoUrl: requestData.photoUrl,
          checkedInAt: requestData.checkedInAt?.toDate?.() || requestData.checkedInAt
        }
      })
    }

    // Retourner les informations de la demande (sans faire le check-in automatiquement)
    // Le check-in sera fait via l'API POST
    return NextResponse.json({
      valid: true,
      request: {
        id: requestDoc.id,
        firstName: requestData.firstName,
        lastName: requestData.lastName,
        email: requestData.email,
        phone: requestData.phone,
        teamName: requestData.teamName,
        matchId: requestData.matchId,
        matchType: requestData.matchType,
        photoUrl: requestData.photoUrl
      }
    })
  } catch (error: any) {
    console.error('Error validating QR code:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to validate QR code' },
      { status: 500 }
    )
  }
}

// POST - Valider et faire le check-in automatiquement
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> | { token: string } }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
    }

    const { token } = await Promise.resolve(params)

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    // Chercher la demande avec ce token
    const requestsSnapshot = await adminDb.collection('spectatorRequests')
      .where('qrCodeToken', '==', token)
      .limit(1)
      .get()

    if (requestsSnapshot.empty) {
      return NextResponse.json(
        { 
          error: 'Invalid QR code',
          valid: false 
        },
        { status: 404 }
      )
    }

    const requestDoc = requestsSnapshot.docs[0]
    const requestData = requestDoc.data()
    const requestId = requestDoc.id

    // Vérifier que la demande est approuvée
    if (requestData.status !== 'approved') {
      return NextResponse.json(
        {
          error: 'Request is not approved',
          valid: false,
          status: requestData.status
        },
        { status: 400 }
      )
    }

    // Vérifier si déjà check-in
    if (requestData.checkedIn === true) {
      return NextResponse.json({
        success: false,
        alreadyCheckedIn: true,
        message: 'Already checked in',
        request: {
          id: requestId,
          firstName: requestData.firstName,
          lastName: requestData.lastName,
          email: requestData.email,
          teamName: requestData.teamName,
          checkedInAt: requestData.checkedInAt?.toDate?.() || requestData.checkedInAt
        }
      })
    }

    // Vérifier qu'il n'y a pas déjà un check-in avec le même email ou téléphone pour ce match
    const normalizedEmail = requestData.email?.toLowerCase().trim() || ''
    const normalizedPhone = (requestData.phone?.trim().replace(/\s+/g, '') || '')

    const allMatchRequests = await adminDb.collection('spectatorRequests')
      .where('matchId', '==', requestData.matchId)
      .where('matchType', '==', requestData.matchType)
      .get()

    // Vérifier s'il y a déjà un check-in avec le même email (sauf la demande actuelle)
    const duplicateEmailCheckIn = allMatchRequests.docs.find(doc => {
      if (doc.id === requestId) return false
      const data = doc.data()
      return data.checkedIn === true && 
             data.email?.toLowerCase().trim() === normalizedEmail
    })

    if (duplicateEmailCheckIn) {
      const duplicateData = duplicateEmailCheckIn.data()
      return NextResponse.json(
        { 
          error: `This email is already checked in for this match (${duplicateData.firstName} ${duplicateData.lastName})`,
          success: false
        },
        { status: 400 }
      )
    }

    // Vérifier s'il y a déjà un check-in avec le même téléphone (sauf la demande actuelle)
    const duplicatePhoneCheckIn = allMatchRequests.docs.find(doc => {
      if (doc.id === requestId) return false
      const data = doc.data()
      const docPhone = data.phone?.trim().replace(/\s+/g, '') || ''
      return data.checkedIn === true && docPhone === normalizedPhone && normalizedPhone !== ''
    })

    if (duplicatePhoneCheckIn) {
      const duplicateData = duplicatePhoneCheckIn.data()
      return NextResponse.json(
        { 
          error: `This phone number is already checked in for this match (${duplicateData.firstName} ${duplicateData.lastName})`,
          success: false
        },
        { status: 400 }
      )
    }

    // Faire le check-in
    await adminDb.collection('spectatorRequests').doc(requestId).update({
      checkedIn: true,
      checkedInAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })

    return NextResponse.json({
      success: true,
      message: 'Check-in successful',
      request: {
        id: requestId,
        firstName: requestData.firstName,
        lastName: requestData.lastName,
        email: requestData.email,
        teamName: requestData.teamName,
        checkedInAt: new Date().toISOString()
      }
    })
  } catch (error: any) {
    console.error('Error processing QR code check-in:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process check-in' },
      { status: 500 }
    )
  }
}
