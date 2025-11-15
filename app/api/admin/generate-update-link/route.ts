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
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Expire dans 7 jours

    // Mettre à jour l'inscription avec le token
    await adminDb.collection('teamRegistrations').doc(registrationId).update({
      updateToken: token,
      updateTokenExpiresAt: expiresAt,
      updateTokenUsed: false
    })

    // Générer le lien
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const updateLink = `${baseUrl}/update-registration/${token}`

    return NextResponse.json({
      success: true,
      updateLink,
      expiresAt: expiresAt.toISOString()
    })
  } catch (error: any) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
