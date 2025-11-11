"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
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

interface PlayerStats {
  matchesPlayed: number
  goals: number
  assists: number
  mvpCount: number
  fouls: number
  averageRating: number
}

interface PlayerData {
  id: string
  firstName: string
  lastName: string
  nickname?: string
  position: string
  jerseyNumber: number
  teamId: string
  teamName?: string
  photo?: string
  grade: string
  height: number
  foot: string
}

interface Match {
  id: string
  homeTeamId: string
  awayTeamId: string
  homeTeam?: { name: string }
  awayTeam?: { name: string }
  date: Date
  homeTeamScore?: number
  awayTeamScore?: number
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  round: number
}

export default function PlayerProfilePage() {
  const { user } = useAuth()
  const [playerData, setPlayerData] = useState<PlayerData | null>(null)
  const [stats, setStats] = useState<PlayerStats>({
    matchesPlayed: 0,
    goals: 0,
    assists: 0,
    mvpCount: 0,
    fouls: 0,
    averageRating: 0
  })
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([])
  const [pastMatches, setPastMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPlayerData = async () => {
      if (!user?.email) return

      try {
        // Trouver le joueur par email
        const playersQuery = query(
          collection(db, 'players'),
          where('email', '==', user.email)
        )
        const playersSnap = await getDocs(playersQuery)

        if (playersSnap.empty) {
          console.log('Aucun joueur trouvé pour cet email')
          setLoading(false)
          return
        }

        const playerDoc = playersSnap.docs[0]
        const player = { id: playerDoc.id, ...playerDoc.data() } as PlayerData

        // Récupérer le nom de l'équipe
        if (player.teamId) {
          const teamDoc = await getDoc(doc(db, 'teams', player.teamId))
          if (teamDoc.exists()) {
            player.teamName = teamDoc.data().name
          }
        }

        setPlayerData(player)

        // Charger les statistiques du joueur
        const statsQuery = query(
          collection(db, 'playerStatistics'),
          where('playerId', '==', player.id)
        )
        const statsSnap = await getDocs(statsQuery)
        
        if (!statsSnap.empty) {
          const statsData = statsSnap.docs[0].data()
          setStats({
            matchesPlayed: statsData.matchesPlayed || 0,
            goals: statsData.goals || 0,
            assists: statsData.assists || 0,
            mvpCount: statsData.mvpCount || 0,
            fouls: statsData.fouls || 0,
            averageRating: statsData.averageRating || 0
          })
        }

        // Charger les matchs de l'équipe
        if (player.teamId) {
          const matchesQuery = query(collection(db, 'matches'))
          const matchesSnap = await getDocs(matchesQuery)
          
          const teamsMap = new Map()
          const teamsSnap = await getDocs(collection(db, 'teams'))
          teamsSnap.docs.forEach(doc => {
            teamsMap.set(doc.id, doc.data())
          })

          const allMatches = matchesSnap.docs
            .map(doc => {
              const data = doc.data()
              return {
                id: doc.id,
                ...data,
                date: data.date?.toDate() || new Date(),
                homeTeam: teamsMap.get(data.homeTeamId),
                awayTeam: teamsMap.get(data.awayTeamId)
              }
            })
            .filter(match => 
              match.homeTeamId === player.teamId || 
              match.awayTeamId === player.teamId
            ) as Match[]

          const now = new Date()
          const upcoming = allMatches
            .filter(m => m.date > now && m.status === 'scheduled')
            .sort((a, b) => a.date.getTime() - b.date.getTime())
            .slice(0, 5)

          const past = allMatches
            .filter(m => m.status === 'completed')
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 5)

          setUpcomingMatches(upcoming)
          setPastMatches(past)
        }

      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPlayerData()
  }, [user])

  const convertMatchFormat = (match: Match) => ({
    id: match.id,
    teamA: match.homeTeam?.name || 'Équipe inconnue',
    teamB: match.awayTeam?.name || 'Équipe inconnue',
    teamAId: match.homeTeamId,
    teamBId: match.awayTeamId,
    date: match.date,
    scoreA: match.homeTeamScore,
    scoreB: match.awayTeamScore,
    status: match.status === 'completed' ? 'completed' as const : 
            match.status === 'in_progress' ? 'live' as const :
            'upcoming' as const,
    venue: `Stade de ${match.homeTeam?.name || 'l\'équipe'}`,
    round: match.round
  })

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </PublicLayout>
    )
  }

  if (!playerData) {
    return (
      <PublicLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-sofa-text-muted mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-sofa-text-primary mb-2">
              Profil non trouvé
            </h2>
            <p className="text-sofa-text-secondary mb-6">
              Aucun profil joueur n'est associé à votre compte.
            </p>
            <Link href="/public" className="sofa-btn">
              Retour à l'accueil
            </Link>
          </div>
        </div>
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <div className="space-y-6 pb-8">
        {/* Header fixe avec photo et infos */}
        <div className="sticky top-0 z-20 bg-gradient-to-br from-sofa-bg-secondary via-sofa-bg-tertiary to-sofa-bg-card border-b border-sofa-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex items-center gap-6">
              {/* Photo du joueur */}
              <div className="relative">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-sofa-blue to-sofa-green flex items-center justify-center text-white text-3xl sm:text-4xl font-bold shadow-lg">
                  {playerData.photo ? (
                    <img 
                      src={playerData.photo} 
                      alt={`${playerData.firstName} ${playerData.lastName}`}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    `${playerData.firstName[0]}${playerData.lastName[0]}`
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-sofa-green rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white">
                  {playerData.jerseyNumber}
                </div>
              </div>

              {/* Infos du joueur */}
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-sofa-text-primary mb-1">
                  {playerData.firstName} {playerData.lastName}
                  {playerData.nickname && (
                    <span className="text-lg text-sofa-text-accent ml-2">
                      "{playerData.nickname}"
                    </span>
                  )}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-sofa-text-secondary">
                  <span className="flex items-center gap-1">
                    <Activity className="w-4 h-4" />
                    {playerData.position}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {playerData.teamName || 'Équipe inconnue'}
                  </span>
                  <span className="px-2 py-1 bg-sofa-bg-card rounded text-sofa-text-accent font-medium">
                    {playerData.grade}
                  </span>
                </div>
              </div>

              {/* Bouton modifier */}
              <Link 
                href="/player/profile/edit"
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
              <div className="text-center text-sofa-text-muted py-12">
                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Graphique des performances à venir</p>
                <p className="text-sm mt-2">Vos statistiques seront affichées après plusieurs matchs</p>
              </div>
            </div>
          </motion.section>

          {/* Prochains matchs */}
          {upcomingMatches.length > 0 && (
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
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {upcomingMatches.map((match, index) => (
                  <motion.div
                    key={match.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <SofaMatchCard 
                      match={convertMatchFormat(match)} 
                      index={index} 
                    />
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Matchs passés */}
          {pastMatches.length > 0 && (
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
                      match={convertMatchFormat(match)} 
                      index={index} 
                    />
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

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
            
            <div className="sofa-card p-6">
              <div className="text-center text-sofa-text-muted py-12">
                <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucun badge pour le moment</p>
                <p className="text-sm mt-2">Jouez des matchs pour débloquer des badges!</p>
              </div>
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
