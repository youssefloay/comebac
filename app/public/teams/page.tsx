"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"
import type { Team, Player } from "@/lib/types"
import { Users, MapPin, Trophy, Target } from "lucide-react"
import { FavoriteButton } from "@/components/favorites/favorite-button"
import { t } from "@/lib/i18n"
import { AdBanner } from "@/components/ads/AdBanner"

interface TeamWithPlayers extends Team {
  players: Player[]
  playerCount: number
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<TeamWithPlayers[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTeamsWithPlayers = async () => {
      try {
        // Fetch teams
        const teamsSnap = await getDocs(collection(db, "teams"))
        const teamsData = teamsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Team[]

        // Fetch all players from players collection (for display)
        const playersSnap = await getDocs(collection(db, "players"))
        const allPlayers = playersSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Player[]

        // Fetch all player accounts and coach accounts (for accurate count)
        const [playerAccountsSnap, coachAccountsSnap] = await Promise.all([
          getDocs(collection(db, "playerAccounts")),
          getDocs(collection(db, "coachAccounts"))
        ])
        const allPlayerAccounts = playerAccountsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        const allCoachAccounts = coachAccountsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        // Créer un Set des emails des entraîneurs pour exclusion rapide
        const coachEmails = new Set(allCoachAccounts.map((coach: any) => coach.email))

        // Group players by team
        const teamsWithPlayers = teamsData.map(team => {
          const teamPlayers = allPlayers.filter(player => player.teamId === team.id)
          // Count from playerAccounts for accurate number - exclure les entraîneurs
          const teamPlayerAccounts = allPlayerAccounts.filter(
            (account: any) => 
              account.teamId === team.id && 
              !coachEmails.has(account.email) && 
              !account.isActingCoach
          )
          const actualPlayerCount = teamPlayerAccounts.length
          
          return {
            ...team,
            players: teamPlayers,
            playerCount: actualPlayerCount // Use playerAccounts count for accuracy
          }
        })

        setTeams(teamsWithPlayers)
      } catch (error) {
        console.error("Error fetching teams and players:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchTeamsWithPlayers()
  }, [])

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Modern Header 2025 */}
      <motion.div 
        className="mb-8 sm:mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
            <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
            {t('teams.title')}
          </h1>
        </div>
        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 ml-14">
          {t('teams.subtitle')}
        </p>
      </motion.div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-gray-200 dark:border-gray-700 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('teams.loading')}</p>
        </div>
      ) : teams.length === 0 ? (
        <motion.div 
          className="rounded-2xl bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm p-12 text-center shadow-lg"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Users className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t('teams.noTeams')}</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {teams.map((team, index) => {
            const teamColor = team.color || '#3b82f6'
            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="h-full"
              >
                <Link href={`/public/team/${team.id}`}>
                  <div className="group relative h-full flex flex-col rounded-2xl overflow-hidden bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                    {/* Favorite Button */}
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-20" onClick={(e) => e.preventDefault()}>
                      <FavoriteButton teamId={team.id} teamName={team.name} size="sm" />
                    </div>

                    {/* Team Header - Modern 2025 */}
                    <div 
                      className="relative overflow-hidden pt-6 pb-4 sm:pt-8 sm:pb-6 px-4 sm:px-5"
                      style={{ 
                        background: `linear-gradient(135deg, ${teamColor} 0%, ${teamColor}dd 50%, ${teamColor}cc 100%)` 
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/20"></div>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]"></div>
                      
                      {/* Logo and Name - Centered */}
                      <div className="relative z-10 flex flex-col items-center gap-2 sm:gap-3">
                        {team.logo ? (
                          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center overflow-hidden border-2 border-white/50 shadow-xl">
                            <img 
                              src={team.logo} 
                              alt={team.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                if (e.currentTarget.parentElement) {
                                  const initials = team.name.substring(0, 2).toUpperCase()
                                  e.currentTarget.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-bold text-base sm:text-lg">${initials}</div>`
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center border-2 border-white/50 shadow-xl">
                            <span className="text-white font-bold text-base sm:text-lg">
                              {team.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        
                        {/* Team Name */}
                        <div className="text-center w-full px-2">
                          <h2 className="text-base sm:text-lg font-bold text-white group-hover:scale-105 transition-transform drop-shadow-lg mb-0.5 sm:mb-1 line-clamp-2">
                            {team.name}
                          </h2>
                          {(team.school || team.schoolName) && (
                            <p className="text-[10px] sm:text-xs text-white/90 drop-shadow line-clamp-1">
                              {team.school || team.schoolName}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Team Content - Modern 2025 */}
                    <div className="flex-1 flex flex-col justify-between p-3 sm:p-5">
                      {/* Stats - Compact */}
                      <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                        <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border border-blue-200/30 dark:border-blue-800/30">
                          <div className="p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-blue-500/10 dark:bg-blue-400/10 flex-shrink-0">
                            <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">Joueurs</p>
                            <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                              {team.playerCount} {team.playerCount > 1 ? t('team.playersCount') : t('team.playerSingular')}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/30 border border-gray-200/30 dark:border-gray-700/30">
                          <div className="p-1 sm:p-1.5 rounded-md sm:rounded-lg bg-gray-500/10 dark:bg-gray-400/10 flex-shrink-0">
                            <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">Stade</p>
                            <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                              {t('team.stadiumOf')} {team.name}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Players Preview - Modern 2025 */}
                      {team.players.length > 0 ? (
                        <div className="space-y-2 mb-3 sm:mb-4">
                          <h3 className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                            {t('teams.keyPlayers')}
                          </h3>
                          {team.players.slice(0, 3).map((player) => (
                            <div key={player.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 dark:from-gray-800/30 dark:to-gray-700/20 border border-gray-200/30 dark:border-gray-700/30">
                              <div className="w-8 h-8 sm:w-9 sm:h-9 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center text-sm sm:text-base flex-shrink-0 shadow-sm">
                                {getPositionIcon(player.position)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                  <span className="text-xs sm:text-sm text-gray-900 dark:text-white font-semibold truncate">
                                    {player.name}
                                  </span>
                                  {(player as any).isCaptain && (
                                    <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 text-white text-[10px] sm:text-xs font-bold rounded-full shadow-sm" title={t('teams.captain')}>
                                      C
                                    </span>
                                  )}
                                  <span className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-bold">
                                    #{player.number}
                                  </span>
                                </div>
                                {(player as any).nickname && (
                                  <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 italic truncate">
                                    "{(player as any).nickname}"
                                  </div>
                                )}
                                <div className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {player.position}
                                </div>
                              </div>
                            </div>
                          ))}
                          {team.players.length > 3 && (
                            <div className="text-center pt-1 sm:pt-2">
                              <span className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-semibold">
                                +{team.players.length - 3} {t('teams.morePlayers')}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-3 sm:py-4 mb-3 sm:mb-4">
                          <Users className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{t('team.noPlayers')}</p>
                        </div>
                      )}

                      {/* Action Button - Modern 2025 */}
                      <div className="pt-2 sm:pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2 w-full px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-700 group-hover:from-gray-200 group-hover:to-gray-100 dark:group-hover:from-gray-700 dark:group-hover:to-gray-600 transition-all duration-300">
                          <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                            {t('teams.viewTeam')}
                          </span>
                          <Target className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Publicité discrète en bas de page */}
      {!loading && teams.length > 0 && (
        <div className="pt-8 mt-8">
          <AdBanner slot="1234567898" format="auto" style="horizontal" className="opacity-75" />
        </div>
      )}
    </div>
  )
}
