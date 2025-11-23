"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Clipboard, Check, AlertCircle, Lock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Player {
  id: string
  firstName: string
  lastName: string
  position: string
  jerseyNumber: number
  status?: 'starter' | 'substitute' | 'injured' | 'suspended'
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
  starters: string[] // IDs des joueurs
  substitutes: string[] // IDs des joueurs
  formation: string
  validated: boolean
  validatedAt?: Date
  createdAt: Date
}

export default function CoachLineupsPage() {
  const { user, isAdmin } = useAuth()
  const [players, setPlayers] = useState<Player[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [selectedStarters, setSelectedStarters] = useState<string[]>([])
  const [selectedSubstitutes, setSelectedSubstitutes] = useState<string[]>([])
  const [existingLineup, setExistingLineup] = useState<Lineup | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [teamId, setTeamId] = useState<string | null>(null)
  const [teamColor, setTeamColor] = useState('#3B82F6')

  useEffect(() => {
    loadData()
  }, [user, isAdmin])

  const loadData = async () => {
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
          tid = coachSnap.docs[0].data().teamId
        }
      }

      if (tid && tid !== 'demo') {
        setTeamId(tid)

        // Charger la couleur de l'équipe
        const teamDoc = await getDoc(doc(db, 'teams', tid))
        if (teamDoc.exists()) {
          setTeamColor(teamDoc.data().color || '#3B82F6')
        }

        // Charger les joueurs disponibles
        const playersQuery = query(
          collection(db, 'playerAccounts'),
          where('teamId', '==', tid)
        )
        const playersSnap = await getDocs(playersQuery)
        const playersData = playersSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          status: doc.data().status || 'starter'
        })) as Player[]
        playersData.sort((a, b) => a.jerseyNumber - b.jerseyNumber)
        setPlayers(playersData)

        // Charger les matchs à venir
        const matchesQuery = query(
          collection(db, 'matches'),
          where('teams', 'array-contains', tid),
          where('status', '==', 'upcoming')
        )
        const matchesSnap = await getDocs(matchesQuery)
        const matchesData = matchesSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().date?.toDate() || new Date()
        })) as Match[]
        matchesData.sort((a, b) => a.date.getTime() - b.date.getTime())
        setMatches(matchesData)

        if (matchesData.length > 0) {
          selectMatch(matchesData[0], tid)
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectMatch = async (match: Match, tid: string) => {
    setSelectedMatch(match)
    
    // Charger la composition existante si elle existe
    const lineupsQuery = query(
      collection(db, 'lineups'),
      where('matchId', '==', match.id),
      where('teamId', '==', tid)
    )
    const lineupsSnap = await getDocs(lineupsQuery)
    
    if (!lineupsSnap.empty) {
      const lineupData = lineupsSnap.docs[0].data() as Lineup
      setExistingLineup(lineupData)
      setSelectedStarters(lineupData.starters || [])
      setSelectedSubstitutes(lineupData.substitutes || [])
    } else {
      setExistingLineup(null)
      setSelectedStarters([])
      setSelectedSubstitutes([])
    }
  }

  const toggleStarter = (playerId: string) => {
    if (isLineupLocked()) return
    
    if (selectedStarters.includes(playerId)) {
      setSelectedStarters(selectedStarters.filter(id => id !== playerId))
    } else if (selectedStarters.length < 5) {
      setSelectedStarters([...selectedStarters, playerId])
      setSelectedSubstitutes(selectedSubstitutes.filter(id => id !== playerId))
    }
  }

  const toggleSubstitute = (playerId: string) => {
    if (isLineupLocked()) return
    
    if (selectedSubstitutes.includes(playerId)) {
      setSelectedSubstitutes(selectedSubstitutes.filter(id => id !== playerId))
    } else if (selectedSubstitutes.length < 3) {
      setSelectedSubstitutes([...selectedSubstitutes, playerId])
      setSelectedStarters(selectedStarters.filter(id => id !== playerId))
    }
  }

  const isLineupLocked = () => {
    if (!selectedMatch) return false
    const hoursUntilMatch = (selectedMatch.date.getTime() - new Date().getTime()) / (1000 * 60 * 60)
    return existingLineup?.validated && hoursUntilMatch <= 24
  }

  const canValidate = () => {
    return selectedStarters.length === 5 && selectedSubstitutes.length === 3 && !isLineupLocked()
  }

  const validateLineup = async () => {
    if (!canValidate() || !selectedMatch || !teamId) return

    setSaving(true)
    try {
      const lineupData = {
        matchId: selectedMatch.id,
        teamId: teamId,
        starters: selectedStarters,
        substitutes: selectedSubstitutes,
        formation: '2-2-1',
        validated: true,
        validatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      if (existingLineup) {
        // Mettre à jour
        const lineupsQuery = query(
          collection(db, 'lineups'),
          where('matchId', '==', selectedMatch.id),
          where('teamId', '==', teamId)
        )
        const lineupsSnap = await getDocs(lineupsQuery)
        if (!lineupsSnap.empty) {
          await updateDoc(lineupsSnap.docs[0].ref, {
            ...lineupData,
            updatedAt: serverTimestamp()
          })
        }
      } else {
        // Créer
        await addDoc(collection(db, 'lineups'), lineupData)
      }

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
      
      // Recharger
      if (teamId) {
        await selectMatch(selectedMatch, teamId)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la validation')
    } finally {
      setSaving(false)
    }
  }

  const getPlayerById = (id: string) => players.find(p => p.id === id)

  const getPositionPlayers = () => {
    const starters = selectedStarters.map(id => getPlayerById(id)).filter(Boolean) as Player[]
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
  const locked = isLineupLocked()

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
            <Clipboard className="w-8 h-8 md:w-10 md:h-10 text-orange-600" />
            Compositions d'Équipe
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Créez et validez vos compositions officielles
          </p>
        </motion.div>

        {/* Success Message */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-l-4 border-green-500 rounded-xl shadow-lg backdrop-blur-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-green-900 dark:text-green-400">Composition validée ✅</h3>
                  <p className="text-green-700 dark:text-green-300 text-sm">
                    Votre composition a été enregistrée avec succès
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Match Selection */}
        {matches.length > 0 ? (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionnez un match
            </label>
            <select
              value={selectedMatch?.id || ''}
              onChange={(e) => {
                const match = matches.find(m => m.id === e.target.value)
                if (match && teamId) selectMatch(match, teamId)
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {matches.map(match => (
                <option key={match.id} value={match.id}>
                  {match.date.toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })} - {match.homeTeam} vs {match.awayTeam}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="mb-6 p-8 bg-white rounded-lg shadow-md border border-gray-200 text-center">
            <Clipboard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Aucun match à venir</p>
          </div>
        )}

        {selectedMatch && (
          <>
            {/* Locked Warning */}
            {locked && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-l-4 border-yellow-500 rounded-xl shadow-lg backdrop-blur-xl"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                    <Lock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-yellow-900 dark:text-yellow-400">Composition verrouillée</h3>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                      Cette composition est verrouillée car le match est dans moins de 24h
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Terrain */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl"
                >
                  <h3 className="text-lg md:text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
                    Formation 2-2-1
                  </h3>
                  
                  {/* Mini-terrain */}
                  <div 
                    className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl"
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
                    {/* Lignes du terrain */}
                    <div 
                      className="absolute top-1/2 left-0 right-0 h-1 transform -translate-y-1/2"
                      style={{
                        background: 'rgba(255,255,255,0.95)',
                        boxShadow: '0 0 10px rgba(255,255,255,0.5)'
                      }}
                    ></div>

                    {/* Attaquant */}
                    <div className="absolute top-[10%] left-1/2 transform -translate-x-1/2">
                      {positions.forwards[0] ? (
                        <PlayerCard player={positions.forwards[0]} color={teamColor} />
                      ) : (
                        <EmptySlot label="ATT" />
                      )}
                    </div>

                    {/* Milieux */}
                    <div className="absolute top-[35%] left-0 right-0 flex justify-center gap-12">
                      {[0, 1].map(i => (
                        <div key={i}>
                          {positions.midfielders[i] ? (
                            <PlayerCard player={positions.midfielders[i]} color={teamColor} />
                          ) : (
                            <EmptySlot label="MIL" />
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Défenseurs */}
                    <div className="absolute top-[60%] left-0 right-0 flex justify-center gap-12">
                      {[0, 1].map(i => (
                        <div key={i}>
                          {positions.defenders[i] ? (
                            <PlayerCard player={positions.defenders[i]} color={teamColor} />
                          ) : (
                            <EmptySlot label="DÉF" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Remplaçants */}
                  <div className="mt-6">
                    <h4 className="text-sm font-bold text-gray-700 mb-3">
                      Remplaçants ({selectedSubstitutes.length}/3)
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      {selectedSubstitutes.map(id => {
                        const player = getPlayerById(id)
                        return player ? (
                          <div key={id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex flex-col items-center gap-2">
                              <div 
                                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                                style={{ backgroundColor: teamColor }}
                              >
                                {player.jerseyNumber}
                              </div>
                              <div className="text-center w-full">
                                <p className="text-xs font-bold text-gray-900 truncate">
                                  {player.firstName} {player.lastName}
                                </p>
                                <p className="text-xs text-gray-600">{player.position}</p>
                              </div>
                            </div>
                          </div>
                        ) : null
                      })}
                      {[...Array(3 - selectedSubstitutes.length)].map((_, i) => (
                        <div key={`empty-${i}`} className="p-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <div className="w-12 h-12 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center mb-2">
                              ?
                            </div>
                            <p className="text-xs">Vide</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Validation Button */}
                  <div className="mt-6">
                    <motion.button
                      whileHover={canValidate() && !saving ? { scale: 1.02 } : {}}
                      whileTap={canValidate() && !saving ? { scale: 0.98 } : {}}
                      onClick={validateLineup}
                      disabled={!canValidate() || saving}
                      className={`w-full px-6 py-4 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2 shadow-lg ${
                        canValidate() && !saving
                          ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 hover:shadow-xl'
                          : 'bg-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {saving ? (
                        <>
                          <LoadingSpinner size="sm" />
                          Validation en cours...
                        </>
                      ) : locked ? (
                        <>
                          <Lock className="w-5 h-5" />
                          Composition verrouillée
                        </>
                      ) : (
                        <>
                          <Check className="w-5 h-5" />
                          Valider la composition
                        </>
                      )}
                    </motion.button>
                    {!locked && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                        {selectedStarters.length}/5 titulaires • {selectedSubstitutes.length}/3 remplaçants
                      </p>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Liste des joueurs */}
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl"
                >
                  <h3 className="text-lg md:text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4">
                    Joueurs Disponibles
                  </h3>
                  <div className="space-y-2 max-h-[800px] overflow-y-auto">
                    {players.filter(p => p.status !== 'injured' && p.status !== 'suspended').map((player, index) => {
                      const isStarter = selectedStarters.includes(player.id)
                      const isSubstitute = selectedSubstitutes.includes(player.id)
                      const isSelected = isStarter || isSubstitute
                      
                      return (
                        <motion.div
                          key={player.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 * index }}
                          whileHover={!locked ? { scale: 1.02, x: 5 } : {}}
                          className={`p-3 rounded-xl border-2 transition-all backdrop-blur-sm ${
                            isSelected
                              ? isStarter
                                ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-500 shadow-lg'
                                : 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-500 shadow-lg'
                              : 'bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          } ${locked ? 'opacity-50' : 'cursor-pointer'}`}
                        >
                          <div className="flex items-center gap-3">
                            <motion.div
                              whileHover={{ scale: 1.1, rotate: 5 }}
                              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
                              style={{ 
                                background: isSelected && isStarter
                                  ? 'linear-gradient(135deg, #10b981, #059669)'
                                  : isSelected && isSubstitute
                                  ? 'linear-gradient(135deg, #3b82f6, #2563eb)'
                                  : teamColor
                              }}
                            >
                              {player.jerseyNumber}
                            </motion.div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                {player.firstName} {player.lastName}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">{player.position}</p>
                            </div>
                          </div>
                          {!locked && (
                            <div className="mt-2 flex gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => toggleStarter(player.id)}
                                disabled={selectedStarters.length >= 5 && !isStarter}
                                className={`flex-1 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                                  isStarter
                                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50'
                                }`}
                              >
                                Titulaire
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => toggleSubstitute(player.id)}
                                disabled={selectedSubstitutes.length >= 3 && !isSubstitute}
                                className={`flex-1 px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                                  isSubstitute
                                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50'
                                }`}
                              >
                                Remplaçant
                              </motion.button>
                            </div>
                          )}
                        </motion.div>
                      )
                    })}
                  </div>

                  {/* Joueurs indisponibles */}
                  {players.filter(p => p.status === 'injured' || p.status === 'suspended').length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-bold text-gray-700 mb-2">Indisponibles</h4>
                      <div className="space-y-2">
                        {players.filter(p => p.status === 'injured' || p.status === 'suspended').map(player => (
                          <div key={player.id} className="p-2 bg-red-50 rounded-lg border border-red-200">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold text-xs">
                                {player.jerseyNumber}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-gray-900 truncate">
                                  {player.firstName} {player.lastName}
                                </p>
                                <p className="text-xs text-red-600">
                                  {player.status === 'injured' ? '🟠 Blessé' : '🔴 Suspendu'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function PlayerCard({ player, color }: { player: Player; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <div 
        className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg border-4 border-white shadow-lg"
        style={{ backgroundColor: color }}
      >
        {player.jerseyNumber}
      </div>
      <div className="mt-2 px-3 py-1 bg-white rounded-lg shadow-md">
        <p className="text-xs font-bold text-gray-900 whitespace-nowrap">
          {player.lastName.toUpperCase()}
        </p>
      </div>
    </div>
  )
}

function EmptySlot({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="w-14 h-14 rounded-full border-4 border-dashed border-white/50 flex items-center justify-center text-white/50 font-bold text-lg">
        ?
      </div>
      <div className="mt-2 px-3 py-1 bg-white/50 rounded-lg">
        <p className="text-xs font-bold text-white whitespace-nowrap">
          {label}
        </p>
      </div>
    </div>
  )
}
