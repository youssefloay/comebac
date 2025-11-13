/**
 * Système de génération automatique de couleurs pour les équipes
 * Utilise une palette limitée de 2-4 couleurs pour un design cohérent
 */

// Palette limitée de couleurs (2-4 couleurs max)
export const TEAM_COLOR_PALETTE = [
  {
    primary: '#000000',      // Noir
    light: '#f5f5f5',        // Gris très clair
    medium: '#e5e5e5',       // Gris clair
    dark: '#1a1a1a',         // Gris foncé
  },
  {
    primary: '#3b82f6',      // Bleu
    light: '#eff6ff',        // Bleu très clair
    medium: '#dbeafe',       // Bleu clair
    dark: '#1e40af',         // Bleu foncé
  },
  {
    primary: '#10b981',      // Vert
    light: '#ecfdf5',        // Vert très clair
    medium: '#d1fae5',       // Vert clair
    dark: '#059669',         // Vert foncé
  },
  {
    primary: '#6366f1',      // Indigo (optionnel, 4ème couleur)
    light: '#eef2ff',        // Indigo très clair
    medium: '#e0e7ff',       // Indigo clair
    dark: '#4f46e5',         // Indigo foncé
  },
]

/**
 * Génère une couleur pour une équipe basée sur son ID ou nom
 * @param teamId - ID de l'équipe
 * @param teamName - Nom de l'équipe (optionnel, utilisé comme fallback)
 * @returns Objet avec les couleurs de l'équipe
 */
export function getTeamColor(teamId: string | null | undefined, teamName?: string): {
  primary: string
  light: string
  medium: string
  dark: string
} {
  // Utiliser l'ID de l'équipe ou le nom comme seed
  const seed = teamId || teamName || 'default'
  
  // Créer un hash simple à partir du seed
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // Sélectionner une couleur de la palette basée sur le hash
  const index = Math.abs(hash) % TEAM_COLOR_PALETTE.length
  return TEAM_COLOR_PALETTE[index]
}

/**
 * Génère une couleur pour une équipe (version simple, retourne juste la couleur primaire)
 * @param teamId - ID de l'équipe
 * @param teamName - Nom de l'équipe (optionnel)
 * @returns Couleur hexadécimale
 */
export function getTeamColorSimple(teamId: string | null | undefined, teamName?: string): string {
  return getTeamColor(teamId, teamName).primary
}

/**
 * Génère une classe Tailwind pour le fond d'une équipe
 * @param teamId - ID de l'équipe
 * @param teamName - Nom de l'équipe (optionnel)
 * @param variant - Variante de couleur ('light', 'medium', 'dark', ou 'primary')
 * @returns Classe Tailwind ou style inline
 */
export function getTeamColorClass(
  teamId: string | null | undefined,
  teamName?: string,
  variant: 'light' | 'medium' | 'dark' | 'primary' = 'light'
): string {
  const colors = getTeamColor(teamId, teamName)
  return colors[variant === 'primary' ? 'primary' : variant]
}

/**
 * Génère un style inline pour le fond d'une équipe
 * @param teamId - ID de l'équipe
 * @param teamName - Nom de l'équipe (optionnel)
 * @param variant - Variante de couleur
 * @returns Style CSS inline
 */
export function getTeamColorStyle(
  teamId: string | null | undefined,
  teamName?: string,
  variant: 'light' | 'medium' | 'dark' | 'primary' = 'light'
): React.CSSProperties {
  const colors = getTeamColor(teamId, teamName)
  return {
    backgroundColor: colors[variant === 'primary' ? 'primary' : variant],
  }
}

/**
 * Génère un style inline pour le texte d'une équipe
 * @param teamId - ID de l'équipe
 * @param teamName - Nom de l'équipe (optionnel)
 * @returns Style CSS inline pour la couleur du texte
 */
export function getTeamTextColorStyle(
  teamId: string | null | undefined,
  teamName?: string
): React.CSSProperties {
  const colors = getTeamColor(teamId, teamName)
  return {
    color: colors.primary,
  }
}

