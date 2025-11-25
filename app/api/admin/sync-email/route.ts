import { NextRequest, NextResponse } from 'next/server'
import { syncEmailEverywhere } from '../sync-email-logic'

/**
 * API centralisée pour synchroniser un email dans TOUTES les collections
 * Utilisée quand on change un email quelque part dans l'interface
 */
export async function POST(request: NextRequest) {
  try {
    const { oldEmail, newEmail } = await request.json()

    if (!oldEmail || !newEmail) {
      return NextResponse.json(
        { error: 'oldEmail et newEmail requis' },
        { status: 400 }
      )
    }

    if (oldEmail.toLowerCase().trim() === newEmail.toLowerCase().trim()) {
      return NextResponse.json(
        { error: 'Les emails sont identiques' },
        { status: 400 }
      )
    }

    const result = await syncEmailEverywhere(oldEmail, newEmail)

    return NextResponse.json({
      success: true,
      message: `✅ Email synchronisé dans ${result.updates.length} collection(s)`,
      ...result
    })

  } catch (error: any) {
    console.error('❌ Erreur synchronisation email:', error)
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Erreur serveur',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

