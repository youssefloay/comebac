import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
  try {
    const { 
      title, 
      message, 
      targetType, // 'all', 'players', 'coaches', 'users', 'team', 'specific'
      teamId,
      specificEmails,
      priority, // 'low', 'normal', 'high'
      actionUrl
    } = await request.json()

    if (!title || !message || !targetType) {
      return NextResponse.json(
        { error: 'title, message et targetType requis' },
        { status: 400 }
      )
    }

    console.log(`📢 Envoi de notification: "${title}"`)
    console.log(`🎯 Cible: ${targetType}`)

    let recipients: Array<{ email: string; name: string; type: string; teamName?: string }> = []

    // Récupérer les destinataires selon le type
    if (targetType === 'all' || targetType === 'players') {
      const playersSnap = await adminDb.collection('playerAccounts').get()
      playersSnap.docs.forEach(doc => {
        const data = doc.data()
        if (data.email) {
          recipients.push({
            email: data.email,
            name: `${data.firstName} ${data.lastName}`,
            type: 'player',
            teamName: data.teamName
          })
        }
      })
    }

    if (targetType === 'all' || targetType === 'coaches') {
      const coachesSnap = await adminDb.collection('coachAccounts').get()
      coachesSnap.docs.forEach(doc => {
        const data = doc.data()
        if (data.email) {
          recipients.push({
            email: data.email,
            name: `${data.firstName} ${data.lastName}`,
            type: 'coach',
            teamName: data.teamName
          })
        }
      })
    }

    if (targetType === 'all' || targetType === 'users') {
      const usersSnap = await adminDb.collection('users').get()
      usersSnap.docs.forEach(doc => {
        const data = doc.data()
        if (data.email) {
          recipients.push({
            email: data.email,
            name: data.displayName || data.name || data.email,
            type: 'user',
            teamName: undefined
          })
        }
      })
    }

    if (targetType === 'team' && teamId) {
      // Joueurs de l'équipe
      const playersSnap = await adminDb.collection('playerAccounts')
        .where('teamId', '==', teamId)
        .get()
      playersSnap.docs.forEach(doc => {
        const data = doc.data()
        if (data.email) {
          recipients.push({
            email: data.email,
            name: `${data.firstName} ${data.lastName}`,
            type: 'player',
            teamName: data.teamName
          })
        }
      })

      // Coaches de l'équipe
      const coachesSnap = await adminDb.collection('coachAccounts')
        .where('teamId', '==', teamId)
        .get()
      coachesSnap.docs.forEach(doc => {
        const data = doc.data()
        if (data.email) {
          recipients.push({
            email: data.email,
            name: `${data.firstName} ${data.lastName}`,
            type: 'coach',
            teamName: data.teamName
          })
        }
      })
    }

    if (targetType === 'specific' && specificEmails && specificEmails.length > 0) {
      // Chercher dans playerAccounts
      for (const email of specificEmails) {
        const playerSnap = await adminDb.collection('playerAccounts')
          .where('email', '==', email)
          .limit(1)
          .get()
        
        if (!playerSnap.empty) {
          const data = playerSnap.docs[0].data()
          recipients.push({
            email: data.email,
            name: `${data.firstName} ${data.lastName}`,
            type: 'player',
            teamName: data.teamName
          })
          continue
        }

        // Chercher dans coachAccounts
        const coachSnap = await adminDb.collection('coachAccounts')
          .where('email', '==', email)
          .limit(1)
          .get()
        
        if (!coachSnap.empty) {
          const data = coachSnap.docs[0].data()
          recipients.push({
            email: data.email,
            name: `${data.firstName} ${data.lastName}`,
            type: 'coach',
            teamName: data.teamName
          })
          continue
        }

        // Chercher dans users
        const userSnap = await adminDb.collection('users')
          .where('email', '==', email)
          .limit(1)
          .get()
        
        if (!userSnap.empty) {
          const data = userSnap.docs[0].data()
          recipients.push({
            email: data.email,
            name: data.displayName || data.name || data.email,
            type: 'user',
            teamName: undefined
          })
        }
      }
    }

    // Supprimer les doublons
    recipients = recipients.filter((recipient, index, self) =>
      index === self.findIndex(r => r.email === recipient.email)
    )

    console.log(`📊 ${recipients.length} destinataire(s) trouvé(s)`)

    // Créer la notification dans Firestore
    const notificationRef = await adminDb.collection('customNotifications').add({
      title,
      message,
      targetType,
      teamId: teamId || null,
      specificEmails: specificEmails || [],
      priority: priority || 'normal',
      actionUrl: actionUrl || null,
      recipientCount: recipients.length,
      recipients: recipients.map(r => ({
        email: r.email,
        name: r.name,
        type: r.type,
        teamName: r.teamName,
        read: false,
        readAt: null
      })),
      createdAt: new Date(),
      createdBy: 'admin',
      readCount: 0
    })

    console.log(`✅ Notification créée avec ID: ${notificationRef.id}`)

    // Envoyer les notifications push à chaque destinataire
    let sentCount = 0
    let errorCount = 0
    const results = []

    for (const recipient of recipients) {
      try {
        // Créer une notification individuelle pour chaque utilisateur
        await adminDb.collection('notifications').add({
          userId: recipient.email,
          title,
          message,
          type: 'custom',
          priority: priority || 'normal',
          actionUrl: actionUrl || null,
          customNotificationId: notificationRef.id,
          read: false,
          createdAt: new Date()
        })

        sentCount++
        results.push({
          email: recipient.email,
          name: recipient.name,
          status: 'sent'
        })
      } catch (error: any) {
        errorCount++
        results.push({
          email: recipient.email,
          name: recipient.name,
          status: 'error',
          error: error.message
        })
      }
    }

    console.log(`✅ ${sentCount} notification(s) envoyée(s), ${errorCount} erreur(s)`)

    return NextResponse.json({
      success: true,
      message: `✅ Notification envoyée à ${sentCount} personne(s)`,
      notificationId: notificationRef.id,
      recipientCount: recipients.length,
      sentCount,
      errorCount,
      results
    })

  } catch (error: any) {
    console.error('❌ Erreur:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur serveur' },
      { status: 500 }
    )
  }
}
