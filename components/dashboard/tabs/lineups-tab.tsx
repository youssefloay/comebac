"use client"

import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Users, Download, Sparkles, Camera } from 'lucide-react'
import type { Team, Player } from '@/lib/types'

interface TeamWithPlayers extends Team {
  players: Player[]
}

export default function LineupsTab() {
  const [teams, setTeams] = useState<TeamWithPlayers[]>([])
  const [selectedTeam, setSelectedTeam] = useState<TeamWithPlayers | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [editedPlayers, setEditedPlayers] = useState<Player[]>([])
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  useEffect(() => {
    loadTeamsWithPlayers()
  }, [])

  const loadTeamsWithPlayers = async () => {
    try {
      const teamsSnap = await getDocs(collection(db, 'teams'))
      const teamsData = teamsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Team[]

      const playersSnap = await getDocs(collection(db, 'players'))
      const playersData = playersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date()
      })) as Player[]

      const teamsWithPlayers = teamsData.map(team => ({
        ...team,
        players: playersData
          .filter(p => p.teamId === team.id && !(p as any).isCoach)
          .sort((a, b) => (a.number || 0) - (b.number || 0))
      }))

      setTeams(teamsWithPlayers)
      if (teamsWithPlayers.length > 0) {
        setSelectedTeam(teamsWithPlayers[0])
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPlayersByPosition = (players: Player[]) => {
    const starters = players.slice(0, 7)
    const substitutes = players.slice(7, 10)

    return {
      goalkeeper: starters.find(p => p.position?.toLowerCase().includes('gardien')),
      defenders: starters.filter(p => p.position?.toLowerCase().includes('défenseur')),
      midfielders: starters.filter(p => p.position?.toLowerCase().includes('milieu')),
      forwards: starters.filter(p => p.position?.toLowerCase().includes('attaquant')),
      substitutes
    }
  }

  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (targetIndex: number) => {
    if (draggedIndex === null) return
    
    const newPlayers = [...editedPlayers]
    const [draggedPlayer] = newPlayers.splice(draggedIndex, 1)
    newPlayers.splice(targetIndex, 0, draggedPlayer)
    
    setEditedPlayers(newPlayers)
    setDraggedIndex(null)
  }

  const startEdit = () => {
    if (selectedTeam) {
      setEditedPlayers([...selectedTeam.players])
      setEditMode(true)
    }
  }

  const cancelEdit = () => {
    setEditMode(false)
    setEditedPlayers([])
  }

  const saveLineup = () => {
    if (selectedTeam) {
      setSelectedTeam({
        ...selectedTeam,
        players: editedPlayers
      })
      setEditMode(false)
      // Ici vous pourriez sauvegarder dans la DB si nécessaire
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (teams.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Aucune équipe disponible</p>
      </div>
    )
  }

  const displayPlayers = editMode ? editedPlayers : (selectedTeam?.players || [])
  const lineup = getPlayersByPosition(displayPlayers)

  return (
    <div className="min-h-screen">
      {/* Header avec effet glassmorphism */}
      <div className="relative mb-8 p-8 rounded-3xl overflow-hidden">
        {/* Background animé */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 opacity-90"></div>
        <div className="absolute inset-0 backdrop-blur-3xl bg-white/10"></div>
        
        {/* Contenu */}
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
                <p className="text-white/80 font-medium">Créez des visuels de ouf 🔥</p>
              </div>
            </div>
            <div className="flex gap-3">
              {editMode ? (
                <>
                  <button
                    onClick={saveLineup}
                    className="px-6 py-3 bg-green-500/90 backdrop-blur-xl text-white rounded-2xl hover:bg-green-600 transition border border-white/30 shadow-2xl flex items-center gap-2 font-bold"
                  >
                    <Camera className="w-5 h-5" />
                    Sauvegarder
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="px-6 py-3 bg-red-500/90 backdrop-blur-xl text-white rounded-2xl hover:bg-red-600 transition border border-white/30 shadow-2xl flex items-center gap-2 font-bold"
                  >
                    Annuler
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={startEdit}
                    className="px-6 py-3 bg-blue-500/90 backdrop-blur-xl text-white rounded-2xl hover:bg-blue-600 transition border border-white/30 shadow-2xl flex items-center gap-2 font-bold"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-6 py-3 bg-white/20 backdrop-blur-xl text-white rounded-2xl hover:bg-white/30 transition border border-white/30 shadow-2xl flex items-center gap-2 font-bold"
                  >
                    <Camera className="w-5 h-5" />
                    Capturer
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Sélecteur d'équipe stylé */}
          <select
            value={selectedTeam?.id || ''}
            onChange={(e) => setSelectedTeam(teams.find(t => t.id === e.target.value) || null)}
            className="w-full px-6 py-4 bg-white/20 backdrop-blur-xl text-white rounded-2xl border border-white/30 shadow-2xl font-bold text-lg outline-none focus:ring-4 focus:ring-white/50 transition"
          >
            {teams.map(team => (
              <option key={team.id} value={team.id} className="bg-gray-900 text-white">
                {team.name} ({team.players.length} joueurs)
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedTeam && lineup && (
        <div className="relative max-w-2xl mx-auto">
          {/* Carte principale avec effet 3D */}
          <div className="relative p-6 rounded-3xl overflow-hidden shadow-2xl">
            {/* Background dégradé dynamique */}
            <div 
              className="absolute inset-0"
              style={{
                background: `linear-gradient(135deg, ${selectedTeam.color}22 0%, ${selectedTeam.color}44 100%)`
              }}
            ></div>
            
            {/* Terrain de football ultra stylé */}
            <div className="relative">
              {/* Header de la carte */}
              <div className="relative mb-4 p-4 rounded-2xl overflow-hidden">
                <div 
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(135deg, ${selectedTeam.color} 0%, ${selectedTeam.color}dd 100%)`
                  }}
                ></div>
                <div className="absolute inset-0 backdrop-blur-sm bg-black/20"></div>
                
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {selectedTeam.logo ? (
                      <img 
                        src={selectedTeam.logo} 
                        alt={selectedTeam.name}
                        className="w-12 h-12 rounded-xl object-cover shadow-2xl border-2 border-white/50"
                      />
                    ) : (
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-2xl border-2 border-white/50"
                        style={{ backgroundColor: selectedTeam.color }}
                      >
                        ⚽
                      </div>
                    )}
                    <div>
                      <h3 className="text-2xl font-black text-white drop-shadow-lg">
                        {selectedTeam.name}
                      </h3>
                      <p className="text-sm text-white/90 font-bold">Composition Officielle</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-white drop-shadow-lg">
                      {selectedTeam.players.length}
                    </div>
                    <div className="text-xs text-white/90 font-bold">Joueurs</div>
                  </div>
                </div>
              </div>

              {/* Terrain */}
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

                {/* Bandes de pelouse ultra réalistes */}
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

                {/* Lignes du terrain avec effet néon */}
                <div 
                  className="absolute top-1/2 left-0 right-0 h-1 transform -translate-y-1/2"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.95) 3%, rgba(255,255,255,0.95) 97%, transparent 100%)',
                    boxShadow: '0 0 20px rgba(255,255,255,0.6), 0 0 40px rgba(255,255,255,0.3)'
                  }}
                ></div>
                
                {/* Cercle central avec effet glow */}
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
                
                {/* Surfaces de réparation stylées */}
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

                {/* Buts avec effet 3D */}
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

                {/* Joueurs avec cartes ultra stylées */}
                {lineup.goalkeeper && (
                  <div 
                    className="absolute bottom-[5%] left-1/2 transform -translate-x-1/2"
                    draggable={editMode}
                    onDragStart={() => handleDragStart(displayPlayers.findIndex(p => p.id === lineup.goalkeeper?.id))}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(displayPlayers.findIndex(p => p.id === lineup.goalkeeper?.id))}
                  >
                    <InstagramPlayerCard player={lineup.goalkeeper} color={selectedTeam.color} editMode={editMode} />
                  </div>
                )}

                <div className="absolute bottom-[22%] left-0 right-0 flex justify-center gap-6">
                  {lineup.defenders.map((player) => (
                    <div
                      key={player.id}
                      draggable={editMode}
                      onDragStart={() => handleDragStart(displayPlayers.findIndex(p => p.id === player.id))}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(displayPlayers.findIndex(p => p.id === player.id))}
                    >
                      <InstagramPlayerCard player={player} color={selectedTeam.color} editMode={editMode} />
                    </div>
                  ))}
                </div>

                <div className="absolute bottom-[48%] left-0 right-0 flex justify-center gap-6">
                  {lineup.midfielders.map((player) => (
                    <div
                      key={player.id}
                      draggable={editMode}
                      onDragStart={() => handleDragStart(displayPlayers.findIndex(p => p.id === player.id))}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(displayPlayers.findIndex(p => p.id === player.id))}
                    >
                      <InstagramPlayerCard player={player} color={selectedTeam.color} editMode={editMode} />
                    </div>
                  ))}
                </div>

                <div className="absolute bottom-[74%] left-0 right-0 flex justify-center gap-6">
                  {lineup.forwards.map((player) => (
                    <div
                      key={player.id}
                      draggable={editMode}
                      onDragStart={() => handleDragStart(displayPlayers.findIndex(p => p.id === player.id))}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(displayPlayers.findIndex(p => p.id === player.id))}
                    >
                      <InstagramPlayerCard player={player} color={selectedTeam.color} editMode={editMode} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Remplaçants avec style Instagram */}
              {lineup.substitutes && lineup.substitutes.length > 0 && (
                <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-gray-900 to-gray-800 shadow-xl">
                  <h4 className="text-sm font-black text-white mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                    Remplaçants
                  </h4>
                  <div className="grid grid-cols-3 gap-2">
                    {lineup.substitutes.map((player, idx) => (
                      <div 
                        key={player.id}
                        draggable={editMode}
                        onDragStart={() => handleDragStart(7 + idx)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(7 + idx)}
                        className={`p-2 rounded-lg bg-white/10 backdrop-blur-xl border border-white/20 hover:bg-white/20 transition ${editMode ? 'cursor-move' : ''}`}
                      >
                        <div className="flex flex-col items-center gap-1.5">
                          <div 
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-sm shadow-lg"
                            style={{ 
                              background: `linear-gradient(135deg, ${selectedTeam.color} 0%, ${selectedTeam.color}dd 100%)`
                            }}
                          >
                            {player.number}
                          </div>
                          <div className="text-center w-full">
                            <p className="text-xs font-bold text-white truncate">{player.name}</p>
                            <p className="text-xs text-white/70 truncate">{player.position}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mode édition: Liste complète des joueurs */}
              {editMode && (
                <div className="mt-4 p-4 rounded-xl bg-white/10 backdrop-blur-xl border border-white/30">
                  <h4 className="text-sm font-black text-white mb-3">
                    💡 Glissez-déposez les joueurs pour réorganiser
                  </h4>
                  <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                    {editedPlayers.map((player, idx) => (
                      <div
                        key={player.id}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(idx)}
                        className="p-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 transition cursor-move"
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                            style={{ backgroundColor: selectedTeam?.color }}
                          >
                            {player.number}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-white truncate">{player.name}</p>
                            <p className="text-xs text-white/70 truncate">{player.position}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InstagramPlayerCard({ player, color, editMode }: { player: Player; color: string; editMode?: boolean }) {
  return (
    <div className={`flex flex-col items-center group ${editMode ? 'cursor-move' : 'cursor-pointer'}`}>
      {/* Carte joueur avec effet glassmorphism */}
      <div className="relative">
        {/* Glow effect */}
        <div 
          className="absolute inset-0 rounded-2xl blur-xl opacity-60 group-hover:opacity-100 transition-opacity"
          style={{ 
            background: `linear-gradient(135deg, ${color} 0%, ${color}88 100%)`
          }}
        ></div>
        
        {/* Carte principale */}
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
          
          {/* Effet de brillance animé */}
          <div 
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 50%, rgba(255,255,255,0.2) 100%)'
            }}
          ></div>

          {/* Badge capitaine */}
          {(player as any).isCaptain && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-xs font-black text-white shadow-lg border-2 border-white">
              C
            </div>
          )}
        </div>
      </div>
      
      {/* Nom avec effet glassmorphism */}
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
