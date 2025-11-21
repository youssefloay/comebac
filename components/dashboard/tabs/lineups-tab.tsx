"use client"

import { useState, useEffect } from 'react'
import { collection, getDocs, query, where, addDoc, updateDoc, doc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Users, Download, Sparkles, Camera, Calendar, CheckCircle, XCircle, Edit2, Save, X, AlertCircle, Search, Crown } from 'lucide-react'
import type { Team, Player, Match } from '@/lib/types'

interface Lineup {
  id?: string
  matchId: string
  teamId: string
  starters: string[] // IDs des joueurs
  substitutes: string[] // IDs des joueurs
  formation: string
  validated: boolean
  validatedAt?: Date
  createdAt?: Date
  updatedAt?: Date
}

interface MatchWithLineups extends Match {
  homeLineup?: Lineup
  awayLineup?: Lineup
  homeTeamName?: string
  awayTeamName?: string
}

export default function LineupsTab() {
  const [matches, setMatches] = useState<MatchWithLineups[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [selectedMatch, setSelectedMatch] = useState<MatchWithLineups | null>(null)
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [editedStarters, setEditedStarters] = useState<string[]>([])
  const [editedSubstitutes, setEditedSubstitutes] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<'all' | 'with-lineups' | 'without-lineups'>('all')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (selectedMatch && selectedTeamId) {
      loadLineupForTeam(selectedMatch.id, selectedTeamId)
    }
  }, [selectedMatch, selectedTeamId])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Charger les équipes
      const teamsSnap = await getDocs(collection(db, 'teams'))
      const teamsData = teamsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Team[]
      setTeams(teamsData)

      // Charger les joueurs
      const playersSnap = await getDocs(collection(db, 'players'))
      const playersData = playersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Player[]
      setPlayers(playersData)

      // Charger les matchs
      const matchesSnap = await getDocs(collection(db, 'matches'))
      const matchesData = matchesSnap.docs.map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          ...data,
          date: data.date?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        }
      }) as Match[]

      // Charger les compositions
      const lineupsSnap = await getDocs(collection(db, 'lineups'))
      const lineupsData = lineupsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        validatedAt: doc.data().validatedAt?.toDate(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate()
      })) as Lineup[]

      // Combiner matchs et compositions
      const matchesWithLineups: MatchWithLineups[] = matchesData.map(match => {
        const homeLineup = lineupsData.find(l => l.matchId === match.id && l.teamId === match.homeTeamId)
        const awayLineup = lineupsData.find(l => l.matchId === match.id && l.teamId === match.awayTeamId)
        const homeTeam = teamsData.find(t => t.id === match.homeTeamId)
        const awayTeam = teamsData.find(t => t.id === match.awayTeamId)

        return {
          ...match,
          homeLineup,
          awayLineup,
          homeTeamName: homeTeam?.name || 'Équipe inconnue',
          awayTeamName: awayTeam?.name || 'Équipe inconnue'
        }
      })

      // Trier par date (plus récents en premier)
      matchesWithLineups.sort((a, b) => b.date.getTime() - a.date.getTime())
      setMatches(matchesWithLineups)
    } catch (error) {
      console.error('Erreur lors du chargement:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLineupForTeam = async (matchId: string, teamId: string) => {
    try {
      const lineupsQuery = query(
        collection(db, 'lineups'),
        where('matchId', '==', matchId),
        where('teamId', '==', teamId)
      )
      const lineupsSnap = await getDocs(lineupsQuery)
      
      if (!lineupsSnap.empty) {
        const lineup = {
          id: lineupsSnap.docs[0].id,
          ...lineupsSnap.docs[0].data(),
          validatedAt: lineupsSnap.docs[0].data().validatedAt?.toDate(),
          createdAt: lineupsSnap.docs[0].data().createdAt?.toDate() || new Date(),
          updatedAt: lineupsSnap.docs[0].data().updatedAt?.toDate()
        } as Lineup
        
        setEditedStarters(lineup.starters || [])
        setEditedSubstitutes(lineup.substitutes || [])
      } else {
        // Charger tous les joueurs de l'équipe par défaut
        const teamPlayers = players.filter(p => p.teamId === teamId)
        setEditedStarters(teamPlayers.slice(0, 7).map(p => p.id))
        setEditedSubstitutes(teamPlayers.slice(7, 10).map(p => p.id))
      }
    } catch (error) {
      console.error('Erreur lors du chargement de la composition:', error)
    }
  }

  const handleSelectMatch = (match: MatchWithLineups) => {
    setSelectedMatch(match)
    setSelectedTeamId(null)
    setEditMode(false)
    setEditedStarters([])
    setEditedSubstitutes([])
  }

  const handleSelectTeam = (teamId: string) => {
    setSelectedTeamId(teamId)
    setEditMode(false)
  }

  const startEdit = () => {
    setEditMode(true)
  }

  const handleSaveLineup = async () => {
    if (!selectedMatch || !selectedTeamId) return

    setSaving(true)
    try {
      const lineupData = {
        matchId: selectedMatch.id,
        teamId: selectedTeamId,
        starters: editedStarters,
        substitutes: editedSubstitutes,
        formation: '2-2-1',
        validated: true,
        validatedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }

      // Vérifier si une composition existe déjà
      const lineupsQuery = query(
        collection(db, 'lineups'),
        where('matchId', '==', selectedMatch.id),
        where('teamId', '==', selectedTeamId)
      )
      const lineupsSnap = await getDocs(lineupsQuery)

      if (!lineupsSnap.empty) {
        // Mettre à jour
        await updateDoc(doc(db, 'lineups', lineupsSnap.docs[0].id), lineupData)
      } else {
        // Créer
        await addDoc(collection(db, 'lineups'), {
          ...lineupData,
          createdAt: serverTimestamp()
        })
      }

      setEditMode(false)
      await loadData() // Recharger les données
      
      // Recharger la composition pour l'équipe sélectionnée
      if (selectedMatch && selectedTeamId) {
        await loadLineupForTeam(selectedMatch.id, selectedTeamId)
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      alert('Erreur lors de la sauvegarde de la composition')
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = () => {
    setEditMode(false)
    if (selectedMatch && selectedTeamId) {
      loadLineupForTeam(selectedMatch.id, selectedTeamId)
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null || !editMode) return
    
    const allPlayers = [...editedStarters, ...editedSubstitutes]
    const newPlayers = [...allPlayers]
    const [draggedPlayer] = newPlayers.splice(draggedIndex, 1)
    newPlayers.splice(targetIndex, 0, draggedPlayer)
    
    setEditedStarters(newPlayers.slice(0, 7))
    setEditedSubstitutes(newPlayers.slice(7, 10))
    setDraggedIndex(null)
  }

  const togglePlayer = (playerId: string) => {
    if (!editMode) return

    const isStarter = editedStarters.includes(playerId)
    const isSubstitute = editedSubstitutes.includes(playerId)

    if (isStarter) {
      setEditedStarters(editedStarters.filter(id => id !== playerId))
    } else if (isSubstitute) {
      setEditedSubstitutes(editedSubstitutes.filter(id => id !== playerId))
    } else {
      if (editedStarters.length < 7) {
        setEditedStarters([...editedStarters, playerId])
      } else if (editedSubstitutes.length < 3) {
        setEditedSubstitutes([...editedSubstitutes, playerId])
      }
    }
  }

  const getPlayerById = (id: string) => players.find(p => p.id === id)
  const getTeamById = (id: string) => teams.find(t => t.id === id)

  const getPlayersByPosition = (playerIds: string[]) => {
    const playersList = playerIds.map(id => getPlayerById(id)).filter(Boolean) as Player[]
    return {
      goalkeeper: playersList.find(p => p.position?.toLowerCase().includes('gardien')),
      defenders: playersList.filter(p => p.position?.toLowerCase().includes('défenseur')),
      midfielders: playersList.filter(p => p.position?.toLowerCase().includes('milieu')),
      forwards: playersList.filter(p => p.position?.toLowerCase().includes('attaquant'))
    }
  }

  const filteredMatches = matches.filter(match => {
    const matchesSearch = searchTerm === "" || 
      match.homeTeamName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.awayTeamName?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterStatus === 'all' ||
      (filterStatus === 'with-lineups' && (match.homeLineup || match.awayLineup)) ||
      (filterStatus === 'without-lineups' && !match.homeLineup && !match.awayLineup)
    
    return matchesSearch && matchesFilter
  })

  const displayStarters = editMode ? editedStarters : (selectedMatch && selectedTeamId === selectedMatch.homeTeamId ? selectedMatch.homeLineup?.starters || [] : selectedMatch?.awayLineup?.starters || [])
  const displaySubstitutes = editMode ? editedSubstitutes : (selectedMatch && selectedTeamId === selectedMatch.homeTeamId ? selectedMatch.homeLineup?.substitutes || [] : selectedMatch?.awayLineup?.substitutes || [])
  const lineup = getPlayersByPosition(displayStarters)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header avec effet glassmorphism */}
      <div className="relative mb-8 p-8 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 opacity-90"></div>
        <div className="absolute inset-0 backdrop-blur-3xl bg-white/10"></div>
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30 shadow-2xl">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-4xl font-black text-white drop-shadow-lg">
                  Compositions d'Équipe
                </h2>
                <p className="text-white/80 font-medium">Gérez les compositions pour chaque match 🔥</p>
              </div>
            </div>
          </div>

          {/* Filtres et recherche */}
          <div className="bg-white/20 backdrop-blur-xl rounded-2xl p-4 border border-white/30">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/80 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher un match..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white/20 backdrop-blur-xl text-white placeholder-white/60 rounded-xl border border-white/30 focus:ring-2 focus:ring-white/50 outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 rounded-xl font-medium transition ${
                    filterStatus === 'all' 
                      ? 'bg-white/30 text-white border-2 border-white/50' 
                      : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setFilterStatus('with-lineups')}
                  className={`px-4 py-2 rounded-xl font-medium transition ${
                    filterStatus === 'with-lineups' 
                      ? 'bg-white/30 text-white border-2 border-white/50' 
                      : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
                  }`}
                >
                  Avec compositions
                </button>
                <button
                  onClick={() => setFilterStatus('without-lineups')}
                  className={`px-4 py-2 rounded-xl font-medium transition ${
                    filterStatus === 'without-lineups' 
                      ? 'bg-white/30 text-white border-2 border-white/50' 
                      : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/20'
                  }`}
                >
                  Sans compositions
                </button>
              </div>
            </div>
          </div>

          {/* Sélecteur de match */}
          <div className="mt-4">
            <select
              value={selectedMatch?.id || ''}
              onChange={(e) => {
                const match = matches.find(m => m.id === e.target.value)
                if (match) handleSelectMatch(match)
              }}
              className="w-full px-6 py-4 bg-white/20 backdrop-blur-xl text-white rounded-2xl border border-white/30 shadow-2xl font-bold text-lg outline-none focus:ring-4 focus:ring-white/50 transition"
            >
              <option value="" className="bg-gray-900 text-white">Sélectionner un match</option>
              {filteredMatches.map(match => (
                <option key={match.id} value={match.id} className="bg-gray-900 text-white">
                  {match.homeTeamName} vs {match.awayTeamName} - {match.date.toLocaleDateString('fr-FR')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedMatch && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Sélection d'équipe */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Sélectionner une équipe</h3>
              <div className="space-y-3">
                <button
                  onClick={() => handleSelectTeam(selectedMatch.homeTeamId)}
                  className={`w-full p-4 rounded-lg border-2 transition text-left ${
                    selectedTeamId === selectedMatch.homeTeamId
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{selectedMatch.homeTeamName}</div>
                  {selectedMatch.homeLineup ? (
                    <div className="text-sm text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Composition validée
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 mt-1">Aucune composition</div>
                  )}
                </button>

                <button
                  onClick={() => handleSelectTeam(selectedMatch.awayTeamId)}
                  className={`w-full p-4 rounded-lg border-2 transition text-left ${
                    selectedTeamId === selectedMatch.awayTeamId
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{selectedMatch.awayTeamName}</div>
                  {selectedMatch.awayLineup ? (
                    <div className="text-sm text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" />
                      Composition validée
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 mt-1">Aucune composition</div>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Composition principale */}
          <div className="lg:col-span-2">
            {selectedTeamId ? (
              <div className="relative max-w-2xl mx-auto">
                <div className="relative p-6 rounded-3xl overflow-hidden shadow-2xl">
                  <div 
                    className="absolute inset-0"
                    style={{
                      background: `linear-gradient(135deg, ${getTeamById(selectedTeamId)?.color || '#10b981'}22 0%, ${getTeamById(selectedTeamId)?.color || '#10b981'}44 100%)`
                    }}
                  ></div>
                  
                  <div className="relative">
                    {/* Header de la carte */}
                    <div className="relative mb-4 p-4 rounded-2xl overflow-hidden">
                      <div 
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(135deg, ${getTeamById(selectedTeamId)?.color || '#10b981'} 0%, ${getTeamById(selectedTeamId)?.color || '#10b981'}dd 100%)`
                        }}
                      ></div>
                      <div className="absolute inset-0 backdrop-blur-sm bg-black/20"></div>
                      
                      <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getTeamById(selectedTeamId)?.logo ? (
                            <img 
                              src={getTeamById(selectedTeamId)?.logo} 
                              alt={getTeamById(selectedTeamId)?.name}
                              className="w-12 h-12 rounded-xl object-cover shadow-2xl border-2 border-white/50"
                            />
                          ) : (
                            <div 
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-2xl border-2 border-white/50"
                              style={{ backgroundColor: getTeamById(selectedTeamId)?.color || '#10b981' }}
                            >
                              ⚽
                            </div>
                          )}
                          <div>
                            <h3 className="text-2xl font-black text-white drop-shadow-lg">
                              {getTeamById(selectedTeamId)?.name}
                            </h3>
                            <p className="text-sm text-white/90 font-bold">Composition Officielle</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {editMode ? (
                            <>
                              <button
                                onClick={handleSaveLineup}
                                disabled={saving}
                                className="px-4 py-2 bg-green-500/90 backdrop-blur-xl text-white rounded-xl hover:bg-green-600 transition border border-white/30 shadow-xl flex items-center gap-2 font-bold disabled:opacity-50"
                              >
                                <Save className="w-4 h-4" />
                                {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="px-4 py-2 bg-red-500/90 backdrop-blur-xl text-white rounded-xl hover:bg-red-600 transition border border-white/30 shadow-xl flex items-center gap-2 font-bold"
                              >
                                <X className="w-4 h-4" />
                                Annuler
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={startEdit}
                              className="px-4 py-2 bg-blue-500/90 backdrop-blur-xl text-white rounded-xl hover:bg-blue-600 transition border border-white/30 shadow-xl flex items-center gap-2 font-bold"
                            >
                              <Edit2 className="w-4 h-4" />
                              Modifier
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Terrain ultra stylé */}
                    {displayStarters.length > 0 ? (
                      <FootballField
                        lineup={lineup}
                        starters={displayStarters}
                        substitutes={displaySubstitutes}
                        players={players}
                        teamColor={getTeamById(selectedTeamId)?.color || '#10b981'}
                        editMode={editMode}
                        onTogglePlayer={togglePlayer}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                      />
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>Aucune composition pour cette équipe</p>
                        <button
                          onClick={startEdit}
                          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          Créer une composition
                        </button>
                      </div>
                    )}

                    {/* Liste des joueurs disponibles (mode édition) */}
                    {editMode && (
                      <div className="mt-4 p-4 rounded-xl bg-white/10 backdrop-blur-xl border border-white/30">
                        <h4 className="text-sm font-black text-white mb-3">
                          💡 Glissez-déposez les joueurs pour réorganiser
                        </h4>
                        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                          {players
                            .filter(p => p.teamId === selectedTeamId)
                            .map((player, idx) => {
                              const allPlayers = [...editedStarters, ...editedSubstitutes]
                              const playerIndex = allPlayers.findIndex(id => id === player.id)
                              const isInLineup = playerIndex !== -1
                              return (
                                <div
                                  key={player.id}
                                  draggable={isInLineup}
                                  onDragStart={() => isInLineup && handleDragStart(playerIndex)}
                                  onDragOver={handleDragOver}
                                  onDrop={() => isInLineup && handleDrop(playerIndex)}
                                  onClick={() => !isInLineup && togglePlayer(player.id)}
                                  className={`p-2 rounded-lg border-2 transition ${
                                    isInLineup
                                      ? 'bg-white/20 border-white/40 cursor-move'
                                      : 'bg-white/10 border-white/20 hover:bg-white/20 cursor-pointer'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                                      style={{ backgroundColor: getTeamById(selectedTeamId)?.color || '#10b981' }}
                                    >
                                      {player.number}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-bold text-white truncate">{player.name}</p>
                                      <p className="text-xs text-white/70 truncate">{player.position}</p>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Sélectionnez une équipe pour voir la composition</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!selectedMatch && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Sélectionnez un match pour voir les compositions</p>
        </div>
      )}
    </div>
  )
}

function FootballField({ 
  lineup, 
  starters, 
  substitutes, 
  players, 
  teamColor, 
  editMode,
  onTogglePlayer,
  onDragStart,
  onDragOver,
  onDrop
}: { 
  lineup: any
  starters: string[]
  substitutes: string[]
  players: Player[]
  teamColor: string
  editMode: boolean
  onTogglePlayer: (playerId: string) => void
  onDragStart: (index: number) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (index: number) => void
}) {
  const getPlayerById = (id: string) => players.find(p => p.id === id)
  const startersList = starters.map(id => getPlayerById(id)).filter(Boolean) as Player[]
  const substitutesList = substitutes.map(id => getPlayerById(id)).filter(Boolean) as Player[]

  return (
    <div 
      className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl"
      style={{
        background: `
          radial-gradient(ellipse at 50% 50%, rgba(255,255,255,0.08) 0%, transparent 60%),
          linear-gradient(180deg, 
            #0a2e0a 0%,
            #1a4d1a 10%,
            #2d6b2d 25%,
            #3d8b3d 40%,
            #4da84d 50%,
            #3d8b3d 60%,
            #2d6b2d 75%,
            #1a4d1a 90%,
            #0a2e0a 100%
          )
        `,
        boxShadow: `
          inset 0 0 100px rgba(0,0,0,0.4),
          inset 0 0 50px rgba(255,255,255,0.05),
          0 20px 60px rgba(0,0,0,0.5)
        `
      }}
    >
      {/* Effet de lumière de stade */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 40% at 50% 0%, rgba(255,255,255,0.15) 0%, transparent 50%),
            radial-gradient(ellipse 80% 40% at 50% 100%, rgba(255,255,255,0.15) 0%, transparent 50%)
          `
        }}
      ></div>

      {/* Bandes de pelouse */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: `
            repeating-linear-gradient(
              180deg,
              transparent,
              transparent 35px,
              rgba(0,0,0,0.12) 35px,
              rgba(0,0,0,0.12) 70px
            )
          `
        }}
      ></div>

      {/* Texture herbe */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(0,0,0,0.03) 1px, rgba(0,0,0,0.03) 2px),
            repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(0,0,0,0.03) 1px, rgba(0,0,0,0.03) 2px)
          `
        }}
      ></div>

      {/* Ligne centrale avec effet néon */}
      <div 
        className="absolute top-1/2 left-0 right-0 h-1 transform -translate-y-1/2"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.95) 3%, rgba(255,255,255,0.95) 97%, transparent 100%)',
          boxShadow: '0 0 20px rgba(255,255,255,0.6), 0 0 40px rgba(255,255,255,0.3)'
        }}
      ></div>
      
      {/* Cercle central */}
      <div 
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full"
        style={{
          border: '4px solid rgba(255,255,255,0.95)',
          boxShadow: `
            0 0 20px rgba(255,255,255,0.6),
            0 0 40px rgba(255,255,255,0.3),
            inset 0 0 30px rgba(255,255,255,0.1)
          `
        }}
      >
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-2xl"></div>
      </div>
      
      {/* Surfaces de réparation */}
      <div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-24"
        style={{
          border: '4px solid rgba(255,255,255,0.95)',
          borderTop: 'none',
          boxShadow: '0 0 20px rgba(255,255,255,0.4)'
        }}
      >
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-2xl"></div>
        <div 
          className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-16 h-10"
          style={{
            border: '3px solid rgba(255,255,255,0.8)',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px'
          }}
        ></div>
      </div>
      
      <div 
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-40 h-24"
        style={{
          border: '4px solid rgba(255,255,255,0.95)',
          borderBottom: 'none',
          boxShadow: '0 0 20px rgba(255,255,255,0.4)'
        }}
      >
        <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-2xl"></div>
        <div 
          className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-10"
          style={{
            border: '3px solid rgba(255,255,255,0.8)',
            borderBottom: 'none',
            borderRadius: '8px 8px 0 0'
          }}
        ></div>
      </div>

      {/* Buts */}
      <div 
        className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-2 rounded-b-lg"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 100%)',
          boxShadow: '0 4px 15px rgba(255,255,255,0.5)'
        }}
      ></div>
      <div 
        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-2 rounded-t-lg"
        style={{
          background: 'linear-gradient(0deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 100%)',
          boxShadow: '0 -4px 15px rgba(255,255,255,0.5)'
        }}
      ></div>

      {/* Joueurs */}
      {lineup.goalkeeper && (
        <div 
          className="absolute bottom-[5%] left-1/2 transform -translate-x-1/2"
          draggable={editMode}
          onDragStart={() => {
            const index = starters.findIndex(id => id === lineup.goalkeeper?.id)
            if (index !== -1) onDragStart(index)
          }}
          onDragOver={onDragOver}
          onDrop={() => {
            const index = starters.findIndex(id => id === lineup.goalkeeper?.id)
            if (index !== -1) onDrop(index)
          }}
        >
          <InstagramPlayerCard 
            player={lineup.goalkeeper} 
            color={teamColor} 
            editMode={editMode}
            onClick={() => editMode && onTogglePlayer(lineup.goalkeeper.id)}
          />
        </div>
      )}

      <div className="absolute bottom-[22%] left-0 right-0 flex justify-center gap-6">
        {lineup.defenders.slice(0, 2).map((player: Player) => {
          const index = starters.findIndex(id => id === player.id)
          return (
            <div
              key={player.id}
              draggable={editMode && index !== -1}
              onDragStart={() => index !== -1 && onDragStart(index)}
              onDragOver={onDragOver}
              onDrop={() => index !== -1 && onDrop(index)}
            >
              <InstagramPlayerCard 
                player={player} 
                color={teamColor} 
                editMode={editMode}
                onClick={() => editMode && onTogglePlayer(player.id)}
              />
            </div>
          )
        })}
      </div>

      <div className="absolute bottom-[48%] left-0 right-0 flex justify-center gap-6">
        {lineup.midfielders.slice(0, 2).map((player: Player) => {
          const index = starters.findIndex(id => id === player.id)
          return (
            <div
              key={player.id}
              draggable={editMode && index !== -1}
              onDragStart={() => index !== -1 && onDragStart(index)}
              onDragOver={onDragOver}
              onDrop={() => index !== -1 && onDrop(index)}
            >
              <InstagramPlayerCard 
                player={player} 
                color={teamColor} 
                editMode={editMode}
                onClick={() => editMode && onTogglePlayer(player.id)}
              />
            </div>
          )
        })}
      </div>

      <div className="absolute bottom-[74%] left-0 right-0 flex justify-center gap-6">
        {lineup.forwards.slice(0, 1).map((player: Player) => {
          const index = starters.findIndex(id => id === player.id)
          return (
            <div
              key={player.id}
              draggable={editMode && index !== -1}
              onDragStart={() => index !== -1 && onDragStart(index)}
              onDragOver={onDragOver}
              onDrop={() => index !== -1 && onDrop(index)}
            >
              <InstagramPlayerCard 
                player={player} 
                color={teamColor} 
                editMode={editMode}
                onClick={() => editMode && onTogglePlayer(player.id)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function InstagramPlayerCard({ 
  player, 
  color, 
  editMode,
  onClick
}: { 
  player: Player
  color: string
  editMode?: boolean
  onClick?: () => void
}) {
  return (
    <div 
      className={`flex flex-col items-center group ${editMode ? 'cursor-move' : 'cursor-pointer'}`}
      onClick={onClick}
    >
      <div className="relative">
        <div 
          className="absolute inset-0 rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity"
          style={{ 
            background: `linear-gradient(135deg, ${color} 0%, ${color}88 100%)`
          }}
        ></div>
        
        <div 
          className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl border-4 border-white transform group-hover:scale-110 transition-transform duration-300"
          style={{ 
            background: `linear-gradient(135deg, ${color} 0%, ${color}dd 50%, ${color} 100%)`,
            boxShadow: `
              0 8px 32px rgba(0,0,0,0.4),
              inset 0 2px 8px rgba(255,255,255,0.3),
              inset 0 -2px 8px rgba(0,0,0,0.3)
            `
          }}
        >
          {player.number}
          
          <div 
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 50%, rgba(255,255,255,0.2) 100%)'
            }}
          ></div>

          {(player as any).isCaptain && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-xs font-black text-white shadow-lg border-2 border-white">
              <Crown className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>
      
      <div 
        className="mt-3 px-4 py-2 rounded-xl backdrop-blur-xl border border-white/40 shadow-2xl transform group-hover:scale-105 transition-transform"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.85) 100%)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3), inset 0 1px 3px rgba(255,255,255,0.8)'
        }}
      >
        <p className="text-xs font-black text-gray-900 whitespace-nowrap max-w-[100px] truncate">
          {player.name.split(' ').pop()?.toUpperCase()}
        </p>
      </div>
    </div>
  )
}
