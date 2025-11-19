/**
 * Utility functions for WhatsApp integration
 */

export interface Contact {
  id: string
  firstName: string
  lastName: string
  phone?: string
  role: 'captain' | 'coach'
  teamName: string
}

/**
 * Creates a WhatsApp group invite link
 * Note: WhatsApp doesn't support direct group invite links via API
 * This creates a chat link with pre-filled message
 */
export function createWhatsAppGroupLink(phoneNumbers: string[]): string {
  // Remove non-numeric characters and ensure format
  const cleanNumbers = phoneNumbers
    .map(num => num.replace(/\D/g, ''))
    .filter(num => num.length > 0)
    .map(num => {
      // Add country code if missing (assuming +33 for France)
      if (num.startsWith('0')) {
        return '33' + num.substring(1)
      }
      if (!num.startsWith('33')) {
        return '33' + num
      }
      return num
    })

  if (cleanNumbers.length === 0) {
    return ''
  }

  // For multiple contacts, create a message link
  // Note: WhatsApp Web/App doesn't support direct group creation via URL
  // This will open WhatsApp with a message suggesting to create a group
  const message = encodeURIComponent(
    'Bonjour, je souhaite vous ajouter à un groupe WhatsApp pour la ComeBac League.'
  )

  // Use the first number as the main contact
  const firstNumber = cleanNumbers[0]
  return `https://wa.me/${firstNumber}?text=${message}`
}

/**
 * Creates individual WhatsApp chat links for each contact
 */
export function createWhatsAppChatLinks(contacts: Contact[]): Array<{ contact: Contact; link: string }> {
  return contacts
    .filter(contact => contact.phone)
    .map(contact => {
      const cleanNumber = contact.phone!.replace(/\D/g, '')
      let formattedNumber = cleanNumber

      // Add country code if missing
      if (cleanNumber.startsWith('0')) {
        formattedNumber = '33' + cleanNumber.substring(1)
      } else if (!cleanNumber.startsWith('33')) {
        formattedNumber = '33' + cleanNumber
      }

      const message = encodeURIComponent(
        `Bonjour ${contact.firstName}, bienvenue dans la ComeBac League!`
      )

      return {
        contact,
        link: `https://wa.me/${formattedNumber}?text=${message}`
      }
    })
}

/**
 * Opens WhatsApp with selected contacts
 * For mobile: opens WhatsApp app
 * For desktop: opens WhatsApp Web
 */
export function openWhatsAppWithContacts(contacts: Contact[]) {
  const phoneNumbers = contacts
    .filter(c => c.phone)
    .map(c => c.phone!.replace(/\D/g, ''))

  if (phoneNumbers.length === 0) {
    alert('Aucun numéro de téléphone disponible pour les contacts sélectionnés.')
    return
  }

  // For multiple contacts, we'll create individual chat links
  // User can manually create a group in WhatsApp
  if (phoneNumbers.length === 1) {
    const link = createWhatsAppChatLinks(contacts)[0].link
    window.open(link, '_blank')
  } else {
    // Open first contact, user can add others manually
    const firstContact = contacts.find(c => c.phone)
    if (firstContact) {
      const link = createWhatsAppChatLinks([firstContact])[0].link
      window.open(link, '_blank')
      alert(
        `WhatsApp ouvert pour ${firstContact.firstName}. ` +
        `Vous pouvez créer un groupe et ajouter les ${phoneNumbers.length - 1} autres contacts manuellement.`
      )
    }
  }
}

