"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Users, Mail, Phone, Calendar, Ruler, Shield, Target, TrendingUp, Award, BarChart3 } from 'lucide-react'

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

  useEffect(() => {
    const loadTeamData = async () => {
      if (!user?.email) return

      try {
        let tid = ''
        
        // Si admin, utiliser une équipe de démo
        if (isAdmin) {
          tid = 'demo'
        } else {
          // Récupérer l'ID de l'équipe du coach
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

        if (tid) {
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            Mon Équipe
          </h1>
          <p className="text-gray-600">
            {players.length} joueur{players.length > 1 ? 's' : ''} dans votre équipe
          </p>
        </div>

        {/* Statistiques globales de l'équipe */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <div className="flex flex-col items-center text-center">
              <BarChart3 className="w-8 h-8 text-blue-600 mb-2" />
              <span className="text-2xl font-bold text-gray-900">{teamStats.totalMatches}</span>
              <p className="text-xs text-gray-600">Matchs</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <div className="flex flex-col items-center text-center">
              <Target className="w-8 h-8 text-green-600 mb-2" />
              <span className="text-2xl font-bold text-gray-900">{teamStats.totalGoals}</span>
              <p className="text-xs text-gray-600">Buts</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <div className="flex flex-col items-center text-center">
              <TrendingUp className="w-8 h-8 text-purple-600 mb-2" />
              <span className="text-2xl font-bold text-gray-900">{teamStats.totalAssists}</span>
              <p className="text-xs text-gray-600">Passes</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <div className="flex flex-col items-center text-center">
              <Award className="w-8 h-8 text-yellow-600 mb-2" />
              <span className="text-2xl font-bold text-gray-900">{teamStats.totalYellowCards}</span>
              <p className="text-xs text-gray-600">Cartons J.</p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
            <div className="flex flex-col items-center text-center">
              <Award className="w-8 h-8 text-red-600 mb-2" />
              <span className="text-2xl font-bold text-gray-900">{teamStats.totalRedCards}</span>
              <p className="text-xs text-gray-600">Cartons R.</p>
            </div>
          </div>
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {players.map((player) => {
            const statusBadge = getStatusBadge(player.status)
            const stats = player.stats || { matchesPlayed: 0, minutesPlayed: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 }
            
            return (
              <div
                key={player.id}
                className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center text-white text-xl font-bold">
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
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white">
                      {player.jerseyNumber}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-900 text-lg">
                      {player.firstName} {player.lastName}
                    </h3>
                    {player.nickname && (
                      <p className="text-sm text-gray-500 italic">"{player.nickname}"</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Shield className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-600">{player.position}</span>
                    </div>
                  </div>
                </div>

                {/* Statut du joueur */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-2">Statut</label>
                  <select
                    value={player.status || 'starter'}
                    onChange={(e) => handleStatusChange(player.id, e.target.value as Player['status'])}
                    disabled={updatingPlayer === player.id}
                    className={`w-full px-3 py-2 border rounded-lg text-sm font-medium ${statusBadge.color} ${
                      updatingPlayer === player.id ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <option value="starter">✅ Titulaire</option>
                    <option value="substitute">🔵 Remplaçant</option>
                    <option value="injured">🟠 Blessé</option>
                    <option value="suspended">🔴 Suspendu</option>
                  </select>
                </div>

                {/* Statistiques du joueur */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-xs font-bold text-gray-700 mb-2">Statistiques</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-gray-900">{stats.goals}</p>
                      <p className="text-xs text-gray-600">Buts</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{stats.assists}</p>
                      <p className="text-xs text-gray-600">Passes</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900">{stats.matchesPlayed}</p>
                      <p className="text-xs text-gray-600">Matchs</p>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">Minutes jouées:</span>
                      <span className="font-bold text-gray-900">{stats.minutesPlayed}'</span>
                    </div>
                    {(stats.yellowCards > 0 || stats.redCards > 0) && (
                      <div className="flex items-center justify-between text-xs mt-1">
                        <span className="text-gray-600">Cartons:</span>
                        <div className="flex gap-2">
                          {stats.yellowCards > 0 && (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded font-bold">
                              {stats.yellowCards} 🟨
                            </span>
                          )}
                          {stats.redCards > 0 && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded font-bold">
                              {stats.redCards} 🟥
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{player.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-3 h-3" />
                    <span>{player.phone}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {players.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Aucun joueur dans votre équipe</p>
          </div>
        )}
      </div>
    </div>
  )
}
