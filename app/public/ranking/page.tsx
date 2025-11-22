"use client"

import { useEffect, useState } from "react"
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"
import type { TeamStatistics, Team } from "@/lib/types"
import { t } from "@/lib/i18n"
import { TeamLink } from "@/components/ui/team-link"
import { AdBanner } from "@/components/ads/AdBanner"
import { getParticipatingTeamIds, filterParticipatingTeams } from "@/lib/tournament-utils"

interface RankingTeam extends TeamStatistics {
  teamName: string
  goalDifference: number
  teamLogo?: string
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

        let statsData = Array.from(teamStatsMap.values())
          .map((data) => {
            const team = teamsMap.get(data.teamId)
            return {
              id: data.docId || data.id,
              teamId: data.teamId,
              teamName: team?.name || t('home.unknownTeam'),
              teamLogo: team?.logo,
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

        // Filtrer pour ne garder que les équipes participantes
        const participatingTeamIds = await getParticipatingTeamIds()
        if (participatingTeamIds) {
          statsData = filterParticipatingTeams(statsData, participatingTeamIds)
        }

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

  // Get top 3 for podium
  const topThree = ranking.slice(0, 3)
  const restOfRanking = ranking.slice(3)

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-sofa-text-primary mb-2">{t('ranking.title')}</h1>
          <p className="text-sofa-text-secondary">{t('ranking.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {ranking.length > 4 && (
            <button
              onClick={handleCleanupDuplicates}
              disabled={cleaning}
              className="sofa-btn bg-sofa-red hover:bg-red-600 text-xs sm:text-sm"
            >
              {cleaning ? t('ranking.cleanup') : t('ranking.cleanupDuplicates')}
            </button>
          )}
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="sofa-btn-secondary sofa-btn text-xs sm:text-sm"
          >
            {showDebug ? t('ranking.hideDebug') : t('ranking.debugInfo')}
          </button>
        </div>
      </div>

      {/* Podium Section */}
      {topThree.length >= 3 && (
        <div className="mb-8 overflow-visible">
          <h2 className="text-xl font-bold text-sofa-text-primary mb-4 flex items-center gap-2">
            {t('ranking.podium')}
          </h2>
          <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto overflow-visible">
            {/* 2nd Place */}
            <div className="order-1 pt-8" style={{ overflow: 'visible' }}>
              <div className="sofa-card p-4 text-center relative bg-gradient-to-br from-sofa-bg-card to-sofa-bg-secondary" style={{ overflow: 'visible' }}>
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold text-sm z-50 shadow-xl border-2 border-white">
                  2
                </div>
                <div className="mb-3">
                  {topThree[1].teamLogo ? (
                    <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-sofa-bg-secondary border-2 border-gray-400">
                      <img 
                        src={topThree[1].teamLogo} 
                        alt={topThree[1].teamName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          if (e.currentTarget.parentElement) {
                            e.currentTarget.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-lg font-bold">🥈</div>'
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-4xl">🥈</div>
                  )}
                </div>
                <TeamLink 
                  teamId={topThree[1].teamId} 
                  teamName={topThree[1].teamName}
                  className="font-semibold text-sofa-text-primary hover:text-sofa-text-accent transition-colors text-sm block mb-2"
                />
                <div className="text-lg font-bold text-sofa-text-accent">{topThree[1].points} pts</div>
                <div className="text-xs text-sofa-text-muted">
                  {topThree[1].wins}V - {topThree[1].draws}N - {topThree[1].losses}D
                </div>
                <div className="text-xs text-sofa-text-muted mt-1">
                  Diff: {topThree[1].goalDifference > 0 ? '+' : ''}{topThree[1].goalDifference}
                </div>
              </div>
            </div>
            
            {/* 1st Place */}
            <div className="order-2" style={{ overflow: 'visible' }}>
              <div className="sofa-card p-4 text-center relative bg-gradient-to-br from-sofa-green/10 to-sofa-bg-secondary" style={{ overflow: 'visible' }}>
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 text-white rounded-full flex items-center justify-center font-bold z-50 shadow-xl border-2 border-white">
                  1
                </div>
                <div className="mb-3">
                  {topThree[0].teamLogo ? (
                    <div className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-sofa-bg-secondary border-2 border-sofa-green">
                      <img 
                        src={topThree[0].teamLogo} 
                        alt={topThree[0].teamName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          if (e.currentTarget.parentElement) {
                            e.currentTarget.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-sofa-green text-2xl font-bold">👑</div>'
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-5xl">👑</div>
                  )}
                </div>
                <TeamLink 
                  teamId={topThree[0].teamId} 
                  teamName={topThree[0].teamName}
                  className="font-bold text-sofa-text-primary hover:text-sofa-text-accent transition-colors block mb-2"
                />
                <div className="text-xl font-bold text-sofa-green">{topThree[0].points} pts</div>
                <div className="text-xs text-sofa-text-muted">
                  {topThree[0].wins}V - {topThree[0].draws}N - {topThree[0].losses}D
                </div>
                <div className="text-xs text-sofa-text-muted mt-1">
                  Diff: {topThree[0].goalDifference > 0 ? '+' : ''}{topThree[0].goalDifference}
                </div>
              </div>
            </div>
            
            {/* 3rd Place */}
            <div className="order-3 pt-12" style={{ overflow: 'visible' }}>
              <div className="sofa-card p-4 text-center relative bg-gradient-to-br from-sofa-bg-card to-sofa-bg-secondary" style={{ overflow: 'visible' }}>
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center font-bold text-sm z-50 shadow-xl border-2 border-white">
                  3
                </div>
                <div className="mb-3">
                  {topThree[2].teamLogo ? (
                    <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-sofa-bg-secondary border-2 border-orange-500">
                      <img 
                        src={topThree[2].teamLogo} 
                        alt={topThree[2].teamName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          if (e.currentTarget.parentElement) {
                            e.currentTarget.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-orange-500 text-lg font-bold">🥉</div>'
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-4xl">🥉</div>
                  )}
                </div>
                <TeamLink 
                  teamId={topThree[2].teamId} 
                  teamName={topThree[2].teamName}
                  className="font-semibold text-sofa-text-primary hover:text-sofa-text-accent transition-colors text-sm block mb-2"
                />
                <div className="text-lg font-bold text-sofa-text-accent">{topThree[2].points} pts</div>
                <div className="text-xs text-sofa-text-muted">
                  {topThree[2].wins}V - {topThree[2].draws}N - {topThree[2].losses}D
                </div>
                <div className="text-xs text-sofa-text-muted mt-1">
                  Diff: {topThree[2].goalDifference > 0 ? '+' : ''}{topThree[2].goalDifference}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDebug && (
        <div className="sofa-card p-6 mb-8 border-l-4 border-sofa-orange">
          <h3 className="font-semibold text-sofa-text-accent mb-3">Informations de Debug</h3>
          <p className="text-sm text-sofa-text-secondary mb-2">
            {t('ranking.teamsDisplayed')}: {ranking.length} | 
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
          <p className="text-sofa-text-secondary">{t('ranking.loading')}</p>
        </div>
      ) : ranking.length === 0 ? (
        <div className="sofa-card p-12 text-center">
          <p className="text-sofa-text-secondary">{t('ranking.noData')}</p>
        </div>
      ) : (
        <div>
          {/* Complete Ranking Table */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-sofa-text-primary mb-4 flex items-center gap-2">
              📊 {t('ranking.fullRanking')}
            </h2>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block w-full overflow-x-auto">
            <div className="sofa-table min-w-full">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr>
                    <th className="text-left whitespace-nowrap">Pos</th>
                    <th className="text-left whitespace-nowrap">{t('ranking.team')}</th>
                    <th className="text-center whitespace-nowrap">{t('ranking.matches')}</th>
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
                    const isTopThree = position <= 3
                    
                    return (
                      <tr 
                        key={team.id} 
                        className={`group ${isTopThree ? 'bg-gradient-to-r from-sofa-bg-secondary to-sofa-bg-card' : ''}`}
                      >
                        <td>
                          <div className="flex items-center gap-3">
                            <span className={`font-bold min-w-[24px] ${isTopThree ? 'text-sofa-text-accent' : 'text-sofa-text-primary'}`}>
                              {position}
                            </span>
                            {position === 1 && <span className="text-sofa-green">👑</span>}
                            {position === 2 && <span className="text-gray-400">🥈</span>}
                            {position === 3 && <span className="text-orange-500">🥉</span>}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            {team.teamLogo && (
                              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                                <img 
                                  src={team.teamLogo} 
                                  alt={team.teamName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <TeamLink 
                              teamId={team.teamId} 
                              teamName={team.teamName}
                              className={`font-semibold group-hover:text-sofa-text-accent transition-colors ${
                                isTopThree ? 'text-sofa-text-accent' : 'text-sofa-text-primary'
                              }`}
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
                          <span className={`font-bold text-lg ${isTopThree ? 'text-sofa-green' : 'text-sofa-text-accent'}`}>
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

        {/* Mobile Optimized Table */}
        <div className="md:hidden w-full overflow-x-auto">
          <div className="sofa-table min-w-full">
            <table className="w-full text-xs table-fixed" style={{ minWidth: '100%' }}>
              <thead className="bg-sofa-bg-secondary sticky top-0 z-10">
                <tr>
                  <th className="text-left py-2 px-1 font-bold text-sofa-text-primary w-10">#</th>
                  <th className="text-left py-2 px-1 font-bold text-sofa-text-primary">ÉQUIPE</th>
                  <th className="text-center py-2 px-0.5 font-bold text-sofa-text-primary w-8">MJ</th>
                  <th className="text-center py-2 px-0.5 font-bold text-sofa-text-primary w-8">V</th>
                  <th className="text-center py-2 px-0.5 font-bold text-sofa-text-primary w-8">N</th>
                  <th className="text-center py-2 px-0.5 font-bold text-sofa-text-primary w-8">D</th>
                  <th className="text-center py-2 px-0.5 font-bold text-sofa-text-primary w-16">Buts</th>
                  <th className="text-center py-2 px-1 font-bold text-sofa-text-primary w-12">Pts</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((team, idx) => {
                  const position = idx + 1
                  const goalDiff = team.goalDifference
                  const isTopThree = position <= 3
                  
                  return (
                    <tr 
                      key={team.id} 
                      className={`border-b border-sofa-border/50 hover:bg-sofa-bg-hover transition-colors ${
                        isTopThree ? 'bg-gradient-to-r from-sofa-bg-secondary/50 to-transparent' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-2 px-1 w-10">
                        <div className="flex items-center gap-0.5">
                          <span className={`font-bold text-xs ${
                            isTopThree ? 'text-sofa-text-accent' : 'text-sofa-text-primary'
                          }`}>
                            {position}
                          </span>
                          {position === 1 && <span className="text-yellow-500 text-[10px]">👑</span>}
                          {position === 2 && <span className="text-gray-400 text-[10px]">🥈</span>}
                          {position === 3 && <span className="text-orange-500 text-[10px]">🥉</span>}
                        </div>
                      </td>
                      
                      {/* Team with Logo */}
                      <td className="py-2 px-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {team.teamLogo ? (
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-sofa-bg-secondary border border-sofa-border flex-shrink-0 flex items-center justify-center">
                              <img 
                                src={team.teamLogo} 
                                alt={team.teamName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  if (e.currentTarget.parentElement) {
                                    const initials = team.teamName.substring(0, 2).toUpperCase()
                                    e.currentTarget.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-sofa-text-muted text-[9px] font-bold bg-sofa-bg-secondary">${initials}</div>`
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-sofa-bg-secondary border border-sofa-border flex-shrink-0 flex items-center justify-center">
                              <span className="text-sofa-text-muted text-[9px] font-bold">
                                {team.teamName.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <TeamLink 
                            teamId={team.teamId} 
                            teamName={team.teamName}
                            className={`font-semibold truncate block text-[11px] ${
                              isTopThree ? 'text-sofa-text-accent' : 'text-sofa-text-primary'
                            } hover:text-sofa-text-accent transition-colors`}
                          />
                        </div>
                      </td>
                      
                      {/* Matches Played */}
                      <td className="text-center py-2 px-0.5 w-8">
                        <span className="text-sofa-text-secondary font-medium text-[10px]">
                          {team.matchesPlayed}
                        </span>
                      </td>
                      
                      {/* Wins */}
                      <td className="text-center py-2 px-0.5 w-8">
                        <span className="font-semibold text-green-600 text-[10px]">
                          {team.wins}
                        </span>
                      </td>
                      
                      {/* Draws */}
                      <td className="text-center py-2 px-0.5 w-8">
                        <span className="font-semibold text-orange-600 text-[10px]">
                          {team.draws}
                        </span>
                      </td>
                      
                      {/* Losses */}
                      <td className="text-center py-2 px-0.5 w-8">
                        <span className="font-semibold text-red-600 text-[10px]">
                          {team.losses}
                        </span>
                      </td>
                      
                      {/* Goals Combined: BP - BC (Diff) */}
                      <td className="text-center py-2 px-0.5 w-16">
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="text-[9px] text-sofa-text-secondary">
                            <span className="font-medium">{team.goalsFor}</span>
                            <span className="mx-0.5">-</span>
                            <span className="font-medium">{team.goalsAgainst}</span>
                          </div>
                          <div className={`font-bold text-[10px] ${
                            goalDiff >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {goalDiff > 0 ? '+' : ''}{goalDiff}
                          </div>
                        </div>
                      </td>
                      
                      {/* Points */}
                      <td className="text-center py-2 px-1 w-12">
                        <span className={`font-bold text-sm ${
                          isTopThree ? 'text-sofa-green' : 'text-sofa-text-accent'
                        }`}>
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

      {/* Publicité discrète en bas de page */}
      <div className="pt-8 mt-8">
        <AdBanner slot="1234567896" format="auto" style="horizontal" className="opacity-75" />
      </div>
    </div>
  )
}
