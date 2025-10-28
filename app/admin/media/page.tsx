"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getTeams, getPlayersWithProfiles, updatePlayerSeasonStats } from "@/lib/db"
import { MediaManager } from "@/components/admin/media-manager"
import type { Team, Player } from "@/lib/types"
import { RefreshCw } from "lucide-react"

export default function AdminMediaPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
      return
    }
    
    if (user) {
      loadData()
    }
  }, [user, authLoading, router])

  const loadData = async () => {
    try {
      setLoading(true)
      const [teamsData, playersData] = await Promise.all([
        getTeams(),
        getPlayersWithProfiles()
      ])
      
      setTeams(teamsData)
      setPlayers(playersData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSeedPlayers = async () => {
    try {
      setUpdating(true)
      const response = await fetch('/api/seed-players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed' })
      })
      
      const result = await response.json()
      if (result.success) {
        console.log("✅ Seed réussi:", result.message)
        await loadData() // Recharger les données
      } else {
        console.error("❌ Erreur seed:", result.message)
      }
    } catch (error) {
      console.error("Error seeding players:", error)
    } finally {
      setUpdating(false)
    }
  }

  const handleUpdateSeasonStats = async () => {
    try {
      setUpdating(true)
      await updatePlayerSeasonStats()
      await loadData() // Recharger les données
    } catch (error) {
      console.error("Error updating season stats:", error)
    } finally {
      setUpdating(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-sofa-green rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sofa-text-secondary">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-sofa-bg-primary">
      <div className="container mx-auto px-4 py-8">
        {/* Header avec actions */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-sofa-text-primary">Gestion des Médias</h1>
            <p className="text-sofa-text-secondary mt-2">
              Gérez les logos d'équipes, photos de joueurs et statistiques FIFA
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={handleSeedPlayers}
              disabled={updating}
              className="flex items-center gap-2 px-4 py-2 bg-sofa-green text-white rounded-lg hover:bg-sofa-green/90 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
              {updating ? 'Seed en cours...' : 'Seed Joueurs + Photos'}
            </button>
            
            <button
              onClick={handleUpdateSeasonStats}
              disabled={updating}
              className="flex items-center gap-2 px-4 py-2 bg-sofa-text-accent text-white rounded-lg hover:bg-sofa-text-accent/90 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
              {updating ? 'Mise à jour...' : 'Mettre à jour les stats'}
            </button>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="sofa-card p-6 text-center">
            <div className="text-3xl font-bold text-sofa-text-accent mb-2">{teams.length}</div>
            <div className="text-sm text-sofa-text-secondary">Équipes</div>
          </div>
          
          <div className="sofa-card p-6 text-center">
            <div className="text-3xl font-bold text-sofa-text-accent mb-2">{players.length}</div>
            <div className="text-sm text-sofa-text-secondary">Joueurs</div>
          </div>
          
          <div className="sofa-card p-6 text-center">
            <div className="text-3xl font-bold text-sofa-text-accent mb-2">
              {teams.filter(t => t.logo).length}
            </div>
            <div className="text-sm text-sofa-text-secondary">Logos ajoutés</div>
          </div>
          
          <div className="sofa-card p-6 text-center">
            <div className="text-3xl font-bold text-sofa-text-accent mb-2">
              {players.filter(p => p.photo).length}
            </div>
            <div className="text-sm text-sofa-text-secondary">Photos ajoutées</div>
          </div>
        </div>

        {/* Gestionnaire de médias */}
        <MediaManager 
          teams={teams}
          players={players}
          onUpdate={loadData}
        />
      </div>
    </div>
  )
}