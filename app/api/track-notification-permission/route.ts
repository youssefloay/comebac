import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(request: NextRequest) {
  try {
    const { userId, userEmail, userType, permission, source } = await request.json()

    // Enregistrer l'action
    await adminDb.collection('notificationPermissions').add({
      userId: userId || 'anonymous',
      userEmail: userEmail || 'anonymous',
      userType: userType || 'public',
      permission, // 'granted', 'denied', 'default'
      source: source || 'popup', // 'popup', 'settings', etc.
      timestamp: FieldValue.serverTimestamp(),
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    // Mettre à jour le profil utilisateur si connecté
    if (userId && userId !== 'anonymous') {
      const collections = ['players', 'coaches', 'users', 'userProfiles']
      
      for (const collectionName of collections) {
        try {
          const docRef = adminDb.collection(collectionName).doc(userId)
          const doc = await docRef.get()
          
          if (doc.exists) {
            await docRef.update({
              notificationPermission: permission,
              notificationPermissionUpdatedAt: FieldValue.serverTimestamp()
            })
            break
          }
        } catch (error) {
          // Continue si le document n'existe pas dans cette collection
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erreur tracking notification:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
