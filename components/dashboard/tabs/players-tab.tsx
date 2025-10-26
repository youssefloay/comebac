"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { getTeams, getPlayersByTeam, createPlayer, updatePlayer, deletePlayer } from "@/lib/db"
import type { Team, Player } from "@/lib/types"
import { Plus, Trash2, Edit2, AlertCircle } from "lucide-react"

const POSITIONS = ["Gardien", "Défenseur", "Milieu", "Attaquant"] as const

export default function PlayersTab() {
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string>("")
  const [players, setPlayers] = useState<Player[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: "", number: "", position: "Milieu" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadTeams()
  }, [])

  useEffect(() => {
    if (selectedTeam) {
      loadPlayers()
    }
  }, [selectedTeam])

  const loadTeams = async () => {
    try {
      setError(null)
      const teamsData = await getTeams()
      setTeams(teamsData)
      if (teamsData.length > 0) {
        setSelectedTeam(teamsData[0].id)
      }
    } catch (err) {
      setError("Erreur lors du chargement des équipes")
      console.error("Error loading teams:", err)
    }
  }

  const loadPlayers = async () => {
    try {
      setError(null)
      const playersData = await getPlayersByTeam(selectedTeam)
      setPlayers(playersData)
    } catch (err) {
      setError("Erreur lors du chargement des joueurs")
      console.error("Error loading players:", err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      setError("Le nom du joueur est requis")
      return
    }

    if (!formData.number || Number.parseInt(formData.number) < 1 || Number.parseInt(formData.number) > 99) {
      setError("Le numéro doit être entre 1 et 99")
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (editingId) {
        await updatePlayer(editingId, {
          name: formData.name,
          number: Number.parseInt(formData.number),
          position: formData.position as any,
        })
        setSuccess("Joueur mis à jour avec succès")
      } else {
        await createPlayer({
          name: formData.name,
          number: Number.parseInt(formData.number),
          position: formData.position as any,
          teamId: selectedTeam,
        })
        setSuccess("Joueur ajouté avec succès")
      }

      setFormData({ name: "", number: "", position: "Milieu" })
      setShowForm(false)
      setEditingId(null)
      await loadPlayers()

      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError("Une erreur s'est produite lors de l'enregistrement")
      console.error("Error saving player:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, playerName: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le joueur "${playerName}"?`)) {
      try {
        setError(null)
        await deletePlayer(id)
        setSuccess("Joueur supprimé avec succès")
        await loadPlayers()
        setTimeout(() => setSuccess(null), 3000)
      } catch (err) {
        setError("Erreur lors de la suppression du joueur")
        console.error("Error deleting player:", err)
      }
    }
  }

  const handleEdit = (player: Player) => {
    setFormData({
      name: player.name,
      number: player.number.toString(),
      position: player.position,
    })
    setEditingId(player.id)
    setShowForm(true)
    setError(null)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingId(null)
    setFormData({ name: "", number: "", position: "Milieu" })
    setError(null)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestion des Joueurs</h2>
        <button
          onClick={() => {
            handleCancel()
            setShowForm(true)
          }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition"
        >
          <Plus className="w-5 h-5" />
          Ajouter un joueur
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

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Sélectionner une équipe</label>
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none w-full md:w-64"
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Nom du joueur"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                required
              />
              <input
                type="number"
                placeholder="Numéro"
                min="1"
                max="99"
                value={formData.number}
                onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
                required
              />
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              >
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Nom</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Numéro</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Poste</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {players.map((player) => (
              <tr key={player.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{player.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600 font-semibold">{player.number}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{player.position}</td>
                <td className="px-6 py-4 text-sm flex gap-2">
                  <button
                    onClick={() => handleEdit(player)}
                    className="text-blue-600 hover:bg-blue-50 p-2 rounded transition"
                    title="Modifier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(player.id, player.name)}
                    className="text-red-600 hover:bg-red-50 p-2 rounded transition"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {players.length === 0 && <div className="text-center py-8 text-gray-500">Aucun joueur pour cette équipe</div>}
      </div>
    </div>
  )
}
