"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Plus, Trash2, Edit2, AlertCircle, X, Users, TrendingUp, Calendar, UserCheck, Crown, CheckCircle, XCircle } from "lucide-react"
// Removed old imports - using API endpoints instead
import type { Team } from "@/lib/types"
import { ImageCropper } from "@/components/admin/ImageCropper"

interface Player {
  id: string
  name: string
  email: string
  teamId: string
}

interface TeamCoachInfo {
  hasCoach: boolean
  coachName?: string
  hasActingCoach: boolean
  actingCoachName?: string
}

interface TeamStats {
  played: number
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  points: number
}

interface Match {
  id: string
  homeTeamId: string
  awayTeamId: string
  homeTeamName: string
  awayTeamName: string
  date: Date
  status: string
  homeScore?: number
  awayScore?: number
}

export default function TeamsTab() {
  const [teams, setTeams] = useState<Team[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ 
    name: "", 
    logo: "", 
    color: "#10b981",
    schoolName: "",
    teamGrade: "",
    coach: {
      firstName: "",
      lastName: "",
      birthDate: "",
      email: "",
      phone: ""
    }
  })
  const [showCoachForm, setShowCoachForm] = useState(false)
  const [customGrade, setCustomGrade] = useState("")
  const [isCustomGrade, setIsCustomGrade] = useState(false)
  const [loading, setLoading] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [cropperImage, setCropperImage] = useState<string | null>(null)
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([])
  const [teamStats, setTeamStats] = useState<TeamStats | null>(null)
  const [teamMatches, setTeamMatches] = useState<Match[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [hasCoach, setHasCoach] = useState(false)
  const [promotingPlayerId, setPromotingPlayerId] = useState<string | null>(null)
  const [teamsCoachInfo, setTeamsCoachInfo] = useState<Map<string, TeamCoachInfo>>(new Map())
  const [teamsPlayerCount, setTeamsPlayerCount] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    loadTeams()
  }, [])

  const loadTeams = async () => {
    try {
      setError(null)
      const response = await fetch('/api/admin/teams')
      if (!response.ok) throw new Error('Failed to fetch teams')
      const teamsData = await response.json()
      const teamsWithDates = teamsData.map((team: any) => ({
        ...team,
        createdAt: team.createdAt ? new Date(team.createdAt.seconds * 1000) : new Date(),
        updatedAt: team.updatedAt ? new Date(team.updatedAt.seconds * 1000) : new Date()
      }))
      setTeams(teamsWithDates)

      // Charger les informations sur les coaches, coaches intérimaires et le nombre de joueurs
      const accountsRes = await fetch('/api/admin/team-accounts')
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json()
        const coachInfoMap = new Map<string, TeamCoachInfo>()
        const playerCountMap = new Map<string, number>()

        accountsData.teams?.forEach((teamData: any) => {
          const coachInfo: TeamCoachInfo = {
            hasCoach: false,
            hasActingCoach: false
          }

          // Vérifier si l'équipe a un coach
          if (teamData.coaches && teamData.coaches.length > 0) {
            const coach = teamData.coaches[0]
            coachInfo.hasCoach = true
            coachInfo.coachName = coach.name || `${coach.firstName || ''} ${coach.lastName || ''}`.trim() || coach.email
          }

          // Vérifier si l'équipe a un coach intérimaire
          if (teamData.players) {
            const actingCoach = teamData.players.find((p: any) => p.isActingCoach === true)
            if (actingCoach) {
              coachInfo.hasActingCoach = true
              coachInfo.actingCoachName = actingCoach.name
            }
            
            // Compter les joueurs (exclure les coaches intérimaires)
            const playerCount = teamData.players.filter((p: any) => !p.isActingCoach).length
            playerCountMap.set(teamData.id, playerCount)
          }

          coachInfoMap.set(teamData.id, coachInfo)
        })

        setTeamsCoachInfo(coachInfoMap)
        setTeamsPlayerCount(playerCountMap)
      }
    } catch (err) {
      setError("Erreur lors du chargement des équipes")
      console.error("Error loading teams:", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setError("Le nom de l'équipe est requis")
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log("[v0] Submitting team form:", formData)
      
      // Prepare coach data - only include if form is shown and has data
      const coachData = showCoachForm && (
        formData.coach.firstName || 
        formData.coach.lastName || 
        formData.coach.email
      ) ? formData.coach : undefined

      if (editingId) {
        console.log("[v0] Updating team:", editingId)
        const response = await fetch('/api/admin/teams', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingId,
            name: formData.name,
            logo: formData.logo,
            color: formData.color,
            schoolName: formData.schoolName,
            school: formData.schoolName, // Pour compatibilité
            teamGrade: formData.teamGrade,
            coach: coachData,
          })
        })
        if (!response.ok) throw new Error('Failed to update team')
        console.log("[v0] Team updated successfully")
        setSuccess("Équipe mise à jour avec succès")
      } else {
        console.log("[v0] Creating new team")
        const response = await fetch('/api/admin/teams', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formData.name,
            logo: formData.logo,
            color: formData.color,
            schoolName: formData.schoolName,
            school: formData.schoolName, // Pour compatibilité
            teamGrade: formData.teamGrade,
            coach: coachData,
          })
        })
        if (!response.ok) throw new Error('Failed to create team')
        console.log("[v0] Team created successfully")
        setSuccess("Équipe créée avec succès")
      }

      setFormData({ 
        name: "", 
        logo: "", 
        color: "#10b981",
        schoolName: "",
        teamGrade: "",
        coach: {
          firstName: "",
          lastName: "",
          birthDate: "",
          email: "",
          phone: ""
        }
      })
      setCustomGrade("")
      setIsCustomGrade(false)
      setShowForm(false)
      setShowCoachForm(false)
      setEditingId(null)
      console.log("[v0] Reloading teams list...")
      await loadTeams()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error("[v0] Error in handleSubmit:", err)
      setError(`Une erreur s'est produite: ${err instanceof Error ? err.message : "Erreur inconnue"}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, teamName: string) => {
    if (confirm(`⚠️ ATTENTION: Supprimer COMPLÈTEMENT l'équipe "${teamName}"?\n\nCela supprimera DÉFINITIVEMENT:\n- ✅ Tous les joueurs de l'équipe\n- ✅ Tous les coaches de l'équipe\n- ✅ Tous les comptes Firebase Auth (joueurs + coaches)\n- ✅ Tous les matchs de l'équipe\n- ✅ Toutes les statistiques\n- ✅ Tous les résultats\n- ✅ Toutes les compositions\n- ✅ Tous les favoris\n\nCette action est IRRÉVERSIBLE!\n\nTapez "SUPPRIMER" pour confirmer`)) {
      const confirmation = prompt('Tapez "SUPPRIMER" en majuscules pour confirmer:')
      if (confirmation !== 'SUPPRIMER') {
        alert('Suppression annulée')
        return
      }

      try {
        setError(null)
        setLoading(true)
        
        const response = await fetch('/api/admin/delete-team-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ teamId: id, teamName })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to delete team')
        }
        
        const result = await response.json()
        const report = result.report
        
        let successMessage = `✅ Équipe "${teamName}" supprimée complètement!\n\n`
        successMessage += `📊 Résumé:\n`
        successMessage += `- ${report.players.length} joueur(s)\n`
        successMessage += `- ${report.coaches.length} coach(es)\n`
        successMessage += `- ${report.firebaseAccounts.length} compte(s) Firebase\n`
        successMessage += `- ${report.statistics} statistique(s)\n`
        successMessage += `- ${report.matches} match(s)\n`
        successMessage += `- ${report.results} résultat(s)\n`
        successMessage += `- ${report.lineups} composition(s)\n`
        successMessage += `- ${report.favorites} favori(s)\n`
        
        if (report.errors.length > 0) {
          successMessage += `\n⚠️ ${report.errors.length} erreur(s) rencontrée(s)`
        }
        
        alert(successMessage)
        setSuccess(`Équipe "${teamName}" supprimée complètement`)
        await loadTeams()
        setTimeout(() => setSuccess(null), 5000)
      } catch (err: any) {
        setError(`Erreur lors de la suppression: ${err.message}`)
        console.error("Error deleting team:", err)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleEdit = (team: Team) => {
    const grade = team.teamGrade || ""
    const isCustom = grade && !["1ère", "Terminale"].includes(grade)
    setFormData({ 
      name: team.name, 
      logo: team.logo || "", 
      color: team.color || "#10b981",
      schoolName: team.schoolName || team.school || "",
      teamGrade: grade,
      coach: team.coach || {
        firstName: "",
        lastName: "",
        birthDate: "",
        email: "",
        phone: ""
      }
    })
    setCustomGrade(isCustom ? grade : "")
    setIsCustomGrade(!!isCustom)
    setShowCoachForm(!!team.coach)
    setEditingId(team.id)
    setShowForm(true)
    setError(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setShowCoachForm(false)
    setCustomGrade("")
    setIsCustomGrade(false)
    setFormData({ 
      name: "", 
      logo: "", 
      color: "#10b981",
      schoolName: "",
      teamGrade: "",
      coach: {
        firstName: "",
        lastName: "",
        birthDate: "",
        email: "",
        phone: ""
      }
    })
    setError(null)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image')
      return
    }

    setError(null)

    // Ouvrir le cropper
    const reader = new FileReader()
    reader.onload = () => {
      setCropperImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    setUploadingLogo(true)
    setCropperImage(null)

    try {
      const formData = new FormData()
      formData.append('file', croppedBlob, 'logo.jpg')

      const response = await fetch('/api/upload-team-logo', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setFormData(prev => ({ ...prev, logo: data.url }))
        setSuccess('Logo uploadé avec succès!')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.error || 'Erreur lors de l\'upload')
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      setError('Erreur lors de l\'upload du logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleTeamClick = async (team: Team) => {
    setSelectedTeam(team)
    setLoadingDetails(true)
    
    try {
      // Charger les données de l'équipe avec playerAccounts et coachAccounts
      const accountsRes = await fetch('/api/admin/team-accounts')
      let playersLoaded = false
      let updatedTeam = team
      
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json()
        const teamData = accountsData.teams?.find((t: any) => t.id === team.id)
        
        if (teamData) {
          // Vérifier si l'équipe a un coach
          setHasCoach(teamData.coaches && teamData.coaches.length > 0)
          
          // Si le coach n'est pas rempli dans team, charger depuis coachAccounts
          if ((!team.coach || !team.coach.firstName || !team.coach.lastName) && teamData.coaches && teamData.coaches.length > 0) {
            const coach = teamData.coaches[0]
            updatedTeam = {
              ...team,
              coach: {
                firstName: coach.firstName || coach.name?.split(' ')[0] || '',
                lastName: coach.lastName || coach.name?.split(' ').slice(1).join(' ') || '',
                birthDate: coach.birthDate || '',
                email: coach.email || '',
                phone: coach.phone || ''
              }
            }
            setSelectedTeam(updatedTeam)
          }
          
          // Charger les joueurs avec leurs comptes playerAccounts
          const playersRes = await fetch(`/api/admin/players?teamId=${team.id}`)
          if (playersRes.ok) {
            const playersData = await playersRes.json()
            if (teamData.players) {
              const playersWithStatus = playersData.map((player: Player) => {
                const account = teamData.players.find((p: any) => p.email === player.email)
                return {
                  ...player,
                  playerAccountId: account?.id,
                  isActingCoach: account?.isActingCoach || false
                }
              })
              setTeamPlayers(playersWithStatus)
              playersLoaded = true
            } else {
              setTeamPlayers(playersData)
              playersLoaded = true
            }
          }
        }
      }

      // Si l'API team-accounts ne fonctionne pas, charger les joueurs normalement
      if (!playersLoaded) {
        const playersRes = await fetch(`/api/admin/players?teamId=${team.id}`)
        if (playersRes.ok) {
          const playersData = await playersRes.json()
          setTeamPlayers(playersData)
        }
      }

      // Load team statistics
      const statsRes = await fetch(`/api/admin/statistics?teamId=${team.id}`)
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        if (statsData.length > 0) {
          setTeamStats(statsData[0])
        } else {
          setTeamStats({
            played: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            goalsFor: 0,
            goalsAgainst: 0,
            points: 0
          })
        }
      }

      // Load team matches
      const matchesRes = await fetch(`/api/admin/matches?teamId=${team.id}`)
      if (matchesRes.ok) {
        const matchesData = await matchesRes.json()
        setTeamMatches(matchesData.map((match: any) => ({
          ...match,
          date: new Date(match.date.seconds * 1000)
        })))
      }
    } catch (err) {
      console.error("Error loading team details:", err)
    } finally {
      setLoadingDetails(false)
    }
  }

  const closeTeamDetails = () => {
    setSelectedTeam(null)
    setTeamPlayers([])
    setTeamStats(null)
    setTeamMatches([])
    setHasCoach(false)
  }

  const handlePromoteToActingCoach = async (playerAccountId: string) => {
    if (!selectedTeam) return

    setPromotingPlayerId(playerAccountId)
    try {
      const response = await fetch('/api/team/set-acting-coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: selectedTeam.id, playerId: playerAccountId })
      })

      const data = await response.json()

      if (!response.ok) {
        alert(data.error || 'Erreur lors de la promotion')
        return
      }

      // Recharger les détails de l'équipe
      if (selectedTeam) {
        await handleTeamClick(selectedTeam)
      }
      // Recharger la liste des équipes pour mettre à jour les infos coach
      await loadTeams()
      alert('Joueur promu coach intérimaire avec succès!')
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la promotion')
    } finally {
      setPromotingPlayerId(null)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Gestion des Équipes</h2>
        <button
          onClick={() => {
            handleCancel()
            setShowForm(true)
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition w-full sm:w-auto justify-center"
        >
          <Plus className="w-5 h-5" />
          <span className="text-sm sm:text-base">Nouvelle équipe</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">{success}</p>
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Team Info */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de l'équipe</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'équipe *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Real Madrid, FC Barcelone..."
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    École
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Lycée Français du Caire..."
                    value={formData.schoolName}
                    onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Classe
                  </label>
                  <select
                    value={formData.teamGrade && ["1ère", "Terminale"].includes(formData.teamGrade) ? formData.teamGrade : (isCustomGrade || (formData.teamGrade && !["1ère", "Terminale"].includes(formData.teamGrade)) ? "Autre" : "")}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === "Autre") {
                        setIsCustomGrade(true)
                        setFormData({ ...formData, teamGrade: customGrade || "" })
                      } else if (value === "") {
                        setIsCustomGrade(false)
                        setFormData({ ...formData, teamGrade: "" })
                        setCustomGrade("")
                      } else {
                        setIsCustomGrade(false)
                        setFormData({ ...formData, teamGrade: value })
                        setCustomGrade("")
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Sélectionner une classe</option>
                    <option value="1ère">1ère</option>
                    <option value="Terminale">Terminale</option>
                    <option value="Autre">Autre</option>
                  </select>
                  {isCustomGrade && (
                    <input
                      type="text"
                      placeholder="Précisez la classe..."
                      value={customGrade || formData.teamGrade || ""}
                      onChange={(e) => {
                        const value = e.target.value
                        setCustomGrade(value)
                        setFormData({ ...formData, teamGrade: value })
                      }}
                      className="w-full mt-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Logo de l'équipe (optionnel)
                  </label>
                  <div className="space-y-2">
                    {formData.logo && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <img 
                          src={formData.logo} 
                          alt="Logo" 
                          className="w-12 h-12 object-cover rounded"
                        />
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, logo: '' })}
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Supprimer
                        </button>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {uploadingLogo && (
                      <p className="text-sm text-blue-600">Upload en cours...</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Format: JPG, PNG, GIF (max 500KB)
                    </p>
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Couleur de l'équipe
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div
                          className="w-16 h-16 rounded-lg border-2 border-gray-300 shadow-md hover:shadow-lg transition-shadow pointer-events-none"
                          style={{ backgroundColor: formData.color }}
                        />
                        <input
                          type="color"
                          value={formData.color}
                          onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          type="text"
                          value={formData.color}
                          onChange={(e) => {
                            const color = e.target.value
                            if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
                              setFormData({ ...formData, color })
                            }
                          }}
                          placeholder="#10b981"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-1">Format hexadécimal (#RRGGBB)</p>
                      </div>
                    </div>
                    {/* Palette de couleurs prédéfinies */}
                    <div>
                      <p className="text-xs text-gray-600 mb-2">Couleurs prédéfinies :</p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
                          '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
                          '#14b8a6', '#a855f7', '#eab308', '#dc2626', '#0ea5e9',
                          '#d946ef', '#22c55e', '#fb923c', '#64748b', '#1e293b'
                        ].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setFormData({ ...formData, color })}
                            className={`w-10 h-10 rounded-lg border-2 transition-all ${
                              formData.color === color 
                                ? 'border-gray-900 scale-110 shadow-lg' 
                                : 'border-gray-300 hover:border-gray-500 hover:scale-105'
                            }`}
                            style={{ backgroundColor: color }}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coach Section */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Entraîneur (optionnel)</h3>
                <button
                  type="button"
                  onClick={() => setShowCoachForm(!showCoachForm)}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showCoachForm ? "Masquer" : "Ajouter un entraîneur"}
                </button>
              </div>
              
              {showCoachForm && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Jean"
                      value={formData.coach.firstName}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        coach: { ...formData.coach, firstName: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Dupont"
                      value={formData.coach.lastName}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        coach: { ...formData.coach, lastName: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de naissance
                    </label>
                    <input
                      type="date"
                      value={formData.coach.birthDate}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        coach: { ...formData.coach, birthDate: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="coach@example.com"
                      value={formData.coach.email}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        coach: { ...formData.coach, email: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      placeholder="+33 6 12 34 56 78"
                      value={formData.coach.phone}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        coach: { ...formData.coach, phone: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? "Enregistrement..." : editingId ? "Mettre à jour" : "Ajouter"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team) => (
          <div key={team.id} className="bg-white rounded-lg shadow hover:shadow-lg transition p-6">
            <div className="flex items-start justify-between mb-4">
              <div 
                className="flex-1 cursor-pointer" 
                onClick={() => handleTeamClick(team)}
              >
                <div
                  className="w-12 h-12 rounded-lg mb-3 flex items-center justify-center text-white font-bold text-lg overflow-hidden"
                  style={{ backgroundColor: team.logo ? 'transparent' : team.color }}
                >
                  {team.logo ? (
                    <img 
                      src={team.logo} 
                      alt={team.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.parentElement!.style.backgroundColor = team.color
                        e.currentTarget.parentElement!.innerHTML = '⚽'
                      }}
                    />
                  ) : (
                    "⚽"
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition">{team.name}</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEdit(team)
                  }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Modifier"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(team.id, team.name)
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-1 mb-3">
              <p className="text-sm text-gray-600">Créée le {team.createdAt.toLocaleDateString("fr-FR")}</p>
              {(team.schoolName || team.school) && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">École:</span> {team.schoolName || team.school}
                </p>
              )}
              {team.teamGrade && (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Classe:</span> {team.teamGrade}
                </p>
              )}
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-gray-700">
                  <span className="font-medium">Joueurs:</span> {teamsPlayerCount.get(team.id) ?? '...'}
                </span>
              </div>
            </div>
            
            {/* Informations Coach */}
            <div className="space-y-2 mt-3 pt-3 border-t border-gray-200">
              {(() => {
                const coachInfo = teamsCoachInfo.get(team.id)
                if (!coachInfo) {
                  return (
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
                      <span>Chargement...</span>
                    </div>
                  )
                }

                if (coachInfo.hasCoach) {
                  return (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">
                        <span className="font-medium text-green-700">Coach:</span> {coachInfo.coachName}
                      </span>
                    </div>
                  )
                }

                if (coachInfo.hasActingCoach) {
                  return (
                    <div className="flex items-center gap-2 text-sm">
                      <Crown className="w-4 h-4 text-orange-600" />
                      <span className="text-gray-700">
                        <span className="font-medium text-orange-700">Coach Intérimaire:</span> {coachInfo.actingCoachName}
                      </span>
                    </div>
                  )
                }

                return (
                  <div className="flex items-center gap-2 text-sm">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-red-700 font-medium">Besoin d'un coach</span>
                  </div>
                )
              })()}
            </div>
          </div>
        ))}
      </div>

      {/* Team Details Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <div
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center text-white font-bold text-xl sm:text-2xl overflow-hidden flex-shrink-0"
                  style={{ backgroundColor: selectedTeam.logo ? 'transparent' : selectedTeam.color }}
                >
                  {selectedTeam.logo ? (
                    <img 
                      src={selectedTeam.logo} 
                      alt={selectedTeam.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.parentElement!.style.backgroundColor = selectedTeam.color
                        e.currentTarget.parentElement!.innerHTML = '⚽'
                      }}
                    />
                  ) : (
                    "⚽"
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{selectedTeam.name}</h2>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                    <p className="text-xs sm:text-sm text-gray-600">Détails de l'équipe</p>
                    {(selectedTeam.schoolName || selectedTeam.school) && (
                      <span className="text-xs sm:text-sm text-gray-500 truncate">
                        • {(selectedTeam.schoolName || selectedTeam.school)}
                      </span>
                    )}
                    {selectedTeam.teamGrade && (
                      <span className="text-xs sm:text-sm text-gray-500">
                        • {selectedTeam.teamGrade}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={closeTeamDetails}
                className="p-2 hover:bg-gray-100 rounded-lg transition flex-shrink-0"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </button>
            </div>

            {loadingDetails ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Chargement des détails...</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Coach Info */}
                {selectedTeam.coach && (
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Users className="w-5 h-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Entraîneur</h3>
                    </div>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-2xl">
                          {selectedTeam.coach.firstName.charAt(0)}{selectedTeam.coach.lastName.charAt(0)}
                        </div>
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Nom complet</p>
                            <p className="font-semibold text-gray-900 text-lg">
                              {selectedTeam.coach.firstName} {selectedTeam.coach.lastName}
                            </p>
                          </div>
                          {selectedTeam.coach.birthDate && (
                            <div>
                              <p className="text-sm text-gray-600">Date de naissance</p>
                              <p className="font-medium text-gray-900">
                                {new Date(selectedTeam.coach.birthDate).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          )}
                          {selectedTeam.coach.email && (
                            <div>
                              <p className="text-sm text-gray-600">Email</p>
                              <p className="font-medium text-gray-900">{selectedTeam.coach.email}</p>
                            </div>
                          )}
                          {selectedTeam.coach.phone && (
                            <div>
                              <p className="text-sm text-gray-600">Téléphone</p>
                              <p className="font-medium text-gray-900">{selectedTeam.coach.phone}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Statistics */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Statistiques</h3>
                  </div>
                  {teamStats ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Matchs joués</p>
                        <p className="text-2xl font-bold text-blue-600">{teamStats.played}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Victoires</p>
                        <p className="text-2xl font-bold text-green-600">{teamStats.wins}</p>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Nuls</p>
                        <p className="text-2xl font-bold text-yellow-600">{teamStats.draws}</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Défaites</p>
                        <p className="text-2xl font-bold text-red-600">{teamStats.losses}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Points</p>
                        <p className="text-2xl font-bold text-purple-600">{teamStats.points}</p>
                      </div>
                      <div className="bg-indigo-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Buts pour</p>
                        <p className="text-2xl font-bold text-indigo-600">{teamStats.goalsFor}</p>
                      </div>
                      <div className="bg-pink-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Buts contre</p>
                        <p className="text-2xl font-bold text-pink-600">{teamStats.goalsAgainst}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-600">Différence</p>
                        <p className="text-2xl font-bold text-gray-600">
                          {teamStats.goalsFor - teamStats.goalsAgainst > 0 ? '+' : ''}
                          {teamStats.goalsFor - teamStats.goalsAgainst}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">Aucune statistique disponible</p>
                  )}
                </div>

                {/* Message si pas de coach */}
                {!hasCoach && (
                  <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-bold text-orange-900 mb-1">
                          Aucun coach assigné à l'équipe
                        </h3>
                        <p className="text-sm text-orange-700">
                          Vous pouvez choisir un joueur pour qu'il devienne coach intérimaire. Il aura accès aux fonctions de coach tout en restant joueur.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Players */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Joueurs ({teamPlayers.length})</h3>
                  </div>
                  {teamPlayers.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {teamPlayers.map((player: any) => (
                        <div key={player.id} className="bg-gray-50 rounded-lg p-4 relative">
                          {(player.isActingCoach) && (
                            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold">
                              <Crown className="w-3 h-3" />
                              Coach Intérimaire
                            </div>
                          )}
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                              {player.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{player.name}</p>
                              <p className="text-sm text-gray-600">{player.email}</p>
                            </div>
                          </div>
                          {!hasCoach && !player.isActingCoach && player.playerAccountId && (
                            <button
                              onClick={() => handlePromoteToActingCoach(player.playerAccountId)}
                              disabled={promotingPlayerId === player.playerAccountId}
                              className="w-full mt-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {promotingPlayerId === player.playerAccountId ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Promotion...
                                </>
                              ) : (
                                <>
                                  <UserCheck className="w-4 h-4" />
                                  Nommer Coach Intérimaire
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Aucun joueur dans cette équipe</p>
                  )}
                </div>

                {/* Recent Matches */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Matchs récents</h3>
                  </div>
                  {teamMatches.length > 0 ? (
                    <div className="space-y-3">
                      {teamMatches.slice(0, 5).map((match) => (
                        <div key={match.id} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">{match.homeTeamName}</span>
                                {match.status === 'completed' && match.homeScore !== undefined && (
                                  <span className="font-bold text-lg">{match.homeScore}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{match.awayTeamName}</span>
                                {match.status === 'completed' && match.awayScore !== undefined && (
                                  <span className="font-bold text-lg">{match.awayScore}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">
                                {match.date.toLocaleDateString('fr-FR')}
                              </p>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                match.status === 'completed' ? 'bg-green-100 text-green-800' :
                                match.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {match.status === 'completed' ? 'Terminé' :
                                 match.status === 'scheduled' ? 'Programmé' : match.status}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Aucun match pour cette équipe</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {teams.length === 0 && !showForm && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Aucune équipe créée</p>
          <button onClick={() => setShowForm(true)} className="text-blue-600 hover:underline font-semibold">
            Créer la première équipe
          </button>
        </div>
      )}

      {/* Image Cropper */}
      {cropperImage && (
        <ImageCropper
          image={cropperImage}
          onCropComplete={handleCropComplete}
          onCancel={() => setCropperImage(null)}
          aspectRatio={1}
          shape="round"
        />
      )}
    </div>
  )
}
