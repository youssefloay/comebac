"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy } from "firebase/firestore"
import type { Match, Team, MatchResult } from "@/lib/types"


import { 
  Calendar, 
  Clock, 
  MapPin, 
  Trophy, 
  Users, 
  Target,
  Home,
  Plane,
  CheckCircle,
  PlayCircle,
  XCircle,
  Filter,
  ChevronDown
} from "lucide-react"

export default function MatchesPage() {
  const [matches, setMatches] = useState<(Match & { homeTeam?: Team; awayTeam?: Team; result?: MatchResult })[]>([])
  const [filteredMatches, setFilteredMatches] = useState<(Match & { homeTeam?: Team; awayTeam?: Team; result?: MatchResult })[]>([])
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

  // Filter matches based on status and round
  useEffect(() => {
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

    setFilteredMatches(filtered)
  }, [matches, filterStatus, selectedRound])

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Date non définie"
    const parseDateValue = (value: any): Date | null => {
      if (!value) return null
      if (typeof value.toDate === 'function') return value.toDate()
      if (typeof value === 'object' && value.seconds != null) {
        const secs = Number(value.seconds)
        const nanos = Number(value.nanoseconds || 0)
        return new Date(secs * 1000 + Math.round(nanos / 1e6))
      }
      if (typeof value === 'number') return value < 1e12 ? new Date(value * 1000) : new Date(value)
      if (typeof value === 'string') {
        const d = new Date(value)
        if (!isNaN(d.getTime())) return d
      }
      if (value instanceof Date) return value
      try {
        const d = new Date(value)
        if (!isNaN(d.getTime())) return d
      } catch (e) {}
      return null
    }

    const date = parseDateValue(timestamp) || new Date()
    return date.toLocaleDateString("fr-FR", { 
      weekday: "long", 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    })
  }

  const formatShortDate = (timestamp: any) => {
    if (!timestamp) return ""
    const date = new Date(timestamp)
    return date.toLocaleDateString("fr-FR", { 
      day: "2-digit", 
      month: "2-digit",
      year: "2-digit"
    })
  }

  const formatTime = (timestamp: any) => {
    if (!timestamp) return ""
    const date = new Date(timestamp)
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Terminé',
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
          iconColor: 'text-green-600'
        }
      case 'in_progress':
        return {
          label: 'En cours',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: PlayCircle,
          iconColor: 'text-yellow-600'
        }
      case 'cancelled':
        return {
          label: 'Annulé',
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: XCircle,
          iconColor: 'text-red-600'
        }
      default:
        return {
          label: 'À venir',
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: Clock,
          iconColor: 'text-blue-600'
        }
    }
  }

  const getMatchResult = (match: Match & { result?: MatchResult }) => {
    if (!match.result) return null
    
    const homeScore = match.result.homeTeamScore
    const awayScore = match.result.awayTeamScore
    
    if (homeScore > awayScore) {
      return { winner: 'home', result: 'Victoire à domicile' }
    } else if (awayScore > homeScore) {
      return { winner: 'away', result: 'Victoire à l\'extérieur' }
    } else {
      return { winner: 'draw', result: 'Match nul' }
    }
  }

  const isMatchPassed = (matchDate: Date) => {
    if (!matchDate) return false
    
    // Set current date to October 26, 2025
    const now = new Date(2025, 9, 26) // Note: month is 0-based, so 9 is October
    
    // Set both dates to start of day for comparison
    const matchDay = new Date(matchDate.getFullYear(), matchDate.getMonth(), matchDate.getDate())
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    console.log('Comparing dates:', {
      matchDate: matchDay.toISOString(),
      today: today.toISOString(),
      isPassed: matchDay < today
    })
    
    return matchDay < today
  }



  // Debug log when component renders
  console.log('Rendering matches page with:', {
    numberOfMatches: matches.length,
    loading,
    matchesWithResults: matches.filter(m => m.result).length
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Calendrier des Matchs</h1>
        <p className="text-gray-600">Suivez tous les matchs de la ligue scolaire</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl">
          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8" />
            <div>
              <p className="text-blue-100 text-sm">Total Matchs</p>
              <p className="text-2xl font-bold">{matches.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8" />
            <div>
              <p className="text-green-100 text-sm">Terminés</p>
              <p className="text-2xl font-bold">{matches.filter(m => m.status === 'completed').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-xl">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8" />
            <div>
              <p className="text-orange-100 text-sm">À venir</p>
              <p className="text-2xl font-bold">{matches.filter(m => m.status === 'scheduled').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl">
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8" />
            <div>
              <p className="text-purple-100 text-sm">Journées</p>
              <p className="text-2xl font-bold">{rounds.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtres
          </h2>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            {showFilters ? 'Masquer' : 'Afficher'}
          </button>
        </div>
        
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${showFilters ? 'block' : 'hidden md:grid'}`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">Tous les matchs</option>
              <option value="scheduled">À venir</option>
              <option value="in_progress">En cours</option>
              <option value="completed">Terminés</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Journée</label>
            <select
              value={selectedRound}
              onChange={(e) => setSelectedRound(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="all">Toutes les journées</option>
              {rounds.map(round => (
                <option key={round} value={round}>Journée {round}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterStatus('all')
                setSelectedRound('all')
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* Matches List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des matchs...</p>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun match trouvé</h3>
          <p className="text-gray-600">Aucun match ne correspond aux filtres sélectionnés.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredMatches.map((match) => {
            const statusInfo = getStatusInfo(match.status)
            const matchResult = getMatchResult(match)
            const StatusIcon = statusInfo.icon
            
            return (
              <div key={`match-${match.id}`} className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200">
                {/* Match Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-blue-50 p-2 rounded-lg">
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{formatDate(match.date)}</p>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {formatTime(match.date)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                        Journée {match.round}
                      </span>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full border ${statusInfo.color} flex items-center gap-2`}>
                        <StatusIcon className={`w-4 h-4 ${statusInfo.iconColor}`} />
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Match Content */}
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                    {/* Home Team */}
                    <div className="text-center lg:text-right">
                      <div className="flex items-center justify-center lg:justify-end gap-3 mb-3">
                        <div className="bg-green-50 p-2 rounded-lg">
                          <Home className="w-5 h-5 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-green-700 bg-green-50 px-2 py-1 rounded">
                          DOMICILE
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {match.homeTeam?.name || "Équipe inconnue"}
                      </h3>
                      
                      {match.result && (
                        <div className="space-y-2">
                          <div className={`text-4xl font-bold ${
                            matchResult?.winner === 'home' ? 'text-green-600' : 
                            matchResult?.winner === 'draw' ? 'text-yellow-600' : 'text-gray-600'
                          }`}>
                            {match.result.homeTeamScore}
                          </div>
                          
                          {match.result.homeTeamGoalScorers.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-700 flex items-center justify-center lg:justify-end gap-1">
                                <Target className="w-4 h-4" />
                                Buteurs
                              </p>
                              {match.result.homeTeamGoalScorers.map((scorer, idx) => (
                                <div key={`home-scorer-${match.id}-${idx}`} className="text-sm text-gray-600">
                                  <span className="font-medium">{scorer.playerName}</span>
                                  {scorer.assists && (
                                    <span className="text-blue-600 ml-1">(Passe: {scorer.assists})</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* VS Section */}
                    <div className="text-center">
                      <div className="flex flex-col items-center gap-3">
                        {match.result ? (
                          <div className="bg-gray-50 p-4 rounded-xl">
                            <div className="text-3xl font-bold text-gray-900 mb-2">
                              {match.result.homeTeamScore} - {match.result.awayTeamScore}
                            </div>
                            {matchResult && (
                              <p className={`text-sm font-medium mb-3 ${
                                matchResult.winner === 'home' ? 'text-green-600' : 
                                matchResult.winner === 'away' ? 'text-blue-600' : 'text-yellow-600'
                              }`}>
                                {matchResult.result}
                              </p>
                            )}
                            
                            {/* Cards Display */}
                            {match.result && (
                              <div className="space-y-2 text-xs">
                                {/* Home Team Cards */}
                                {(match.result.homeTeamYellowCards?.length > 0 || match.result.homeTeamRedCards?.length > 0) && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-gray-700">{match.homeTeam?.name}:</span>
                                    {match.result.homeTeamYellowCards?.map((card, idx) => (
                                      <div key={`home-yellow-${idx}`} className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded">
                                        <div className="w-3 h-4 bg-yellow-400 border border-yellow-600 rounded-sm shadow-sm"></div>
                                        <span className="text-yellow-800 text-xs font-medium">{card.playerName}</span>
                                      </div>
                                    ))}
                                    {match.result.homeTeamRedCards?.map((card, idx) => (
                                      <div key={`home-red-${idx}`} className="flex items-center gap-1 bg-red-100 px-2 py-1 rounded">
                                        <div className="w-3 h-4 bg-red-500 border border-red-700 rounded-sm shadow-sm"></div>
                                        <span className="text-red-800 text-xs font-medium">{card.playerName}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Away Team Cards */}
                                {(match.result.awayTeamYellowCards?.length > 0 || match.result.awayTeamRedCards?.length > 0) && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-gray-700">{match.awayTeam?.name}:</span>
                                    {match.result.awayTeamYellowCards?.map((card, idx) => (
                                      <div key={`away-yellow-${idx}`} className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded">
                                        <div className="w-3 h-4 bg-yellow-400 border border-yellow-600 rounded-sm shadow-sm"></div>
                                        <span className="text-yellow-800 text-xs font-medium">{card.playerName}</span>
                                      </div>
                                    ))}
                                    {match.result.awayTeamRedCards?.map((card, idx) => (
                                      <div key={`away-red-${idx}`} className="flex items-center gap-1 bg-red-100 px-2 py-1 rounded">
                                        <div className="w-3 h-4 bg-red-500 border border-red-700 rounded-sm shadow-sm"></div>
                                        <span className="text-red-800 text-xs font-medium">{card.playerName}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-blue-50 p-4 rounded-xl">
                            <div className="text-2xl font-bold text-blue-600 mb-2">VS</div>
                            <p className="text-sm text-blue-700">
                              {formatTime(match.date)}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          <span>Stade de {match.homeTeam?.name}</span>
                        </div>
                      </div>
                    </div>

                    {/* Away Team */}
                    <div className="text-center lg:text-left">
                      <div className="flex items-center justify-center lg:justify-start gap-3 mb-3">
                        <span className="text-sm font-medium text-blue-700 bg-blue-50 px-2 py-1 rounded">
                          EXTÉRIEUR
                        </span>
                        <div className="bg-blue-50 p-2 rounded-lg">
                          <Plane className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                      
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {match.awayTeam?.name || "Équipe inconnue"}
                      </h3>
                      
                      {match.result && (
                        <div className="space-y-2">
                          <div className={`text-4xl font-bold ${
                            matchResult?.winner === 'away' ? 'text-green-600' : 
                            matchResult?.winner === 'draw' ? 'text-yellow-600' : 'text-gray-600'
                          }`}>
                            {match.result.awayTeamScore}
                          </div>
                          
                          {match.result.awayTeamGoalScorers.length > 0 && (
                            <div className="space-y-1">
                              <p className="text-sm font-medium text-gray-700 flex items-center justify-center lg:justify-start gap-1">
                                <Target className="w-4 h-4" />
                                Buteurs
                              </p>
                              {match.result.awayTeamGoalScorers.map((scorer, idx) => (
                                <div key={`away-scorer-${match.id}-${idx}`} className="text-sm text-gray-600">
                                  <span className="font-medium">{scorer.playerName}</span>
                                  {scorer.assists && (
                                    <span className="text-blue-600 ml-1">(Passe: {scorer.assists})</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Match Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 rounded-b-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {match.homeTeam?.name} vs {match.awayTeam?.name}
                      </span>
                    </div>
                    
                    <div className="bg-gray-100 px-3 py-2 rounded-lg border">
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <XCircle className="w-4 h-4" />
                        Seuls les administrateurs peuvent modifier les résultats
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
