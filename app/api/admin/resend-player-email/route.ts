import { NextRequest, NextResponse } from 'next/server'
import { sendPlayerAccountEmail } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const { playerEmail, playerName, teamName } = await request.json()

    if (!playerEmail || !playerName || !teamName) {
      return NextResponse.json(
        { error: 'Email, nom du joueur et nom de l\'équipe requis' },
        { status: 400 }
      )
    }

    // Envoyer l'email au joueur
    await sendPlayerAccountEmail(playerEmail, playerName, teamName)

    return NextResponse.json({
      success: true,
      message: `Email renvoyé à ${playerName}`
    })
  } catch (error) {
    console.error('Erreur lors du renvoi de l\'email:', error)
    return NextResponse.json(
      { error: 'Erreur lors du renvoi de l\'email' },
      { status: 500 }
    )
  }
}
