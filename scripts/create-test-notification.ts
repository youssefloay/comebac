import { adminDb } from '../lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'

async function createTestNotification() {
  try {
    // Trouver l'utilisateur avec l'email contact@comebac.com
    const usersSnapshot = await adminDb
      .collection('users')
      .where('email', '==', 'contact@comebac.com')
      .limit(1)
      .get()

    if (usersSnapshot.empty) {
      console.log('Utilisateur non trouvé, essayons avec auth...')
      
      // Essayer de trouver dans les comptes admin
      const adminSnapshot = await adminDb
        .collection('adminAccounts')
        .where('email', '==', 'contact@comebac.com')
        .limit(1)
        .get()

      if (adminSnapshot.empty) {
        console.log('❌ Utilisateur contact@comebac.com non trouvé')
        return
      }

      const adminDoc = adminSnapshot.docs[0]
      const userId = adminDoc.data().uid

      console.log('✅ Utilisateur trouvé:', userId)

      // Créer une notification de test
      const notificationRef = await adminDb.collection('notifications').add({
        userId,
        title: '🎉 Bienvenue !',
        message: 'Votre système de notifications fonctionne parfaitement !',
        type: 'success',
        read: false,
        createdAt: Timestamp.now()
      })

      console.log('✅ Notification de test créée:', notificationRef.id)
      return
    }

    const userDoc = usersSnapshot.docs[0]
    const userId = userDoc.id

    console.log('✅ Utilisateur trouvé:', userId)

    // Créer une notification de test
    const notificationRef = await adminDb.collection('notifications').add({
      userId,
      title: '🎉 Bienvenue !',
      message: 'Votre système de notifications fonctionne parfaitement !',
      type: 'success',
      read: false,
      createdAt: Timestamp.now()
    })

    console.log('✅ Notification de test créée:', notificationRef.id)

  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

createTestNotification()
