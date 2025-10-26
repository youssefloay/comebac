"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import Link from "next/link"
import { db } from "@/lib/firebase"
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore"
import type { Team, Player } from "@/lib/types"
import { 
  ArrowLeft, 
  Users, 
  MapPin, 
  Trophy, 
  Target,
  Calendar,
  TrendingUp,
  Award,
  Shield
} from "lucide-react"

export default function TeamDetailPage() {
  const params = useParams()
  const teamId = params?.id as string
  
  const [team, setTeam] = useState<Team | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTeamDetails = async () => {
      try {
        // Fetch team
        const teamDoc = await getDoc(doc(db, "teams", teamId))
        if (teamDoc.exists()) {
          setTeam({ id: teamDoc.id, ...teamDoc.data() } as Team)
        }

        // Fetch players
        const playersQuery = query(collection(db, "players"), where("teamId", "==", teamId))
        const playersSnap = await getDocs(playersQuery)
        const playersData = playersSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Player[]

        // Sort players by number
        playersData.sort((a, b) => (a.number || 0) - (b.number || 0))
        setPlayers(playersData)
      } catch (error) {
        console.error("Error fetching team details:", error)
      } finally {
        setLoading(false)
      }
    }

    if (teamId) {
      fetchTeamDetails()
    }
  }, [teamId])

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

  const getPositionColor = (position: string) => {
    switch (position?.toLowerCase()) {
      case 'gardien':
      case 'goalkeeper':
        return 'text-sofa-yellow'
      case 'défenseur':
      case 'defender':
        return 'text-sofa-blue'
      case 'milieu':
      case 'midfielder':
        return 'text-sofa-green'
      case 'attaquant':
      case 'forward':
        return 'text-sofa-red'
      default:
        return 'text-sofa-text-muted'
    }
  }

  const groupPlayersByPosition = (players: Player[]) => {
    const positions = {
      'Gardien': players.filter(p => p.position?.toLowerCase().includes('gardien') || p.position?.toLowerCase().includes('goalkeeper')),
      'Défenseur': players.filter(p => p.position?.toLowerCase().includes('défenseur') || p.position?.toLowerCase().includes('defender')),
      'Milieu': players.filter(p => p.position?.toLowerCase().includes('milieu') || p.position?.toLowerCase().includes('midfielder')),
      'Attaquant': players.filter(p => p.position?.toLowerCase().includes('attaquant') || p.position?.toLowerCase().includes('forward')),
      'Autres': players.filter(p => !p.position || (!p.position.toLowerCase().includes('gardien') && 
                                                   !p.position.toLowerCase().includes('goalkeeper') &&
                                                   !p.position.toLowerCase().includes('défenseur') && 
                                                   !p.position.toLowerCase().includes('defender') &&
                                                   !p.position.toLowerCase().includes('milieu') && 
                                                   !p.position.toLowerCase().includes('midfielder') &&
                                                   !p.position.toLowerCase().includes('attaquant') && 
                                                   !p.position.toLowerCase().includes('forward')))
    }
    return positions
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center py-20">
          <div className="w-12 h-12 border-4 border-sofa-border border-t-sofa-text-accent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sofa-text-secondary">Chargement de l'équipe...</p>
        </div>
      </div>
    )
  }

  if (!team) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="sofa-card p-12 text-center">
          <Users className="w-16 h-16 text-sofa-text-muted mx-auto mb-4" />
          <p className="text-sofa-text-secondary">Équipe non trouvée</p>
          <Link href="/public/teams">
            <button className="sofa-btn mt-4">
              Retour aux équipes
            </button>
          </Link>
        </div>
      </div>
    )
  }

  const playersByPosition = groupPlayersByPosition(players)

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* Header */}
      <div className="mb-8">
        <Link href="/public/teams" className="inline-flex items-center gap-2 text-sofa-text-accent hover:text-sofa-green transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux équipes</span>
        </Link>
        
        <div className="sofa-card overflow-hidden">
          <div 
            className="h-32 relative"
            style={{ 
              background: `linear-gradient(135deg, ${team.color || '#00d4aa'} 0%, ${team.color || '#00d4aa'}dd 100%)` 
            }}
          >
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute bottom-6 left-6">
              <h1 className="text-3xl font-bold text-white mb-2">{team.name}</h1>
              <div className="flex items-center gap-4 text-white/90">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{players.length} joueurs</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  <span>Stade de {team.name}</span>
                </div>
              </div>
            </div>
            <div className="absolute top-6 right-6">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">⚽</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Players by Position */}
      <div className="space-y-8">
        {Object.entries(playersByPosition).map(([position, positionPlayers]) => {
          if (positionPlayers.length === 0) return null
          
          return (
            <motion.div
              key={position}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="sofa-card p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-sofa-bg-tertiary rounded-lg flex items-center justify-center">
                  <span className="text-xl">{getPositionIcon(position)}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-sofa-text-primary">{position}s</h2>
                  <p className="text-sm text-sofa-text-muted">{positionPlayers.length} joueur{positionPlayers.length > 1 ? 's' : ''}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {positionPlayers.map((player, index) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-sofa-bg-tertiary rounded-lg p-4 hover:bg-sofa-bg-hover transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-sofa-bg-card rounded-full flex items-center justify-center border-2 border-sofa-border">
                        <span className="font-bold text-sofa-text-accent">
                          #{player.number || '?'}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-sofa-text-primary">
                          {player.name}
                        </h3>
                        <p className={`text-sm ${getPositionColor(player.position || '')}`}>
                          {player.position || 'Position non définie'}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Empty State */}
      {players.length === 0 && (
        <div className="sofa-card p-12 text-center">
          <Users className="w-16 h-16 text-sofa-text-muted mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-sofa-text-primary mb-2">Aucun joueur enregistré</h3>
          <p className="text-sofa-text-secondary">Cette équipe n'a pas encore de joueurs enregistrés.</p>
        </div>
      )}
    </div>
  )
}