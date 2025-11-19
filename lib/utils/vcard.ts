/**
 * Utility functions for vCard generation (iPhone contacts)
 */

export interface Contact {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: 'captain' | 'coach'
  teamName: string
}

/**
 * Generates a vCard string for a single contact
 * Format compatible with iPhone Contacts app
 */
export function generateVCard(contact: Contact): string {
  const fullName = `${contact.firstName} ${contact.lastName}`.trim()
  const roleLabel = contact.role === 'captain' ? 'Capitaine' : 'Coach'
  const organization = `ComeBac League - ${contact.teamName}`
  const title = `${roleLabel} - ${contact.teamName}`

  let vcard = 'BEGIN:VCARD\n'
  vcard += 'VERSION:3.0\n'
  vcard += `FN:${fullName}\n`
  vcard += `N:${contact.lastName};${contact.firstName};;;\n`
  
  if (contact.phone) {
    // Clean phone number
    const cleanPhone = contact.phone.replace(/\D/g, '')
    vcard += `TEL;TYPE=CELL:${cleanPhone}\n`
  }
  
  if (contact.email) {
    vcard += `EMAIL;TYPE=INTERNET:${contact.email}\n`
  }
  
  vcard += `ORG:${organization}\n`
  vcard += `TITLE:${title}\n`
  vcard += `NOTE:Role: ${roleLabel}, Team: ${contact.teamName}\n`
  vcard += 'END:VCARD\n'

  return vcard
}

/**
 * Generates a vCard file for multiple contacts
 */
export function generateVCardFile(contacts: Contact[]): string {
  return contacts.map(contact => generateVCard(contact)).join('\n')
}

/**
 * Downloads contacts as vCard file for iPhone
 */
export function downloadContactsAsVCard(contacts: Contact[], filename: string = 'comebac-contacts.vcf') {
  if (contacts.length === 0) {
    alert('Aucun contact à télécharger.')
    return
  }

  const vcardContent = generateVCardFile(contacts)
  const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Opens contacts in default mail client (for iOS)
 * iOS can import vCard files from Mail app
 */
export function shareContactsViaMail(contacts: Contact[]) {
  if (contacts.length === 0) {
    alert('Aucun contact à partager.')
    return
  }

  const vcardContent = generateVCardFile(contacts)
  const blob = new Blob([vcardContent], { type: 'text/vcard;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  // Create a mailto link with attachment (works on iOS)
  const subject = encodeURIComponent('Contacts ComeBac League')
  const body = encodeURIComponent(
    `Bonjour,\n\nVeuillez trouver ci-joint les contacts de la ComeBac League.\n\n` +
    `Pour les importer sur iPhone:\n` +
    `1. Ouvrez ce fichier .vcf sur votre iPhone\n` +
    `2. Appuyez sur "Ajouter tous les contacts"\n\n` +
    `Total: ${contacts.length} contact(s)`
  )

  // Note: Direct attachment in mailto doesn't work, so we'll use download instead
  // and show instructions
  downloadContactsAsVCard(contacts)
  
  alert(
    `Fichier de contacts téléchargé!\n\n` +
    `Pour l'importer sur iPhone:\n` +
    `1. Ouvrez le fichier .vcf téléchargé\n` +
    `2. Sélectionnez "Ouvrir avec Contacts"\n` +
    `3. Appuyez sur "Ajouter tous les contacts"\n\n` +
    `Ou envoyez-vous le fichier par email et ouvrez-le sur votre iPhone.`
  )
}

