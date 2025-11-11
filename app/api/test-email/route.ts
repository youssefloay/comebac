import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email-service'

export async function GET() {
  try {
    console.log('🧪 Test d\'envoi d\'email...')
    console.log('RESEND_API_KEY présente:', !!process.env.RESEND_API_KEY)
    console.log('EMAIL_FROM:', process.env.EMAIL_FROM)

    const result = await sendEmail({
      to: 'test@example.com', // Changez par votre email pour tester
      subject: 'Test Email - ComeBac League',
      html: '<h1>Test</h1><p>Ceci est un email de test.</p>'
    })

    return NextResponse.json({
      success: result.success,
      message: 'Test terminé',
      hasApiKey: !!process.env.RESEND_API_KEY,
      result
    })
  } catch (error: any) {
    console.error('❌ Erreur:', error)
    return NextResponse.json({
      error: error.message,
      hasApiKey: !!process.env.RESEND_API_KEY
    }, { status: 500 })
  }
}
