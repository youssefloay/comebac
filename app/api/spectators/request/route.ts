import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

/**
 * Valide un numéro de téléphone égyptien
 * Formats acceptés:
 * - 01XXXXXXXXX (11 chiffres)
 * - +20 1XXXXXXXXX
 * - 0020 1XXXXXXXXX
 * - 1XXXXXXXXX (10 chiffres, sans le 0 initial)
 */
function validateEgyptianPhone(phone: string): boolean {
  // Nettoyer le numéro (supprimer espaces, tirets, etc.)
  const cleaned = phone.trim().replace(/[\s\-\(\)]/g, '')
  
  // Vérifier les formats égyptiens
  // Format: 01XXXXXXXXX (11 chiffres)
  if (/^01\d{9}$/.test(cleaned)) {
    return true
  }
  
  // Format: +20 1XXXXXXXXX
  if (/^\+201\d{9}$/.test(cleaned)) {
    return true
  }
  
  // Format: 0020 1XXXXXXXXX
  if (/^00201\d{9}$/.test(cleaned)) {
    return true
  }
  
  // Format: 1XXXXXXXXX (10 chiffres, sans le 0 initial)
  if (/^1\d{9}$/.test(cleaned)) {
    return true
  }
  
  return false
}

/**
 * Normalise un numéro de téléphone égyptien au format standard: 01XXXXXXXXX
 */
function normalizeEgyptianPhone(phone: string): string {
  // Nettoyer le numéro (supprimer espaces, tirets, etc.)
  const cleaned = phone.trim().replace(/[\s\-\(\)]/g, '')
  
  // Si commence par +20, enlever +20 et ajouter 0
  if (cleaned.startsWith('+201')) {
    return '0' + cleaned.substring(3)
  }
  
  // Si commence par 0020, enlever 0020 et ajouter 0
  if (cleaned.startsWith('00201')) {
    return '0' + cleaned.substring(4)
  }
  
  // Si commence par 1 (sans le 0), ajouter le 0
  if (cleaned.startsWith('1') && cleaned.length === 10) {
    return '0' + cleaned
  }
  
  // Si déjà au format 01XXXXXXXXX, retourner tel quel
  if (cleaned.startsWith('01') && cleaned.length === 11) {
    return cleaned
  }
  
  // Par défaut, retourner le numéro nettoyé
  return cleaned
}

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
    const { matchId, matchType, teamId, teamName, firstName, lastName, email, phone, photoUrl, userId } = body

    // Validation
    if (!matchId || !matchType || !teamId || !teamName || !firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validation photo obligatoire
    if (!photoUrl || !photoUrl.trim()) {
      return NextResponse.json(
        { error: 'Photo is required. Requests without a photo will be automatically rejected.' },
        { status: 400 }
      )
    }

    // Normaliser l'email
    const normalizedEmail = email.toLowerCase().trim()
    
    // Valider le numéro de téléphone égyptien
    if (!validateEgyptianPhone(phone.trim())) {
      return NextResponse.json(
        { error: 'Invalid Egyptian phone number. Please use format: 01XXXXXXXXX' },
        { status: 400 }
      )
    }
    
    // Normaliser le numéro de téléphone égyptien
    const normalizedPhone = normalizeEgyptianPhone(phone.trim())

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
    // Si pas de photo, rejeter automatiquement
    const status = photoUrl && photoUrl.trim() ? 'pending' : 'rejected'
    
    const requestData = {
      matchId,
      matchType,
      teamId,
      teamName,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      photoUrl: photoUrl.trim(),
      status,
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
