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

        // Fetch all player accounts (for accurate count)
        const playerAccountsSnap = await getDocs(collection(db, "playerAccounts"))
        const allPlayerAccounts = playerAccountsSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        // Group players by team
        const teamsWithPlayers = teamsData.map(team => {
          const teamPlayers = allPlayers.filter(player => player.teamId === team.id)
          // Count from playerAccounts for accurate number
          const teamPlayerAccounts = allPlayerAccounts.filter(
            (account: any) => account.teamId === team.id
          )
          const actualPlayerCount = teamPlayerAccounts.length
          
          // Log pour debug
          if (teamPlayers.length > 0 || actualPlayerCount > 0) {
            console.log(`Équipe ${team.name}:`, {
              playersCollection: teamPlayers.length,
              playerAccountsCollection: actualPlayerCount,
              players: teamPlayers.map(p => ({ name: p.name, isCaptain: (p as any).isCaptain }))
            })
          }
          
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-sofa-text-primary mb-2">{t('teams.title')}</h1>
        <p className="text-sofa-text-secondary">
          {t('teams.subtitle')}
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-sofa-border border-t-sofa-text-accent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sofa-text-secondary">{t('teams.loading')}</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="sofa-card p-12 text-center">
          <Users className="w-16 h-16 text-sofa-text-muted mx-auto mb-4" />
          <p className="text-sofa-text-secondary">{t('teams.noTeams')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {teams.map((team, index) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/public/team/${team.id}`}>
                <div className="sofa-card cursor-pointer group relative">
                  {/* Favorite Button - Outside card */}
                  <div className="absolute -top-2 -right-2 z-20" onClick={(e) => e.preventDefault()}>
                    <FavoriteButton teamId={team.id} teamName={team.name} size="sm" />
                  </div>

                  {/* Team Header - Compact horizontal layout */}
                  <div 
                    className="h-20 sm:h-24 relative overflow-hidden flex items-center px-4 sm:px-6 gap-3 sm:gap-4"
                    style={{ 
                      background: `linear-gradient(135deg, ${team.color || '#00d4aa'} 0%, ${team.color || '#00d4aa'}dd 100%)` 
                    }}
                  >
                    <div className="absolute inset-0 bg-black/20"></div>
                    
                    {/* Logo */}
                    {team.logo && (
                      <div className="relative z-10 flex-shrink-0">
                        <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                          <img 
                            src={team.logo} 
                            alt={team.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                    
                    {/* Team Info */}
                    <div className="relative z-10 flex-1 min-w-0 pr-8">
                      <h2 className="text-lg sm:text-xl font-bold text-white group-hover:scale-105 transition-transform truncate">
                        {team.name}
                      </h2>
                      {(team.school || team.schoolName) && (
                        <p className="text-xs sm:text-sm text-white/80 truncate">
                          {team.school || team.schoolName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Team Stats */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-sofa-text-accent" />
                        <span className="text-sofa-text-primary font-semibold">
                          {team.playerCount} {team.playerCount > 1 ? t('team.playersCount') : t('team.playerSingular')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-sofa-text-muted" />
                        <span className="text-sm text-sofa-text-muted">
                          {t('team.stadiumOf')} {team.name}
                        </span>
                      </div>
                    </div>

                    {/* Players Preview */}
                    {team.players.length > 0 ? (
                      <div className="space-y-2 mb-4">
                        <h3 className="text-sm font-semibold text-sofa-text-secondary uppercase tracking-wide">
                          {t('teams.keyPlayers')}
                        </h3>
                        {team.players.slice(0, 3).map((player) => (
                          <div key={player.id} className="flex items-center gap-3 p-2 bg-sofa-bg-tertiary rounded-lg">
                            <div className="w-8 h-8 bg-sofa-bg-hover rounded-full flex items-center justify-center text-sm">
                              {getPositionIcon(player.position)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sofa-text-primary font-medium">
                                  {player.name}
                                </span>
                                {(player as any).isCaptain && (
                                  <span className="inline-flex items-center justify-center w-5 h-5 bg-yellow-500 text-white text-xs font-bold rounded-full" title={t('teams.captain')}>
                                    C
                                  </span>
                                )}
                                <span className="text-xs text-sofa-text-accent font-bold">
                                  #{player.number}
                                </span>
                              </div>
                              {(player as any).nickname && (
                                <div className="text-xs text-sofa-text-muted italic">
                                  "{(player as any).nickname}"
                                </div>
                              )}
                              <div className="text-xs text-sofa-text-muted">
                                {player.position}
                              </div>
                            </div>
                          </div>
                        ))}
                        {team.players.length > 3 && (
                          <div className="text-center pt-2">
                            <span className="text-sm text-sofa-text-accent">
                              +{team.players.length - 3} {t('teams.morePlayers')}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Users className="w-8 h-8 text-sofa-text-muted mx-auto mb-2" />
                        <p className="text-sm text-sofa-text-muted">{t('team.noPlayers')}</p>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-4 border-t border-sofa-border">
                      <div className="flex items-center justify-center gap-2 text-sofa-text-accent group-hover:text-sofa-green transition-colors">
                        <span className="text-sm font-medium">{t('teams.viewTeam')}</span>
                        <Target className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
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
