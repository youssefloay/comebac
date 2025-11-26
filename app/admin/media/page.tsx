"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getTeams, getPlayersWithProfiles, updatePlayerSeasonStats } from "@/lib/db"
import { MediaManager } from "@/components/admin/media-manager"
import type { Team, Player } from "@/lib/types"
import { RefreshCw } from "lucide-react"
import { useAdminI18n } from '@/lib/i18n/admin-i18n-context'

export default function AdminMediaPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const { t } = useAdminI18n()
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
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Header avec actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 mb-4 sm:mb-6 md:mb-8">
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-sofa-text-primary">{t.media.title}</h1>
            <p className="text-sm sm:text-base text-sofa-text-secondary mt-1 sm:mt-2">
              {t.media.subtitle}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={handleSeedPlayers}
              disabled={updating}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sofa-green text-white rounded-lg hover:bg-sofa-green/90 active:bg-sofa-green/80 transition-colors disabled:opacity-50 font-medium text-sm sm:text-base touch-manipulation"
              style={{ minHeight: '44px' }}
            >
              <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">{updating ? t.common.loading : t.media.seedPlayers}</span>
              <span className="xs:hidden">{updating ? t.common.loading : 'Seed'}</span>
            </button>
            
            <button
              onClick={handleUpdateSeasonStats}
              disabled={updating}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sofa-text-accent text-white rounded-lg hover:bg-sofa-text-accent/90 active:bg-sofa-text-accent/80 transition-colors disabled:opacity-50 font-medium text-sm sm:text-base touch-manipulation"
              style={{ minHeight: '44px' }}
            >
              <RefreshCw className={`w-4 h-4 ${updating ? 'animate-spin' : ''}`} />
              <span className="hidden xs:inline">{updating ? t.common.loading : t.media.updateStats}</span>
              <span className="xs:hidden">{updating ? t.common.loading : 'Stats'}</span>
            </button>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <div className="sofa-card p-4 sm:p-5 md:p-6 text-center">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-sofa-text-accent mb-1 sm:mb-2">{teams.length}</div>
            <div className="text-xs sm:text-sm text-sofa-text-secondary">{t.media.teams}</div>
          </div>
          
          <div className="sofa-card p-4 sm:p-5 md:p-6 text-center">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-sofa-text-accent mb-1 sm:mb-2">{players.length}</div>
            <div className="text-xs sm:text-sm text-sofa-text-secondary">{t.media.players}</div>
          </div>
          
          <div className="sofa-card p-4 sm:p-5 md:p-6 text-center">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-sofa-text-accent mb-1 sm:mb-2">
              {teams.filter(t => t.logo).length}
            </div>
            <div className="text-xs sm:text-sm text-sofa-text-secondary">{t.media.logosAdded}</div>
          </div>
          
          <div className="sofa-card p-4 sm:p-5 md:p-6 text-center">
            <div className="text-xl sm:text-2xl md:text-3xl font-bold text-sofa-text-accent mb-1 sm:mb-2">
              {players.filter(p => p.photo).length}
            </div>
            <div className="text-xs sm:text-sm text-sofa-text-secondary">{t.media.photosAdded}</div>
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