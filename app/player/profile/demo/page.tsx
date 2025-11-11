"use client"

import { motion } from 'framer-motion'
import { SofaMatchCard } from '@/components/sofa/match-card'
import { SofaStatCard } from '@/components/sofa/stat-card'
import Link from 'next/link'
import { 
  User, 
  Trophy, 
  Target, 
  Users, 
  Calendar,
  TrendingUp,
  Award,
  AlertCircle,
  Edit,
  Star,
  Activity
} from 'lucide-react'
import PublicLayout from '@/components/public/public-layout'

export default function PlayerProfileDemoPage() {
  // Données mock
  const playerData = {
    id: 'mock-player-1',
    firstName: 'Mohamed',
    lastName: 'Salah',
    nickname: 'Mo',
    position: 'Attaquant',
    jerseyNumber: 11,
    teamId: 'team-1',
    teamName: 'Les Pharaons FC',
    grade: 'Terminale',
    height: 175,
    foot: 'Gaucher'
  }

  const stats = {
    matchesPlayed: 12,
    goals: 18,
    assists: 7,
    mvpCount: 5,
    fouls: 3,
    averageRating: 8.4
  }

  const upcomingMatches = [
    {
      id: '1',
      teamA: 'Les Pharaons FC',
      teamB: 'Eagles United',
      teamAId: 'team-1',
      teamBId: 'team-2',
      date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: 'upcoming' as const,
      venue: 'Stade des Pharaons',
      round: 8
    },
    {
      id: '2',
      teamA: 'Lions FC',
      teamB: 'Les Pharaons FC',
      teamAId: 'team-3',
      teamBId: 'team-1',
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      status: 'upcoming' as const,
      venue: 'Stade des Lions',
      round: 9
    },
    {
      id: '3',
      teamA: 'Les Pharaons FC',
      teamB: 'Titans Academy',
      teamAId: 'team-1',
      teamBId: 'team-4',
      date: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000),
      status: 'upcoming' as const,
      venue: 'Stade des Pharaons',
      round: 10
    }
  ]

  const pastMatches = [
    {
      id: '4',
      teamA: 'Les Pharaons FC',
      teamB: 'Warriors SC',
      teamAId: 'team-1',
      teamBId: 'team-5',
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      scoreA: 4,
      scoreB: 2,
      status: 'completed' as const,
      venue: 'Stade des Pharaons',
      round: 7
    },
    {
      id: '5',
      teamA: 'Champions FC',
      teamB: 'Les Pharaons FC',
      teamAId: 'team-6',
      teamBId: 'team-1',
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      scoreA: 1,
      scoreB: 3,
      status: 'completed' as const,
      venue: 'Stade des Champions',
      round: 6
    },
    {
      id: '6',
      teamA: 'Les Pharaons FC',
      teamB: 'Dynamo United',
      teamAId: 'team-1',
      teamBId: 'team-7',
      date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      scoreA: 5,
      scoreB: 1,
      status: 'completed' as const,
      venue: 'Stade des Pharaons',
      round: 5
    },
    {
      id: '7',
      teamA: 'Strikers FC',
      teamB: 'Les Pharaons FC',
      teamAId: 'team-8',
      teamBId: 'team-1',
      date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
      scoreA: 2,
      scoreB: 2,
      status: 'completed' as const,
      venue: 'Stade des Strikers',
      round: 4
    }
  ]

  const badges = [
    { id: 1, name: 'Hat-trick Hero', icon: '🎩', description: '3 buts en un match', unlocked: true },
    { id: 2, name: 'Passeur Décisif', icon: '🎯', description: '5 passes décisives', unlocked: true },
    { id: 3, name: 'MVP du Mois', icon: '⭐', description: 'Meilleur joueur du mois', unlocked: true },
    { id: 4, name: 'Fair-Play', icon: '🤝', description: 'Aucune faute en 5 matchs', unlocked: false },
    { id: 5, name: 'Buteur Elite', icon: '👑', description: '20 buts en une saison', unlocked: false },
    { id: 6, name: 'Légende', icon: '🏆', description: 'Champion de la ligue', unlocked: false }
  ]

  return (
    <PublicLayout>
      <div className="space-y-6 pb-8">
        {/* Header fixe avec photo et infos */}
        <div className="sticky top-0 z-20 bg-gradient-to-br from-sofa-bg-secondary via-sofa-bg-tertiary to-sofa-bg-card border-b border-sofa-border shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex items-center gap-6">
              {/* Photo du joueur */}
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-sofa-blue to-sofa-green flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-lg">
                  MS
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-sofa-green rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white">
                  {playerData.jerseyNumber}
                </div>
              </div>

              {/* Infos du joueur */}
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-sofa-text-primary mb-1">
                  {playerData.firstName} {playerData.lastName}
                  <span className="text-lg text-sofa-text-accent ml-2">
                    "{playerData.nickname}"
                  </span>
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-sofa-text-secondary">
                  <span className="flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    {playerData.position}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {playerData.teamName}
                  </span>
                  <span className="px-2 py-1 bg-sofa-bg-card rounded text-sofa-text-accent font-medium">
                    {playerData.grade}
                  </span>
                  <span className="text-xs text-sofa-text-muted">
                    {playerData.height}cm • {playerData.foot}
                  </span>
                </div>
              </div>

              {/* Bouton modifier */}
              <Link 
                href="#"
                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-sofa-blue text-white rounded-lg hover:bg-opacity-90 transition"
              >
                <Edit className="w-4 h-4" />
                Modifier
              </Link>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          {/* Statistiques personnelles */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-bold text-sofa-text-primary mb-4 flex items-center gap-3">
              <Trophy className="w-6 h-6 text-sofa-green" />
              Mes Statistiques
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <SofaStatCard
                title="Matchs"
                value={stats.matchesPlayed}
                icon={Calendar}
                color="blue"
                index={0}
              />
              <SofaStatCard
                title="Buts"
                value={stats.goals}
                icon={Target}
                color="green"
                index={1}
              />
              <SofaStatCard
                title="Passes D."
                value={stats.assists}
                icon={TrendingUp}
                color="purple"
                index={2}
              />
              <SofaStatCard
                title="MVP"
                value={stats.mvpCount}
                icon={Star}
                color="orange"
                index={3}
              />
              <SofaStatCard
                title="Fautes"
                value={stats.fouls}
                icon={AlertCircle}
                color="red"
                index={4}
              />
              <div className="sofa-card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-5 h-5 text-sofa-blue" />
                  <h3 className="text-sm font-medium text-sofa-text-secondary">Note Moy.</h3>
                </div>
                <div className="text-2xl font-bold text-sofa-text-primary">
                  {stats.averageRating.toFixed(1)}
                  <span className="text-sm text-sofa-text-muted">/10</span>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Graphique de performances */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h2 className="text-2xl font-bold text-sofa-text-primary mb-4 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-sofa-blue" />
              Évolution des Performances
            </h2>
            
            <div className="sofa-card p-6">
              {/* Graphique simple avec barres */}
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-sofa-text-secondary w-20">Buts</span>
                  <div className="flex-1 bg-sofa-bg-secondary rounded-full h-8 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-sofa-green to-sofa-blue h-full flex items-center justify-end pr-3 text-white text-sm font-bold"
                      style={{ width: '90%' }}
                    >
                      18
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-sofa-text-secondary w-20">Passes D.</span>
                  <div className="flex-1 bg-sofa-bg-secondary rounded-full h-8 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-sofa-purple to-sofa-blue h-full flex items-center justify-end pr-3 text-white text-sm font-bold"
                      style={{ width: '35%' }}
                    >
                      7
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-sofa-text-secondary w-20">MVP</span>
                  <div className="flex-1 bg-sofa-bg-secondary rounded-full h-8 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-sofa-orange to-sofa-red h-full flex items-center justify-end pr-3 text-white text-sm font-bold"
                      style={{ width: '42%' }}
                    >
                      5
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-sofa-text-secondary w-20">Note Moy.</span>
                  <div className="flex-1 bg-sofa-bg-secondary rounded-full h-8 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-sofa-blue to-sofa-green h-full flex items-center justify-end pr-3 text-white text-sm font-bold"
                      style={{ width: '84%' }}
                    >
                      8.4/10
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Prochains matchs */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-sofa-text-primary flex items-center gap-3">
                <Calendar className="w-6 h-6 text-sofa-blue" />
                Mes Prochains Matchs
              </h2>
              <Link href="/public/matches" className="text-sofa-text-accent hover:text-sofa-green transition-colors text-sm font-medium">
                Tous les matchs →
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingMatches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <SofaMatchCard 
                    match={match} 
                    index={index} 
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Matchs passés */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-sofa-text-primary flex items-center gap-3">
                <Trophy className="w-6 h-6 text-sofa-green" />
                Mes Derniers Matchs
              </h2>
              <Link href="/public/matches" className="text-sofa-text-accent hover:text-sofa-green transition-colors text-sm font-medium">
                Historique complet →
              </Link>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pastMatches.map((match, index) => (
                <motion.div
                  key={match.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <SofaMatchCard 
                    match={match} 
                    index={index} 
                  />
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Badges et récompenses */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-sofa-text-primary mb-4 flex items-center gap-3">
              <Award className="w-6 h-6 text-sofa-green" />
              Badges & Récompenses
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {badges.map((badge, index) => (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`sofa-card p-4 text-center ${
                    badge.unlocked 
                      ? 'bg-gradient-to-br from-sofa-bg-card to-sofa-bg-secondary' 
                      : 'opacity-50 grayscale'
                  }`}
                >
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <h3 className="text-sm font-semibold text-sofa-text-primary mb-1">
                    {badge.name}
                  </h3>
                  <p className="text-xs text-sofa-text-muted">
                    {badge.description}
                  </p>
                  {badge.unlocked && (
                    <div className="mt-2 text-xs text-sofa-green font-medium">
                      ✓ Débloqué
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Accès rapide aux autres sections */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <h2 className="text-2xl font-bold text-sofa-text-primary mb-4">
              Navigation Rapide
            </h2>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Link href="/public/ranking" className="sofa-card p-4 hover:shadow-lg transition-shadow">
                <Trophy className="w-8 h-8 text-sofa-green mb-2" />
                <h3 className="font-semibold text-sofa-text-primary">Classement</h3>
                <p className="text-xs text-sofa-text-muted mt-1">Voir le classement</p>
              </Link>
              
              <Link href="/public/teams" className="sofa-card p-4 hover:shadow-lg transition-shadow">
                <Users className="w-8 h-8 text-sofa-blue mb-2" />
                <h3 className="font-semibold text-sofa-text-primary">Équipes</h3>
                <p className="text-xs text-sofa-text-muted mt-1">Toutes les équipes</p>
              </Link>
              
              <Link href="/public/players" className="sofa-card p-4 hover:shadow-lg transition-shadow">
                <User className="w-8 h-8 text-sofa-purple mb-2" />
                <h3 className="font-semibold text-sofa-text-primary">Joueurs</h3>
                <p className="text-xs text-sofa-text-muted mt-1">Tous les joueurs</p>
              </Link>
              
              <Link href="/public/statistics" className="sofa-card p-4 hover:shadow-lg transition-shadow">
                <TrendingUp className="w-8 h-8 text-sofa-orange mb-2" />
                <h3 className="font-semibold text-sofa-text-primary">Stats</h3>
                <p className="text-xs text-sofa-text-muted mt-1">Statistiques</p>
              </Link>
            </div>
          </motion.section>
        </div>
      </div>
    </PublicLayout>
  )
}
