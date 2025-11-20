"use client"

import { useEffect, useState, useMemo, useCallback } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
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
  ChevronDown
} from "lucide-react"

export default function MatchesPage() {
  const [matches, setMatches] = useState<(Match & { homeTeam?: Team; awayTeam?: Team; result?: MatchResult })[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'scheduled' | 'completed' | 'in_progress'>('all')
  const [selectedRound, setSelectedRound] = useState<number | 'all'>('all')
  const [rounds, setRounds] = useState<number[]>([])
  const [showFilters, setShowFilters] = useState(false)



  useEffect(() => {
    const fetchMatches = async () => {
      try {
        console.log("Starting to fetch data...")
        
        // Fetch matches
        const matchesRef = collection(db, "matches")
        console.log("Matches collection reference created")
        
        const matchesQuery = query(matchesRef, orderBy("date", "asc"))
        console.log("Matches query created with orderBy date ascending")
        
        const matchesSnap = await getDocs(matchesQuery)
        console.log(`Found ${matchesSnap.docs.length} matches`)
        
        if (matchesSnap.empty) {
          console.log("No matches found in the collection")
        } else {
          console.log("Matches data:", matchesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate?.()?.toISOString() || 'Invalid Date'
          })))
        }
        
        // Fetch teams
        const teamsRef = collection(db, "teams")
        const teamsSnap = await getDocs(teamsRef)
        console.log(`Found ${teamsSnap.docs.length} teams`)
        
        // Fetch results
        const resultsRef = collection(db, "matchResults")
        const resultsSnap = await getDocs(resultsRef)
        console.log(`Found ${resultsSnap.docs.length} match results`)

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
          console.log(`Mapped result for match ${resultData.matchId}:`, {
            id: doc.id,
            homeScore: resultData.homeTeamScore,
            awayScore: resultData.awayTeamScore
          })
        })

        const matchesData = matchesSnap.docs.map((doc) => {
          const data = doc.data()
          const matchId = doc.id
          
          // Debug logging
          console.log('Raw match data:', {
            id: matchId,
            ...data,
          })
          
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
            result: resultsMap.get(matchId)
          }
          
          // Debug logging for match data
          console.log('Match details:', {
            id: matchId,
            status: processedMatch.status,
            hasResult: !!resultsMap.get(matchId),
            homeTeam: processedMatch.homeTeam?.name,
            awayTeam: processedMatch.awayTeam?.name
          });

          // Debug logging
          console.log('Processed match:', processedMatch)
          
          return processedMatch as Match & { homeTeam?: Team; awayTeam?: Team; result?: MatchResult }
        })

        setMatches(matchesData)
        
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

  // Filter matches based on status and round - optimisé avec useMemo
  const filteredMatches = useMemo(() => {
    let filtered = matches

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
  }, [matches, filterStatus, selectedRound])





  // Debug log when component renders
  console.log('Rendering matches page with:', {
    numberOfMatches: matches.length,
    loading,
    matchesWithResults: matches.filter(m => m.result).length
  })

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
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Compact Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-sofa-text-primary mb-2">{t('matches.title')}</h1>
        <p className="text-sofa-text-secondary">{t('matches.subtitle')}</p>
      </div>

      {/* Publicité en haut de page */}
      <AdBanner slot="1234567893" format="auto" style="horizontal" className="mb-6" />

      {/* Quick Stats - More Compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="sofa-stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-sofa-blue" />
            <span className="text-sm font-medium text-sofa-text-secondary">{t('matches.total')}</span>
          </div>
          <div className="sofa-stat-number text-xl">{matches.length}</div>
        </div>
        
        <div className="sofa-stat-card">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-sofa-green" />
            <span className="text-sm font-medium text-sofa-text-secondary">{t('matches.completed')}</span>
          </div>
          <div className="sofa-stat-number text-xl">{matches.filter(m => m.status === 'completed').length}</div>
        </div>
        
        <div className="sofa-stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-sofa-orange" />
            <span className="text-sm font-medium text-sofa-text-secondary">{t('matches.upcoming')}</span>
          </div>
          <div className="sofa-stat-number text-xl">{matches.filter(m => m.status === 'scheduled').length}</div>
        </div>
        
        <div className="sofa-stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-5 h-5 text-sofa-text-accent" />
            <span className="text-sm font-medium text-sofa-text-secondary">{t('matches.rounds')}</span>
          </div>
          <div className="sofa-stat-number text-xl">{rounds.length}</div>
        </div>
      </div>

      {/* Improved Filters */}
      <div className="sofa-card p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-sofa-text-primary flex items-center gap-2">
            <Filter className="w-4 h-4" />
            {t('matches.filters')}
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center gap-2 text-sofa-text-muted hover:text-sofa-text-primary transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            {showFilters ? t('matches.hide') : t('matches.show')}
          </button>
        </div>
        
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-3 ${showFilters ? 'block' : 'hidden md:grid'}`}>
          {/* Quick Filter Buttons */}
          <div className="md:col-span-4 flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filterStatus === 'all' 
                  ? 'bg-sofa-text-accent text-white' 
                  : 'bg-sofa-bg-tertiary text-sofa-text-muted hover:bg-sofa-bg-hover'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilterStatus('in_progress')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filterStatus === 'in_progress' 
                  ? 'bg-sofa-red text-white' 
                  : 'bg-sofa-bg-tertiary text-sofa-text-muted hover:bg-sofa-bg-hover'
              }`}
            >
              🔴 {t('matches.live')}
            </button>
            <button
              onClick={() => setFilterStatus('scheduled')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filterStatus === 'scheduled' 
                  ? 'bg-sofa-blue text-white' 
                  : 'bg-sofa-bg-tertiary text-sofa-text-muted hover:bg-sofa-bg-hover'
              }`}
            >
              📅 {t('matches.upcoming')}
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filterStatus === 'completed' 
                  ? 'bg-sofa-green text-white' 
                  : 'bg-sofa-bg-tertiary text-sofa-text-muted hover:bg-sofa-bg-hover'
              }`}
            >
              ✅ {t('matches.completed')}
            </button>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-sofa-text-muted mb-1">{t('matches.round')}</label>
            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full px-3 py-2 border border-sofa-border rounded-lg focus:ring-2 focus:ring-sofa-text-accent outline-none bg-sofa-bg-card text-sofa-text-primary"
            >
              <option value="all">{t('matches.all')}</option>
              {rounds.map(round => (
                <option key={round} value={round}>{t('matches.round')} {round}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterStatus('all')
                setSelectedRound('all')
              }}
              className="w-full px-3 py-2 bg-sofa-bg-tertiary text-sofa-text-primary rounded-lg hover:bg-sofa-bg-hover transition-colors text-sm"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Publicité après les filtres */}
      <AdBanner slot="1234567894" format="auto" style="horizontal" className="mb-6" />

      {/* Organized Matches Display */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-sofa-border border-t-sofa-text-accent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sofa-text-muted">{t('matches.loading')}</p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="sofa-card p-12 text-center">
          <Calendar className="w-16 h-16 text-sofa-text-muted mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-sofa-text-primary mb-2">{t('matches.notFound')}</h3>
          <p className="text-sofa-text-muted">{t('matches.noMatchesFilter')}</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Live Matches - Highest Priority */}
          {liveMatches.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-sofa-red rounded-full animate-pulse"></div>
                <h2 className="text-xl font-bold text-sofa-text-primary">{t('matches.liveMatches')}</h2>
                <span className="bg-sofa-red text-white px-2 py-1 rounded-full text-xs font-medium">
                  {liveMatches.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveMatches.map((match, index) => {
                  const convertedMatch = {
                    id: match.id,
                    teamA: match.homeTeam?.name || t('home.unknownTeam'),
                    teamB: match.awayTeam?.name || t('home.unknownTeam'),
                    teamAId: match.homeTeamId,
                    teamBId: match.awayTeamId,
                    date: match.date,
                    scoreA: match.result?.homeTeamScore,
                    scoreB: match.result?.awayTeamScore,
                    status: 'live' as const,
                    venue: `${t('team.stadiumOf')} ${match.homeTeam?.name || t('home.unknownTeam')}`,
                    round: match.round
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
            </section>
          )}

          {/* Publicité après les matchs en direct */}
          {liveMatches.length > 0 && (
            <AdBanner slot="1234567895" format="auto" style="horizontal" />
          )}

          {/* Today's Matches */}
          {todayMatches.length > 0 && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Calendar className="w-5 h-5 text-sofa-blue" />
                <h2 className="text-xl font-bold text-sofa-text-primary">Aujourd'hui</h2>
                <span className="bg-sofa-blue text-white px-2 py-1 rounded-full text-xs font-medium">
                  {todayMatches.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {todayMatches.map((match, index) => {
                  const convertedMatch = {
                    id: match.id,
                    teamA: match.homeTeam?.name || t('home.unknownTeam'),
                    teamB: match.awayTeam?.name || t('home.unknownTeam'),
                    teamAId: match.homeTeamId,
                    teamBId: match.awayTeamId,
                    date: match.date,
                    scoreA: match.result?.homeTeamScore,
                    scoreB: match.result?.awayTeamScore,
                    status: match.status === 'completed' ? 'completed' as const : 'upcoming' as const,
                    venue: `${t('team.stadiumOf')} ${match.homeTeam?.name || t('home.unknownTeam')}`,
                    round: match.round
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
            </section>
          )}

          {/* Upcoming Matches */}
          {upcomingMatches.length > 0 && filterStatus !== 'completed' && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-sofa-orange" />
                  <h2 className="text-xl font-bold text-sofa-text-primary">{t('matches.upcomingMatches')}</h2>
                  <span className="bg-sofa-orange text-white px-2 py-1 rounded-full text-xs font-medium">
                    {upcomingMatches.length}
                  </span>
                </div>
                {upcomingMatches.length > 6 && (
                  <button 
                    onClick={() => setFilterStatus('scheduled')}
                    className="text-sofa-text-accent hover:text-sofa-green transition-colors text-sm font-medium"
                  >
                    {t('home.viewAll')} →
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingMatches.map((match, index) => {
                  const convertedMatch = {
                    id: match.id,
                    teamA: match.homeTeam?.name || t('home.unknownTeam'),
                    teamB: match.awayTeam?.name || t('home.unknownTeam'),
                    teamAId: match.homeTeamId,
                    teamBId: match.awayTeamId,
                    date: match.date,
                    scoreA: match.result?.homeTeamScore,
                    scoreB: match.result?.awayTeamScore,
                    status: 'upcoming' as const,
                    venue: `${t('team.stadiumOf')} ${match.homeTeam?.name || t('home.unknownTeam')}`,
                    round: match.round
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
            </section>
          )}

          {/* Recent Results */}
          {recentMatches.length > 0 && filterStatus !== 'scheduled' && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Trophy className="w-5 h-5 text-sofa-green" />
                  <h2 className="text-xl font-bold text-sofa-text-primary">{t('matches.lastResults')}</h2>
                  <span className="bg-sofa-green text-white px-2 py-1 rounded-full text-xs font-medium">
                    {recentMatches.length}
                  </span>
                </div>
                {recentMatches.length > 6 && (
                  <button 
                    onClick={() => setFilterStatus('completed')}
                    className="text-sofa-text-accent hover:text-sofa-green transition-colors text-sm font-medium"
                  >
                    {t('home.viewAll')} →
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentMatches.map((match, index) => {
                  const convertedMatch = {
                    id: match.id,
                    teamA: match.homeTeam?.name || t('home.unknownTeam'),
                    teamB: match.awayTeam?.name || t('home.unknownTeam'),
                    teamAId: match.homeTeamId,
                    teamBId: match.awayTeamId,
                    date: match.date,
                    scoreA: match.result?.homeTeamScore,
                    scoreB: match.result?.awayTeamScore,
                    status: 'completed' as const,
                    venue: `${t('team.stadiumOf')} ${match.homeTeam?.name || t('home.unknownTeam')}`,
                    round: match.round
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
            </section>
          )}

          {/* All Matches (when filters are applied) */}
          {(filterStatus !== 'all' || selectedRound !== 'all') && (
            <section>
              <div className="flex items-center gap-3 mb-4">
                <Filter className="w-5 h-5 text-sofa-text-accent" />
                <h2 className="text-xl font-bold text-sofa-text-primary">
                  {t('matches.filteredResults')}
                  {filterStatus !== 'all' && ` - ${
                    filterStatus === 'scheduled' ? 'À venir' :
                    filterStatus === 'completed' ? t('matches.completedPlural') :
                    filterStatus === 'in_progress' ? 'En direct' : ''
                  }`}
                  {selectedRound !== 'all' && ` - ${t('matches.round')} ${selectedRound}`}
                </h2>
                <span className="bg-sofa-text-accent text-white px-2 py-1 rounded-full text-xs font-medium">
                  {filteredMatches.length}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredMatches.map((match, index) => {
                  const convertedMatch = {
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
            </section>
          )}
        </div>
      )}
    </div>
  )
}
