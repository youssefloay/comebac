"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, orderBy, where, doc, updateDoc, addDoc, Timestamp } from "firebase/firestore"
import type { Match, Team, MatchResult } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MatchResultForm } from "@/components/matches/match-result-form"

export default function MatchesPage() {
  const [matches, setMatches] = useState<(Match & { homeTeam?: Team; awayTeam?: Team; result?: MatchResult })[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      } catch (error) {
        console.error("Error fetching matches:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [])

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
    return date.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
  }

  const formatTime = (timestamp: any) => {
    if (!timestamp) return ""
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
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
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

  const handleSubmitResult = async (match: Match & { homeTeam?: Team; awayTeam?: Team }, result: MatchResult) => {
    try {
      setIsSubmitting(true)

      // Check if a result already exists for this match
      const existingResultQuery = query(collection(db, "matchResults"), where("matchId", "==", match.id))
      const existingSnap = await getDocs(existingResultQuery)
      const existingDoc = existingSnap.docs[0]

      // Update match status to completed
      await updateDoc(doc(db, "matches", match.id), {
        status: "completed",
        updatedAt: Timestamp.now()
      })

      // Save or update the result
      if (existingDoc) {
        // Update existing result
        await updateDoc(doc(db, "matchResults", existingDoc.id), {
          ...result,
          matchId: match.id,
          updatedAt: Timestamp.now(),
        })
      } else {
        // Create new result
        await addDoc(collection(db, "matchResults"), {
          ...result,
          matchId: match.id,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
      }

      // Helper to compute points for a team given a result
      const computePoints = (res: MatchResult | null, isHome: boolean) => {
        if (!res) return 0
        const home = res.homeTeamScore
        const away = res.awayTeamScore
        if (isHome) return home > away ? 3 : home === away ? 1 : 0
        return away > home ? 3 : away === home ? 1 : 0
      }

      // Fetch current stats documents and update them idempotently
      const homeTeamStatsQuery = query(collection(db, "teamStatistics"), where("teamId", "==", match.homeTeamId))
      const awayTeamStatsQuery = query(collection(db, "teamStatistics"), where("teamId", "==", match.awayTeamId))

      const [homeStatsSnap, awayStatsSnap] = await Promise.all([
        getDocs(homeTeamStatsQuery),
        getDocs(awayTeamStatsQuery),
      ])

      const oldResult = existingDoc ? (existingDoc.data() as MatchResult) : null

      const updateTeamStats = async (teamId: string, isHome: boolean, statsDoc: any) => {
        const existing = statsDoc ? { id: statsDoc.id, ...statsDoc.data() } : null

        const oldGoalsFor = oldResult ? (isHome ? oldResult.homeTeamScore : oldResult.awayTeamScore) : 0
        const oldGoalsAgainst = oldResult ? (isHome ? oldResult.awayTeamScore : oldResult.homeTeamScore) : 0
        const oldPoints = computePoints(oldResult, isHome)

        const newGoalsFor = result ? (isHome ? result.homeTeamScore : result.awayTeamScore) : 0
        const newGoalsAgainst = result ? (isHome ? result.awayTeamScore : result.homeTeamScore) : 0
        const newPoints = computePoints(result, isHome)

        const deltaMatches = oldResult ? 0 : 1
        const deltaWins = (newPoints === 3 ? 1 : 0) - (oldPoints === 3 ? 1 : 0)
        const deltaDraws = (newPoints === 1 ? 1 : 0) - (oldPoints === 1 ? 1 : 0)
        const deltaLosses = (newPoints === 0 ? 1 : 0) - (oldPoints === 0 ? 1 : 0)

        const stats = {
          teamId,
          matchesPlayed: (existing?.matchesPlayed || 0) + deltaMatches,
          wins: (existing?.wins || 0) + deltaWins,
          draws: (existing?.draws || 0) + deltaDraws,
          losses: (existing?.losses || 0) + deltaLosses,
          goalsFor: (existing?.goalsFor || 0) + (newGoalsFor - oldGoalsFor),
          goalsAgainst: (existing?.goalsAgainst || 0) + (newGoalsAgainst - oldGoalsAgainst),
          points: (existing?.points || 0) + (newPoints - oldPoints),
          updatedAt: Timestamp.now(),
        }

        if (existing?.id) {
          await updateDoc(doc(db, "teamStatistics", existing.id), stats)
        } else {
          await addDoc(collection(db, "teamStatistics"), stats)
        }
      }

      await Promise.all([
        updateTeamStats(match.homeTeamId, true, homeStatsSnap.docs[0]),
        updateTeamStats(match.awayTeamId, false, awayStatsSnap.docs[0]),
      ])

      // Refresh matches
      window.location.reload()
    } catch (error) {
      console.error("Error submitting match result:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Debug log when component renders
  console.log('Rendering matches page with:', {
    numberOfMatches: matches.length,
    loading,
    matchesWithResults: matches.filter(m => m.result).length
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Calendrier des Matchs</h1>

      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-600">Chargement...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8">
          <p className="text-gray-600 text-center">Aucun match programmé</p>
          <pre className="mt-4 text-xs">Debug: {JSON.stringify({ loading, matchCount: matches.length }, null, 2)}</pre>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => (
            <div key={match.id} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-2">{formatDate(match.date)}</p>
                  <div className="flex items-center justify-between md:justify-start gap-4">
                    <div className="flex-1 text-right md:text-left">
                      <p className="font-semibold text-gray-900">{match.homeTeam?.name || "Équipe inconnue"}</p>
                      {match.result && (
                        <div className="mt-2 text-sm">
                          <p className="font-bold">{match.result.homeTeamScore}</p>
                          {match.result.homeTeamGoalScorers.map((scorer, idx) => (
                            <p key={idx} className="text-xs text-gray-600">
                              ⚽ {scorer.playerName} {scorer.assists && `(Passe: ${scorer.assists})`}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">VS</p>
                      <p className="text-xs text-gray-500">{formatTime(match.date)}</p>
                    </div>
                    <div className="flex-1 text-left md:text-right">
                      <p className="font-semibold text-gray-900">{match.awayTeam?.name || "Équipe inconnue"}</p>
                      {match.result && (
                        <div className="mt-2 text-sm">
                          <p className="font-bold">{match.result.awayTeamScore}</p>
                          {match.result.awayTeamGoalScorers.map((scorer, idx) => (
                            <p key={idx} className="text-xs text-gray-600">
                              ⚽ {scorer.playerName} {scorer.assists && `(Passe: ${scorer.assists})`}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col gap-2">
                  <div className="flex flex-col gap-2 items-end">
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-700">
                      {match.status === "completed" ? "Terminé" : "À venir"}
                    </span>
                    
                    {/* Debug info */}
                    <div className="text-xs text-gray-500">
                      Status: {match.status}
                      <br />
                      Date: {match.date.toLocaleString()}
                    </div>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          {match.result ? 'Modifier le résultat' : 'Ajouter le résultat'}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Résultat du match</DialogTitle>
                        </DialogHeader>
                        <MatchResultForm 
                          match={match} 
                          onSubmit={handleSubmitResult}
                          isSubmitting={isSubmitting}
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
