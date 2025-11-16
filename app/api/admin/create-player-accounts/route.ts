import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { generateWelcomeEmail, sendEmail } from '@/lib/email-service'
import { getPasswordResetActionCodeSettings } from '@/lib/password-reset'

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

        // 3. Récupérer le nom de l'équipe
        let teamName = 'votre équipe'
        try {
          const teamDoc = await firestore.collection('teams').doc(teamId).get()
          if (teamDoc.exists) {
            teamName = teamDoc.data()?.name || teamName
          } else {
            const regDoc = await firestore.collection('teamRegistrations').doc(teamId).get()
            if (regDoc.exists) {
              teamName = regDoc.data()?.teamName || teamName
            }
          }
        } catch (error) {
          console.log('⚠️ Impossible de récupérer le nom de l\'équipe')
        }

        // 4. Générer le lien de réinitialisation de mot de passe
        const resetLink = await auth.generatePasswordResetLink(player.email, getPasswordResetActionCodeSettings(player.email))

        console.log(`✅ Lien de réinitialisation généré`)

        // 5. Envoyer l'email avec le nouveau template
        const playerName = `${player.firstName} ${player.lastName}`
        const emailData = generateWelcomeEmail(playerName, teamName, resetLink, player.email)
        await sendEmail(emailData)

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
