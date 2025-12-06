import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { sendEmail } from '@/lib/email-service'
import { getSpectatorApprovalEmailHtml, getSpectatorRejectionEmailHtml } from '@/lib/email-templates'
import { getPreseasonMatchById } from '@/lib/preseason/db'
import QRCode from 'qrcode'
import crypto from 'crypto'

// PUT - Mettre à jour le statut d'une demande
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
    }

    const { id } = await Promise.resolve(params)
    const body = await request.json()
    const { status, checkedIn } = body

    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    const updateData: any = {
      updatedAt: Timestamp.now()
    }

    // Récupérer la demande avant mise à jour pour envoyer l'email
    const requestDoc = await adminDb.collection('spectatorRequests').doc(id).get()
    if (!requestDoc.exists) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    const requestData = requestDoc.data()!
    const oldStatus = requestData.status

    // Générer un token QR code unique lors de l'approbation (avant la mise à jour)
    let qrCodeToken: string | null = null
    if (status && status === 'approved' && oldStatus !== 'approved') {
      // Générer un token unique sécurisé
      qrCodeToken = crypto.randomBytes(32).toString('hex')
      updateData.qrCodeToken = qrCodeToken
    } else if (status && status === 'rejected') {
      // Supprimer le token si la demande est rejetée
      updateData.qrCodeToken = null
    }

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      updateData.status = status
    }

    if (checkedIn !== undefined) {
      // Vérifier que la demande est approuvée avant de permettre le check-in
      if (checkedIn && requestData.status !== 'approved') {
        return NextResponse.json(
          { error: 'Only approved requests can be checked in' },
          { status: 400 }
        )
      }

      // Si on essaie de check-in, vérifier qu'il n'y a pas déjà un autre check-in avec le même email ou téléphone pour ce match
      if (checkedIn) {
        const normalizedEmail = requestData.email?.toLowerCase().trim() || ''
        const normalizedPhone = (requestData.phone?.trim().replace(/\s+/g, '') || '')

        // Chercher toutes les demandes pour ce match
        const allMatchRequests = await adminDb.collection('spectatorRequests')
          .where('matchId', '==', requestData.matchId)
          .where('matchType', '==', requestData.matchType)
          .get()

        // Vérifier s'il y a déjà un check-in avec le même email (sauf la demande actuelle)
        const duplicateEmailCheckIn = allMatchRequests.docs.find(doc => {
          if (doc.id === id) return false // Ignorer la demande actuelle
          const data = doc.data()
          return data.checkedIn === true && 
                 data.email?.toLowerCase().trim() === normalizedEmail
        })

        if (duplicateEmailCheckIn) {
          const duplicateData = duplicateEmailCheckIn.data()
          return NextResponse.json(
            { 
              error: `This email is already checked in for this match (${duplicateData.firstName} ${duplicateData.lastName})` 
            },
            { status: 400 }
          )
        }

        // Vérifier s'il y a déjà un check-in avec le même téléphone (sauf la demande actuelle)
        const duplicatePhoneCheckIn = allMatchRequests.docs.find(doc => {
          if (doc.id === id) return false // Ignorer la demande actuelle
          const data = doc.data()
          const docPhone = data.phone?.trim().replace(/\s+/g, '') || ''
          return data.checkedIn === true && docPhone === normalizedPhone && normalizedPhone !== ''
        })

        if (duplicatePhoneCheckIn) {
          const duplicateData = duplicatePhoneCheckIn.data()
          return NextResponse.json(
            { 
              error: `This phone number is already checked in for this match (${duplicateData.firstName} ${duplicateData.lastName})` 
            },
            { status: 400 }
          )
        }
      }

      updateData.checkedIn = checkedIn
      if (checkedIn) {
        updateData.checkedInAt = Timestamp.now()
      } else {
        updateData.checkedInAt = null
      }
    }

    // Sauvegarder d'abord pour avoir le token disponible
    await adminDb.collection('spectatorRequests').doc(id).update(updateData)

    // Envoyer un email si le statut a changé vers approved ou rejected
    if (status && status !== oldStatus && (status === 'approved' || status === 'rejected')) {
      console.log(`📧 Preparing to send email for request ${id}: ${oldStatus} -> ${status}`)
      console.log(`📧 Request data:`, { email: requestData.email, firstName: requestData.firstName, lastName: requestData.lastName })
      
      try {
        // Récupérer les informations du match
        let matchDate = ''
        let matchTime = ''
        let venue = ''
        const matchType = requestData.matchType

        console.log(`📧 Fetching match info: type=${matchType}, id=${requestData.matchId}`)

        if (matchType === 'preseason') {
          const preseasonMatch = await getPreseasonMatchById(requestData.matchId)
          if (preseasonMatch) {
            matchDate = preseasonMatch.date.toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
            matchTime = preseasonMatch.time || ''
            venue = preseasonMatch.location || ''
            console.log(`📧 Preseason match found: ${matchDate} ${matchTime}`)
          } else {
            console.warn(`📧 Preseason match not found: ${requestData.matchId}`)
          }
        } else {
          const regularMatch = await adminDb.collection('matches').doc(requestData.matchId).get()
          if (regularMatch.exists) {
            const matchData = regularMatch.data()
            const date = matchData?.date?.toDate ? matchData.date.toDate() : new Date(matchData?.date)
            matchDate = date.toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })
            matchTime = date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
            venue = matchData?.venue || matchData?.location || ''
            console.log(`📧 Regular match found: ${matchDate} ${matchTime}`)
          } else {
            console.warn(`📧 Regular match not found: ${requestData.matchId}`)
          }
        }

        let emailHtml = ''
        let emailSubject = ''

        if (status === 'approved') {
          emailSubject = 'Request Approved / Demande approuvée - ComeBac League'
          
          // Générer le QR code si un token existe
          let qrCodeDataUrl = ''
          if (qrCodeToken) {
            try {
              // Générer le QR code avec l'URL complète contenant le token
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
              const qrCodeUrl = `${baseUrl}/api/spectators/qr/${qrCodeToken}`
              qrCodeDataUrl = await QRCode.toDataURL(qrCodeUrl, {
                errorCorrectionLevel: 'M',
                type: 'image/png',
                width: 300,
                margin: 2
              })
              console.log('✅ QR code generated successfully for token:', qrCodeToken.substring(0, 8) + '...')
            } catch (qrError: any) {
              console.error('❌ Error generating QR code:', qrError)
            }
          }
          
          emailHtml = getSpectatorApprovalEmailHtml(
            requestData.firstName,
            requestData.lastName,
            requestData.teamName,
            matchDate,
            matchTime,
            venue,
            matchType,
            qrCodeDataUrl
          )
          console.log(`📧 Generated approval email HTML (${emailHtml.length} chars)`)
        } else if (status === 'rejected') {
          emailSubject = 'Request Rejected / Demande refusée - ComeBac League'
          emailHtml = getSpectatorRejectionEmailHtml(
            requestData.firstName,
            requestData.lastName,
            requestData.teamName,
            matchDate
          )
          console.log(`📧 Generated rejection email HTML (${emailHtml.length} chars)`)
        }

        if (emailHtml && requestData.email) {
          console.log(`📧 Sending email to: ${requestData.email}`)
          const emailResult = await sendEmail({
            to: requestData.email,
            subject: emailSubject,
            html: emailHtml
          })
          
          if (emailResult.success) {
            console.log(`✅ Email sent successfully to ${requestData.email} for ${status} status`)
            console.log(`✅ Email ID: ${emailResult.data?.id || 'N/A'}`)
          } else {
            console.error(`❌ Failed to send email to ${requestData.email}:`, emailResult.error)
          }
        } else {
          console.warn(`⚠️ Cannot send email: emailHtml=${!!emailHtml}, email=${requestData.email}`)
        }
      } catch (emailError: any) {
        console.error('❌ Error sending email to spectator:', emailError)
        console.error('❌ Error details:', emailError.message, emailError.stack)
        // Ne pas faire échouer la requête si l'email échoue
      }
    } else {
      console.log(`📧 Email not sent: status=${status}, oldStatus=${oldStatus}, condition=${status && status !== oldStatus && (status === 'approved' || status === 'rejected')}`)
    }

    return NextResponse.json({ message: 'Request updated successfully' })
  } catch (error: any) {
    console.error('Error updating spectator request:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update request' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer une demande
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    if (!adminDb) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 })
    }

    const { id } = await Promise.resolve(params)

    if (!id) {
      return NextResponse.json({ error: 'Request ID is required' }, { status: 400 })
    }

    await adminDb.collection('spectatorRequests').doc(id).delete()

    return NextResponse.json({ message: 'Request deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting spectator request:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete request' },
      { status: 500 }
    )
  }
}
