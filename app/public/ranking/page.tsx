"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import type { TeamStatistics, Team } from "@/lib/types"
import { TeamLink } from "@/components/ui/team-link"

interface RankingTeam extends TeamStatistics {
  teamName: string
  goalDifference: number
}

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankingTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [showDebug, setShowDebug] = useState(false)
  const [cleaning, setCleaning] = useState(false)

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const [statsSnap, teamsSnap] = await Promise.all([
          getDocs(collection(db, "teamStatistics")),
          getDocs(collection(db, "teams"))
        ])
        
        console.log('🔍 RANKING DEBUG:')
        console.log('Total teamStatistics documents:', statsSnap.docs.length)
        console.log('Total teams:', teamsSnap.docs.length)
        
        const teamsMap = new Map()
        teamsSnap.docs.forEach((doc) => {
          teamsMap.set(doc.id, { id: doc.id, ...doc.data() })
        })

        // Check for duplicates
        const teamIds = statsSnap.docs.map(doc => doc.data().teamId)
        const uniqueTeamIds = [...new Set(teamIds)]
        
        if (teamIds.length !== uniqueTeamIds.length) {
          console.warn('🚨 DUPLICATES DETECTED in teamStatistics!')
          console.log('Total documents:', teamIds.length)
          console.log('Unique teams:', uniqueTeamIds.length)
          
          // Find duplicates
          const duplicates = teamIds.filter((id, index) => teamIds.indexOf(id) !== index)
          console.log('Duplicate team IDs:', [...new Set(duplicates)])
          
          // Show all documents for debugging
          statsSnap.docs.forEach(doc => {
            const data = doc.data()
            console.log(`Doc ${doc.id}: Team ${data.teamId}, Points: ${data.points || 0}`)
          })
        }

        // Remove duplicates by keeping only the latest/best entry per team
        const teamStatsMap = new Map()
        
        statsSnap.docs.forEach((doc) => {
          const data = doc.data() as TeamStatistics
          const existing = teamStatsMap.get(data.teamId)
          
          if (!existing) {
            teamStatsMap.set(data.teamId, {
              ...data,
              docId: doc.id
            })
          } else {
            // Keep the one with higher points
            const shouldReplace = (data.points || 0) > (existing.points || 0)
            
            if (shouldReplace) {
              console.log(`Replacing stats for team ${data.teamId}: ${existing.points || 0} -> ${data.points || 0} points`)
              teamStatsMap.set(data.teamId, {
                ...data,
                docId: doc.id
              })
            }
          }
        })

        const statsData = Array.from(teamStatsMap.values())
          .map((data) => {
            const team = teamsMap.get(data.teamId)
            return {
              id: data.docId || data.id,
              teamId: data.teamId,
              teamName: team?.name || "Équipe inconnue",
              points: data.points || 0,
              wins: data.wins || 0,
              draws: data.draws || 0,
              losses: data.losses || 0,
              goalsFor: data.goalsFor || 0,
              goalsAgainst: data.goalsAgainst || 0,
              matchesPlayed: data.matchesPlayed || 0,
              goalDifference: (data.goalsFor || 0) - (data.goalsAgainst || 0),
              updatedAt: data.updatedAt
            }
          })
          .sort((a, b) => {
            if (b.points !== a.points) return b.points - a.points
            return b.goalDifference - a.goalDifference
          })

        console.log('✅ Final ranking entries:', statsData.length)
        setRanking(statsData)
      } catch (error) {
        console.error("Error fetching ranking:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRanking()
  }, [])

  const handleCleanupDuplicates = async () => {
    if (!confirm('Nettoyer les doublons dans la base de données? Cette action va supprimer les entrées dupliquées.')) {
      return
    }
    
    setCleaning(true)
    try {
      const response = await fetch('/api/cleanup-duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      const result = await response.json()
      
      if (result.success) {
        console.log('🎉 Cleanup successful:', result)
        alert(`Nettoyage réussi! ${result.stats.deletedCount} doublons supprimés. ${result.stats.finalCount} équipes restantes.`)
        
        // Reload the page data
        window.location.reload()
      } else {
        console.error('Cleanup failed:', result)
        alert(`Erreur: ${result.error}`)
      }
    } catch (error) {
      console.error('Error calling cleanup API:', error)
      alert('Erreur lors du nettoyage')
    } finally {
      setCleaning(false)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-sofa-text-primary">Classement Général</h1>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {ranking.length > 4 && (
            <button
              onClick={handleCleanupDuplicates}
              disabled={cleaning}
              className="sofa-btn bg-sofa-red hover:bg-red-600 text-xs sm:text-sm"
            >
              {cleaning ? 'Nettoyage...' : '🧹 Nettoyer Doublons'}
            </button>
          )}
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="sofa-btn-secondary sofa-btn text-xs sm:text-sm"
          >
            {showDebug ? 'Masquer Debug' : 'Debug Info'}
          </button>
        </div>
      </div>

      {showDebug && (
        <div className="sofa-card p-6 mb-8 border-l-4 border-sofa-orange">
          <h3 className="font-semibold text-sofa-text-accent mb-3">Informations de Debug</h3>
          <p className="text-sm text-sofa-text-secondary mb-2">
            Équipes affichées: {ranking.length} | 
            Ouvrez la console du navigateur (F12) pour plus de détails sur les doublons
          </p>
          {ranking.length > 4 && (
            <p className="text-sm text-sofa-red">
              ⚠️ Plus de 4 équipes détectées - il y a probablement des doublons dans la base de données
            </p>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-sofa-border border-t-sofa-text-accent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sofa-text-secondary">Chargement du classement...</p>
        </div>
      ) : ranking.length === 0 ? (
        <div className="sofa-card p-12 text-center">
          <p className="text-sofa-text-secondary">Aucune donnée de classement disponible</p>
        </div>
      ) : (
        <div>
          {/* Desktop Table */}
          <div className="hidden md:block w-full overflow-x-auto">
          <div className="sofa-table min-w-full">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr>
                  <th className="text-left whitespace-nowrap">Pos</th>
                  <th className="text-left whitespace-nowrap">Équipe</th>
                  <th className="text-center whitespace-nowrap">Matchs</th>
                  <th className="text-center whitespace-nowrap">V</th>
                  <th className="text-center whitespace-nowrap">N</th>
                  <th className="text-center whitespace-nowrap">D</th>
                  <th className="text-center whitespace-nowrap">BP</th>
                  <th className="text-center whitespace-nowrap">BC</th>
                  <th className="text-center whitespace-nowrap">Diff</th>
                  <th className="text-center whitespace-nowrap">Pts</th>
                </tr>
              </thead>
            <tbody>
              {ranking.map((team, idx) => {
                const position = idx + 1
                const goalDiff = team.goalDifference
                
                return (
                  <tr key={team.id} className="group">
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sofa-text-primary min-w-[24px]">
                          {position}
                        </span>
                        {position <= 3 && (
                          <span className="text-sofa-yellow">🏆</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="sofa-team-logo text-sm flex-shrink-0">⚽</div>
                        <TeamLink 
                          teamId={team.teamId} 
                          teamName={team.teamName}
                          className="font-semibold text-sofa-text-primary group-hover:text-sofa-text-accent transition-colors"
                        />
                      </div>
                    </td>
                    <td className="text-center text-sofa-text-secondary">
                      {team.matchesPlayed}
                    </td>
                    <td className="text-center">
                      <span className="font-semibold text-sofa-green">{team.wins}</span>
                    </td>
                    <td className="text-center">
                      <span className="font-semibold text-sofa-orange">{team.draws}</span>
                    </td>
                    <td className="text-center">
                      <span className="font-semibold text-sofa-red">{team.losses}</span>
                    </td>
                    <td className="text-center text-sofa-text-secondary">{team.goalsFor}</td>
                    <td className="text-center text-sofa-text-secondary">{team.goalsAgainst}</td>
                    <td className="text-center">
                      <span className={`font-semibold ${goalDiff >= 0 ? 'text-sofa-green' : 'text-sofa-red'}`}>
                        {goalDiff > 0 ? '+' : ''}{goalDiff}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="font-bold text-lg text-sofa-text-accent">{team.points}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Optimized Table */}
        <div className="md:hidden w-full">
          <div className="sofa-table">
            <table className="w-full text-xs table-fixed">
              <thead>
                <tr>
                  <th className="text-left py-2 px-1" style={{width: '8%'}}>#</th>
                  <th className="text-left py-2 px-1" style={{width: '20%'}}>Équipe</th>
                  <th className="text-center py-2 px-1" style={{width: '8%'}}>MJ</th>
                  <th className="text-center py-2 px-1" style={{width: '8%'}}>V</th>
                  <th className="text-center py-2 px-1" style={{width: '8%'}}>N</th>
                  <th className="text-center py-2 px-1" style={{width: '8%'}}>D</th>
                  <th className="text-center py-2 px-1" style={{width: '8%'}}>BP</th>
                  <th className="text-center py-2 px-1" style={{width: '8%'}}>BC</th>
                  <th className="text-center py-2 px-1" style={{width: '10%'}}>Diff</th>
                  <th className="text-center py-2 px-1" style={{width: '14%'}}>Pts</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((team, idx) => {
                  const position = idx + 1
                  const goalDiff = team.goalDifference
                  
                  // Créer une abréviation du nom d'équipe
                  const getTeamAbbreviation = (teamName: string) => {
                    const words = teamName.split(' ')
                    if (words.length === 1) {
                      return teamName.substring(0, 4).toUpperCase()
                    } else if (words.length === 2) {
                      return (words[0].substring(0, 2) + words[1].substring(0, 2)).toUpperCase()
                    } else {
                      return words.map(word => word.substring(0, 1)).join('').toUpperCase().substring(0, 4)
                    }
                  }
                  
                  return (
                    <tr key={team.id} className="group border-b border-sofa-border/50 hover:bg-sofa-bg-hover">
                      <td className="py-2 px-1">
                        <div className="flex items-center justify-center">
                          <span className="font-bold text-sofa-text-primary text-sm">
                            {position}
                          </span>
                          {position <= 3 && (
                            <span className="text-sofa-yellow text-xs ml-1">🏆</span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 px-1">
                        <div title={team.teamName}>
                          <TeamLink 
                            teamId={team.teamId} 
                            teamName={getTeamAbbreviation(team.teamName)}
                            className="font-bold text-sofa-text-primary text-xs hover:text-sofa-text-accent transition-colors block"
                          />
                        </div>
                      </td>
                      <td className="text-center py-2 px-1">
                        <span className="text-sofa-text-secondary font-medium text-xs">
                          {team.matchesPlayed}
                        </span>
                      </td>
                      <td className="text-center py-2 px-1">
                        <span className="font-semibold text-sofa-green text-xs">
                          {team.wins}
                        </span>
                      </td>
                      <td className="text-center py-2 px-1">
                        <span className="font-semibold text-sofa-orange text-xs">
                          {team.draws}
                        </span>
                      </td>
                      <td className="text-center py-2 px-1">
                        <span className="font-semibold text-sofa-red text-xs">
                          {team.losses}
                        </span>
                      </td>
                      <td className="text-center py-2 px-1">
                        <span className="text-sofa-text-secondary text-xs font-medium">
                          {team.goalsFor}
                        </span>
                      </td>
                      <td className="text-center py-2 px-1">
                        <span className="text-sofa-text-secondary text-xs font-medium">
                          {team.goalsAgainst}
                        </span>
                      </td>
                      <td className="text-center py-2 px-1">
                        <span className={`font-bold text-xs ${goalDiff >= 0 ? 'text-sofa-green' : 'text-sofa-red'}`}>
                          {goalDiff > 0 ? '+' : ''}{goalDiff}
                        </span>
                      </td>
                      <td className="text-center py-2 px-1">
                        <span className="font-bold text-sofa-text-accent text-sm">
                          {team.points}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      )}
    </div>
  )
}
