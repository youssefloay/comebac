"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  Sparkles, 
  Users, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Trophy,
  RefreshCw,
  PlayCircle,
  Loader,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Star
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, orderBy, limit, where } from 'firebase/firestore'

interface FantasyStats {
  totalTeams: number
  totalPlayers: number
  activeGameweek: number
  mostPopularPlayer: {
    name: string
    popularity: number
  } | null
  topTeam: {
    name: string
    points: number
  } | null
  averageTeamPoints: number
}

interface ActionLog {
  id: string
  action: string
  timestamp: Date
  status: 'success' | 'error'
  message: string
}

export default function AdminFantasyPage() {
  const { user, loading: authLoading, isAdmin } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<FantasyStats | null>(null)
  const [logs, setLogs] = useState<ActionLog[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
      } else if (!isAdmin) {
        router.push('/public')
      } else {
        loadFantasyStats()
      }
    }
  }, [user, authLoading, isAdmin, router])

  const loadFantasyStats = async () => {
    try {
      setLoading(true)

      // Récupérer le nombre d'équipes Fantasy
      const teamsSnapshot = await getDocs(collection(db, 'fantasy_teams'))
      const totalTeams = teamsSnapshot.size

      // Récupérer le nombre de joueurs avec stats Fantasy
      const playerStatsSnapshot = await getDocs(collection(db, 'player_fantasy_stats'))
      const totalPlayers = playerStatsSnapshot.size

      // Récupérer la gameweek active
      const gameweeksQuery = query(
        collection(db, 'fantasy_gameweeks'),
        where('isActive', '==', true)
      )
      const gameweeksSnapshot = await getDocs(gameweeksQuery)
      const activeGameweek = gameweeksSnapshot.empty ? 0 : gameweeksSnapshot.docs[0].data().number

      // Récupérer le joueur le plus populaire
      const popularPlayersQuery = query(
        collection(db, 'player_fantasy_stats'),
        orderBy('popularity', 'desc'),
        limit(1)
      )
      const popularPlayersSnapshot = await getDocs(popularPlayersQuery)
      let mostPopularPlayer = null
      
      if (!popularPlayersSnapshot.empty) {
        const playerStats = popularPlayersSnapshot.docs[0].data()
        // Récupérer le nom du joueur
        const playersSnapshot = await getDocs(collection(db, 'players'))
        const player = playersSnapshot.docs.find(doc => doc.id === playerStats.playerId)
        
        if (player) {
          mostPopularPlayer = {
            name: player.data().name,
            popularity: playerStats.popularity || 0
          }
        }
      }

      // Récupérer l'équipe en tête du classement
      const topTeamsQuery = query(
        collection(db, 'fantasy_teams'),
        orderBy('totalPoints', 'desc'),
        limit(1)
      )
      const topTeamsSnapshot = await getDocs(topTeamsQuery)
      let topTeam = null
      
      if (!topTeamsSnapshot.empty) {
        const team = topTeamsSnapshot.docs[0].data()
        topTeam = {
          name: team.teamName,
          points: team.totalPoints || 0
        }
      }

      // Calculer la moyenne des points
      let averageTeamPoints = 0
      if (totalTeams > 0) {
        const totalPoints = teamsSnapshot.docs.reduce((sum, doc) => {
          return sum + (doc.data().totalPoints || 0)
        }, 0)
        averageTeamPoints = Math.round(totalPoints / totalTeams)
      }

      setStats({
        totalTeams,
        totalPlayers,
        activeGameweek,
        mostPopularPlayer,
        topTeam,
        averageTeamPoints
      })
    } catch (error) {
      console.error('Erreur lors du chargement des stats:', error)
      setMessage({ type: 'error', text: 'Erreur lors du chargement des statistiques' })
    } finally {
      setLoading(false)
    }
  }

  const addLog = (action: string, status: 'success' | 'error', message: string) => {
    const newLog: ActionLog = {
      id: Date.now().toString(),
      action,
      timestamp: new Date(),
      status,
      message
    }
    setLogs(prev => [newLog, ...prev.slice(0, 9)]) // Garder les 10 derniers logs
  }

  const handleInitFantasyData = async () => {
    if (!confirm(
      '🎮 Initialiser les données Fantasy\n\n' +
      'Cette action va:\n' +
      '• Calculer le prix initial de tous les joueurs\n' +
      '• Créer les PlayerFantasyStats pour chaque joueur\n' +
      '• Créer la première gameweek\n\n' +
      'Continuer?'
    )) {
      return
    }

    setActionLoading('init')
    setMessage(null)
    
    try {
      const token = await user?.getIdToken()
      const response = await fetch('/api/admin/fantasy/init-data', { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: data.message })
        addLog('Initialisation Fantasy', 'success', data.message)
        await loadFantasyStats()
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de l\'initialisation' })
        addLog('Initialisation Fantasy', 'error', data.error)
      }
    } catch (error) {
      const errorMsg = 'Erreur de connexion'
      setMessage({ type: 'error', text: errorMsg })
      addLog('Initialisation Fantasy', 'error', errorMsg)
    } finally {
      setActionLoading(null)
    }
  }

  const handleStartNewGameweek = async () => {
    if (!confirm(
      '📅 Démarrer une nouvelle gameweek\n\n' +
      'Cette action va:\n' +
      '• Clôturer la gameweek actuelle\n' +
      '• Réinitialiser les transferts gratuits (2 par équipe)\n' +
      '• Réinitialiser les points hebdomadaires\n' +
      '• Créer une nouvelle gameweek\n' +
      '• Envoyer des notifications de deadline\n\n' +
      'Continuer?'
    )) {
      return
    }

    setActionLoading('gameweek')
    setMessage(null)
    
    try {
      const token = await user?.getIdToken()
      const response = await fetch('/api/admin/fantasy/start-gameweek', { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: data.message })
        addLog('Nouvelle gameweek', 'success', data.message)
        await loadFantasyStats()
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors du démarrage de la gameweek' })
        addLog('Nouvelle gameweek', 'error', data.error)
      }
    } catch (error) {
      const errorMsg = 'Erreur de connexion'
      setMessage({ type: 'error', text: errorMsg })
      addLog('Nouvelle gameweek', 'error', errorMsg)
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdatePrices = async () => {
    if (!confirm(
      '💰 Mettre à jour les prix des joueurs\n\n' +
      'Cette action va ajuster les prix de tous les joueurs\n' +
      'basés sur leur forme récente (5 derniers matchs).\n\n' +
      'Variation maximale: ±0.5M€ par gameweek\n\n' +
      'Continuer?'
    )) {
      return
    }

    setActionLoading('prices')
    setMessage(null)
    
    try {
      const token = await user?.getIdToken()
      const response = await fetch('/api/admin/fantasy/update-prices', { 
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: data.message })
        addLog('Mise à jour des prix', 'success', data.message)
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la mise à jour des prix' })
        addLog('Mise à jour des prix', 'error', data.error)
      }
    } catch (error) {
      const errorMsg = 'Erreur de connexion'
      setMessage({ type: 'error', text: errorMsg })
      addLog('Mise à jour des prix', 'error', errorMsg)
    } finally {
      setActionLoading(null)
    }
  }

  const handleUpdateAfterMatch = async () => {
    const matchId = prompt('ID du match à traiter:')
    if (!matchId) return

    if (!confirm(
      `⚽ Mettre à jour Fantasy après le match\n\n` +
      `Match ID: ${matchId}\n\n` +
      `Cette action va:\n` +
      `• Calculer les points de tous les joueurs du match\n` +
      `• Mettre à jour toutes les équipes Fantasy\n` +
      `• Envoyer des notifications\n` +
      `• Vérifier et attribuer les badges\n\n` +
      `Continuer?`
    )) {
      return
    }

    setActionLoading('match')
    setMessage(null)
    
    try {
      const token = await user?.getIdToken()
      const response = await fetch('/api/admin/fantasy/update-after-match', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ matchId })
      })
      const data = await response.json()
      
      if (response.ok) {
        setMessage({ type: 'success', text: data.message })
        addLog('Mise à jour après match', 'success', data.message)
        await loadFantasyStats()
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la mise à jour' })
        addLog('Mise à jour après match', 'error', data.error)
      }
    } catch (error) {
      const errorMsg = 'Erreur de connexion'
      setMessage({ type: 'error', text: errorMsg })
      addLog('Mise à jour après match', 'error', errorMsg)
    } finally {
      setActionLoading(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Admin Fantasy</h1>
          </div>
          <p className="text-gray-600">
            Gestion et administration du mode Fantasy ComeBac League
          </p>
        </div>

        {/* Message de résultat */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <p
              className={`text-sm font-medium ${
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {message.text}
            </p>
          </div>
        )}

        {/* Statistiques globales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Total équipes */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">
                {stats?.totalTeams || 0}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Équipes Fantasy</h3>
            <p className="text-xs text-gray-500 mt-1">Total d'équipes créées</p>
          </div>

          {/* Total joueurs */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">
                {stats?.totalPlayers || 0}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Joueurs avec stats</h3>
            <p className="text-xs text-gray-500 mt-1">PlayerFantasyStats créés</p>
          </div>

          {/* Gameweek active */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">
                {stats?.activeGameweek || 0}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Gameweek active</h3>
            <p className="text-xs text-gray-500 mt-1">Journée en cours</p>
          </div>

          {/* Joueur le plus populaire */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-600">Joueur populaire</h3>
                <p className="text-lg font-bold text-gray-900 truncate">
                  {stats?.mostPopularPlayer?.name || 'N/A'}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {stats?.mostPopularPlayer 
                ? `${stats.mostPopularPlayer.popularity.toFixed(1)}% des équipes`
                : 'Aucune donnée'}
            </p>
          </div>

          {/* Équipe en tête */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Trophy className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-600">Équipe leader</h3>
                <p className="text-lg font-bold text-gray-900 truncate">
                  {stats?.topTeam?.name || 'N/A'}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {stats?.topTeam ? `${stats.topTeam.points} points` : 'Aucune donnée'}
            </p>
          </div>

          {/* Moyenne des points */}
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-teal-600" />
              </div>
              <span className="text-3xl font-bold text-gray-900">
                {stats?.averageTeamPoints || 0}
              </span>
            </div>
            <h3 className="text-sm font-medium text-gray-600">Moyenne des points</h3>
            <p className="text-xs text-gray-500 mt-1">Points moyens par équipe</p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Actions Fantasy</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Initialiser les données */}
            <button
              onClick={handleInitFantasyData}
              disabled={actionLoading !== null}
              className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                {actionLoading === 'init' ? (
                  <Loader className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <PlayCircle className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-gray-900">Initialiser Fantasy</h3>
                <p className="text-xs text-gray-600">Créer les données initiales</p>
              </div>
            </button>

            {/* Nouvelle gameweek */}
            <button
              onClick={handleStartNewGameweek}
              disabled={actionLoading !== null}
              className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                {actionLoading === 'gameweek' ? (
                  <Loader className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <Calendar className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-gray-900">Nouvelle gameweek</h3>
                <p className="text-xs text-gray-600">Démarrer la journée suivante</p>
              </div>
            </button>

            {/* Mettre à jour les prix */}
            <button
              onClick={handleUpdatePrices}
              disabled={actionLoading !== null}
              className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                {actionLoading === 'prices' ? (
                  <Loader className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <DollarSign className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-gray-900">Mettre à jour les prix</h3>
                <p className="text-xs text-gray-600">Ajuster selon la forme</p>
              </div>
            </button>

            {/* Mettre à jour après match */}
            <button
              onClick={handleUpdateAfterMatch}
              disabled={actionLoading !== null}
              className="flex items-center gap-3 p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                {actionLoading === 'match' ? (
                  <Loader className="w-5 h-5 text-white animate-spin" />
                ) : (
                  <RefreshCw className="w-5 h-5 text-white" />
                )}
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-gray-900">Mise à jour après match</h3>
                <p className="text-xs text-gray-600">Calculer les points</p>
              </div>
            </button>
          </div>
        </div>

        {/* Logs des mises à jour */}
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Logs des mises à jour</h2>
          
          {logs.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              Aucune action effectuée pour le moment
            </p>
          ) : (
            <div className="space-y-3">
              {logs.map(log => (
                <div
                  key={log.id}
                  className={`p-4 rounded-lg border ${
                    log.status === 'success'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {log.status === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h3
                          className={`font-semibold text-sm ${
                            log.status === 'success' ? 'text-green-900' : 'text-red-900'
                          }`}
                        >
                          {log.action}
                        </h3>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {log.timestamp.toLocaleTimeString('fr-FR')}
                        </span>
                      </div>
                      <p
                        className={`text-sm ${
                          log.status === 'success' ? 'text-green-700' : 'text-red-700'
                        }`}
                      >
                        {log.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
