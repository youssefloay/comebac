/**
 * Capitalise la première lettre de chaque mot
 */
export function capitalizeWords(text: string | undefined | null): string {
  if (!text) return ''
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Capitalise la première lettre d'un texte
 */
export function capitalize(text: string | undefined | null): string {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}
