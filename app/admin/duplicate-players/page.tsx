"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, AlertTriangle, Trash2, Edit, Loader, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface PlayerInfo {
  firstName: string
  lastName: string
  email: string
  nickname?: string
  teamId: string
  teamName: string
  source: 'playerAccounts' | 'teams'
  sourceId: string
  playerId?: string
}

interface DuplicateGroup {
  key: string
  players: PlayerInfo[]
}

export default function DuplicatePlayersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([])
  const [removing, setRemoving] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadDuplicates()
  }, [])

  const loadDuplicates = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/detect-duplicate-players')
      const data = await response.json()
      
      if (response.ok) {
        setDuplicates(data.duplicates || [])
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors du chargement' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion' })
    } finally {
      setLoading(false)
    }
  }

  const handleRemovePlayer = async (player: PlayerInfo) => {
    if (!confirm(
      `⚠️ Retirer ${player.firstName} ${player.lastName} de l'équipe "${player.teamName}"?\n\n` +
      `Cette action va retirer ce joueur de cette équipe spécifique.\n\n` +
      `Continuer?`
    )) {
      return
    }

    setRemoving(`${player.sourceId}_${player.playerId || 'captain'}`)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/remove-player-from-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: player.source,
          sourceId: player.sourceId,
          playerId: player.playerId || 'captain',
          playerData: {
            email: player.email,
            firstName: player.firstName,
            lastName: player.lastName
          }
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Joueur retiré avec succès' })
        // Recharger les doublons
        await loadDuplicates()
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors du retrait' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion' })
    } finally {
      setRemoving(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Chargement des joueurs dupliqués...</p>
        </div>
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
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Link
                href="/admin"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </Link>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 md:w-10 md:h-10 text-orange-600" />
                Joueurs dans Plusieurs Équipes
              </h1>
            </div>
            <button
              onClick={loadDuplicates}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-semibold"
            >
              Actualiser
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            {duplicates.length} joueur{duplicates.length > 1 ? 's' : ''} trouvé{duplicates.length > 1 ? 's' : ''} dans plusieurs équipes
          </p>
        </motion.div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-xl ${
              message.type === 'success'
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800'
                : 'bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800'
            }`}
          >
            <p className={`font-semibold ${
              message.type === 'success'
                ? 'text-green-800 dark:text-green-300'
                : 'text-red-800 dark:text-red-300'
            }`}>
              {message.text}
            </p>
          </motion.div>
        )}

        {/* Liste des doublons */}
        {duplicates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl p-12 text-center"
          >
            <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Aucun joueur trouvé dans plusieurs équipes
            </p>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {duplicates.map((group, groupIndex) => (
              <motion.div
                key={group.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.1 }}
                className="bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                    <AlertTriangle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {group.players[0].firstName} {group.players[0].lastName}
                    </h3>
                    {group.players[0].email && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {group.players[0].email}
                      </p>
                    )}
                    {group.players[0].nickname && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 italic">
                        "{group.players[0].nickname}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  {group.players.map((player, playerIndex) => (
                    <motion.div
                      key={`${player.sourceId}_${player.playerId || 'captain'}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: playerIndex * 0.05 }}
                      className="flex items-center justify-between p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                            player.source === 'playerAccounts'
                              ? 'bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-700 dark:text-blue-400'
                              : 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-700 dark:text-green-400'
                          }`}>
                            {player.source === 'playerAccounts' ? 'Compte Validé' : 'Équipe Validée'}
                          </div>
                          <h4 className="font-bold text-gray-900 dark:text-white">
                            {player.teamName}
                          </h4>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {player.email && (
                            <span>📧 {player.email}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemovePlayer(player)}
                        disabled={removing === `${player.sourceId}_${player.playerId || 'captain'}`}
                        className="ml-4 px-4 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-xl hover:from-red-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {removing === `${player.sourceId}_${player.playerId || 'captain'}` ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Retrait...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4" />
                            Retirer
                          </>
                        )}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

