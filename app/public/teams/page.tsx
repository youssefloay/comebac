"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where } from "firebase/firestore"
import type { Team, Player } from "@/lib/types"
import { Users, MapPin, Trophy, Target } from "lucide-react"

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

        // Fetch all players
        const playersSnap = await getDocs(collection(db, "players"))
        const allPlayers = playersSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Player[]

        // Group players by team
        const teamsWithPlayers = teamsData.map(team => {
          const teamPlayers = allPlayers.filter(player => player.teamId === team.id)
          return {
            ...team,
            players: teamPlayers,
            playerCount: teamPlayers.length
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
        <h1 className="text-4xl font-bold text-sofa-text-primary mb-2">Équipes</h1>
        <p className="text-sofa-text-secondary">
          Découvrez toutes les équipes et leurs joueurs du championnat
        </p>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-sofa-border border-t-sofa-text-accent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sofa-text-secondary">Chargement des équipes...</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="sofa-card p-12 text-center">
          <Users className="w-16 h-16 text-sofa-text-muted mx-auto mb-4" />
          <p className="text-sofa-text-secondary">Aucune équipe disponible</p>
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
                <div className="sofa-card cursor-pointer group">
                  {/* Team Header */}
                  <div 
                    className="h-24 relative overflow-hidden"
                    style={{ 
                      background: `linear-gradient(135deg, ${team.color || '#00d4aa'} 0%, ${team.color || '#00d4aa'}dd 100%)` 
                    }}
                  >
                    <div className="absolute inset-0 bg-black/20"></div>
                    <div className="absolute bottom-4 left-6">
                      <h2 className="text-xl font-bold text-white group-hover:scale-105 transition-transform">
                        {team.name}
                      </h2>
                    </div>
                    <div className="absolute top-4 right-6">
                      <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                        <span className="text-2xl">⚽</span>
                      </div>
                    </div>
                  </div>

                  {/* Team Stats */}
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-sofa-text-accent" />
                        <span className="text-sofa-text-primary font-semibold">
                          {team.playerCount} joueurs
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-sofa-text-muted" />
                        <span className="text-sm text-sofa-text-muted">
                          Stade de {team.name}
                        </span>
                      </div>
                    </div>

                    {/* Players Preview */}
                    {team.players.length > 0 ? (
                      <div className="space-y-2 mb-4">
                        <h3 className="text-sm font-semibold text-sofa-text-secondary uppercase tracking-wide">
                          Joueurs Clés
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
                                <span className="text-xs text-sofa-text-accent font-bold">
                                  #{player.number}
                                </span>
                              </div>
                              <div className="text-xs text-sofa-text-muted">
                                {player.position}
                              </div>
                            </div>
                          </div>
                        ))}
                        {team.players.length > 3 && (
                          <div className="text-center pt-2">
                            <span className="text-sm text-sofa-text-accent">
                              +{team.players.length - 3} autres joueurs
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <Users className="w-8 h-8 text-sofa-text-muted mx-auto mb-2" />
                        <p className="text-sm text-sofa-text-muted">Aucun joueur enregistré</p>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-4 border-t border-sofa-border">
                      <div className="flex items-center justify-center gap-2 text-sofa-text-accent group-hover:text-sofa-green transition-colors">
                        <span className="text-sm font-medium">Voir l'équipe</span>
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
    </div>
  )
}
