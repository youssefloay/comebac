"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Users, Mail, Phone, Calendar, Ruler, Shield, Target, TrendingUp, Award, BarChart3, Edit, X, Save } from 'lucide-react'
import { capitalizeWords } from '@/lib/text-utils'
import { motion, AnimatePresence } from 'framer-motion'

interface Player {
  id: string
  firstName: string
  lastName: string
  nickname?: string
  email: string
  phone: string
  position: string
  jerseyNumber: number
  birthDate?: string
  height?: number
  photo?: string
  status?: 'starter' | 'substitute' | 'injured' | 'suspended'
  stats?: {
    matchesPlayed: number
    minutesPlayed: number
    goals: number
    assists: number
    yellowCards: number
    redCards: number
  }
}

export default function CoachTeamPage() {
  const { user, isAdmin } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [teamId, setTeamId] = useState<string | null>(null)
  const [updatingPlayer, setUpdatingPlayer] = useState<string | null>(null)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    const loadTeamData = async () => {
      if (!user?.email) return

      try {
        let tid = ''
        
        // Vérifier si on est en mode impersonation
        const impersonateCoachId = sessionStorage.getItem('impersonateCoachId')
        
        if (impersonateCoachId) {
          // Mode impersonation: charger les données du coach spécifique
          const coachDoc = await getDoc(doc(db, 'coachAccounts', impersonateCoachId))
          if (coachDoc.exists()) {
            tid = coachDoc.data().teamId
          }
        } else if (isAdmin) {
          // Admin sans impersonation: équipe de démo
          tid = 'demo'
        } else {
          // Utilisateur normal: chercher par email
          const coachQuery = query(
            collection(db, 'coachAccounts'),
            where('email', '==', user.email)
          )
          const coachSnap = await getDocs(coachQuery)

          if (!coachSnap.empty) {
            const coachData = coachSnap.docs[0].data()
            tid = coachData.teamId
          }
        }

        if (tid && tid !== 'demo') {
          setTeamId(tid)

          // Charger les joueurs de l'équipe
          const playersQuery = query(
            collection(db, 'playerAccounts'),
            where('teamId', '==', tid)
          )
          const playersSnap = await getDocs(playersQuery)

          const playersData = playersSnap.docs.map(doc => {
            const data = doc.data()
            return {
              id: doc.id,
              ...data,
              status: data.status || 'starter',
              stats: data.stats || {
                matchesPlayed: 0,
                minutesPlayed: 0,
                goals: 0,
                assists: 0,
                yellowCards: 0,
                redCards: 0
              }
            }
          }) as Player[]

          // Trier par numéro de maillot
          playersData.sort((a, b) => a.jerseyNumber - b.jerseyNumber)
          setPlayers(playersData)
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'équipe:', error)
      } finally {
        setLoading(false)
      }
    }

    loadTeamData()
  }, [user, isAdmin])

  const handleStatusChange = async (playerId: string, newStatus: Player['status']) => {
    setUpdatingPlayer(playerId)
    try {
      await updateDoc(doc(db, 'playerAccounts', playerId), {
        status: newStatus,
        updatedAt: new Date()
      })
      
      setPlayers(players.map(p => 
        p.id === playerId ? { ...p, status: newStatus } : p
      ))
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
      alert('Erreur lors de la mise à jour du statut')
    } finally {
      setUpdatingPlayer(null)
    }
  }

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer({ ...player })
    setShowEditModal(true)
  }

  const handleSavePlayer = async () => {
    if (!editingPlayer) return

    setUpdatingPlayer(editingPlayer.id)
    try {
      const updatedData = {
        firstName: capitalizeWords(editingPlayer.firstName),
        lastName: capitalizeWords(editingPlayer.lastName),
        nickname: capitalizeWords(editingPlayer.nickname) || '',
        email: editingPlayer.email,
        phone: editingPlayer.phone,
        position: editingPlayer.position,
        jerseyNumber: editingPlayer.jerseyNumber,
        birthDate: editingPlayer.birthDate || '',
        height: editingPlayer.height || 0,
        updatedAt: new Date()
      }

      // 1. Mettre à jour playerAccounts
      await updateDoc(doc(db, 'playerAccounts', editingPlayer.id), updatedData)
      
      // 2. Synchroniser avec la collection players
      const playersQuery = query(
        collection(db, 'players'),
        where('email', '==', editingPlayer.email)
      )
      const playersSnap = await getDocs(playersQuery)
      
      for (const playerDoc of playersSnap.docs) {
        await updateDoc(doc(db, 'players', playerDoc.id), {
          firstName: updatedData.firstName,
          lastName: updatedData.lastName,
          name: `${updatedData.firstName} ${updatedData.lastName}`,
          email: updatedData.email,
          phone: updatedData.phone,
          position: updatedData.position,
          number: updatedData.jerseyNumber,
          birthDate: updatedData.birthDate,
          height: updatedData.height,
          nickname: updatedData.nickname
        })
      }

      // 2b. Synchroniser avec la collection teams
      if (editingPlayer.teamId) {
        const teamDoc = await getDoc(doc(db, 'teams', editingPlayer.teamId))
        if (teamDoc.exists()) {
          const teamData = teamDoc.data()
          if (teamData.players && Array.isArray(teamData.players)) {
            const updatedPlayers = teamData.players.map((p: any) => {
              if (p.email === editingPlayer.email || p.id === editingPlayer.id) {
                return {
                  ...p,
                  firstName: updatedData.firstName,
                  lastName: updatedData.lastName,
                  nickname: updatedData.nickname,
                  email: updatedData.email,
                  phone: updatedData.phone,
                  position: updatedData.position,
                  jerseyNumber: updatedData.jerseyNumber
                }
              }
              return p
            })
            await updateDoc(doc(db, 'teams', editingPlayer.teamId), {
              players: updatedPlayers
            })
          }
        }
      }

      // 3. Synchroniser avec teamRegistrations
      const registrationsQuery = query(collection(db, 'teamRegistrations'))
      const registrationsSnap = await getDocs(registrationsQuery)
      
      for (const regDoc of registrationsSnap.docs) {
        const regData = regDoc.data()
        if (regData.players && Array.isArray(regData.players)) {
          const updatedPlayers = regData.players.map((p: any) => {
            if (p.email === editingPlayer.email) {
              return {
                ...p,
                firstName: updatedData.firstName,
                lastName: updatedData.lastName,
                nickname: updatedData.nickname,
                email: updatedData.email,
                phone: updatedData.phone,
                position: updatedData.position,
                jerseyNumber: updatedData.jerseyNumber,
                birthDate: updatedData.birthDate,
                height: updatedData.height
              }
            }
            return p
          })
          
          if (JSON.stringify(updatedPlayers) !== JSON.stringify(regData.players)) {
            await updateDoc(doc(db, 'teamRegistrations', regDoc.id), {
              players: updatedPlayers
            })
          }
        }
      }
      
      setPlayers(players.map(p => 
        p.id === editingPlayer.id ? editingPlayer : p
      ))
      
      setShowEditModal(false)
      setEditingPlayer(null)
    } catch (error) {
      console.error('Erreur lors de la mise à jour du joueur:', error)
      alert('Erreur lors de la mise à jour du joueur')
    } finally {
      setUpdatingPlayer(null)
    }
  }

  const getStatusBadge = (status: Player['status']) => {
    switch (status) {
      case 'starter':
        return { label: 'Titulaire', color: 'bg-green-100 text-green-700 border-green-200' }
      case 'substitute':
        return { label: 'Remplaçant', color: 'bg-blue-100 text-blue-700 border-blue-200' }
      case 'injured':
        return { label: 'Blessé', color: 'bg-orange-100 text-orange-700 border-orange-200' }
      case 'suspended':
        return { label: 'Suspendu', color: 'bg-red-100 text-red-700 border-red-200' }
      default:
        return { label: 'Titulaire', color: 'bg-green-100 text-green-700 border-green-200' }
    }
  }

  // Calculer les statistiques globales de l'équipe
  const teamStats = players.reduce((acc, player) => ({
    totalGoals: acc.totalGoals + (player.stats?.goals || 0),
    totalAssists: acc.totalAssists + (player.stats?.assists || 0),
    totalMatches: Math.max(acc.totalMatches, player.stats?.matchesPlayed || 0),
    totalYellowCards: acc.totalYellowCards + (player.stats?.yellowCards || 0),
    totalRedCards: acc.totalRedCards + (player.stats?.redCards || 0)
  }), { totalGoals: 0, totalAssists: 0, totalMatches: 0, totalYellowCards: 0, totalRedCards: 0 })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4 md:p-8 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 md:w-10 md:h-10 text-orange-600" />
            Mon Équipe
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {players.length} joueur{players.length > 1 ? 's' : ''} dans votre équipe
          </p>
        </motion.div>

        {/* Statistiques globales de l'équipe */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl p-4 md:p-6"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{teamStats.totalMatches}</span>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-1">Matchs</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-white via-white to-green-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl p-4 md:p-6"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <Target className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{teamStats.totalGoals}</span>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-1">Buts</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-white via-white to-purple-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl p-4 md:p-6"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{teamStats.totalAssists}</span>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-1">Passes</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-white via-white to-yellow-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl p-4 md:p-6"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">{teamStats.totalYellowCards}</span>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-1">Cartons J.</p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-gradient-to-br from-white via-white to-red-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl p-4 md:p-6"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-3 shadow-lg">
                <Award className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">{teamStats.totalRedCards}</span>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium mt-1">Cartons R.</p>
            </div>
          </motion.div>
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {players.map((player, index) => {
            const statusBadge = getStatusBadge(player.status)
            const stats = player.stats || { matchesPlayed: 0, minutesPlayed: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 }
            
            return (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl"
              >
                <div className="flex items-start gap-4 mb-4">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="relative"
                  >
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-xl border-4 border-white dark:border-gray-800">
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
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 md:w-8 md:h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm border-4 border-white dark:border-gray-800 shadow-lg">
                      {player.jerseyNumber}
                    </div>
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg md:text-xl">
                      {player.firstName} {player.lastName}
                    </h3>
                    {player.nickname && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 italic">"{player.nickname}"</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{player.position}</span>
                    </div>
                  </div>
                </div>

                {/* Statut du joueur */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Statut</label>
                  <select
                    value={player.status || 'starter'}
                    onChange={(e) => handleStatusChange(player.id, e.target.value as Player['status'])}
                    disabled={updatingPlayer === player.id}
                    className={`w-full px-3 py-2 border rounded-xl text-sm font-semibold transition-all ${
                      player.status === 'starter' 
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                        : player.status === 'substitute'
                        ? 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
                        : player.status === 'injured'
                        ? 'bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400'
                        : 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
                    } ${
                      updatingPlayer === player.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'
                    }`}
                  >
                    <option value="starter">✅ Titulaire</option>
                    <option value="substitute">🔵 Remplaçant</option>
                    <option value="injured">🟠 Blessé</option>
                    <option value="suspended">🔴 Suspendu</option>
                  </select>
                </div>

                {/* Statistiques du joueur */}
                <div className="mb-4 p-3 md:p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700">
                  <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">Statistiques</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg md:text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.goals}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Buts</p>
                    </div>
                    <div>
                      <p className="text-lg md:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{stats.assists}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Passes</p>
                    </div>
                    <div>
                      <p className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{stats.matchesPlayed}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Matchs</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Minutes jouées:</span>
                      <span className="font-bold text-gray-900 dark:text-white">{stats.minutesPlayed}'</span>
                    </div>
                    {(stats.yellowCards > 0 || stats.redCards > 0) && (
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-gray-600 dark:text-gray-400">Cartons:</span>
                        <div className="flex gap-2">
                          {stats.yellowCards > 0 && (
                            <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 text-yellow-800 dark:text-yellow-400 rounded-full font-bold border border-yellow-200 dark:border-yellow-800">
                              {stats.yellowCards} 🟨
                            </span>
                          )}
                          {stats.redCards > 0 && (
                            <span className="px-2 py-0.5 bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 text-red-800 dark:text-red-400 rounded-full font-bold border border-red-200 dark:border-red-800">
                              {stats.redCards} 🟥
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-1 text-xs mb-4">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{player.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Phone className="w-3 h-3" />
                    <span>{player.phone}</span>
                  </div>
                </div>

                {/* Bouton d'édition */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleEditPlayer(player)}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm font-semibold"
                >
                  <Edit className="w-4 h-4" />
                  Modifier les infos
                </motion.button>
              </motion.div>
            )
          })}
        </div>

        {players.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Aucun joueur dans votre équipe</p>
          </motion.div>
        )}
      </div>

      {/* Modal d'édition */}
      <AnimatePresence>
        {showEditModal && editingPlayer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 md:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                    Modifier {editingPlayer.firstName} {editingPlayer.lastName}
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setShowEditModal(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </motion.button>
                </div>

              <div className="space-y-4">
                {/* Nom et Prénom */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      value={editingPlayer.firstName}
                      onChange={(e) => setEditingPlayer({ ...editingPlayer, firstName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={editingPlayer.lastName}
                      onChange={(e) => setEditingPlayer({ ...editingPlayer, lastName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                </div>

                {/* Surnom */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Surnom
                  </label>
                  <input
                    type="text"
                    value={editingPlayer.nickname || ''}
                    onChange={(e) => setEditingPlayer({ ...editingPlayer, nickname: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                    placeholder="Optionnel"
                  />
                </div>

                {/* Position et Numéro */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Position *
                    </label>
                    <select
                      value={editingPlayer.position}
                      onChange={(e) => setEditingPlayer({ ...editingPlayer, position: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    >
                      <option value="Gardien">Gardien</option>
                      <option value="Défenseur">Défenseur</option>
                      <option value="Milieu">Milieu</option>
                      <option value="Attaquant">Attaquant</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Numéro *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="99"
                      value={editingPlayer.jerseyNumber}
                      onChange={(e) => setEditingPlayer({ ...editingPlayer, jerseyNumber: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                </div>

                {/* Email et Téléphone */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={editingPlayer.email}
                      onChange={(e) => setEditingPlayer({ ...editingPlayer, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone *
                    </label>
                    <input
                      type="tel"
                      value={editingPlayer.phone}
                      onChange={(e) => setEditingPlayer({ ...editingPlayer, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                </div>

                {/* Date de naissance et Taille */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de naissance
                    </label>
                    <input
                      type="date"
                      value={editingPlayer.birthDate || ''}
                      onChange={(e) => setEditingPlayer({ ...editingPlayer, birthDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taille (cm)
                    </label>
                    <input
                      type="number"
                      min="100"
                      max="250"
                      value={editingPlayer.height || ''}
                      onChange={(e) => setEditingPlayer({ ...editingPlayer, height: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-400"
                      placeholder="Ex: 175"
                    />
                  </div>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-semibold"
                >
                  Annuler
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSavePlayer}
                  disabled={updatingPlayer === editingPlayer.id}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingPlayer === editingPlayer.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Enregistrer
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
