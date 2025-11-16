"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { 
  Upload, 
  X, 
  Save, 
  Users, 
  Shield, 
  Camera, 
  Edit3,
  Star,
  Zap,
  Target,
  Activity
} from "lucide-react"
import type { Team, Player } from "@/lib/types"
import { updateTeamLogo, updatePlayerProfile } from "@/lib/db"
import { ImageCropper } from "./ImageCropper"

interface MediaManagerProps {
  teams: Team[]
  players: Player[]
  onUpdate: () => void
}

export function MediaManager({ teams, players, onUpdate }: MediaManagerProps) {
  const [activeTab, setActiveTab] = useState<'teams' | 'players'>('teams')
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)
  const [uploading, setUploading] = useState(false)
  const [editingStats, setEditingStats] = useState(false)
  const [cropperImage, setCropperImage] = useState<string | null>(null)
  const [cropperType, setCropperType] = useState<'team' | 'player'>('team')
  const [cropperTarget, setCropperTarget] = useState<Team | Player | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Upload d'image vers Firebase Storage
  const handleImageUpload = async (file: File, type: 'team' | 'player', targetId: string): Promise<string> => {
    const { uploadTeamLogo: uploadTeam, uploadPlayerPhoto: uploadPlayer } = await import('@/lib/upload-image')
    
    if (type === 'team') {
      return await uploadTeam(targetId, file)
    } else {
      return await uploadPlayer(targetId, file)
    }
  }

  const handleFileSelect = (file: File, type: 'team' | 'player', target: Team | Player) => {
    console.log('📸 File selected:', file.name, type)
    const reader = new FileReader()
    reader.onload = () => {
      const imageData = reader.result as string
      console.log('✅ Image loaded, opening cropper...')
      setCropperImage(imageData)
      setCropperType(type)
      setCropperTarget(target)
    }
    reader.onerror = (error) => {
      console.error('❌ Error reading file:', error)
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    setUploading(true)
    setCropperImage(null)
    
    try {
      // Convertir le blob en File
      const file = new File([croppedBlob], 'cropped-image.jpg', { type: 'image/jpeg' })
      
      if (cropperType === 'team' && cropperTarget) {
        const team = cropperTarget as Team
        const imageUrl = await handleImageUpload(file, 'team', team.id)
        await updateTeamLogo(team.id, imageUrl)
      } else if (cropperType === 'player' && cropperTarget) {
        const player = cropperTarget as Player
        const imageUrl = await handleImageUpload(file, 'player', player.id)
        await updatePlayerProfile(player.id, { photo: imageUrl })
      }
      
      onUpdate()
    } catch (error) {
      console.error("Error uploading image:", error)
      alert('Erreur lors de l\'upload de l\'image. Vérifiez la console.')
    } finally {
      setUploading(false)
      setCropperTarget(null)
    }
  }

  const handleTeamLogoUpload = async (team: Team, file: File) => {
    handleFileSelect(file, 'team', team)
  }

  const handlePlayerPhotoUpload = async (player: Player, file: File) => {
    handleFileSelect(file, 'player', player)
  }

  const handlePlayerStatsUpdate = async (player: Player, stats: any) => {
    try {
      await updatePlayerProfile(player.id, { stats })
      setEditingStats(false)
      onUpdate()
    } catch (error) {
      console.error("Error updating player stats:", error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-sofa-text-primary mb-8">Gestionnaire de Médias</h1>

      {/* Navigation */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={() => setActiveTab('teams')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'teams'
              ? 'bg-sofa-text-accent text-white'
              : 'bg-sofa-bg-secondary text-sofa-text-secondary hover:bg-sofa-border'
          }`}
        >
          <Shield className="w-5 h-5 inline mr-2" />
          Logos d'Équipes
        </button>
        <button
          onClick={() => setActiveTab('players')}
          className={`px-6 py-3 rounded-lg font-medium transition-colors ${
            activeTab === 'players'
              ? 'bg-sofa-text-accent text-white'
              : 'bg-sofa-bg-secondary text-sofa-text-secondary hover:bg-sofa-border'
          }`}
        >
          <Users className="w-5 h-5 inline mr-2" />
          Profils Joueurs
        </button>
      </div>

      {/* Gestion des logos d'équipes */}
      {activeTab === 'teams' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-sofa-text-primary">Logos d'Équipes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <motion.div
                key={team.id}
                whileHover={{ scale: 1.02 }}
                className="sofa-card p-6"
              >
                <div className="text-center space-y-4">
                  {/* Logo actuel */}
                  <div className="w-24 h-24 mx-auto bg-sofa-bg-secondary rounded-full flex items-center justify-center overflow-hidden">
                    {team.logo ? (
                      <Image
                        src={team.logo}
                        alt={team.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Shield className="w-12 h-12 text-sofa-text-muted" />
                    )}
                  </div>
                  
                  <h3 className="text-lg font-semibold text-sofa-text-primary">{team.name}</h3>
                  
                  {/* Upload button */}
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleTeamLogoUpload(team, file)
                      }}
                      className="hidden"
                      id={`team-logo-${team.id}`}
                    />
                    <label
                      htmlFor={`team-logo-${team.id}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-sofa-text-accent text-white rounded-lg cursor-pointer hover:bg-sofa-text-accent/90 transition-colors"
                    >
                      {uploading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      {team.logo ? 'Changer Logo' : 'Ajouter Logo'}
                    </label>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Gestion des profils joueurs */}
      {activeTab === 'players' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-sofa-text-primary">Profils Joueurs</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {players.map((player) => {
              const team = teams.find(t => t.id === player.teamId)
              return (
                <motion.div
                  key={player.id}
                  whileHover={{ scale: 1.02 }}
                  className="sofa-card p-6"
                >
                  <div className="space-y-4">
                    {/* Photo et infos de base */}
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-sofa-bg-secondary rounded-full flex items-center justify-center overflow-hidden">
                        {player.photo ? (
                          <Image
                            src={player.photo}
                            alt={player.name}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Users className="w-8 h-8 text-sofa-text-muted" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-sofa-text-primary">{player.name}</h3>
                        <p className="text-sm text-sofa-text-secondary">#{player.number} - {player.position}</p>
                        <p className="text-xs text-sofa-text-muted">{team?.name}</p>
                      </div>
                    </div>

                    {/* Statistiques FIFA */}
                    {player.stats && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-sofa-text-primary">Note Générale</span>
                          <span className="text-lg font-bold text-sofa-text-accent">{player.stats.overall}</span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <div className="font-bold text-sofa-text-primary">{player.stats.pace}</div>
                            <div className="text-sofa-text-muted">VIT</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-sofa-text-primary">{player.stats.shooting}</div>
                            <div className="text-sofa-text-muted">TIR</div>
                          </div>
                          <div className="text-center">
                            <div className="font-bold text-sofa-text-primary">{player.stats.passing}</div>
                            <div className="text-sofa-text-muted">PAS</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handlePlayerPhotoUpload(player, file)
                        }}
                        className="hidden"
                        id={`player-photo-${player.id}`}
                      />
                      <label
                        htmlFor={`player-photo-${player.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-sofa-blue text-white rounded-lg cursor-pointer hover:bg-sofa-blue/90 transition-colors text-sm"
                      >
                        <Camera className="w-4 h-4" />
                        Photo
                      </label>
                      
                      <button
                        onClick={() => {
                          setSelectedPlayer(player)
                          setEditingStats(true)
                        }}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-sofa-green text-white rounded-lg hover:bg-sofa-green/90 transition-colors text-sm"
                      >
                        <Edit3 className="w-4 h-4" />
                        Stats
                      </button>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modal d'édition des statistiques */}
      {editingStats && selectedPlayer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-sofa-bg-card rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-sofa-text-primary">
                Statistiques FIFA - {selectedPlayer.name}
              </h3>
              <button
                onClick={() => setEditingStats(false)}
                className="p-2 hover:bg-sofa-bg-secondary rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-sofa-text-muted" />
              </button>
            </div>

            <PlayerStatsEditor
              player={selectedPlayer}
              onSave={(stats) => handlePlayerStatsUpdate(selectedPlayer, stats)}
              onCancel={() => setEditingStats(false)}
            />
          </motion.div>
        </div>
      )}

      {/* Image Cropper */}
      {cropperImage && (
        <ImageCropper
          image={cropperImage}
          onCropComplete={handleCropComplete}
          onCancel={() => {
            setCropperImage(null)
            setCropperTarget(null)
          }}
          aspectRatio={1}
          shape="round"
        />
      )}
    </div>
  )
}

// Composant pour éditer les statistiques d'un joueur
function PlayerStatsEditor({ 
  player, 
  onSave, 
  onCancel 
}: { 
  player: Player
  onSave: (stats: any) => void
  onCancel: () => void
}) {
  const [stats, setStats] = useState(player.stats || {
    overall: 65,
    pace: 65,
    shooting: 65,
    passing: 65,
    dribbling: 65,
    defending: 65,
    physical: 65
  })

  const [playerInfo, setPlayerInfo] = useState({
    age: player.age || 20,
    nationality: player.nationality || "",
    height: player.height || 175,
    weight: player.weight || 70
  })

  const statCategories = [
    { key: 'overall', label: 'Note Générale', icon: Star, color: 'text-sofa-yellow' },
    { key: 'pace', label: 'Vitesse', icon: Zap, color: 'text-sofa-green' },
    { key: 'shooting', label: 'Tir', icon: Target, color: 'text-sofa-red' },
    { key: 'passing', label: 'Passe', icon: Activity, color: 'text-sofa-blue' },
    { key: 'dribbling', label: 'Dribble', icon: Star, color: 'text-sofa-text-accent' },
    { key: 'defending', label: 'Défense', icon: Shield, color: 'text-sofa-orange' },
    { key: 'physical', label: 'Physique', icon: Users, color: 'text-sofa-text-primary' }
  ]

  const handleSave = () => {
    onSave({
      stats,
      ...playerInfo
    })
  }

  return (
    <div className="space-y-6">
      {/* Informations personnelles */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-sofa-text-primary">Informations Personnelles</h4>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-sofa-text-secondary mb-2">Âge</label>
            <input
              type="number"
              value={playerInfo.age}
              onChange={(e) => setPlayerInfo(prev => ({ ...prev, age: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-sofa-border rounded-lg bg-sofa-bg-secondary text-sofa-text-primary"
              min="16"
              max="45"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-sofa-text-secondary mb-2">Nationalité</label>
            <input
              type="text"
              value={playerInfo.nationality}
              onChange={(e) => setPlayerInfo(prev => ({ ...prev, nationality: e.target.value }))}
              className="w-full px-3 py-2 border border-sofa-border rounded-lg bg-sofa-bg-secondary text-sofa-text-primary"
              placeholder="ex: Maroc"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-sofa-text-secondary mb-2">Taille (cm)</label>
            <input
              type="number"
              value={playerInfo.height}
              onChange={(e) => setPlayerInfo(prev => ({ ...prev, height: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-sofa-border rounded-lg bg-sofa-bg-secondary text-sofa-text-primary"
              min="150"
              max="220"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-sofa-text-secondary mb-2">Poids (kg)</label>
            <input
              type="number"
              value={playerInfo.weight}
              onChange={(e) => setPlayerInfo(prev => ({ ...prev, weight: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-sofa-border rounded-lg bg-sofa-bg-secondary text-sofa-text-primary"
              min="50"
              max="120"
            />
          </div>
        </div>
      </div>

      {/* Statistiques FIFA */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-sofa-text-primary">Statistiques FIFA</h4>
        
        {statCategories.map((category) => (
          <div key={category.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <category.icon className={`w-4 h-4 ${category.color}`} />
                <label className="text-sm font-medium text-sofa-text-primary">
                  {category.label}
                </label>
              </div>
              <span className="text-sm font-bold text-sofa-text-accent">
                {stats[category.key as keyof typeof stats]}
              </span>
            </div>
            
            <input
              type="range"
              min="1"
              max="99"
              value={stats[category.key as keyof typeof stats]}
              onChange={(e) => setStats(prev => ({
                ...prev,
                [category.key]: parseInt(e.target.value)
              }))}
              className="w-full h-2 bg-sofa-bg-secondary rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-sofa-border text-sofa-text-secondary rounded-lg hover:bg-sofa-bg-secondary transition-colors"
        >
          Annuler
        </button>
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 bg-sofa-text-accent text-white rounded-lg hover:bg-sofa-text-accent/90 transition-colors"
        >
          Sauvegarder
        </button>
      </div>
    </div>
  )
}