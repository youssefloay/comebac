"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, doc, getDoc, orderBy } from "firebase/firestore"
import type { Team, Player, Match, MatchResult, TeamStatistics } from "@/lib/types"
import { SofaMatchCard } from "@/components/sofa/match-card"
import { 
  ArrowLeft, 
  Users, 
  MapPin, 
  Trophy, 
  Target,
  Calendar,
  TrendingUp,
  Award,
  Shield,
  BarChart3
} from "lucide-react"

type TabType = 'matches' | 'players' | 'stats'

export default function TeamDetailPage() {
  const params = useParams()
  const teamId = params?.id as string
  
  const [team, setTeam] = useState<Team | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<(Match & { homeTeam?: Team; awayTeam?: Team; result?: MatchResult })[]>([])
  const [teamStats, setTeamStats] = useState<TeamStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('matches')

  useEffect(() => {
    const fetchTeamDetails = async () => {
      try {
        console.log('🔄 Chargement des détails de l\'équipe...')
        
        // Fetch team
        const teamDoc = await getDoc(doc(db, "teams", teamId))
        if (teamDoc.exists()) {
          setTeam({ id: teamDoc.id, ...teamDoc.data() } as Team)
        }

        // Fetch all teams for match display
        const teamsSnap = await getDocs(collection(db, 'teams'))
        const teamsMap = new Map()
        teamsSnap.docs.forEach(doc => {
          teamsMap.set(doc.id, { id: doc.id, ...doc.data() })
        })

        // Fetch players
        const playersQuery = query(collection(db, "players"), where("teamId", "==", teamId))
        const playersSnap = await getDocs(playersQuery)
        const playersData = playersSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Player[]
        playersData.sort((a, b) => (a.number || 0) - (b.number || 0))
        setPlayers(playersData)

        // Fetch team matches (home and away)
        const allMatchesSnap = await getDocs(collection(db, 'matches'))
        const teamMatches = allMatchesSnap.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate() || new Date(),
            homeTeam: teamsMap.get(doc.data().homeTeamId),
            awayTeam: teamsMap.get(doc.data().awayTeamId)
          }))
          .filter((match: any) => 
            match.homeTeamId === teamId || match.awayTeamId === teamId
          ) as (Match & { homeTeam?: Team; awayTeam?: Team })[]

        // Fetch match results
        const resultsSnap = await getDocs(collection(db, 'matchResults'))
        const resultsMap = new Map()
        resultsSnap.docs.forEach(doc => {
          const result = doc.data()
          resultsMap.set(result.matchId, result)
        })

        // Combine matches with results
        const matchesWithResults = teamMatches.map(match => ({
          ...match,
          result: resultsMap.get(match.id)
        }))

        // Sort matches by date (most recent first)
        matchesWithResults.sort((a, b) => b.date.getTime() - a.date.getTime())
        setMatches(matchesWithResults)

        // Fetch team statistics
        const statsQuery = query(collection(db, 'teamStatistics'), where('teamId', '==', teamId))
        const statsSnap = await getDocs(statsQuery)
        if (statsSnap.docs.length > 0) {
          setTeamStats({ id: statsSnap.docs[0].id, ...statsSnap.docs[0].data() } as TeamStatistics)
        }

        console.log('✅ Détails de l\'équipe chargés')
      } catch (error) {
        console.error("Error fetching team details:", error)
      } finally {
        setLoading(false)
      }
    }

    if (teamId) {
      fetchTeamDetails()
    }
  }, [teamId])

  const getPositionIcon = (position: string) => {
    switch (position?.toLowerCase()) {
      case 'gardien':
      case 'goalkeeper':
        return '🥅'
      case 'défenseur':
      case 'defender':
        return '🛡️'
      case 'milieu':
      case 'midfielder':
        return '⚽'
      case 'attaquant':
      case 'forward':
        return '🎯'
      default:
        return '👤'
    }
  }

  const getPositionColor = (position: string) => {
    switch (position?.toLowerCase()) {
      case 'gardien':
      case 'goalkeeper':
        return 'text-sofa-yellow'
      case 'défenseur':
      case 'defender':
        return 'text-sofa-blue'
      case 'milieu':
      case 'midfielder':
        return 'text-sofa-green'
      case 'attaquant':
      case 'forward':
        return 'text-sofa-red'
      default:
        return 'text-sofa-text-muted'
    }
  }

  const groupPlayersByPosition = (players: Player[]) => {
    const positions = {
      'Gardien': players.filter(p => p.position?.toLowerCase().includes('gardien') || p.position?.toLowerCase().includes('goalkeeper')),
      'Défenseur': players.filter(p => p.position?.toLowerCase().includes('défenseur') || p.position?.toLowerCase().includes('defender')),
      'Milieu': players.filter(p => p.position?.toLowerCase().includes('milieu') || p.position?.toLowerCase().includes('midfielder')),
      'Attaquant': players.filter(p => p.position?.toLowerCase().includes('attaquant') || p.position?.toLowerCase().includes('forward')),
      'Autres': players.filter(p => !p.position || (!p.position.toLowerCase().includes('gardien') && 
                                                   !p.position.toLowerCase().includes('goalkeeper') &&
                                                   !p.position.toLowerCase().includes('défenseur') && 
                                                   !p.position.toLowerCase().includes('defender') &&
                                                   !p.position.toLowerCase().includes('milieu') && 
                                                   !p.position.toLowerCase().includes('midfielder') &&
                                                   !p.position.toLowerCase().includes('attaquant') && 
                                                   !p.position.toLowerCase().includes('forward')))
    }
    return positions
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-sofa-border border-t-sofa-text-accent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sofa-text-secondary">Chargement de l'équipe...</p>
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="sofa-card p-12 text-center">
          <Users className="w-16 h-16 text-sofa-text-muted mx-auto mb-4" />
          <p className="text-sofa-text-secondary">Équipe non trouvée</p>
          <Link href="/public/teams">
            <button className="sofa-btn mt-4">
              Retour aux équipes
            </button>
          </Link>
        </div>
      </div>
    )
  }

  const playersByPosition = groupPlayersByPosition(players)

  const convertMatchFormat = (match: Match & { homeTeam?: Team; awayTeam?: Team; result?: MatchResult }) => ({
    id: match.id,
    teamA: match.homeTeam?.name || 'Équipe inconnue',
    teamB: match.awayTeam?.name || 'Équipe inconnue',
    teamAId: match.homeTeamId,
    teamBId: match.awayTeamId,
    date: match.date,
    scoreA: match.result?.homeTeamScore,
    scoreB: match.result?.awayTeamScore,
    status: match.status === 'completed' ? 'completed' as const : 
            match.status === 'in_progress' ? 'live' as const :
            'upcoming' as const,
    venue: `Stade de ${match.homeTeam?.name || 'l\'équipe'}`,
    round: match.round
  })

  const tabs = [
    { id: 'matches', label: 'Matchs', icon: Calendar },
    { id: 'players', label: 'Joueurs', icon: Users },
    { id: 'stats', label: 'Statistiques', icon: BarChart3 },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <Link href="/public/teams" className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux équipes</span>
        </Link>
        
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div 
            className="h-32 sm:h-40 relative"
            style={{ 
              background: `linear-gradient(135deg, ${team.color || '#10b981'} 0%, ${team.color || '#10b981'}dd 100%)` 
            }}
          >
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">{team.name}</h1>
              {team.schoolName && (
                <p className="text-sm sm:text-base text-white/80 mb-2">{team.schoolName}</p>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-white/90">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">{players.length} joueurs</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Stade de {team.name}</span>
                </div>
              </div>
            </div>
            <div className="absolute top-4 sm:top-6 right-4 sm:right-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                {team.logo ? (
                  <img 
                    src={team.logo} 
                    alt={team.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      const parent = e.currentTarget.parentElement
                      if (parent) {
                        parent.innerHTML = '<span class="text-2xl sm:text-3xl">⚽</span>'
                      }
                    }}
                  />
                ) : (
                  <span className="text-2xl sm:text-3xl">⚽</span>
                )}
              </div>
            </div>
          </div>
          
          {/* Coach Info */}
          {team.coach && (
            <div className="p-4 sm:p-6 bg-gray-50 border-t">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white flex items-center justify-center font-bold text-lg">
                  {team.coach.firstName.charAt(0)}{team.coach.lastName.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">Entraîneur</p>
                  <p className="font-semibold text-gray-900 text-base sm:text-lg">
                    {team.coach.firstName} {team.coach.lastName}
                  </p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs sm:text-sm text-gray-600">
                    {team.coach.email && (
                      <span className="flex items-center gap-1">
                        📧 {team.coach.email}
                      </span>
                    )}
                    {team.coach.phone && (
                      <span className="flex items-center gap-1">
                        📞 {team.coach.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 sm:mb-8">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-xl">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive 
                    ? 'bg-white text-green-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Matches Tab */}
        {activeTab === 'matches' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {matches.length > 0 ? (
              <>
                {/* Recent/Completed Matches */}
                {matches.filter(m => m.status === 'completed').length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Trophy className="w-5 h-5 text-green-600" />
                      Derniers Résultats
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {matches
                        .filter(m => m.status === 'completed')
                        .slice(0, 6)
                        .map((match, index) => (
                          <SofaMatchCard 
                            key={match.id} 
                            match={convertMatchFormat(match)} 
                            index={index} 
                          />
                        ))}
                    </div>
                  </div>
                )}

                {/* Upcoming Matches */}
                {matches.filter(m => m.status === 'scheduled').length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-600" />
                      Prochains Matchs
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {matches
                        .filter(m => m.status === 'scheduled')
                        .slice(0, 6)
                        .map((match, index) => (
                          <SofaMatchCard 
                            key={match.id} 
                            match={convertMatchFormat(match)} 
                            index={index} 
                          />
                        ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white rounded-xl p-12 text-center border">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun match</h3>
                <p className="text-gray-600">Cette équipe n'a pas encore de matchs programmés.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Players Tab */}
        {activeTab === 'players' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {players.length > 0 ? (
              Object.entries(groupPlayersByPosition(players)).map(([position, positionPlayers]) => {
                if (positionPlayers.length === 0) return null
                
                return (
                  <div key={position} className="bg-white rounded-xl p-6 border">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-xl">{getPositionIcon(position)}</span>
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{position}s</h2>
                        <p className="text-sm text-gray-600">{positionPlayers.length} joueur{positionPlayers.length > 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {positionPlayers.map((player, index) => (
                        <motion.div
                          key={player.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-gray-200">
                              <span className="font-bold text-green-600">
                                #{player.number || '?'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 truncate flex items-center gap-2">
                                <span>{player.name}</span>
                                {(player as any).isCaptain && (
                                  <span className="inline-flex items-center justify-center w-5 h-5 bg-yellow-500 text-white text-xs font-bold rounded-full flex-shrink-0" title="Capitaine">
                                    C
                                  </span>
                                )}
                              </h3>
                              <p className={`text-sm ${getPositionColor(player.position || '')} truncate`}>
                                {player.position || 'Position non définie'}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="bg-white rounded-xl p-12 text-center border">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun joueur enregistré</h3>
                <p className="text-gray-600">Cette équipe n'a pas encore de joueurs enregistrés.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Statistics Tab */}
        {activeTab === 'stats' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {teamStats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Matchs Joués</p>
                      <p className="text-2xl font-bold text-gray-900">{teamStats.matchesPlayed}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Points</p>
                      <p className="text-2xl font-bold text-gray-900">{teamStats.points}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Target className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Buts Pour</p>
                      <p className="text-2xl font-bold text-gray-900">{teamStats.goalsFor}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Buts Contre</p>
                      <p className="text-2xl font-bold text-gray-900">{teamStats.goalsAgainst}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <Award className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Victoires</p>
                      <p className="text-2xl font-bold text-gray-900">{teamStats.wins}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Nuls</p>
                      <p className="text-2xl font-bold text-gray-900">{teamStats.draws}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-red-600 rotate-180" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Défaites</p>
                      <p className="text-2xl font-bold text-gray-900">{teamStats.losses}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Différence</p>
                      <p className={`text-2xl font-bold ${
                        (teamStats.goalsFor - teamStats.goalsAgainst) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {teamStats.goalsFor - teamStats.goalsAgainst > 0 ? '+' : ''}{teamStats.goalsFor - teamStats.goalsAgainst}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 text-center border">
                <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune statistique</h3>
                <p className="text-gray-600">Les statistiques de cette équipe ne sont pas encore disponibles.</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}