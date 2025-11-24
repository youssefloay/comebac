"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Loader, Search, AlertCircle, ArrowLeft, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface PlayerInfo {
  firstName: string
  lastName: string
  email: string
  nickname?: string
  jerseyNumber?: string | number
  position?: string
}

interface TeamComparison {
  team1: {
    id: string
    name: string
    players: PlayerInfo[]
  }
  team2: {
    id: string
    name: string
    players: PlayerInfo[]
  }
  commonPlayers: PlayerInfo[]
  team1Only: PlayerInfo[]
  team2Only: PlayerInfo[]
}

interface Team {
  id: string
  name: string
}

export default function CompareTeamsPage() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [team1Id, setTeam1Id] = useState<string>('')
  const [team2Id, setTeam2Id] = useState<string>('')
  const [compareAll, setCompareAll] = useState(false)
  const [searchByEmail, setSearchByEmail] = useState(true)
  const [searchByName, setSearchByName] = useState(true)
  const [loading, setLoading] = useState(false)
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [comparison, setComparison] = useState<TeamComparison | null>(null)
  const [allComparisons, setAllComparisons] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Charger la liste des équipes
    const loadTeams = async () => {
      try {
        const response = await fetch('/api/admin/teams')
        const data = await response.json()
        if (response.ok) {
          const teamsList = data.map((team: any) => ({
            id: team.id,
            name: team.name || 'Sans nom'
          })).sort((a: Team, b: Team) => a.name.localeCompare(b.name))
          setTeams(teamsList)
        }
      } catch (err) {
        console.error('Erreur chargement équipes:', err)
      } finally {
        setLoadingTeams(false)
      }
    }
    loadTeams()
  }, [])

  const handleCompare = async () => {
    if (!searchByEmail && !searchByName) {
      setError('Veuillez sélectionner au moins un critère de recherche')
      return
    }

    if (compareAll) {
      // Comparer toutes les équipes
      setLoading(true)
      setError(null)
      setComparison(null)
      setAllComparisons([])

      try {
        const params = new URLSearchParams({
          compareAll: 'true',
          searchByEmail: searchByEmail.toString(),
          searchByName: searchByName.toString()
        })
        
        const response = await fetch(`/api/admin/compare-teams?${params.toString()}`)
        const data = await response.json()

        if (response.ok) {
          setAllComparisons(data.comparisons || [])
        } else {
          setError(data.error || 'Erreur lors de la comparaison')
        }
      } catch (err) {
        setError('Erreur de connexion')
      } finally {
        setLoading(false)
      }
    } else {
      // Comparer deux équipes spécifiques
      if (!team1Id || !team2Id) {
        setError('Veuillez sélectionner les deux équipes')
        return
      }

      if (team1Id === team2Id) {
        setError('Les deux équipes doivent être différentes')
        return
      }

      setLoading(true)
      setError(null)
      setComparison(null)
      setAllComparisons([])

      try {
        const team1 = teams.find(t => t.id === team1Id)
        const team2 = teams.find(t => t.id === team2Id)
        
        if (!team1 || !team2) {
          setError('Équipes non trouvées')
          return
        }

        const params = new URLSearchParams({
          team1: team1.name,
          team2: team2.name,
          searchByEmail: searchByEmail.toString(),
          searchByName: searchByName.toString()
        })
        
        const response = await fetch(`/api/admin/compare-teams?${params.toString()}`)
        const data = await response.json()

        if (response.ok) {
          setComparison(data.comparison)
        } else {
          setError(data.error || 'Erreur lors de la comparaison')
        }
      } catch (err) {
        setError('Erreur de connexion')
      } finally {
        setLoading(false)
      }
    }
  }

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
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
                <UserCheck className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
                Comparer Deux Équipes
              </h1>
            </div>
          </div>
        </motion.div>

        {/* Formulaire de comparaison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl p-6 mb-6"
        >
          {/* Option comparer toutes les équipes */}
          <div className="mb-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl border border-purple-200 dark:border-purple-800">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={compareAll}
                onChange={(e) => {
                  setCompareAll(e.target.checked)
                  if (e.target.checked) {
                    setTeam1Id('')
                    setTeam2Id('')
                  }
                }}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                🔍 Comparer toutes les équipes entre elles
              </span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
              Compare toutes les équipes deux par deux pour trouver tous les joueurs en commun
            </p>
          </div>

          {!compareAll && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Équipe 1
                </label>
                {loadingTeams ? (
                  <div className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse">
                    Chargement...
                  </div>
                ) : (
                  <select
                    value={team1Id}
                    onChange={(e) => setTeam1Id(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Sélectionner une équipe</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Équipe 2
                </label>
                {loadingTeams ? (
                  <div className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse">
                    Chargement...
                  </div>
                ) : (
                  <select
                    value={team2Id}
                    onChange={(e) => setTeam2Id(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">Sélectionner une équipe</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}

          {/* Critères de recherche */}
          <div className="mb-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Critères de recherche
            </label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={searchByEmail}
                  onChange={(e) => setSearchByEmail(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  📧 Par email
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={searchByName}
                  onChange={(e) => setSearchByName(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  👤 Par nom + prénom
                </span>
              </label>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {searchByEmail && searchByName 
                ? 'Recherche par email OU nom+prénom' 
                : searchByEmail 
                ? 'Recherche uniquement par email' 
                : 'Recherche uniquement par nom+prénom'}
            </p>
          </div>

          <button
            onClick={handleCompare}
            disabled={loading || loadingTeams || (!searchByEmail && !searchByName) || (!compareAll && (!team1Id || !team2Id))}
            className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                {compareAll ? 'Comparaison de toutes les équipes...' : 'Comparaison...'}
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                {compareAll ? 'Comparer toutes les équipes' : 'Comparer'}
              </>
            )}
          </button>
        </motion.div>

        {/* Message d'erreur */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-xl bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border border-red-200 dark:border-red-800"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <p className="font-semibold text-red-800 dark:text-red-300">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Résultats */}
        {comparison && (
          <div className="space-y-6">
            {/* Message si pas de doublons */}
            {comparison.commonPlayers.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-white via-white to-green-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border-2 border-green-200 dark:border-green-800 backdrop-blur-xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <UserCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      ✅ Aucun joueur en commun
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Les deux équipes n'ont pas de joueurs en commun
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Critères: {searchByEmail && '📧 Email'} {searchByEmail && searchByName && ' + '} {searchByName && '👤 Nom+Prénom'}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Joueurs communs */}
            {comparison.commonPlayers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-white via-white to-orange-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border-2 border-orange-200 dark:border-orange-800 backdrop-blur-xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                    <AlertCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      ⚠️ Joueurs dans les 2 équipes
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {comparison.commonPlayers.length} joueur{comparison.commonPlayers.length > 1 ? 's' : ''} trouvé{comparison.commonPlayers.length > 1 ? 's' : ''} dans les deux équipes
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Critères: {searchByEmail && '📧 Email'} {searchByEmail && searchByName && ' + '} {searchByName && '👤 Nom+Prénom'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {comparison.commonPlayers.map((player, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl border border-orange-200 dark:border-orange-800"
                    >
                      <div className="font-bold text-gray-900 dark:text-white">
                        {player.firstName} {player.lastName}
                      </div>
                      {player.nickname && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 italic">
                          "{player.nickname}"
                        </div>
                      )}
                      {player.email && (
                        <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          📧 {player.email}
                        </div>
                      )}
                      {player.jerseyNumber && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          #{player.jerseyNumber}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Joueurs uniquement dans équipe 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {comparison.team1.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {comparison.team1Only.length} joueur{comparison.team1Only.length > 1 ? 's' : ''} uniquement
                    </p>
                  </div>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {comparison.team1Only.map((player, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {player.firstName} {player.lastName}
                      </div>
                      {player.nickname && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 italic">
                          "{player.nickname}"
                        </div>
                      )}
                      {player.email && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          📧 {player.email}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Joueurs uniquement dans équipe 2 */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-gradient-to-br from-white via-white to-purple-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {comparison.team2.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {comparison.team2Only.length} joueur{comparison.team2Only.length > 1 ? 's' : ''} uniquement
                    </p>
                  </div>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {comparison.team2Only.map((player, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-lg border border-purple-200 dark:border-purple-800"
                    >
                      <div className="font-semibold text-gray-900 dark:text-white">
                        {player.firstName} {player.lastName}
                      </div>
                      {player.nickname && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 italic">
                          "{player.nickname}"
                        </div>
                      )}
                      {player.email && (
                        <div className="text-xs text-gray-500 dark:text-gray-500">
                          📧 {player.email}
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {/* Résultats pour toutes les équipes */}
        {allComparisons.length > 0 && (
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-white via-white to-purple-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border-2 border-purple-200 dark:border-purple-800 backdrop-blur-xl p-6 mb-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Comparaison de toutes les équipes
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {allComparisons.length} paire{allComparisons.length > 1 ? 's' : ''} d'équipes comparée{allComparisons.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </motion.div>

            {allComparisons.map((comp, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {comp.team1.name} vs {comp.team2.name}
                  </h3>
                  {comp.commonPlayers.length > 0 ? (
                    <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg text-sm font-semibold">
                      ⚠️ {comp.commonPlayers.length} joueur{comp.commonPlayers.length > 1 ? 's' : ''} en commun
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-semibold">
                      ✅ Aucun doublon
                    </span>
                  )}
                </div>
                {comp.commonPlayers.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                    {comp.commonPlayers.map((player: PlayerInfo, playerIndex: number) => (
                      <div
                        key={playerIndex}
                        className="p-3 bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-lg border border-orange-200 dark:border-orange-800"
                      >
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {player.firstName} {player.lastName}
                        </div>
                        {player.email && (
                          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            📧 {player.email}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {!comparison && !allComparisons.length && !loading && !error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl p-12 text-center"
          >
            <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              {compareAll 
                ? 'Sélectionnez les critères et cliquez sur "Comparer toutes les équipes"' 
                : 'Sélectionnez deux équipes à comparer'}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

