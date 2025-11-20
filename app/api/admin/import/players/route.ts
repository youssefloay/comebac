import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore'

// Fonction pour parser le CSV
function parseCSV(csvText: string): string[][] {
  const lines: string[] = []
  let currentLine: string[] = []
  let currentField = ''
  let inQuotes = false

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i]
    const nextChar = csvText[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"'
        i++ // Skip next quote
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      currentLine.push(currentField.trim())
      currentField = ''
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (currentField || currentLine.length > 0) {
        currentLine.push(currentField.trim())
        if (currentLine.length > 0) {
          lines.push(currentLine)
        }
        currentLine = []
        currentField = ''
      }
      if (char === '\r' && nextChar === '\n') {
        i++ // Skip \n after \r
      }
    } else {
      currentField += char
    }
  }

  if (currentField || currentLine.length > 0) {
    currentLine.push(currentField.trim())
    if (currentLine.length > 0) {
      lines.push(currentLine)
    }
  }

  return lines
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'Fichier CSV requis' },
        { status: 400 }
      )
    }

    const text = await file.text()
    const lines = parseCSV(text)

    if (lines.length < 2) {
      return NextResponse.json(
        { error: 'Le fichier CSV doit contenir au moins un en-tête et une ligne de données' },
        { status: 400 }
      )
    }

    const headers = lines[0].map(h => h.toLowerCase().trim())
    const dataLines = lines.slice(1)

    // Mapping des colonnes attendues
    const emailIndex = headers.findIndex(h => h.includes('email'))
    const firstNameIndex = headers.findIndex(h => h.includes('prénom') || h.includes('prenom') || h.includes('firstname'))
    const lastNameIndex = headers.findIndex(h => h.includes('nom') && !h.includes('équipe') && !h.includes('equipe') || h.includes('lastname'))
    const teamIdIndex = headers.findIndex(h => h.includes('équipe') || h.includes('equipe') || h.includes('teamid'))
    const teamNameIndex = headers.findIndex(h => h.includes('nom équipe') || h.includes('teamname'))
    const phoneIndex = headers.findIndex(h => h.includes('téléphone') || h.includes('telephone') || h.includes('phone'))
    const positionIndex = headers.findIndex(h => h.includes('poste') || h.includes('position'))
    const numberIndex = headers.findIndex(h => h.includes('numéro') || h.includes('numero') || h.includes('number') || h === 'n°')
    const birthDateIndex = headers.findIndex(h => h.includes('naissance') || h.includes('birthdate'))
    const heightIndex = headers.findIndex(h => h.includes('taille') || h.includes('height'))
    const footIndex = headers.findIndex(h => h.includes('pied') || h.includes('foot'))
    const nicknameIndex = headers.findIndex(h => h.includes('surnom') || h.includes('nickname'))
    const tshirtSizeIndex = headers.findIndex(h => h.includes('t-shirt') || h.includes('tshirt'))

    if (emailIndex === -1 || firstNameIndex === -1 || lastNameIndex === -1) {
      return NextResponse.json(
        { error: 'Le CSV doit contenir au minimum: Email, Prénom, Nom' },
        { status: 400 }
      )
    }

    let created = 0
    let updated = 0
    let errors: string[] = []

    for (let i = 0; i < dataLines.length; i++) {
      const row = dataLines[i]
      if (row.length < headers.length) continue

      try {
        const email = row[emailIndex]?.trim()
        const firstName = row[firstNameIndex]?.trim()
        const lastName = row[lastNameIndex]?.trim()
        const teamId = row[teamIdIndex]?.trim() || ''
        const teamName = row[teamNameIndex]?.trim() || ''
        const phone = row[phoneIndex]?.trim() || ''
        const position = row[positionIndex]?.trim() || ''
        const number = row[numberIndex] ? parseInt(row[numberIndex]) : null
        const birthDate = row[birthDateIndex]?.trim() || ''
        const height = row[heightIndex] ? parseInt(row[heightIndex]) : null
        const foot = row[footIndex]?.trim() || ''
        const nickname = row[nicknameIndex]?.trim() || ''
        const tshirtSize = row[tshirtSizeIndex]?.trim() || 'M'

        if (!email || !firstName || !lastName) {
          errors.push(`Ligne ${i + 2}: Email, Prénom et Nom requis`)
          continue
        }

        // Chercher si le joueur existe déjà
        const playersQuery = query(
          collection(db, 'players'),
          where('email', '==', email)
        )
        const existingPlayers = await getDocs(playersQuery)

        const playerData: any = {
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
          email,
          phone: phone || '',
          position: position || '',
          jerseyNumber: number || 0,
          number: number || 0,
          birthDate: birthDate || null,
          height: height || null,
          strongFoot: foot || 'Droit',
          foot: foot || 'Droit',
          nickname: nickname || '',
          tshirtSize: tshirtSize || 'M',
          updatedAt: new Date()
        }

        if (teamId) {
          playerData.teamId = teamId
        }
        if (teamName) {
          playerData.teamName = teamName
        }

        if (birthDate) {
          try {
            const birth = new Date(birthDate)
            const age = new Date().getFullYear() - birth.getFullYear()
            playerData.age = age
          } catch (e) {
            // Ignore age calculation error
          }
        }

        if (!existingPlayers.empty) {
          // Mettre à jour le joueur existant
          const playerDoc = existingPlayers.docs[0]
          await updateDoc(doc(db, 'players', playerDoc.id), playerData)
          updated++
        } else {
          // Créer un nouveau joueur
          playerData.createdAt = new Date()
          await addDoc(collection(db, 'players'), playerData)
          created++
        }
      } catch (error: any) {
        errors.push(`Ligne ${i + 2}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import terminé: ${created} créé(s), ${updated} mis à jour`,
      created,
      updated,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error: any) {
    console.error('Erreur import joueurs:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'import', details: error.message },
      { status: 500 }
    )
  }
}

