"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { motion } from "framer-motion"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy, limit, where } from "firebase/firestore"
import type { Match, Team, MatchResult } from "@/lib/types"
import { SofaMatchCard } from "@/components/sofa/match-card"
import { t } from "@/lib/i18n"
import { AdBanner } from "@/components/ads/AdBanner"

import { 
  Calendar, 
  Clock, 
  Trophy, 
  Users, 
  CheckCircle,
  Filter,
  ChevronDown,
  Flame
} from "lucide-react"
import type { PreseasonMatch } from '@/lib/types'

export default function MatchesPage() {
  const [matches, setMatches] = useState<(Match & { homeTeam?: Team; awayTeam?: Team; result?: MatchResult })[]>([])
  const [preseasonMatches, setPreseasonMatches] = useState<(PreseasonMatch & { teamALogo?: string; teamBLogo?: string })[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'completed' | 'in_progress'>('all')
  const [selectedRound, setSelectedRound] = useState<number | 'all'>('all')
  const [rounds, setRounds] = useState<number[]>([])
  const [showFilters, setShowFilters] = useState(false)



  useEffect(() => {
    const fetchMatches = async () => {
      try {
        // Fetch regular matches - limit to recent matches for performance
        const matchesRef = collection(db, "matches")
        const matchesQuery = query(
          matchesRef, 
          where("isTest", "==", false), // Exclude test matches
          orderBy("date", "asc"),
          limit(200) // Limit to 200 most recent matches
        )
        const matchesSnap = await getDocs(matchesQuery)
        
        // Fetch preseason matches
        const preseasonRes = await fetch('/api/preseason/matches')
        const preseasonData = await preseasonRes.json()
        setPreseasonMatches(preseasonData.matches || [])
        
        // Fetch teams (only active ones)
        const teamsSnap = await getDocs(query(collection(db, "teams"), where("isActive", "==", true)))
        
        // Fetch results
        const resultsRef = collection(db, "matchResults")
        const resultsSnap = await getDocs(resultsRef)

        const teamsMap = new Map()
        teamsSnap.docs.forEach((doc) => {
          teamsMap.set(doc.id, { id: doc.id, ...doc.data() })
        })

        const resultsMap = new Map()
        resultsSnap.docs.forEach((doc) => {
          const resultData = doc.data() as MatchResult
          resultsMap.set(resultData.matchId, { 
            ...resultData,
            id: doc.id  // This will override any id in the data
          })
        })

        let matchesData = matchesSnap.docs.map((doc) => {
          const data = doc.data()
          const matchId = doc.id
          
          // Convert various possible date representations to a JS Date
          const parseDateValue = (value: any): Date | null => {
            if (!value) return null
            // Firestore Timestamp object
            if (typeof value.toDate === 'function') {
              try {
                return value.toDate()
              } catch (e) {
                console.error('Error calling toDate on timestamp:', e)
              }
            }

            // Raw Firestore timestamp-like object { seconds, nanoseconds }
            if (typeof value === 'object' && value.seconds != null) {
              const secs = Number(value.seconds)
              const nanos = Number(value.nanoseconds || 0)
              return new Date(secs * 1000 + Math.round(nanos / 1e6))
            }

            // If it's a number, assume it's seconds (not ms) if it's small (< 1e12), otherwise ms
            if (typeof value === 'number') {
              // If looks like seconds (e.g., 10-digit), convert to ms
              if (value < 1e12) {
                return new Date(value * 1000)
              }
              return new Date(value)
            }

            // If it's a string, let Date parse it (ISO strings etc.)
            if (typeof value === 'string') {
              const d = new Date(value)
              if (!isNaN(d.getTime())) return d
            }

            // If it's already a Date
            if (value instanceof Date) return value

            // Fallback: try to construct a Date
            try {
              const d = new Date(value)
              if (!isNaN(d.getTime())) return d
            } catch (e) {
              console.error('Unknown date value format:', value)
            }

            return null
          }

          let matchDate = parseDateValue(data.date) || new Date()

          const processedMatch = {
            ...data,
            id: matchId,
            date: matchDate,
            status: data.status || "scheduled", // Keep existing status or default to scheduled
            homeTeam: teamsMap.get(data.homeTeamId),
            awayTeam: teamsMap.get(data.awayTeamId),
            result: resultsMap.get(matchId),
            isTest: data.isTest || false
          }
          
          return processedMatch as Match & { homeTeam?: Team; awayTeam?: Team; result?: MatchResult }
        })

        // Filtrer les matchs de test et les finales non publiées (ne pas les afficher publiquement)
        const publicMatches = matchesData.filter(match => {
          if (match.isTest) return false
          // Si c'est une finale, vérifier qu'elle est publiée
          if ((match as any).isFinal && !(match as any).isPublished) return false
          return true
        })

        setMatches(publicMatches)
        
        // Extract unique rounds for filtering
        const uniqueRounds = [...new Set(matchesData.map(m => m.round))].sort((a, b) => a - b)
        setRounds(uniqueRounds)
        
      } catch (error) {
        console.error("Error fetching matches:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [])






  // Convert preseason matches to match format
  const convertedPreseasonMatches = useMemo(() => {
    return preseasonMatches.map(match => {
      const matchDate = new Date(match.date)
      const [hours, minutes] = match.time.split(':')
      matchDate.setHours(parseInt(hours), parseInt(minutes), 0, 0)
      
      return {
        id: `preseason-${match.id}`,
        homeTeamId: match.teamAId,
        awayTeamId: match.teamBId,
        homeTeam: { id: match.teamAId, name: match.teamAName, logo: match.teamALogo },
        awayTeam: { id: match.teamBId, name: match.teamBName, logo: match.teamBLogo },
        date: matchDate,
        status: match.status === 'finished' ? 'completed' as const :
                match.status === 'in_progress' ? 'in_progress' as const :
                'scheduled' as const,
        round: 0, // Preseason matches don't have rounds
        isPreseason: true,
        location: match.location,
        scoreA: match.scoreA,
        scoreB: match.scoreB,
        penaltiesA: match.penaltiesA,
        penaltiesB: match.penaltiesB,
      } as Match & { homeTeam?: Team; awayTeam?: Team; isPreseason?: boolean; location?: string; scoreA?: number; scoreB?: number; penaltiesA?: number; penaltiesB?: number }
    })
  }, [preseasonMatches])

  // Combine regular and preseason matches
  const allMatches = useMemo(() => {
    return [...matches, ...convertedPreseasonMatches]
  }, [matches, convertedPreseasonMatches])

  // Filter matches based on status and round - optimisé avec useMemo
  const filteredMatches = useMemo(() => {
    let filtered = allMatches

    if (filterStatus !== 'all') {
      filtered = filtered.filter(match => match.status === filterStatus)
    }

    if (selectedRound !== 'all') {
      filtered = filtered.filter(match => match.round === selectedRound)
    }

    // Sort by date (upcoming first, then completed)
    filtered.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1
      if (a.status !== 'completed' && b.status === 'completed') return -1
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

    return filtered
  }, [allMatches, filterStatus, selectedRound])

  // Organize matches by priority - optimisé avec useMemo
  const { liveMatches, todayMatches, upcomingMatches, recentMatches } = useMemo(() => {
    const live = filteredMatches.filter(m => m.status === 'in_progress')
    const today = filteredMatches.filter(m => {
      const today = new Date()
      const matchDate = new Date(m.date)
      return matchDate.toDateString() === today.toDateString() && m.status !== 'in_progress'
    })
    const upcoming = filteredMatches.filter(m => 
      m.status === 'scheduled' && 
      !today.includes(m)
    ).slice(0, 6)
    const recent = filteredMatches.filter(m => m.status === 'completed').slice(0, 6)
    
    return { liveMatches: live, todayMatches: today, upcomingMatches: upcoming, recentMatches: recent }
  }, [filteredMatches])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-12">
        {/* Header - Modern 2025 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
              <Calendar className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                {t('matches.title')}
              </h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">{t('matches.subtitle')}</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats - Modern 2025 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="group relative bg-gradient-to-br from-white via-blue-50/30 to-white dark:from-gray-800 dark:via-blue-900/20 dark:to-gray-900 rounded-xl sm:rounded-2xl border border-blue-200/50 dark:border-blue-800/50 backdrop-blur-sm p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-blue-500/10 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('matches.total')}</span>
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">{allMatches.length}</div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="group relative bg-gradient-to-br from-white via-green-50/30 to-white dark:from-gray-800 dark:via-green-900/20 dark:to-gray-900 rounded-xl sm:rounded-2xl border border-green-200/50 dark:border-green-800/50 backdrop-blur-sm p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-green-500/10 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('matches.completed')}</span>
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 dark:text-green-400">{allMatches.filter(m => m.status === 'completed').length}</div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="group relative bg-gradient-to-br from-white via-orange-50/30 to-white dark:from-gray-800 dark:via-orange-900/20 dark:to-gray-900 rounded-xl sm:rounded-2xl border border-orange-200/50 dark:border-orange-800/50 backdrop-blur-sm p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-orange-500/10 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('matches.upcoming')}</span>
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600 dark:text-orange-400">{allMatches.filter(m => m.status === 'scheduled').length}</div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
            whileHover={{ y: -4, scale: 1.02 }}
            className="group relative bg-gradient-to-br from-white via-purple-50/30 to-white dark:from-gray-800 dark:via-purple-900/20 dark:to-gray-900 rounded-xl sm:rounded-2xl border border-purple-200/50 dark:border-purple-800/50 backdrop-blur-sm p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 sm:w-32 sm:h-32 bg-purple-500/10 rounded-full blur-3xl"></div>
            <div className="relative">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">{t('matches.rounds')}</span>
              </div>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">{rounds.length}</div>
            </div>
          </motion.div>
        </div>

        {/* Filters - Modern 2025 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-lg p-4 sm:p-6 mb-6 sm:mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {t('matches.filters')}
              </h2>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              {showFilters ? t('matches.hide') : t('matches.show')}
            </button>
          </div>
          
          <div className={`grid grid-cols-1 md:grid-cols-4 gap-3 ${showFilters ? 'block' : 'hidden md:grid'}`}>
            {/* Quick Filter Buttons */}
            <div className="md:col-span-4 flex flex-wrap gap-2 mb-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterStatus('all')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  filterStatus === 'all' 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                Tous
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterStatus('in_progress')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  filterStatus === 'in_progress' 
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                🔴 {t('matches.live')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterStatus('scheduled')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  filterStatus === 'scheduled' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                📅 {t('matches.upcoming')}
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterStatus('completed')}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
                  filterStatus === 'completed' 
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                ✅ {t('matches.completed')}
              </motion.button>
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{t('matches.round')}</label>
              <select
                value={selectedRound}
                onChange={(e) => setSelectedRound(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="all">{t('matches.all')}</option>
                {rounds.map(round => (
                  <option key={round} value={round}>{t('matches.round')} {round}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setFilterStatus('all')
                  setSelectedRound('all')
                }}
                className="w-full px-3 py-2 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-900 dark:text-white rounded-lg sm:rounded-xl hover:from-gray-200 hover:to-gray-300 dark:hover:from-gray-600 dark:hover:to-gray-500 transition-all text-sm font-semibold shadow-md"
              >
                Réinitialiser
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Organized Matches Display */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">{t('matches.loading')}</p>
          </div>
        ) : filteredMatches.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-xl sm:rounded-2xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-lg p-12 text-center"
          >
            <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('matches.notFound')}</h3>
            <p className="text-gray-600 dark:text-gray-400">{t('matches.noMatchesFilter')}</p>
          </motion.div>
        ) : (
          <div className="space-y-6 sm:space-y-8">
            {/* Live Matches - Highest Priority */}
            {liveMatches.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{t('matches.liveMatches')}</h2>
                  <span className="bg-gradient-to-r from-red-500 to-red-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
                    {liveMatches.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {liveMatches.map((match, index) => {
                  const isPreseason = (match as any).isPreseason
                  const convertedMatch = {
                    id: match.id,
                    teamA: match.homeTeam?.name || t('home.unknownTeam'),
                    teamB: match.awayTeam?.name || t('home.unknownTeam'),
                    teamAId: match.homeTeamId,
                    teamBId: match.awayTeamId,
                    date: match.date,
                    scoreA: isPreseason ? (match as any).scoreA : match.result?.homeTeamScore,
                    scoreB: isPreseason ? (match as any).scoreB : match.result?.awayTeamScore,
                    status: 'live' as const,
                    venue: isPreseason ? (match as any).location : `${t('team.stadiumOf')} ${match.homeTeam?.name || t('home.unknownTeam')}`,
                    round: match.round,
                    isPreseason,
                    penaltiesA: isPreseason ? (match as any).penaltiesA : undefined,
                    penaltiesB: isPreseason ? (match as any).penaltiesB : undefined,
                  }
                  
                  return (
                    <SofaMatchCard 
                      key={match.id} 
                      match={convertedMatch} 
                      index={index} 
                    />
                  )
                })}
              </div>
              </motion.section>
            )}

            {/* Today's Matches */}
            {todayMatches.length > 0 && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Aujourd'hui</h2>
                  <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
                    {todayMatches.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {todayMatches.map((match, index) => {
                  const isPreseason = (match as any).isPreseason
                  const convertedMatch = {
                    id: match.id,
                    teamA: match.homeTeam?.name || t('home.unknownTeam'),
                    teamB: match.awayTeam?.name || t('home.unknownTeam'),
                    teamAId: match.homeTeamId,
                    teamBId: match.awayTeamId,
                    date: match.date,
                    scoreA: isPreseason ? (match as any).scoreA : match.result?.homeTeamScore,
                    scoreB: isPreseason ? (match as any).scoreB : match.result?.awayTeamScore,
                    status: match.status === 'completed' ? 'completed' as const : 'upcoming' as const,
                    venue: isPreseason ? (match as any).location : `${t('team.stadiumOf')} ${match.homeTeam?.name || t('home.unknownTeam')}`,
                    round: match.round,
                    isPreseason,
                    penaltiesA: isPreseason ? (match as any).penaltiesA : undefined,
                    penaltiesB: isPreseason ? (match as any).penaltiesB : undefined,
                  }
                  
                  return (
                    <SofaMatchCard 
                      key={match.id} 
                      match={convertedMatch} 
                      index={index} 
                    />
                  )
                })}
              </div>
              </motion.section>
            )}

            {/* Upcoming Matches */}
            {upcomingMatches.length > 0 && filterStatus !== 'completed' && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{t('matches.upcomingMatches')}</h2>
                    <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
                      {upcomingMatches.length}
                    </span>
                  </div>
                  {upcomingMatches.length > 6 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFilterStatus('scheduled')}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors text-sm font-semibold"
                    >
                      {t('home.viewAll')} →
                    </motion.button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {upcomingMatches.map((match, index) => {
                  const isPreseason = (match as any).isPreseason
                  const convertedMatch = {
                    id: match.id,
                    teamA: match.homeTeam?.name || t('home.unknownTeam'),
                    teamB: match.awayTeam?.name || t('home.unknownTeam'),
                    teamAId: match.homeTeamId,
                    teamBId: match.awayTeamId,
                    date: match.date,
                    scoreA: isPreseason ? (match as any).scoreA : match.result?.homeTeamScore,
                    scoreB: isPreseason ? (match as any).scoreB : match.result?.awayTeamScore,
                    status: 'upcoming' as const,
                    venue: isPreseason ? (match as any).location : `${t('team.stadiumOf')} ${match.homeTeam?.name || t('home.unknownTeam')}`,
                    round: match.round,
                    isPreseason,
                    penaltiesA: isPreseason ? (match as any).penaltiesA : undefined,
                    penaltiesB: isPreseason ? (match as any).penaltiesB : undefined,
                  }
                  
                  return (
                    <SofaMatchCard 
                      key={match.id} 
                      match={convertedMatch} 
                      index={index} 
                    />
                  )
                })}
              </div>
              </motion.section>
            )}

            {/* Recent Results */}
            {recentMatches.length > 0 && filterStatus !== 'scheduled' && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                      <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{t('matches.lastResults')}</h2>
                    <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
                      {recentMatches.length}
                    </span>
                  </div>
                  {recentMatches.length > 6 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFilterStatus('completed')}
                      className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors text-sm font-semibold"
                    >
                      {t('home.viewAll')} →
                    </motion.button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {recentMatches.map((match, index) => {
                  const isPreseason = (match as any).isPreseason
                  const convertedMatch = {
                    id: match.id,
                    teamA: match.homeTeam?.name || t('home.unknownTeam'),
                    teamB: match.awayTeam?.name || t('home.unknownTeam'),
                    teamAId: match.homeTeamId,
                    teamBId: match.awayTeamId,
                    date: match.date,
                    scoreA: isPreseason ? (match as any).scoreA : match.result?.homeTeamScore,
                    scoreB: isPreseason ? (match as any).scoreB : match.result?.awayTeamScore,
                    status: 'completed' as const,
                    venue: isPreseason ? (match as any).location : `${t('team.stadiumOf')} ${match.homeTeam?.name || t('home.unknownTeam')}`,
                    round: match.round,
                    isPreseason,
                    penaltiesA: isPreseason ? (match as any).penaltiesA : undefined,
                    penaltiesB: isPreseason ? (match as any).penaltiesB : undefined,
                  }
                  
                  return (
                    <SofaMatchCard 
                      key={match.id} 
                      match={convertedMatch} 
                      index={index} 
                    />
                  )
                })}
              </div>
              </motion.section>
            )}

            {/* All Matches (when filters are applied) */}
            {(filterStatus !== 'all' || selectedRound !== 'all') && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
                    <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    {t('matches.filteredResults')}
                    {filterStatus !== 'all' && ` - ${
                      filterStatus === 'scheduled' ? 'À venir' :
                      filterStatus === 'completed' ? t('matches.completedPlural') :
                      filterStatus === 'in_progress' ? 'En direct' : ''
                    }`}
                    {selectedRound !== 'all' && ` - ${t('matches.round')} ${selectedRound}`}
                  </h2>
                  <span className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold shadow-lg">
                    {filteredMatches.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {filteredMatches.map((match, index) => {
                  const isPreseason = (match as any).isPreseason
                  const convertedMatch = {
                    id: match.id,
                    teamA: match.homeTeam?.name || t('home.unknownTeam'),
                    teamB: match.awayTeam?.name || t('home.unknownTeam'),
                    teamAId: match.homeTeamId,
                    teamBId: match.awayTeamId,
                    date: match.date,
                    scoreA: isPreseason ? (match as any).scoreA : match.result?.homeTeamScore,
                    scoreB: isPreseason ? (match as any).scoreB : match.result?.awayTeamScore,
                    status: match.status === 'completed' ? 'completed' as const : 
                            match.status === 'in_progress' ? 'live' as const :
                            'upcoming' as const,
                    venue: isPreseason ? (match as any).location : `${t('team.stadiumOf')} ${match.homeTeam?.name || t('home.unknownTeam')}`,
                    round: match.round,
                    isPreseason,
                    penaltiesA: isPreseason ? (match as any).penaltiesA : undefined,
                    penaltiesB: isPreseason ? (match as any).penaltiesB : undefined,
                  }
                  
                  return (
                    <SofaMatchCard 
                      key={match.id} 
                      match={convertedMatch} 
                      index={index} 
                    />
                  )
                })}
              </div>
              </motion.section>
            )}
          </div>
        )}

        {/* Publicité discrète en bas de page */}
        <div className="pt-6 sm:pt-8 mt-6 sm:mt-8">
          <AdBanner slot="1234567893" format="auto" style="horizontal" className="opacity-75" />
        </div>
      </div>
    </div>
  )
}
