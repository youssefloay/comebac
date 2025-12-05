"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"
import type { TeamStatistics, Team } from "@/lib/types"
import { t } from "@/lib/i18n"
import { TeamLink } from "@/components/ui/team-link"
import { AdBanner } from "@/components/ads/AdBanner"
import { getParticipatingTeamIds, filterParticipatingTeams } from "@/lib/tournament-utils"
import { Trophy } from "lucide-react"

interface RankingTeam extends TeamStatistics {
  teamName: string
  goalDifference: number
  teamLogo?: string
}

export default function RankingPage() {
  const [ranking, setRanking] = useState<RankingTeam[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const [statsSnap, teamsSnap] = await Promise.all([
          getDocs(collection(db, "teamStatistics")),
          getDocs(query(collection(db, "teams"), where("isActive", "==", true)))
        ])
        
        const teamsMap = new Map()
        const activeTeamIds = new Set<string>()
        teamsSnap.docs.forEach((doc) => {
          const teamData = { id: doc.id, ...doc.data() }
          teamsMap.set(doc.id, teamData)
          activeTeamIds.add(doc.id)
        })

        // Remove duplicates by keeping only the latest/best entry per team
        // ET filtrer pour ne garder que les équipes actives
        const teamStatsMap = new Map()
        
        statsSnap.docs.forEach((doc) => {
          const data = doc.data() as TeamStatistics
          
          // Filtrer les équipes inactives
          if (!activeTeamIds.has(data.teamId)) {
            return
          }
          
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

        setRanking(statsData)
      } catch (error) {
        console.error("Error fetching ranking:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRanking()
  }, [])

  // Get top 3 for podium
  const topThree = ranking.slice(0, 3)
  const restOfRanking = ranking.slice(3)

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 overflow-x-hidden">
      {/* Modern Header 2025 */}
      <motion.div 
        className="mb-8 sm:mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg">
            <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
            {t('ranking.title')}
          </h1>
        </div>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 ml-14">
          {t('ranking.subtitle')}
        </p>
      </motion.div>

      {/* Podium Section - Modern 2025 (Same as Public Page) */}
      {topThree.length >= 3 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('ranking.podium')}
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto overflow-visible">
            {/* 2nd Place */}
            <motion.div 
              className="order-1 pt-8" 
              style={{ overflow: 'visible' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 via-gray-100/50 to-white dark:from-gray-800/50 dark:via-gray-700/30 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-all duration-300 text-center" style={{ overflow: 'visible' }}>
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 text-white rounded-full flex items-center justify-center font-bold text-sm z-50 shadow-xl border-2 border-white">
                  2
                </div>
                <div className="mb-4 flex justify-center">
                  {topThree[1].teamLogo ? (
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 shadow-lg flex items-center justify-center">
                      <img 
                        src={topThree[1].teamLogo} 
                        alt={topThree[1].teamName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          if (e.currentTarget.parentElement) {
                            e.currentTarget.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-bold">🥈</div>'
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-5xl flex items-center justify-center">🥈</div>
                  )}
                </div>
                <TeamLink 
                  teamId={topThree[1].teamId} 
                  teamName={topThree[1].teamName}
                  className="font-semibold text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-sm block mb-3"
                />
                <div className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">{topThree[1].points} {t('ranking.pointsShort')}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {topThree[1].wins}{t('ranking.winsShort')} - {topThree[1].draws}{t('ranking.drawsShort')} - {topThree[1].losses}{t('ranking.lossesShort')}
                </div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-500">
                  {t('ranking.diffLabel')} {topThree[1].goalDifference > 0 ? '+' : ''}{topThree[1].goalDifference}
                </div>
              </div>
            </motion.div>
            
            {/* 1st Place */}
            <motion.div 
              className="order-2" 
              style={{ overflow: 'visible' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + 0.15 }}
              whileHover={{ y: -4 }}
            >
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-50 via-amber-50/50 to-white dark:from-yellow-900/20 dark:via-amber-900/10 dark:to-gray-900 border-2 border-yellow-300/50 dark:border-yellow-700/30 backdrop-blur-sm p-6 shadow-xl hover:shadow-2xl transition-all duration-300 text-center" style={{ overflow: 'visible' }}>
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 text-white rounded-full flex items-center justify-center font-bold text-base z-50 shadow-xl border-2 border-white">
                  1
                </div>
                <div className="mb-4 flex justify-center">
                  {topThree[0].teamLogo ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-400 dark:border-yellow-600 shadow-xl flex items-center justify-center">
                      <img 
                        src={topThree[0].teamLogo} 
                        alt={topThree[0].teamName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          if (e.currentTarget.parentElement) {
                            e.currentTarget.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-yellow-600 text-3xl font-bold">👑</div>'
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-6xl flex items-center justify-center">👑</div>
                  )}
                </div>
                <TeamLink 
                  teamId={topThree[0].teamId} 
                  teamName={topThree[0].teamName}
                  className="font-bold text-gray-900 dark:text-white hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors block mb-3 text-base"
                />
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-2">{topThree[0].points} {t('ranking.pointsShort')}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {topThree[0].wins}{t('ranking.winsShort')} - {topThree[0].draws}{t('ranking.drawsShort')} - {topThree[0].losses}{t('ranking.lossesShort')}
                </div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-500">
                  {t('ranking.diffLabel')} {topThree[0].goalDifference > 0 ? '+' : ''}{topThree[0].goalDifference}
                </div>
              </div>
            </motion.div>
            
            {/* 3rd Place */}
            <motion.div 
              className="order-3 pt-12" 
              style={{ overflow: 'visible' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + 0.2 }}
              whileHover={{ y: -4 }}
            >
              <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-50 via-amber-50/50 to-white dark:from-orange-900/20 dark:via-amber-900/10 dark:to-gray-900 border border-orange-200/50 dark:border-orange-700/30 backdrop-blur-sm p-6 shadow-lg hover:shadow-xl transition-all duration-300 text-center" style={{ overflow: 'visible' }}>
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center font-bold text-sm z-50 shadow-xl border-2 border-white">
                  3
                </div>
                <div className="mb-4 flex justify-center">
                  {topThree[2].teamLogo ? (
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-orange-100 dark:bg-orange-900/30 border-2 border-orange-400 dark:border-orange-600 shadow-lg flex items-center justify-center">
                      <img 
                        src={topThree[2].teamLogo} 
                        alt={topThree[2].teamName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          if (e.currentTarget.parentElement) {
                            e.currentTarget.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-orange-500 text-2xl font-bold">🥉</div>'
                          }
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-5xl flex items-center justify-center">🥉</div>
                  )}
                </div>
                <TeamLink 
                  teamId={topThree[2].teamId} 
                  teamName={topThree[2].teamName}
                  className="font-semibold text-gray-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors text-sm block mb-3"
                />
                <div className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-2">{topThree[2].points} {t('ranking.pointsShort')}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {topThree[2].wins}{t('ranking.winsShort')} - {topThree[2].draws}{t('ranking.drawsShort')} - {topThree[2].losses}{t('ranking.lossesShort')}
                </div>
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-500">
                  {t('ranking.diffLabel')} {topThree[2].goalDifference > 0 ? '+' : ''}{topThree[2].goalDifference}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.section>
      )}

      {loading ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-yellow-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('ranking.loading')}</p>
        </div>
      ) : ranking.length === 0 ? (
        <motion.div 
          className="rounded-2xl bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm p-12 text-center shadow-lg"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <p className="text-gray-600 dark:text-gray-400">{t('ranking.noData')}</p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Complete Ranking Table - Modern 2025 */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('ranking.fullRanking')}
              </h2>
            </div>
          </div>

          {/* Desktop Table - Modern 2025 */}
          <div className="hidden md:block w-full overflow-x-auto">
            <div className="rounded-2xl bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-lg overflow-hidden">
              <table className="w-full min-w-[600px]">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700">
                  <tr>
                    <th className="text-left whitespace-nowrap py-4 px-4 font-bold text-gray-900 dark:text-white">{t('ranking.positionShort')}</th>
                    <th className="text-left whitespace-nowrap py-4 px-4 font-bold text-gray-900 dark:text-white">{t('ranking.team')}</th>
                    <th className="text-center whitespace-nowrap py-4 px-4 font-bold text-gray-900 dark:text-white">{t('ranking.matches')}</th>
                    <th className="text-center whitespace-nowrap py-4 px-4 font-bold text-gray-900 dark:text-white">{t('ranking.winsShort')}</th>
                    <th className="text-center whitespace-nowrap py-4 px-4 font-bold text-gray-900 dark:text-white">{t('ranking.drawsShort')}</th>
                    <th className="text-center whitespace-nowrap py-4 px-4 font-bold text-gray-900 dark:text-white">{t('ranking.lossesShort')}</th>
                    <th className="text-center whitespace-nowrap py-4 px-4 font-bold text-gray-900 dark:text-white">{t('ranking.goalsForShort')}</th>
                    <th className="text-center whitespace-nowrap py-4 px-4 font-bold text-gray-900 dark:text-white">{t('ranking.goalsAgainstShort')}</th>
                    <th className="text-center whitespace-nowrap py-4 px-4 font-bold text-gray-900 dark:text-white">{t('ranking.diffShort')}</th>
                    <th className="text-center whitespace-nowrap py-4 px-4 font-bold text-gray-900 dark:text-white">{t('ranking.pointsShortHeader')}</th>
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
                        className={`group border-b border-gray-200/50 dark:border-gray-700/50 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 dark:hover:from-gray-800/50 dark:hover:to-gray-700/30 transition-colors ${
                          isTopThree ? 'bg-gradient-to-r from-yellow-50/30 via-amber-50/20 to-transparent dark:from-yellow-900/10 dark:via-amber-900/5' : ''
                        }`}
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <span className={`font-bold min-w-[24px] ${
                              isTopThree ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-white'
                            }`}>
                              {position}
                            </span>
                            {position === 1 && <span className="text-yellow-500">👑</span>}
                            {position === 2 && <span className="text-gray-400">🥈</span>}
                            {position === 3 && <span className="text-orange-500">🥉</span>}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            {team.teamLogo && (
                              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-gray-200 dark:border-gray-700 shadow-sm">
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
                              className={`font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${
                                isTopThree ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-white'
                              }`}
                            />
                          </div>
                        </td>
                        <td className="text-center py-4 px-4 text-gray-600 dark:text-gray-400">
                          {team.matchesPlayed}
                        </td>
                        <td className="text-center py-4 px-4">
                          <span className="font-semibold text-green-600 dark:text-green-400">{team.wins}</span>
                        </td>
                        <td className="text-center py-4 px-4">
                          <span className="font-semibold text-orange-600 dark:text-orange-400">{team.draws}</span>
                        </td>
                        <td className="text-center py-4 px-4">
                          <span className="font-semibold text-red-600 dark:text-red-400">{team.losses}</span>
                        </td>
                        <td className="text-center py-4 px-4 text-gray-600 dark:text-gray-400">{team.goalsFor}</td>
                        <td className="text-center py-4 px-4 text-gray-600 dark:text-gray-400">{team.goalsAgainst}</td>
                        <td className="text-center py-4 px-4">
                          <span className={`font-semibold ${goalDiff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {goalDiff > 0 ? '+' : ''}{goalDiff}
                          </span>
                        </td>
                        <td className="text-center py-4 px-4">
                          <span className={`font-bold text-lg ${
                            isTopThree ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-white'
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

        {/* Mobile Optimized Table - Modern 2025 */}
        <div className="md:hidden w-full overflow-x-auto">
          <div className="rounded-2xl bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-lg overflow-hidden">
            <table className="w-full text-xs table-fixed" style={{ minWidth: '100%' }}>
              <thead className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 sticky top-0 z-10">
                <tr>
                  <th className="text-left py-3 px-2 font-bold text-gray-900 dark:text-white w-10">#</th>
                  <th className="text-left py-3 px-2 font-bold text-gray-900 dark:text-white">{t('ranking.teamHeader')}</th>
                  <th className="text-center py-3 px-1 font-bold text-gray-900 dark:text-white w-8">{t('ranking.matchesPlayedShort')}</th>
                  <th className="text-center py-3 px-1 font-bold text-gray-900 dark:text-white w-8">{t('ranking.winsShort')}</th>
                  <th className="text-center py-3 px-1 font-bold text-gray-900 dark:text-white w-8">{t('ranking.drawsShort')}</th>
                  <th className="text-center py-3 px-1 font-bold text-gray-900 dark:text-white w-8">{t('ranking.lossesShort')}</th>
                  <th className="text-center py-3 px-1 font-bold text-gray-900 dark:text-white w-16">{t('ranking.goals')}</th>
                  <th className="text-center py-3 px-2 font-bold text-gray-900 dark:text-white w-12">{t('ranking.pointsShortHeader')}</th>
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
                      className={`border-b border-gray-200/50 dark:border-gray-700/50 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100/50 dark:hover:from-gray-800/50 dark:hover:to-gray-700/30 transition-colors ${
                        isTopThree ? 'bg-gradient-to-r from-yellow-50/30 via-amber-50/20 to-transparent dark:from-yellow-900/10 dark:via-amber-900/5' : ''
                      }`}
                    >
                      {/* Rank */}
                      <td className="py-3 px-2 w-10">
                        <div className="flex items-center gap-0.5">
                          <span className={`font-bold text-xs ${
                            isTopThree ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-white'
                          }`}>
                            {position}
                          </span>
                          {position === 1 && <span className="text-yellow-500 text-[10px]">👑</span>}
                          {position === 2 && <span className="text-gray-400 text-[10px]">🥈</span>}
                          {position === 3 && <span className="text-orange-500 text-[10px]">🥉</span>}
                        </div>
                      </td>
                      
                      {/* Team with Logo */}
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {team.teamLogo ? (
                            <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex-shrink-0 flex items-center justify-center shadow-sm">
                              <img 
                                src={team.teamLogo} 
                                alt={team.teamName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  if (e.currentTarget.parentElement) {
                                    const initials = team.teamName.substring(0, 2).toUpperCase()
                                    e.currentTarget.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400 text-[9px] font-bold bg-gray-100 dark:bg-gray-800">${initials}</div>`
                                  }
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex-shrink-0 flex items-center justify-center shadow-sm">
                              <span className="text-gray-500 dark:text-gray-400 text-[9px] font-bold">
                                {team.teamName.substring(0, 2).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <TeamLink 
                            teamId={team.teamId} 
                            teamName={team.teamName}
                            className={`font-semibold truncate block text-[11px] ${
                              isTopThree ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-white'
                            } hover:text-blue-600 dark:hover:text-blue-400 transition-colors`}
                          />
                        </div>
                      </td>
                      
                      {/* Matches Played */}
                      <td className="text-center py-3 px-1 w-8">
                        <span className="text-gray-600 dark:text-gray-400 font-medium text-[10px]">
                          {team.matchesPlayed}
                        </span>
                      </td>
                      
                      {/* Wins */}
                      <td className="text-center py-3 px-1 w-8">
                        <span className="font-semibold text-green-600 dark:text-green-400 text-[10px]">
                          {team.wins}
                        </span>
                      </td>
                      
                      {/* Draws */}
                      <td className="text-center py-3 px-1 w-8">
                        <span className="font-semibold text-orange-600 dark:text-orange-400 text-[10px]">
                          {team.draws}
                        </span>
                      </td>
                      
                      {/* Losses */}
                      <td className="text-center py-3 px-1 w-8">
                        <span className="font-semibold text-red-600 dark:text-red-400 text-[10px]">
                          {team.losses}
                        </span>
                      </td>
                      
                      {/* Goals Combined: BP - BC (Diff) */}
                      <td className="text-center py-3 px-1 w-16">
                        <div className="flex flex-col items-center gap-0.5">
                          <div className="text-[9px] text-gray-600 dark:text-gray-400">
                            <span className="font-medium">{team.goalsFor}</span>
                            <span className="mx-0.5">-</span>
                            <span className="font-medium">{team.goalsAgainst}</span>
                          </div>
                          <div className={`font-bold text-[10px] ${
                            goalDiff >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {goalDiff > 0 ? '+' : ''}{goalDiff}
                          </div>
                        </div>
                      </td>
                      
                      {/* Points */}
                      <td className="text-center py-3 px-2 w-12">
                        <span className={`font-bold text-sm ${
                          isTopThree ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-white'
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
        </motion.div>
      )}

      {/* Publicité discrète en bas de page */}
      <div className="pt-8 mt-8">
        <AdBanner slot="1234567896" format="auto" style="horizontal" className="opacity-75" />
      </div>
    </div>
  )
}
