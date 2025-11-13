// Système de badges pour les joueurs basé sur leurs statistiques réelles

export interface PlayerStats {
  matchesPlayed: number
  minutesPlayed: number
  goals: number
  assists: number
  yellowCards: number
  redCards: number
  cleanSheets?: number
  saves?: number
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export function calculatePlayerBadges(stats: PlayerStats, position: string): Badge[] {
  const badges: Badge[] = []

  // Badges de participation
  if (stats.matchesPlayed >= 1) {
    badges.push({
      id: 'debut',
      name: 'Débuts',
      description: 'Premier match joué',
      icon: '⚽',
      color: 'bg-gray-500',
      rarity: 'common'
    })
  }

  if (stats.matchesPlayed >= 5) {
    badges.push({
      id: 'regular',
      name: 'Régulier',
      description: '5 matchs joués',
      icon: '🎯',
      color: 'bg-blue-500',
      rarity: 'common'
    })
  }

  if (stats.matchesPlayed >= 10) {
    badges.push({
      id: 'veteran',
      name: 'Vétéran',
      description: '10 matchs joués',
      icon: '🏅',
      color: 'bg-purple-500',
      rarity: 'rare'
    })
  }

  if (stats.matchesPlayed >= 20) {
    badges.push({
      id: 'legend',
      name: 'Légende',
      description: '20 matchs joués',
      icon: '👑',
      color: 'bg-yellow-500',
      rarity: 'legendary'
    })
  }

  // Badges de buts
  if (stats.goals >= 1) {
    badges.push({
      id: 'first_goal',
      name: 'Premier But',
      description: 'Premier but marqué',
      icon: '⚡',
      color: 'bg-green-500',
      rarity: 'common'
    })
  }

  if (stats.goals >= 3) {
    badges.push({
      id: 'scorer',
      name: 'Buteur',
      description: '3 buts marqués',
      icon: '🔥',
      color: 'bg-orange-500',
      rarity: 'rare'
    })
  }

  if (stats.goals >= 5) {
    badges.push({
      id: 'top_scorer',
      name: 'Top Buteur',
      description: '5 buts marqués',
      icon: '💥',
      color: 'bg-red-500',
      rarity: 'epic'
    })
  }

  if (stats.goals >= 10) {
    badges.push({
      id: 'goal_machine',
      name: 'Machine à Buts',
      description: '10 buts marqués',
      icon: '🚀',
      color: 'bg-red-600',
      rarity: 'legendary'
    })
  }

  // Hat-trick (3 buts en un match - à implémenter avec données match)
  if (stats.goals >= 3 && stats.matchesPlayed >= 1) {
    const avgGoalsPerMatch = stats.goals / stats.matchesPlayed
    if (avgGoalsPerMatch >= 2) {
      badges.push({
        id: 'hat_trick',
        name: 'Hat-Trick',
        description: 'Moyenne de 2+ buts/match',
        icon: '🎩',
        color: 'bg-purple-600',
        rarity: 'epic'
      })
    }
  }

  // Badges de passes décisives
  if (stats.assists >= 1) {
    badges.push({
      id: 'first_assist',
      name: 'Première Passe',
      description: 'Première passe décisive',
      icon: '🎯',
      color: 'bg-cyan-500',
      rarity: 'common'
    })
  }

  if (stats.assists >= 3) {
    badges.push({
      id: 'playmaker',
      name: 'Passeur',
      description: '3 passes décisives',
      icon: '🎨',
      color: 'bg-indigo-500',
      rarity: 'rare'
    })
  }

  if (stats.assists >= 5) {
    badges.push({
      id: 'maestro',
      name: 'Maestro',
      description: '5 passes décisives',
      icon: '🎭',
      color: 'bg-purple-500',
      rarity: 'epic'
    })
  }

  if (stats.assists >= 10) {
    badges.push({
      id: 'assist_king',
      name: 'Roi des Passes',
      description: '10 passes décisives',
      icon: '👑',
      color: 'bg-purple-600',
      rarity: 'legendary'
    })
  }

  // Badges combinés (buts + passes)
  const totalContributions = stats.goals + stats.assists
  if (totalContributions >= 5) {
    badges.push({
      id: 'contributor',
      name: 'Contributeur',
      description: '5 buts + passes',
      icon: '⭐',
      color: 'bg-yellow-500',
      rarity: 'rare'
    })
  }

  if (totalContributions >= 10) {
    badges.push({
      id: 'star_player',
      name: 'Joueur Étoile',
      description: '10 buts + passes',
      icon: '🌟',
      color: 'bg-yellow-600',
      rarity: 'epic'
    })
  }

  if (totalContributions >= 15) {
    badges.push({
      id: 'mvp',
      name: 'MVP',
      description: '15 buts + passes',
      icon: '💎',
      color: 'bg-cyan-600',
      rarity: 'legendary'
    })
  }

  // Badges défensifs (pour défenseurs et gardiens)
  if (position === 'Défenseur' || position === 'Gardien') {
    if (stats.cleanSheets && stats.cleanSheets >= 1) {
      badges.push({
        id: 'clean_sheet',
        name: 'Cage Inviolée',
        description: 'Premier clean sheet',
        icon: '🛡️',
        color: 'bg-blue-600',
        rarity: 'common'
      })
    }

    if (stats.cleanSheets && stats.cleanSheets >= 3) {
      badges.push({
        id: 'wall',
        name: 'Le Mur',
        description: '3 clean sheets',
        icon: '🧱',
        color: 'bg-gray-600',
        rarity: 'rare'
      })
    }

    if (stats.cleanSheets && stats.cleanSheets >= 5) {
      badges.push({
        id: 'fortress',
        name: 'Forteresse',
        description: '5 clean sheets',
        icon: '🏰',
        color: 'bg-gray-700',
        rarity: 'epic'
      })
    }
  }

  // Badges de discipline
  if (stats.yellowCards === 0 && stats.redCards === 0 && stats.matchesPlayed >= 5) {
    badges.push({
      id: 'fair_play',
      name: 'Fair-Play',
      description: 'Aucun carton en 5 matchs',
      icon: '🤝',
      color: 'bg-green-600',
      rarity: 'rare'
    })
  }

  if (stats.yellowCards === 0 && stats.redCards === 0 && stats.matchesPlayed >= 10) {
    badges.push({
      id: 'gentleman',
      name: 'Gentleman',
      description: 'Aucun carton en 10 matchs',
      icon: '🎩',
      color: 'bg-green-700',
      rarity: 'epic'
    })
  }

  // Badges négatifs (pour motivation)
  if (stats.yellowCards >= 3) {
    badges.push({
      id: 'hot_head',
      name: 'Tête Brûlée',
      description: '3 cartons jaunes',
      icon: '🟨',
      color: 'bg-yellow-600',
      rarity: 'common'
    })
  }

  if (stats.redCards >= 1) {
    badges.push({
      id: 'sent_off',
      name: 'Expulsé',
      description: 'Carton rouge reçu',
      icon: '🟥',
      color: 'bg-red-700',
      rarity: 'rare'
    })
  }

  // Badges de temps de jeu
  if (stats.minutesPlayed >= 450) { // 5 matchs complets
    badges.push({
      id: 'iron_man',
      name: 'Homme de Fer',
      description: '450+ minutes jouées',
      icon: '💪',
      color: 'bg-gray-600',
      rarity: 'rare'
    })
  }

  if (stats.minutesPlayed >= 900) { // 10 matchs complets
    badges.push({
      id: 'endurance',
      name: 'Endurance',
      description: '900+ minutes jouées',
      icon: '🏃',
      color: 'bg-blue-700',
      rarity: 'epic'
    })
  }

  // Badges spéciaux par position
  if (position === 'Attaquant') {
    if (stats.goals >= 1 && stats.matchesPlayed >= 1) {
      const goalsPerMatch = stats.goals / stats.matchesPlayed
      if (goalsPerMatch >= 0.5) {
        badges.push({
          id: 'clinical',
          name: 'Clinique',
          description: '0.5+ but par match',
          icon: '🎯',
          color: 'bg-red-500',
          rarity: 'epic'
        })
      }
    }
  }

  if (position === 'Milieu') {
    if (stats.assists >= 1 && stats.matchesPlayed >= 1) {
      const assistsPerMatch = stats.assists / stats.matchesPlayed
      if (assistsPerMatch >= 0.5) {
        badges.push({
          id: 'orchestrator',
          name: 'Orchestrateur',
          description: '0.5+ passe par match',
          icon: '🎼',
          color: 'bg-indigo-600',
          rarity: 'epic'
        })
      }
    }
  }

  return badges
}

export function getBadgesByRarity(badges: Badge[]): Record<string, Badge[]> {
  return {
    legendary: badges.filter(b => b.rarity === 'legendary'),
    epic: badges.filter(b => b.rarity === 'epic'),
    rare: badges.filter(b => b.rarity === 'rare'),
    common: badges.filter(b => b.rarity === 'common')
  }
}

export function getTopBadges(badges: Badge[], count: number = 3): Badge[] {
  const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 }
  return badges
    .sort((a, b) => rarityOrder[b.rarity] - rarityOrder[a.rarity])
    .slice(0, count)
}

// Obtenir tous les badges possibles (pour afficher ceux à débloquer)
export function getAllPossibleBadges(position: string): Badge[] {
  const allBadges: Badge[] = [
    // Participation
    { id: 'debut', name: 'Débuts', description: 'Jouer votre premier match', icon: '⚽', color: 'bg-gray-500', rarity: 'common' },
    { id: 'regular', name: 'Régulier', description: 'Jouer 5 matchs', icon: '🎯', color: 'bg-blue-500', rarity: 'common' },
    { id: 'veteran', name: 'Vétéran', description: 'Jouer 10 matchs', icon: '🏅', color: 'bg-purple-500', rarity: 'rare' },
    { id: 'legend', name: 'Légende', description: 'Jouer 20 matchs', icon: '👑', color: 'bg-yellow-500', rarity: 'legendary' },
    
    // Buts
    { id: 'first_goal', name: 'Premier But', description: 'Marquer votre premier but', icon: '⚡', color: 'bg-green-500', rarity: 'common' },
    { id: 'scorer', name: 'Buteur', description: 'Marquer 3 buts', icon: '🔥', color: 'bg-orange-500', rarity: 'rare' },
    { id: 'top_scorer', name: 'Top Buteur', description: 'Marquer 5 buts', icon: '💥', color: 'bg-red-500', rarity: 'epic' },
    { id: 'goal_machine', name: 'Machine à Buts', description: 'Marquer 10 buts', icon: '🚀', color: 'bg-red-600', rarity: 'legendary' },
    { id: 'hat_trick', name: 'Hat-Trick', description: 'Moyenne de 2+ buts/match', icon: '🎩', color: 'bg-purple-600', rarity: 'epic' },
    
    // Passes
    { id: 'first_assist', name: 'Première Passe', description: 'Faire votre première passe décisive', icon: '🎯', color: 'bg-cyan-500', rarity: 'common' },
    { id: 'playmaker', name: 'Passeur', description: 'Faire 3 passes décisives', icon: '🎨', color: 'bg-indigo-500', rarity: 'rare' },
    { id: 'maestro', name: 'Maestro', description: 'Faire 5 passes décisives', icon: '🎭', color: 'bg-purple-500', rarity: 'epic' },
    { id: 'assist_king', name: 'Roi des Passes', description: 'Faire 10 passes décisives', icon: '👑', color: 'bg-purple-600', rarity: 'legendary' },
    
    // Combinés
    { id: 'contributor', name: 'Contributeur', description: '5 buts + passes', icon: '⭐', color: 'bg-yellow-500', rarity: 'rare' },
    { id: 'star_player', name: 'Joueur Étoile', description: '10 buts + passes', icon: '🌟', color: 'bg-yellow-600', rarity: 'epic' },
    { id: 'mvp', name: 'MVP', description: '15 buts + passes', icon: '💎', color: 'bg-cyan-600', rarity: 'legendary' },
    
    // Discipline
    { id: 'fair_play', name: 'Fair-Play', description: 'Aucun carton en 5 matchs', icon: '🤝', color: 'bg-green-600', rarity: 'rare' },
    { id: 'gentleman', name: 'Gentleman', description: 'Aucun carton en 10 matchs', icon: '🎩', color: 'bg-green-700', rarity: 'epic' },
    { id: 'hot_head', name: 'Tête Brûlée', description: 'Recevoir 3 cartons jaunes', icon: '🟨', color: 'bg-yellow-600', rarity: 'common' },
    { id: 'sent_off', name: 'Expulsé', description: 'Recevoir un carton rouge', icon: '🟥', color: 'bg-red-700', rarity: 'rare' },
    
    // Temps de jeu
    { id: 'iron_man', name: 'Homme de Fer', description: 'Jouer 450+ minutes', icon: '💪', color: 'bg-gray-600', rarity: 'rare' },
    { id: 'endurance', name: 'Endurance', description: 'Jouer 900+ minutes', icon: '🏃', color: 'bg-blue-700', rarity: 'epic' },
  ]

  // Badges spécifiques par position
  if (position === 'Défenseur' || position === 'Gardien') {
    allBadges.push(
      { id: 'clean_sheet', name: 'Cage Inviolée', description: 'Premier clean sheet', icon: '🛡️', color: 'bg-blue-600', rarity: 'common' },
      { id: 'wall', name: 'Le Mur', description: '3 clean sheets', icon: '🧱', color: 'bg-gray-600', rarity: 'rare' },
      { id: 'fortress', name: 'Forteresse', description: '5 clean sheets', icon: '🏰', color: 'bg-gray-700', rarity: 'epic' }
    )
  }

  if (position === 'Attaquant') {
    allBadges.push(
      { id: 'clinical', name: 'Clinique', description: '0.5+ but par match', icon: '🎯', color: 'bg-red-500', rarity: 'epic' }
    )
  }

  if (position === 'Milieu') {
    allBadges.push(
      { id: 'orchestrator', name: 'Orchestrateur', description: '0.5+ passe par match', icon: '🎼', color: 'bg-indigo-600', rarity: 'epic' }
    )
  }

  return allBadges
}
