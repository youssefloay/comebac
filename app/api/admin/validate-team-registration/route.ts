import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const registrationId = searchParams.get('registrationId')
    const action = searchParams.get('action') // 'validate' or 'reject'

    if (!registrationId || !action) {
      return NextResponse.redirect(new URL('/admin/team-registrations?error=missing_params', request.url))
    }

    if (action !== 'validate' && action !== 'reject') {
      return NextResponse.redirect(new URL('/admin/team-registrations?error=invalid_action', request.url))
    }

    // Récupérer l'inscription
    const registrationDoc = await adminDb.collection('teamRegistrations').doc(registrationId).get()
    
    if (!registrationDoc.exists) {
      return NextResponse.redirect(new URL('/admin/team-registrations?error=not_found', request.url))
    }

    const registration = registrationDoc.data()

    if (action === 'validate') {
      // Vérifier que l'équipe n'est pas déjà validée
      if (registration?.status === 'approved') {
        return NextResponse.redirect(new URL(`/admin/team-registrations?success=already_approved&teamName=${encodeURIComponent(registration.teamName || '')}`, request.url))
      }

      // Mettre à jour le statut à 'pending_validation' pour que l'admin puisse finaliser dans l'interface
      // (on ne fait pas toute la logique ici car c'est complexe et nécessite l'interface admin)
      await adminDb.collection('teamRegistrations').doc(registrationId).update({
        status: 'pending_validation',
        emailValidatedAt: Timestamp.now(),
        emailValidatedAction: 'validate'
      })

      return NextResponse.redirect(new URL(`/admin/team-registrations?success=marked_for_validation&registrationId=${registrationId}`, request.url))
    } else if (action === 'reject') {
      // Vérifier que l'équipe n'est pas déjà rejetée
      if (registration?.status === 'rejected') {
        return NextResponse.redirect(new URL(`/admin/team-registrations?success=already_rejected&teamName=${encodeURIComponent(registration.teamName || '')}`, request.url))
      }

      // Mettre à jour le statut à 'rejected'
      await adminDb.collection('teamRegistrations').doc(registrationId).update({
        status: 'rejected',
        processedAt: Timestamp.now(),
        rejectionReason: 'Rejeté depuis l\'email',
        emailValidatedAt: Timestamp.now(),
        emailValidatedAction: 'reject'
      })

      return NextResponse.redirect(new URL(`/admin/team-registrations?success=rejected&registrationId=${registrationId}`, request.url))
    }

    return NextResponse.redirect(new URL('/admin/team-registrations?error=unknown', request.url))
  } catch (error: any) {
    console.error('❌ Erreur validation équipe:', error)
    return NextResponse.redirect(new URL(`/admin/team-registrations?error=${encodeURIComponent(error.message || 'unknown')}`, request.url))
  }
}


