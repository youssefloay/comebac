import { NextRequest, NextResponse } from 'next/server'
import { adminDb, adminAuth } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Recherche de Youssef Loay...')
    
    // Chercher dans playerAccounts
    const playersSnap = await adminDb.collection('playerAccounts')
      .where('firstName', '==', 'Youssef')
      .where('lastName', '==', 'Loay')
      .get()
    
    // Chercher dans coachAccounts
    const coachesSnap = await adminDb.collection('coachAccounts')
      .where('firstName', '==', 'Youssef')
      .where('lastName', '==', 'Loay')
      .get()
    
    let email: string | null = null
    let name = 'Youssef Loay'
    let userId: string | null = null
    
    if (!playersSnap.empty) {
      const data = playersSnap.docs[0].data()
      email = data.email
      name = `${data.firstName} ${data.lastName}`
      userId = data.uid
      console.log(`✅ Trouvé dans playerAccounts: ${email}, UID: ${userId}`)
    } else if (!coachesSnap.empty) {
      const data = coachesSnap.docs[0].data()
      email = data.email
      name = `${data.firstName} ${data.lastName}`
      userId = data.uid
      console.log(`✅ Trouvé dans coachAccounts: ${email}, UID: ${userId}`)
    } else {
      // Chercher par nom partiel
      const allPlayers = await adminDb.collection('playerAccounts').get()
      const allCoaches = await adminDb.collection('coachAccounts').get()
      
      const allAccounts = [
        ...allPlayers.docs.map(doc => ({ id: doc.id, ...doc.data(), collection: 'playerAccounts' })),
        ...allCoaches.docs.map(doc => ({ id: doc.id, ...doc.data(), collection: 'coachAccounts' }))
      ]
      
      const matches = allAccounts.filter((acc: any) => {
        const firstName = acc.firstName?.toLowerCase() || ''
        const lastName = acc.lastName?.toLowerCase() || ''
        return firstName.includes('youssef') && lastName.includes('loay')
      })
      
      if (matches.length > 0) {
        email = matches[0].email
        name = `${matches[0].firstName || ''} ${matches[0].lastName || ''}`.trim() || email
        userId = matches[0].uid
        console.log(`✅ Trouvé par recherche partielle: ${email}, UID: ${userId}`)
      }
    }
    
    // TOUJOURS utiliser l'UID depuis Firebase Auth (priorité absolue)
    // Car c'est celui utilisé par l'utilisateur connecté
    if (email) {
      try {
        const userRecord = await adminAuth.getUserByEmail(email)
        userId = userRecord.uid
        console.log(`✅ UID récupéré depuis Firebase Auth (priorité): ${userId}`)
      } catch (error: any) {
        console.warn(`⚠️ Impossible de récupérer l'UID depuis Firebase Auth: ${error.message}`)
      }
    }
    
    if (!email || !userId) {
      return NextResponse.json(
        { error: 'Youssef Loay non trouvé ou UID manquant dans la base de données' },
        { status: 404 }
      )
    }
    
    console.log(`📧 Email trouvé: ${email}`)
    console.log(`👤 Nom: ${name}`)
    console.log(`🆔 UID: ${userId}`)
    console.log(`\n📤 Envoi de la notification de test...`)
    
    // Créer la notification dans Firestore avec l'UID (pas l'email)
    const notificationRef = await adminDb.collection('notifications').add({
      userId: userId, // Utiliser l'UID, pas l'email
      title: '🔔 Notification de Test',
      message: 'Ceci est une notification de test envoyée à Youssef Loay. Si vous recevez ce message, le système de notifications fonctionne correctement!',
      type: 'custom',
      priority: 'normal',
      actionUrl: '/coach/profile',
      read: false,
      createdAt: new Date()
    })
    
    console.log(`✅ Notification créée avec ID: ${notificationRef.id}`)
    
    return NextResponse.json({
      success: true,
      message: `✅ Notification de test envoyée à ${name} (${email})`,
      notificationId: notificationRef.id,
      recipient: {
        email,
        name,
        userId
      }
    })
    
  } catch (error: any) {
    console.error('❌ Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}

