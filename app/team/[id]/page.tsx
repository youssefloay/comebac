"use client"

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/lib/auth-context'
import { UserNavbar } from '@/components/user/navbar'
import { PlayerCard } from '@/components/user/player-card'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Users, 
  Trophy, 
  Target,
  Shield,
  Calendar,
  MapPin
} from 'lucide-react'

interface Player {
  id: string
  name: string
  age?: number
  position: string
  number?: number
  avatar?: string
}

interface Team {
  id: string
  name: string
  logo?: string
  color?: string
  founded?: string
  stadium?: string
  description?: string
}

export default function TeamDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [team, setTeam] = useState<Team | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const teamId = params?.id as string

  useEffect(() => {
    if (!user || !teamId) return

    let unsubscribe: (() => void) | undefined

    const loadTeamData = async () => {
      try {
        // Load team details
        const teamDoc = await getDoc(doc(db, 'teams', teamId))
        if (teamDoc.exists()) {
          setTeam({ id: teamDoc.id, ...teamDoc.data() } as Team)
        } else {
          setError('Équipe non trouvée')
          return
        }

        // Load players
        const playersQuery = query(
          collection(db, 'players'),
          where('teamId', '==', teamId)
        )
        
        unsubscribe = onSnapshot(playersQuery, (snapshot) => {
          const playersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Player[]
          
          // Sort players by position and number
          const sortedPlayers = playersData.sort((a, b) => {
            const positionOrder = { 'Gardien': 1, 'Défenseur': 2, 'Milieu': 3, 'Attaquant': 4 }
            const aPos = positionOrder[a.position as keyof typeof positionOrder] || 5
            const bPos = positionOrder[b.position as keyof typeof positionOrder] || 5
            
            if (aPos !== bPos) return aPos - bPos
            return (a.number || 99) - (b.number || 99)
          })
          
          setPlayers(sortedPlayers)
          setLoading(false)
        })
      } catch (err) {
        console.error('Error loading team data:', err)
        setError('Erreur lors du chargement des données')
        setLoading(false)
      }
    }

    loadTeamData()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [user, teamId])

  const getPlayersByPosition = (position: string) => {
    return players.filter(player => player.position === position)
  }

  const getPositionStats = () => {
    const positions = ['Gardien', 'Défenseur', 'Milieu', 'Attaquant']
    return positions.map(position => ({
      position,
      count: getPlayersByPosition(position).length,
      icon: position === 'Gardien' ? '🥅' : 
            position === 'Défenseur' ? '🛡️' : 
            position === 'Milieu' ? '⚽' : '🎯'
    }))
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UserNavbar />
        <div className="flex items-center justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-gray-50">
        <UserNavbar />
        <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="text-red-500 mb-4">
                <Shield className="w-16 h-16 mx-auto" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {error || 'Équipe non trouvée'}
              </h2>
              <Button onClick={() => router.back()} className="mt-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <UserNavbar />
      
      <main className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au tableau de bord
          </Button>
        </motion.div>

        {/* Team Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white"
        >
          <div className="flex items-center gap-6 mb-6">
            {team.logo ? (
              <img 
                src={team.logo} 
                alt={`${team.name} logo`}
                className="w-20 h-20 rounded-full border-4 border-white/20"
              />
            ) : (
              <div 
                className="w-20 h-20 rounded-full border-4 border-white/20 flex items-center justify-center text-3xl font-bold"
                style={{ backgroundColor: team.color || 'rgba(255,255,255,0.2)' }}
              >
                {team.name.charAt(0).toUpperCase()}
              </div>
            )}
            
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">{team.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-white/80">
                {team.founded && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Fondé en {team.founded}
                  </div>
                )}
                {team.stadium && (
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {team.stadium}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {players.length} joueurs
                </div>
              </div>
            </div>
          </div>

          {team.description && (
            <p className="text-white/90 text-lg max-w-3xl">
              {team.description}
            </p>
          )}
        </motion.div>

        {/* Team Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {getPositionStats().map((stat, index) => (
            <motion.div
              key={stat.position}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-lg">
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{stat.icon}</div>
                  <div className="text-2xl font-bold text-gray-900">{stat.count}</div>
                  <div className="text-sm text-gray-600">{stat.position}s</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Players by Position */}
        {['Gardien', 'Défenseur', 'Milieu', 'Attaquant'].map((position) => {
          const positionPlayers = getPlayersByPosition(position)
          if (positionPlayers.length === 0) return null

          return (
            <section key={position}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-4">
                  <span className="text-2xl">
                    {position === 'Gardien' ? '🥅' : 
                     position === 'Défenseur' ? '🛡️' : 
                     position === 'Milieu' ? '⚽' : '🎯'}
                  </span>
                  {position}s
                  <Badge variant="outline" className="ml-2">
                    {positionPlayers.length}
                  </Badge>
                </h2>
              </motion.div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {positionPlayers.map((player, index) => (
                  <PlayerCard 
                    key={player.id} 
                    player={player} 
                    index={index}
                  />
                ))}
              </div>
            </section>
          )
        })}

        {/* Empty State */}
        {players.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-0 shadow-lg">
              <CardContent className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Aucun joueur enregistré
                </h3>
                <p className="text-gray-600">
                  Cette équipe n'a pas encore de joueurs dans la base de données.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  )
}