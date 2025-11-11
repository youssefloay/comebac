import { NextResponse } from 'next/server'
import { sendEmail, generateWelcomeEmail } from '@/lib/email-service'

export async function POST(request: Request) {
  try {
    const { email, firstName, lastName, password, teamName } = await request.json()

    if (!email) {
      return NextResponse.json({ 
        error: 'Email requis' 
      }, { status: 400 })
    }

    console.log('🧪 Test d\'envoi d\'email joueur...')
    console.log('Destinataire:', email)

    // Générer le contenu de l'email
    const emailContent = generateWelcomeEmail({
      firstName: firstName || 'Test',
      lastName: lastName || 'Joueur',
      email: email,
      password: password || 'TestPassword123',
      teamName: teamName || 'Équipe Test'
    })

    // Envoyer l'email
    const result = await sendEmail({
      to: email,
      subject: emailContent.subject,
      html: emailContent.html
    })

    return NextResponse.json({
      success: result.success,
      message: result.success ? 'Email envoyé avec succès!' : 'Erreur lors de l\'envoi',
      result
    })
  } catch (error: any) {
    console.error('❌ Erreur:', error)
    return NextResponse.json({
      error: error.message
    }, { status: 500 })
  }
}
