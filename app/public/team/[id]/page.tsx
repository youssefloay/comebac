"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, doc, getDoc, orderBy } from "firebase/firestore"
import type { Team, Player, Match, MatchResult, TeamStatistics } from "@/lib/types"
import { SofaMatchCard } from "@/components/sofa/match-card"
import { t } from "@/lib/i18n"
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
  const [logoError, setLogoError] = useState(false)

  useEffect(() => {
    const fetchTeamDetails = async () => {
      try {
        console.log('🔄 Chargement des détails de l\'équipe...')
        
        // Fetch team
        const teamDoc = await getDoc(doc(db, "teams", teamId))
        if (teamDoc.exists()) {
          let teamData = { id: teamDoc.id, ...teamDoc.data() } as Team
          
          // Si le coach n'est pas rempli dans teams, chercher dans coachAccounts
          if (!teamData.coach || !teamData.coach.firstName || !teamData.coach.lastName) {
            const coachQuery = query(collection(db, 'coachAccounts'), where('teamId', '==', teamId))
            const coachSnap = await getDocs(coachQuery)
            
            if (!coachSnap.empty) {
              const coachData = coachSnap.docs[0].data()
              teamData = {
                ...teamData,
                coach: {
                  firstName: coachData.firstName || '',
                  lastName: coachData.lastName || '',
                  birthDate: coachData.birthDate || '',
                  email: coachData.email || '',
                  phone: coachData.phone || ''
                }
              }
            }
          }
          
          setTeam(teamData)
          setLogoError(false)
        }

        // Fetch all teams for match display
        const teamsSnap = await getDocs(collection(db, 'teams'))
        const teamsMap = new Map()
        teamsSnap.docs.forEach(doc => {
          teamsMap.set(doc.id, { id: doc.id, ...doc.data() })
        })

        // Fetch players, playerAccounts, and coachAccounts (exclude coaches)
        const [playersSnap, playerAccountsSnap, coachAccountsSnap] = await Promise.all([
          getDocs(query(collection(db, "players"), where("teamId", "==", teamId))),
          getDocs(query(collection(db, "playerAccounts"), where("teamId", "==", teamId))),
          getDocs(query(collection(db, "coachAccounts"), where("teamId", "==", teamId)))
        ])
        
        const allPlayersData = playersSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Player[]
        
        const allPlayerAccounts = playerAccountsSnap.docs.map((doc) => doc.data())
        const allCoachAccounts = coachAccountsSnap.docs.map((doc) => doc.data())
        
        // Créer un Set des emails des entraîneurs pour exclusion rapide
        const coachEmails = new Set(allCoachAccounts.map((coach: any) => coach.email))
        const actingCoachEmails = new Set(
          allPlayerAccounts
            .filter((account: any) => account.isActingCoach === true)
            .map((account: any) => account.email)
        )
        
        // Filter out coaches - exclude coachAccounts and acting coaches
        const playersData = allPlayersData.filter((player) => {
          const playerEmail = player.email || (player as any).email
          // Exclude coaches - check multiple conditions
          const isCoach = 
            (player as any).isCoach === true || 
            player.position?.toLowerCase().includes('entraîneur') ||
            player.position?.toLowerCase().includes('entraineur') ||
            player.position?.toLowerCase().includes('coach') ||
            (playerEmail && coachEmails.has(playerEmail)) ||
            (playerEmail && actingCoachEmails.has(playerEmail))
          return !isCoach
        })
        
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('team.loading')}</p>
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-lg p-12 text-center max-w-md w-full"
        >
          <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-6">{t('team.notFound')}</p>
          <Link href="/public/teams">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
            >
              {t('team.backToTeams')}
            </motion.button>
          </Link>
        </motion.div>
      </div>
    )
  }

  const playersByPosition = groupPlayersByPosition(players)

  const convertMatchFormat = (match: Match & { homeTeam?: Team; awayTeam?: Team; result?: MatchResult }) => ({
    id: match.id,
    teamA: match.homeTeam?.name || t('home.unknownTeam'),
    teamB: match.awayTeam?.name || t('home.unknownTeam'),
    teamAId: match.homeTeamId,
    teamBId: match.awayTeamId,
    date: match.date,
    scoreA: match.result?.homeTeamScore,
    scoreB: match.result?.awayTeamScore,
    status: match.status === 'completed' ? 'completed' as const : 
            match.status === 'in_progress' ? 'live' as const :
            'upcoming' as const,
    venue: `${t('team.stadiumOf')} ${match.homeTeam?.name || t('home.unknownTeam')}`,
    round: match.round
  })

  const tabs = [
    { id: 'matches', label: t('team.tabs.matches'), icon: Calendar },
    { id: 'players', label: t('team.tabs.players'), icon: Users },
    { id: 'stats', label: t('team.tabs.stats'), icon: BarChart3 },
  ]

  const teamColor = team.color || '#10b981'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-12">
        {/* Header - Modern 2025 - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-8"
        >
          <Link 
            href="/public/teams" 
            className="inline-flex items-center gap-1.5 sm:gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors mb-3 sm:mb-4 group text-sm sm:text-base"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
            <span>{t('team.backToTeams')}</span>
          </Link>
          
          {/* Team Header Card - Modern 2025 - Mobile Optimized */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-gray-200/50 dark:border-gray-700/50"
          >
            {/* Hero Background with Gradient - Mobile Optimized */}
            <div 
              className="relative h-32 sm:h-48 md:h-56 overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${teamColor} 0%, ${teamColor}dd 50%, ${teamColor}aa 100%)`,
              }}
            >
              {/* Radial gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/30"></div>
              
              {/* Animated background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px)`,
                  backgroundSize: '50px 50px'
                }}></div>
              </div>

              {/* Content - Mobile Optimized */}
              <div className="relative h-full flex items-end p-4 sm:p-6 md:p-8">
                <div className="flex-1 min-w-0 pr-2 sm:pr-4">
                  <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-1 sm:mb-2 drop-shadow-lg line-clamp-2">
                    {team.name}
                  </h1>
                  {team.schoolName && (
                    <p className="text-xs sm:text-base md:text-lg text-white/90 mb-2 sm:mb-3 drop-shadow-md line-clamp-1">{team.schoolName}</p>
                  )}
                  <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-2 sm:gap-3 md:gap-4 text-white/90">
                    <div className="flex items-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm">
                      <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="font-medium whitespace-nowrap">{players.length} {t('team.playersCount')}</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 bg-white/20 backdrop-blur-sm px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm">
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="font-medium line-clamp-1">{t('team.stadiumOf')} {team.name}</span>
                    </div>
                  </div>
                </div>
                {(team.logo && !logoError) ? (
                  <div className="ml-2 sm:ml-4 md:ml-6 flex-shrink-0">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                      className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl sm:rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl border-2 sm:border-4 border-white/50"
                    >
                      <img 
                        src={team.logo} 
                        alt={team.name}
                        className="w-full h-full object-cover"
                        onError={() => setLogoError(true)}
                      />
                    </motion.div>
                  </div>
                ) : (
                  <div className="ml-2 sm:ml-4 md:ml-6 flex-shrink-0">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                      className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 lg:w-28 lg:h-28 bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-xl sm:rounded-2xl flex items-center justify-center overflow-hidden shadow-2xl border-2 sm:border-4 border-white/50"
                    >
                      <div 
                        className="w-full h-full flex items-center justify-center text-lg sm:text-2xl md:text-3xl font-bold"
                        style={{ color: teamColor }}
                      >
                        {team.name.substring(0, 2).toUpperCase()}
                      </div>
                    </motion.div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Coach Info - Modern 2025 - Mobile Optimized */}
            {team.coach && (
              <div className="bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 border-t border-gray-200/50 dark:border-gray-700/50 p-3 sm:p-4 md:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white flex items-center justify-center font-bold text-base sm:text-lg md:text-xl shadow-lg flex-shrink-0"
                  >
                    {team.coach.firstName.charAt(0)}{team.coach.lastName.charAt(0)}
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1 font-medium uppercase tracking-wide">{t('team.coach')}</p>
                    <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base md:text-lg truncate">
                      {team.coach.firstName} {team.coach.lastName}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Tabs - Modern 2025 - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4 sm:mb-6 md:mb-8"
        >
          <div className="bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-lg p-1 sm:p-1.5">
            <div className="flex space-x-0.5 sm:space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-lg sm:rounded-xl font-semibold transition-all relative ${
                      isActive 
                        ? 'text-white' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-lg sm:rounded-xl shadow-lg"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                    <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 relative z-10 flex-shrink-0 ${isActive ? 'text-white' : ''}`} />
                    <span className={`relative z-10 text-xs sm:text-sm md:text-base ${isActive ? 'text-white' : ''} hidden xs:inline`}>
                      {tab.label}
                    </span>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </motion.div>

        {/* Tab Content - Mobile Optimized */}
        <div className="space-y-4 sm:space-y-6">
        {/* Matches Tab - Modern 2025 */}
        {activeTab === 'matches' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 sm:space-y-6"
          >
            {matches.length > 0 ? (
              <>
                {/* Recent/Completed Matches */}
                {matches.filter(m => m.status === 'completed').length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                        <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                        {t('team.lastResults')}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
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
                  </motion.div>
                )}

                {/* Upcoming Matches */}
                {matches.filter(m => m.status === 'scheduled').length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                      <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg flex-shrink-0">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                        {t('team.upcomingMatches')}
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
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
                  </motion.div>
                )}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-lg p-8 sm:p-12 text-center"
              >
                <Calendar className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">{t('team.noMatches')}</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{t('team.noMatchesDesc')}</p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Players Tab - Modern 2025 */}
        {activeTab === 'players' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 sm:space-y-6"
          >
            {players.length > 0 ? (
              Object.entries(groupPlayersByPosition(players)).map(([position, positionPlayers]) => {
                if (positionPlayers.length === 0) return null
                
                return (
                  <motion.div
                    key={position}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-lg p-4 sm:p-6 md:p-8"
                  >
                    <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                        <span className="text-xl sm:text-2xl md:text-3xl">{getPositionIcon(position)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{position}s</h2>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{positionPlayers.length} {positionPlayers.length > 1 ? t('team.playersCount') : t('team.playerSingular')}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {positionPlayers.map((player, index) => (
                        <motion.div
                          key={player.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ y: -4, scale: 1.02 }}
                          className="group bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-lg transition-all duration-300 border border-gray-200/50 dark:border-gray-700/50"
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white dark:bg-gray-800 rounded-lg sm:rounded-xl flex items-center justify-center border-2 border-gray-300 dark:border-gray-600 shadow-md group-hover:shadow-lg transition-shadow flex-shrink-0">
                              <span className="font-bold text-base sm:text-lg md:text-xl text-green-600 dark:text-green-400">
                                #{player.number || '?'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-900 dark:text-white truncate flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base">
                                <span className="truncate">{player.name}</span>
                                {(player as any).isCaptain && (
                                  <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 text-white text-[10px] sm:text-xs font-bold rounded-full flex-shrink-0 shadow-md" title="Capitaine">
                                    C
                                  </span>
                                )}
                              </h3>
                              {(player as any).nickname && (
                                <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 italic truncate mt-0.5">
                                  "{(player as any).nickname}"
                                </p>
                              )}
                              <p className={`text-[10px] sm:text-xs md:text-sm font-medium truncate mt-0.5 sm:mt-1 ${getPositionColor(player.position || '')}`}>
                                {player.position || t('team.positionUndefined')}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )
              })
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-lg p-8 sm:p-12 text-center"
              >
                <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">{t('team.noPlayers')}</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{t('team.noPlayers')}</p>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Statistics Tab - Modern 2025 */}
        {activeTab === 'stats' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 sm:space-y-6"
          >
            {teamStats ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group relative bg-gradient-to-br from-white via-blue-50/30 to-white dark:from-gray-800 dark:via-blue-900/20 dark:to-gray-900 rounded-xl sm:rounded-2xl border border-blue-200/50 dark:border-blue-800/50 backdrop-blur-sm p-3 sm:p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
                  <div className="relative">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <Calendar className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">{t('team.matchesPlayed')}</p>
                        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">{teamStats.matchesPlayed}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group relative bg-gradient-to-br from-white via-green-50/30 to-white dark:from-gray-800 dark:via-green-900/20 dark:to-gray-900 rounded-xl sm:rounded-2xl border border-green-200/50 dark:border-green-800/50 backdrop-blur-sm p-3 sm:p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-green-500/10 rounded-full blur-3xl"></div>
                  <div className="relative">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <Trophy className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">{t('team.points')}</p>
                        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">{teamStats.points}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group relative bg-gradient-to-br from-white via-yellow-50/30 to-white dark:from-gray-800 dark:via-yellow-900/20 dark:to-gray-900 rounded-xl sm:rounded-2xl border border-yellow-200/50 dark:border-yellow-800/50 backdrop-blur-sm p-3 sm:p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-yellow-500/10 rounded-full blur-3xl"></div>
                  <div className="relative">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <Target className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">{t('team.goalsFor')}</p>
                        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-yellow-600 dark:text-yellow-400">{teamStats.goalsFor}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group relative bg-gradient-to-br from-white via-red-50/30 to-white dark:from-gray-800 dark:via-red-900/20 dark:to-gray-900 rounded-xl sm:rounded-2xl border border-red-200/50 dark:border-red-800/50 backdrop-blur-sm p-3 sm:p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-red-500/10 rounded-full blur-3xl"></div>
                  <div className="relative">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <Shield className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">{t('team.goalsAgainst')}</p>
                        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400">{teamStats.goalsAgainst}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group relative bg-gradient-to-br from-white via-emerald-50/30 to-white dark:from-gray-800 dark:via-emerald-900/20 dark:to-gray-900 rounded-xl sm:rounded-2xl border border-emerald-200/50 dark:border-emerald-800/50 backdrop-blur-sm p-3 sm:p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>
                  <div className="relative">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <Award className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">{t('team.wins')}</p>
                        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-emerald-600 dark:text-emerald-400">{teamStats.wins}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group relative bg-gradient-to-br from-white via-gray-50/30 to-white dark:from-gray-800 dark:via-gray-700/20 dark:to-gray-900 rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm p-3 sm:p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-gray-500/10 rounded-full blur-3xl"></div>
                  <div className="relative">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">{t('team.draws')}</p>
                        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-600 dark:text-gray-400">{teamStats.draws}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group relative bg-gradient-to-br from-white via-red-50/30 to-white dark:from-gray-800 dark:via-red-900/20 dark:to-gray-900 rounded-xl sm:rounded-2xl border border-red-200/50 dark:border-red-800/50 backdrop-blur-sm p-3 sm:p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-red-500/10 rounded-full blur-3xl"></div>
                  <div className="relative">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white rotate-180" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">{t('team.losses')}</p>
                        <p className="text-xl sm:text-2xl md:text-3xl font-bold text-red-600 dark:text-red-400">{teamStats.losses}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.45 }}
                  whileHover={{ y: -4, scale: 1.02 }}
                  className="group relative bg-gradient-to-br from-white via-purple-50/30 to-white dark:from-gray-800 dark:via-purple-900/20 dark:to-gray-900 rounded-xl sm:rounded-2xl border border-purple-200/50 dark:border-purple-800/50 backdrop-blur-sm p-3 sm:p-4 md:p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
                  <div className="relative">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                        <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] sm:text-xs md:text-sm text-gray-600 dark:text-gray-400 font-medium">{t('team.goalDifference')}</p>
                        <p className={`text-xl sm:text-2xl md:text-3xl font-bold ${
                          (teamStats.goalsFor - teamStats.goalsAgainst) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                        }`}>
                          {teamStats.goalsFor - teamStats.goalsAgainst > 0 ? '+' : ''}{teamStats.goalsFor - teamStats.goalsAgainst}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-lg p-8 sm:p-12 text-center"
              >
                <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 dark:text-gray-600 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-1 sm:mb-2">{t('team.noStats')}</h3>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{t('team.statsNotAvailable')}</p>
              </motion.div>
            )}
          </motion.div>
        )}
        </div>
      </div>
    </div>
  )
}