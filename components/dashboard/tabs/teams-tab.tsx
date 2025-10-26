"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Plus, Trash2, Edit2, AlertCircle } from "lucide-react"
import { getTeams, createTeam, updateTeam, deleteTeam } from "@/lib/db"
import type { Team } from "@/lib/types"

export default function TeamsTab() {
  const [teams, setTeams] = useState<Team[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: "", logo: "", color: "#10b981" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadTeams()
  }, [])

  const loadTeams = async () => {
    try {
      setError(null)
      const teamsData = await getTeams()
      setTeams(teamsData)
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
      if (editingId) {
        console.log("[v0] Updating team:", editingId)
        await updateTeam(editingId, {
          name: formData.name,
          logo: formData.logo,
          color: formData.color,
        })
        console.log("[v0] Team updated successfully")
        setSuccess("Équipe mise à jour avec succès")
      } else {
        console.log("[v0] Creating new team")
        await createTeam({
          name: formData.name,
          logo: formData.logo,
          color: formData.color,
        })
        console.log("[v0] Team created successfully")
        setSuccess("Équipe créée avec succès")
      }

      setFormData({ name: "", logo: "", color: "#10b981" })
      setShowForm(false)
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
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'équipe "${teamName}"?`)) {
      try {
        setError(null)
        await deleteTeam(id)
        setSuccess("Équipe supprimée avec succès")
        await loadTeams()
        setTimeout(() => setSuccess(null), 3000)
      } catch (err) {
        setError("Erreur lors de la suppression de l'équipe")
        console.error("Error deleting team:", err)
      }
    }
  }

  const handleEdit = (team: Team) => {
    setFormData({ name: team.name, logo: team.logo, color: team.color })
    setEditingId(team.id)
    setShowForm(true)
    setError(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({ name: "", logo: "", color: "#10b981" })
    setError(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Équipes</h2>
        <button
          onClick={() => {
            handleCancel()
            setShowForm(true)
          }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition"
        >
          <Plus className="w-5 h-5" />
          Nouvelle équipe
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
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input
                type="text"
                placeholder="Nom de l'équipe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                required
              />
              <input
                type="text"
                placeholder="URL du logo"
                value={formData.logo}
                onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              />
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg cursor-pointer h-10"
                />
                <span className="text-sm text-gray-600">{formData.color}</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-dark transition disabled:opacity-50"
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
              <div className="flex-1">
                <div
                  className="w-12 h-12 rounded-lg mb-3 flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: team.color }}
                >
                  {team.logo ? "🏆" : "⚽"}
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(team)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  title="Modifier"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(team.id, team.name)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-gray-600">Créée le {team.createdAt.toLocaleDateString("fr-FR")}</p>
          </div>
        ))}
      </div>

      {teams.length === 0 && !showForm && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">Aucune équipe créée</p>
          <button onClick={() => setShowForm(true)} className="text-primary hover:underline font-semibold">
            Créer la première équipe
          </button>
        </div>
      )}
    </div>
  )
}
