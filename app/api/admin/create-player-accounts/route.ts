import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { sendEmail } from '@/lib/email-service'

export async function POST(request: NextRequest) {
  try {
    const { teamId, players } = await request.json()

    if (!teamId || !players || !Array.isArray(players)) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 })
    }

    const auth = adminAuth
    const firestore = adminDb

    const results = []

    for (const player of players) {
      try {
        console.log(`📝 Création du compte pour ${player.firstName} ${player.lastName}...`)

        // 1. Créer ou récupérer le compte Firebase Auth
        let userRecord
        try {
          userRecord = await auth.getUserByEmail(player.email)
          console.log(`ℹ️ Utilisateur existant trouvé: ${player.email}`)
        } catch (error) {
          userRecord = await auth.createUser({
            email: player.email,
            password: Math.random().toString(36).slice(-12) + 'Aa1!',
            displayName: `${player.firstName} ${player.lastName}`
          })
          console.log(`✅ Compte Auth créé avec UID: ${userRecord.uid}`)
        }

        // 2. Créer le document dans playerAccounts
        await firestore.collection('playerAccounts').doc(userRecord.uid).set({
          uid: userRecord.uid,
          email: player.email,
          firstName: player.firstName,
          lastName: player.lastName,
          nickname: player.nickname || '',
          phone: player.phone,
          position: player.position,
          jerseyNumber: player.jerseyNumber,
          teamId: teamId,
          birthDate: player.birthDate || '',
          height: player.height || 0,
          tshirtSize: player.tshirtSize || 'M',
          foot: player.foot,
          role: 'player',
          createdAt: new Date(),
          updatedAt: new Date()
        })

        console.log(`✅ Document playerAccounts créé`)

        // 3. Générer le lien de réinitialisation de mot de passe
        const resetLink = await auth.generatePasswordResetLink(player.email)

        console.log(`✅ Lien de réinitialisation généré`)

        // 4. Envoyer l'email
        await sendEmail({
          to: player.email,
          subject: '🎉 Bienvenue sur ComeBac League!',
          html: `
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; padding: 20px;">
              <h2>Bienvenue ${player.firstName}!</h2>
              <p>Ton compte joueur a été créé avec succès.</p>
              <p><strong>Email:</strong> ${player.email}</p>
              <p>Clique sur le lien ci-dessous pour créer ton mot de passe:</p>
              <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0;">
                Créer mon mot de passe
              </a>
              <p style="color: #666; font-size: 14px;">Ce lien expire dans 1 heure.</p>
            </body>
            </html>
          `
        })

        console.log(`✅ Email envoyé à ${player.email}`)

        results.push({ player: `${player.firstName} ${player.lastName}`, success: true })

      } catch (error: any) {
        console.error(`❌ Erreur pour ${player.firstName}:`, error)
        results.push({ player: `${player.firstName} ${player.lastName}`, success: false, error: error.message })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length

    return NextResponse.json({
      success: true,
      message: `${successCount} comptes créés, ${failCount} erreurs`,
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
