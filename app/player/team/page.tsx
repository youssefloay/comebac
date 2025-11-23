"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Users, Shield, Clock, AlertCircle, Crown } from 'lucide-react'
import { motion } from 'framer-motion'

interface Player {
  id: string
  firstName: string
  lastName: string
  position: string
  jerseyNumber: number
  photo?: string
  isActingCoach?: boolean
}

interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  homeTeamId: string
  awayTeamId: string
  date: Date
  location: string
  status: 'upcoming' | 'live' | 'finished'
}

interface Lineup {
  matchId: string
  teamId: string
  starters: string[]
  substitutes: string[]
  formation: string
  validated: boolean
  validatedAt?: Date
}

export default function PlayerTeamPage() {
  const { user, isAdmin } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [nextMatch, setNextMatch] = useState<Match | null>(null)
  const [lineup, setLineup] = useState<Lineup | null>(null)
  const [loading, setLoading] = useState(true)
  const [teamId, setTeamId] = useState<string | null>(null)
  const [teamName, setTeamName] = useState<string>('')
  const [teamColor, setTeamColor] = useState('#3B82F6')

  useEffect(() => {
    loadData()
  }, [user, isAdmin])

  const loadData = async () => {
    try {
      let tid = ''
      let tName = ''

      // Vérifier si on est en mode impersonation
      const impersonatePlayerId = sessionStorage.getItem('impersonatePlayerId')
      
      if (isAdmin && impersonatePlayerId) {
        // Charger les données du joueur impersonné
        const playerDocRef = doc(db, 'playerAccounts', impersonatePlayerId)
        const playerDocSnap = await getDoc(playerDocRef)
        
        if (playerDocSnap.exists()) {
          const playerData = playerDocSnap.data()
          tid = playerData.teamId
          tName = playerData.teamName || ''
        }
      } else if (user?.email) {
        // Récupérer les infos du joueur
        const playerQuery = query(
          collection(db, 'playerAccounts'),
          where('email', '==', user.email)
        )
        const playerSnap = await getDocs(playerQuery)

        if (!playerSnap.empty) {
          const playerData = playerSnap.docs[0].data()
          tid = playerData.teamId
          tName = playerData.teamName || ''
        }
      }

      if (!tid) {
        setLoading(false)
        return
      }

      setTeamId(tid)
      setTeamName(tName)

      // Charger les infos de l'équipe
      const teamDoc = await getDoc(doc(db, 'teams', tid))
      if (teamDoc.exists()) {
        setTeamColor(teamDoc.data().color || '#3B82F6')
      }


      // Charger tous les joueurs de l'équipe
      const teamPlayersQuery = query(
        collection(db, 'playerAccounts'),
        where('teamId', '==', tid)
      )
      const teamPlayersSnap = await getDocs(teamPlayersQuery)
      const playersData = teamPlayersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isActingCoach: doc.data().isActingCoach || false
      })) as Player[]
      playersData.sort((a, b) => a.jerseyNumber - b.jerseyNumber)
      setPlayers(playersData)

      // Charger le prochain match
      const matchesQuery = query(
        collection(db, 'matches'),
        where('teams', 'array-contains', tid),
        where('status', '==', 'upcoming'),
        orderBy('date', 'asc'),
        limit(1)
      )
      const matchesSnap = await getDocs(matchesQuery)
      
      if (!matchesSnap.empty) {
        const matchData = {
          id: matchesSnap.docs[0].id,
          ...matchesSnap.docs[0].data(),
          date: matchesSnap.docs[0].data().date?.toDate() || new Date()
        } as Match
        setNextMatch(matchData)

        // Charger la composition pour ce match
        const lineupsQuery = query(
          collection(db, 'lineups'),
          where('matchId', '==', matchData.id),
          where('teamId', '==', tid)
        )
        const lineupsSnap = await getDocs(lineupsQuery)
        
        if (!lineupsSnap.empty) {
          const lineupData = lineupsSnap.docs[0].data() as Lineup
          setLineup(lineupData)
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPlayerById = (id: string) => players.find(p => p.id === id)

  const getPositionPlayers = () => {
    if (!lineup) return { defenders: [], midfielders: [], forwards: [] }
    
    const starters = lineup.starters.map(id => getPlayerById(id)).filter(Boolean) as Player[]
    return {
      defenders: starters.filter(p => p.position.toLowerCase().includes('défenseur')).slice(0, 2),
      midfielders: starters.filter(p => p.position.toLowerCase().includes('milieu')).slice(0, 2),
      forwards: starters.filter(p => p.position.toLowerCase().includes('attaquant')).slice(0, 1)
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const positions = getPositionPlayers()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4 md:p-8 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            Mon Équipe
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {teamName} • {players.length} joueur{players.length > 1 ? 's' : ''}
          </p>
        </motion.div>

        {/* Prochain Match */}
        {nextMatch && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">Prochain Match</h2>
            <div className="bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 md:p-8 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                <div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                    {nextMatch.homeTeam} vs {nextMatch.awayTeam}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {nextMatch.date.toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      day: 'numeric', 
                      month: 'long',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">{nextMatch.location}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Composition */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-lg font-bold text-gray-900 mb-4">Composition Officielle</h4>
                
                {lineup && lineup.validated ? (
                  <>
                    {/* Mini-terrain */}
                    <div 
                      className="relative w-full max-w-md mx-auto aspect-[3/4] rounded-2xl overflow-hidden shadow-lg mb-6"
                      style={{
                        background: `
                          linear-gradient(180deg, 
                            #0a2e0a 0%,
                            #1a4d1a 20%,
                            #2d6b2d 40%,
                            #3d8b3d 50%,
                            #2d6b2d 60%,
                            #1a4d1a 80%,
                            #0a2e0a 100%
                          )
                        `,
                        boxShadow: 'inset 0 0 100px rgba(0,0,0,0.4)'
                      }}
                    >
                      {/* Ligne médiane */}
                      <div 
                        className="absolute top-1/2 left-0 right-0 h-0.5 transform -translate-y-1/2"
                        style={{
                          background: 'rgba(255,255,255,0.95)',
                          boxShadow: '0 0 10px rgba(255,255,255,0.5)'
                        }}
                      ></div>

                      {/* Attaquant */}
                      <div className="absolute top-[10%] left-1/2 transform -translate-x-1/2">
                        {positions.forwards[0] && (
                          <PlayerCard player={positions.forwards[0]} color={teamColor} />
                        )}
                      </div>

                      {/* Milieux */}
                      <div className="absolute top-[35%] left-0 right-0 flex justify-center gap-12">
                        {positions.midfielders.map((player, i) => (
                          <PlayerCard key={i} player={player} color={teamColor} />
                        ))}
                      </div>

                      {/* Défenseurs */}
                      <div className="absolute top-[60%] left-0 right-0 flex justify-center gap-12">
                        {positions.defenders.map((player, i) => (
                          <PlayerCard key={i} player={player} color={teamColor} />
                        ))}
                      </div>
                    </div>

                    {/* Remplaçants */}
                    <div>
                      <h5 className="text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
                        Remplaçants ({lineup.substitutes.length})
                      </h5>
                      <div className="grid grid-cols-3 gap-3">
                        {lineup.substitutes.map((id, index) => {
                          const player = getPlayerById(id)
                          return player ? (
                            <motion.div
                              key={id}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.1 * index }}
                              whileHover={{ scale: 1.05, y: -3 }}
                              className="p-3 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm"
                            >
                              <div className="flex flex-col items-center gap-2">
                                <motion.div
                                  whileHover={{ scale: 1.1, rotate: 5 }}
                                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg"
                                  style={{ 
                                    background: `linear-gradient(135deg, ${teamColor}, ${teamColor}dd)`
                                  }}
                                >
                                  {player.jerseyNumber}
                                </motion.div>
                                <div className="text-center w-full">
                                  <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                                    {player.firstName} {player.lastName}
                                  </p>
                                  <p className="text-xs text-gray-600 dark:text-gray-400">{player.position}</p>
                                </div>
                              </div>
                            </motion.div>
                          ) : null
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl text-center">
                    <AlertCircle className="w-12 h-12 text-yellow-600 dark:text-yellow-400 mx-auto mb-3" />
                    <p className="text-yellow-800 dark:text-yellow-300 font-medium">
                      Composition en attente de validation par l'entraîneur
                    </p>
                    <p className="text-yellow-600 dark:text-yellow-400 text-sm mt-2">
                      La composition sera visible dès qu'elle sera validée
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}


        {/* Liste des joueurs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">Tous les Joueurs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {players.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-4 md:p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl relative"
              >
                {player.isActingCoach && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-bold border border-orange-200 dark:border-orange-800">
                    <Crown className="w-3 h-3" />
                    Coach Intérimaire
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="relative"
                  >
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-lg border-2 border-white dark:border-gray-800">
                      {player.photo ? (
                        <img 
                          src={player.photo} 
                          alt={`${player.firstName} ${player.lastName}`}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        `${player.firstName[0]}${player.lastName[0]}`
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 md:w-7 md:h-7 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-xs border-2 border-white dark:border-gray-800 shadow-lg">
                      {player.jerseyNumber}
                    </div>
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white text-base md:text-lg">
                      {player.firstName} {player.lastName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{player.position}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

function PlayerCard({ player, color }: { player: Player; color: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.1 }}
      className="flex flex-col items-center"
    >
      <div 
        className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white font-bold text-base md:text-lg border-3 border-white shadow-xl"
        style={{ backgroundColor: color }}
      >
        {player.jerseyNumber}
      </div>
      <div className="mt-2 px-2 py-1 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <p className="text-xs font-bold text-gray-900 dark:text-white whitespace-nowrap">
          {player.lastName.toUpperCase()}
        </p>
      </div>
    </motion.div>
  )
}
