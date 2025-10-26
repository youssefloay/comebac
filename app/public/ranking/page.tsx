"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import type { TeamStatistics, Team } from "@/lib/types"

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
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-bold text-sofa-text-primary">Classement Général</h1>
        <div className="flex gap-3">
          {ranking.length > 4 && (
            <button
              onClick={handleCleanupDuplicates}
              disabled={cleaning}
              className="sofa-btn bg-sofa-red hover:bg-red-600"
            >
              {cleaning ? 'Nettoyage...' : '🧹 Nettoyer Doublons'}
            </button>
          )}
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="sofa-btn-secondary sofa-btn"
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
        <div className="sofa-table">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left">Pos</th>
                <th className="text-left">Équipe</th>
                <th className="text-center">Matchs</th>
                <th className="text-center">V</th>
                <th className="text-center">N</th>
                <th className="text-center">D</th>
                <th className="text-center">BP</th>
                <th className="text-center">BC</th>
                <th className="text-center">Diff</th>
                <th className="text-center">Pts</th>
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
                      <div className="flex items-center gap-3">
                        <div className="sofa-team-logo text-sm">⚽</div>
                        <span className="font-semibold text-sofa-text-primary group-hover:text-sofa-text-accent transition-colors">
                          {team.teamName}
                        </span>
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
      )}
    </div>
  )
}
