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
  penalties?: number // Penalties marqués
  ownGoals?: number // Buts contre son camp
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
  const normalizedPosition = position?.trim() || ''

  // Badges de participation (tous les joueurs)
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

  // Badges de buts - Principalement pour Attaquants et Milieux
  if (normalizedPosition === 'Attaquant' || normalizedPosition === 'Milieu') {
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

    // Hat-trick
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
  } else if (normalizedPosition === 'Défenseur') {
    // Défenseurs : badges de buts plus rares (buts défensifs)
    if (stats.goals >= 2) {
      badges.push({
        id: 'defensive_goal',
        name: 'But Défensif',
        description: '2 buts marqués (défenseur)',
        icon: '⚡',
        color: 'bg-green-600',
        rarity: 'rare'
      })
    }
  } else if (normalizedPosition === 'Gardien') {
    // Gardiens : badges de buts très rares (penalty marqué)
    if (stats.goals >= 1) {
      badges.push({
        id: 'goalkeeper_goal',
        name: 'But de Gardien',
        description: 'But marqué (gardien)',
        icon: '⚡',
        color: 'bg-green-700',
        rarity: 'legendary'
      })
    }
  }

  // Badges de passes décisives - Principalement pour Milieux et Attaquants
  if (normalizedPosition === 'Milieu' || normalizedPosition === 'Attaquant') {
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
  } else if (normalizedPosition === 'Défenseur') {
    // Défenseurs : passes décisives plus rares
    if (stats.assists >= 3) {
      badges.push({
        id: 'defensive_assist',
        name: 'Passe Défensive',
        description: '3 passes décisives (défenseur)',
        icon: '🎯',
        color: 'bg-cyan-600',
        rarity: 'epic'
      })
    }
  }

  // Badges combinés (buts + passes) - Principalement pour Attaquants et Milieux
  if (normalizedPosition === 'Attaquant' || normalizedPosition === 'Milieu') {
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
  }

  // Badges défensifs - Gardiens et Défenseurs
  if (normalizedPosition === 'Défenseur' || normalizedPosition === 'Gardien') {
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

    if (stats.cleanSheets && stats.cleanSheets >= 10) {
      badges.push({
        id: 'impregnable',
        name: 'Imprenable',
        description: '10 clean sheets',
        icon: '🏛️',
        color: 'bg-gray-800',
        rarity: 'legendary'
      })
    }
  }

  // Badges spécifiques aux Gardiens (basés uniquement sur clean sheets et matchs joués)
  if (normalizedPosition === 'Gardien') {
    // Badge pour gardiens avec beaucoup de matchs sans encaisser
    if (stats.cleanSheets && stats.cleanSheets >= 5 && stats.matchesPlayed >= 10) {
      badges.push({
        id: 'guardian',
        name: 'Gardien',
        description: '5+ clean sheets en 10+ matchs',
        icon: '🛡️',
        color: 'bg-blue-600',
        rarity: 'epic'
      })
    }
  }

  // Badges spécifiques aux Défenseurs
  if (normalizedPosition === 'Défenseur') {
    // Badge pour défenseurs avec peu de buts encaissés (nécessite cleanSheets)
    if (stats.cleanSheets && stats.cleanSheets >= 3 && stats.matchesPlayed >= 5) {
      badges.push({
        id: 'rock_defense',
        name: 'Rocher Défensif',
        description: '3+ clean sheets en 5+ matchs',
        icon: '🗿',
        color: 'bg-gray-600',
        rarity: 'epic'
      })
    }
  }

  // Badges de discipline (tous les joueurs)
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

  // Badges de temps de jeu (tous les joueurs)
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

  // Badges de penalties (tous les joueurs)
  if (stats.penalties && stats.penalties >= 1) {
    badges.push({
      id: 'penalty_taker',
      name: 'Tireur de Penalty',
      description: 'Premier penalty marqué',
      icon: '🎯',
      color: 'bg-purple-500',
      rarity: 'common'
    })
  }

  if (stats.penalties && stats.penalties >= 3) {
    badges.push({
      id: 'penalty_specialist',
      name: 'Spécialiste Penalty',
      description: '3 penalties marqués',
      icon: '⚡',
      color: 'bg-purple-600',
      rarity: 'rare'
    })
  }

  if (stats.penalties && stats.penalties >= 5) {
    badges.push({
      id: 'penalty_master',
      name: 'Maître du Penalty',
      description: '5 penalties marqués',
      icon: '👑',
      color: 'bg-purple-700',
      rarity: 'epic'
    })
  }

  // Badges own goals (humoristiques/négatifs)
  if (stats.ownGoals && stats.ownGoals >= 1) {
    badges.push({
      id: 'own_goal',
      name: 'But Contre Son Camp',
      description: 'Premier but contre son camp',
      icon: '😅',
      color: 'bg-orange-500',
      rarity: 'common'
    })
  }

  if (stats.ownGoals && stats.ownGoals >= 2) {
    badges.push({
      id: 'own_goal_king',
      name: 'Roi du But Contre Son Camp',
      description: '2 buts contre son camp',
      icon: '🤦',
      color: 'bg-orange-600',
      rarity: 'rare'
    })
  }

  if (stats.ownGoals && stats.ownGoals >= 3) {
    badges.push({
      id: 'own_goal_legend',
      name: 'Légende du But Contre Son Camp',
      description: '3+ buts contre son camp',
      icon: '🙈',
      color: 'bg-orange-700',
      rarity: 'epic'
    })
  }

  // Badges spéciaux par position
  if (normalizedPosition === 'Attaquant') {
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

    if (stats.goals >= 1 && stats.matchesPlayed >= 1) {
      const goalsPerMatch = stats.goals / stats.matchesPlayed
      if (goalsPerMatch >= 1) {
        badges.push({
          id: 'goal_per_game',
          name: 'But par Match',
          description: '1+ but par match',
          icon: '🔥',
          color: 'bg-red-600',
          rarity: 'legendary'
        })
      }
    }
  }

  if (normalizedPosition === 'Milieu') {
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

    if (stats.assists >= 1 && stats.matchesPlayed >= 1) {
      const assistsPerMatch = stats.assists / stats.matchesPlayed
      if (assistsPerMatch >= 1) {
        badges.push({
          id: 'assist_per_game',
          name: 'Passe par Match',
          description: '1+ passe par match',
          icon: '🎭',
          color: 'bg-indigo-700',
          rarity: 'legendary'
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
  const normalizedPosition = position?.trim() || ''
  const allBadges: Badge[] = [
    // Participation (tous les joueurs)
    { id: 'debut', name: 'Débuts', description: 'Jouer votre premier match', icon: '⚽', color: 'bg-gray-500', rarity: 'common' },
    { id: 'regular', name: 'Régulier', description: 'Jouer 5 matchs', icon: '🎯', color: 'bg-blue-500', rarity: 'common' },
    { id: 'veteran', name: 'Vétéran', description: 'Jouer 10 matchs', icon: '🏅', color: 'bg-purple-500', rarity: 'rare' },
    { id: 'legend', name: 'Légende', description: 'Jouer 20 matchs', icon: '👑', color: 'bg-yellow-500', rarity: 'legendary' },
    
    // Discipline (tous les joueurs)
    { id: 'fair_play', name: 'Fair-Play', description: 'Aucun carton en 5 matchs', icon: '🤝', color: 'bg-green-600', rarity: 'rare' },
    { id: 'gentleman', name: 'Gentleman', description: 'Aucun carton en 10 matchs', icon: '🎩', color: 'bg-green-700', rarity: 'epic' },
    { id: 'hot_head', name: 'Tête Brûlée', description: 'Recevoir 3 cartons jaunes', icon: '🟨', color: 'bg-yellow-600', rarity: 'common' },
    { id: 'sent_off', name: 'Expulsé', description: 'Recevoir un carton rouge', icon: '🟥', color: 'bg-red-700', rarity: 'rare' },
    
    // Temps de jeu (tous les joueurs)
    { id: 'iron_man', name: 'Homme de Fer', description: 'Jouer 450+ minutes', icon: '💪', color: 'bg-gray-600', rarity: 'rare' },
    { id: 'endurance', name: 'Endurance', description: 'Jouer 900+ minutes', icon: '🏃', color: 'bg-blue-700', rarity: 'epic' },
    
    // Penalties (tous les joueurs)
    { id: 'penalty_taker', name: 'Tireur de Penalty', description: 'Marquer votre premier penalty', icon: '🎯', color: 'bg-purple-500', rarity: 'common' },
    { id: 'penalty_specialist', name: 'Spécialiste Penalty', description: 'Marquer 3 penalties', icon: '⚡', color: 'bg-purple-600', rarity: 'rare' },
    { id: 'penalty_master', name: 'Maître du Penalty', description: 'Marquer 5 penalties', icon: '👑', color: 'bg-purple-700', rarity: 'epic' },
    
    // Own Goals (tous les joueurs - badges humoristiques)
    { id: 'own_goal', name: 'But Contre Son Camp', description: 'Marquer votre premier but contre son camp', icon: '😅', color: 'bg-orange-500', rarity: 'common' },
    { id: 'own_goal_king', name: 'Roi du But Contre Son Camp', description: 'Marquer 2 buts contre son camp', icon: '🤦', color: 'bg-orange-600', rarity: 'rare' },
    { id: 'own_goal_legend', name: 'Légende du But Contre Son Camp', description: 'Marquer 3+ buts contre son camp', icon: '🙈', color: 'bg-orange-700', rarity: 'epic' },
  ]

  // Badges de buts - Attaquants et Milieux
  if (normalizedPosition === 'Attaquant' || normalizedPosition === 'Milieu') {
    allBadges.push(
      { id: 'first_goal', name: 'Premier But', description: 'Marquer votre premier but', icon: '⚡', color: 'bg-green-500', rarity: 'common' },
      { id: 'scorer', name: 'Buteur', description: 'Marquer 3 buts', icon: '🔥', color: 'bg-orange-500', rarity: 'rare' },
      { id: 'top_scorer', name: 'Top Buteur', description: 'Marquer 5 buts', icon: '💥', color: 'bg-red-500', rarity: 'epic' },
      { id: 'goal_machine', name: 'Machine à Buts', description: 'Marquer 10 buts', icon: '🚀', color: 'bg-red-600', rarity: 'legendary' },
      { id: 'hat_trick', name: 'Hat-Trick', description: 'Moyenne de 2+ buts/match', icon: '🎩', color: 'bg-purple-600', rarity: 'epic' }
    )
  } else if (normalizedPosition === 'Défenseur') {
    allBadges.push(
      { id: 'defensive_goal', name: 'But Défensif', description: 'Marquer 2 buts (défenseur)', icon: '⚡', color: 'bg-green-600', rarity: 'rare' }
    )
  } else if (normalizedPosition === 'Gardien') {
    allBadges.push(
      { id: 'goalkeeper_goal', name: 'But de Gardien', description: 'Marquer un but (gardien)', icon: '⚡', color: 'bg-green-700', rarity: 'legendary' }
    )
  }

  // Badges de passes - Milieux et Attaquants
  if (normalizedPosition === 'Milieu' || normalizedPosition === 'Attaquant') {
    allBadges.push(
      { id: 'first_assist', name: 'Première Passe', description: 'Faire votre première passe décisive', icon: '🎯', color: 'bg-cyan-500', rarity: 'common' },
      { id: 'playmaker', name: 'Passeur', description: 'Faire 3 passes décisives', icon: '🎨', color: 'bg-indigo-500', rarity: 'rare' },
      { id: 'maestro', name: 'Maestro', description: 'Faire 5 passes décisives', icon: '🎭', color: 'bg-purple-500', rarity: 'epic' },
      { id: 'assist_king', name: 'Roi des Passes', description: 'Faire 10 passes décisives', icon: '👑', color: 'bg-purple-600', rarity: 'legendary' }
    )
  } else if (normalizedPosition === 'Défenseur') {
    allBadges.push(
      { id: 'defensive_assist', name: 'Passe Défensive', description: 'Faire 3 passes décisives (défenseur)', icon: '🎯', color: 'bg-cyan-600', rarity: 'epic' }
    )
  }

  // Badges combinés - Attaquants et Milieux
  if (normalizedPosition === 'Attaquant' || normalizedPosition === 'Milieu') {
    allBadges.push(
      { id: 'contributor', name: 'Contributeur', description: '5 buts + passes', icon: '⭐', color: 'bg-yellow-500', rarity: 'rare' },
      { id: 'star_player', name: 'Joueur Étoile', description: '10 buts + passes', icon: '🌟', color: 'bg-yellow-600', rarity: 'epic' },
      { id: 'mvp', name: 'MVP', description: '15 buts + passes', icon: '💎', color: 'bg-cyan-600', rarity: 'legendary' }
    )
  }

  // Badges défensifs - Gardiens et Défenseurs
  if (normalizedPosition === 'Défenseur' || normalizedPosition === 'Gardien') {
    allBadges.push(
      { id: 'clean_sheet', name: 'Cage Inviolée', description: 'Premier clean sheet', icon: '🛡️', color: 'bg-blue-600', rarity: 'common' },
      { id: 'wall', name: 'Le Mur', description: '3 clean sheets', icon: '🧱', color: 'bg-gray-600', rarity: 'rare' },
      { id: 'fortress', name: 'Forteresse', description: '5 clean sheets', icon: '🏰', color: 'bg-gray-700', rarity: 'epic' },
      { id: 'impregnable', name: 'Imprenable', description: '10 clean sheets', icon: '🏛️', color: 'bg-gray-800', rarity: 'legendary' }
    )
  }

  // Badges spécifiques aux Gardiens (basés uniquement sur clean sheets)
  if (normalizedPosition === 'Gardien') {
    allBadges.push(
      { id: 'guardian', name: 'Gardien', description: '5+ clean sheets en 10+ matchs', icon: '🛡️', color: 'bg-blue-600', rarity: 'epic' }
    )
  }

  // Badges spécifiques aux Défenseurs
  if (normalizedPosition === 'Défenseur') {
    allBadges.push(
      { id: 'rock_defense', name: 'Rocher Défensif', description: '3+ clean sheets en 5+ matchs', icon: '🗿', color: 'bg-gray-600', rarity: 'epic' }
    )
  }

  // Badges spécifiques aux Attaquants
  if (normalizedPosition === 'Attaquant') {
    allBadges.push(
      { id: 'clinical', name: 'Clinique', description: '0.5+ but par match', icon: '🎯', color: 'bg-red-500', rarity: 'epic' },
      { id: 'goal_per_game', name: 'But par Match', description: '1+ but par match', icon: '🔥', color: 'bg-red-600', rarity: 'legendary' }
    )
  }

  // Badges spécifiques aux Milieux
  if (normalizedPosition === 'Milieu') {
    allBadges.push(
      { id: 'orchestrator', name: 'Orchestrateur', description: '0.5+ passe par match', icon: '🎼', color: 'bg-indigo-600', rarity: 'epic' },
      { id: 'assist_per_game', name: 'Passe par Match', description: '1+ passe par match', icon: '🎭', color: 'bg-indigo-700', rarity: 'legendary' }
    )
  }

  return allBadges
}
