import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const { registrationId } = await request.json()

    if (!registrationId) {
      return NextResponse.json({ error: 'Registration ID requis' }, { status: 400 })
    }

    // Générer un token unique
    const token = crypto.randomBytes(32).toString('hex')

    // Mettre à jour l'inscription avec le token
    await adminDb.collection('teamRegistrations').doc(registrationId).update({
      updateToken: token,
      updateTokenActive: true, // Actif par défaut, admin peut le désactiver
      updateTokenCreatedAt: new Date()
    })

    // Générer le lien
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const updateLink = `${baseUrl}/update-registration/${token}`

    return NextResponse.json({
      success: true,
      updateLink
    })
  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Nouvelle route pour désactiver le lien
export async function DELETE(request: Request) {
  try {
    const { registrationId } = await request.json()

    if (!registrationId) {
      return NextResponse.json({ error: 'Registration ID requis' }, { status: 400 })
    }

    // Désactiver le token
    await adminDb.collection('teamRegistrations').doc(registrationId).update({
      updateTokenActive: false,
      updateTokenDisabledAt: new Date()
    })

    return NextResponse.json({
      success: true,
      message: 'Lien désactivé'
    })
  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
