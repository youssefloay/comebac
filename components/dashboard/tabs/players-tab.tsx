"use client";

import type React from "react";
import { useState, useEffect } from "react";
// Removed old imports - using API endpoints instead
import type { Team, Player } from "@/lib/types";
import { Plus, Trash2, Edit2, AlertCircle } from "lucide-react";

const POSITIONS = ["Gardien", "Défenseur", "Milieu", "Attaquant"] as const;

// Constantes pour les nouvelles informations
const SCHOOLS = [
  "Lycée Français du Caire",
  "École Française Internationale du Caire",
  "Collège de la Sainte Famille",
  "École Oasis Internationale",
  "Lycée Balzac",
  "École Française de Maadi",
  "Collège Saint-Marc",
  "École Voltaire du Caire",
];

const GRADES = [
  "6ème",
  "5ème",
  "4ème",
  "3ème",
  "2nde",
  "1ère S",
  "1ère ES",
  "1ère L",
  "Terminale S",
  "Terminale ES",
  "Terminale L",
];

const SUBJECTS = [
  "Mathématiques",
  "Physique",
  "Histoire",
  "Géographie",
  "Français",
  "Anglais",
  "Arabe",
  "SVT",
  "Sport",
  "Arts",
];

const BIRTH_PLACES = [
  "Le Caire",
  "Alexandrie",
  "Gizeh",
  "Shubra El-Kheima",
  "Port-Saïd",
  "Suez",
  "Louxor",
  "Assouan",
  "Mansoura",
  "Tanta",
];

const ALTERNATIVE_POSITIONS: Record<string, string[]> = {
  Gardien: [],
  Défenseur: ["DC", "DG", "DD", "MDC"],
  Milieu: ["MC", "MOC", "MDC", "MG", "MD"],
  Attaquant: ["BU", "AG", "AD", "MOC"],
};

export default function PlayersTab() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    number: "",
    position: "Milieu",
    nationality: "Égypte",
    photo: "",
    // Nouvelles informations personnelles
    birthDate: "",
    height: "",
    weight: "",
    birthPlace: "Le Caire",
    school: "Lycée Français du Caire",
    grade: "Terminale S",
    favoriteSubject: "Mathématiques",
    languages: ["Arabe", "Français"],
    alternativePositions: [] as string[],
    strongFoot: "Droit" as "Droit" | "Gauche" | "Ambidextre",
    experienceYears: "",
    preferredNumber: "",
    overall: 75,
    seasonStats: {
      goals: 0,
      assists: 0,
      matches: 0,
      yellowCards: 0,
      redCards: 0,
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  useEffect(() => {
    if (selectedTeam) {
      loadPlayers();
    } else {
      setPlayers([]);
    }
  }, [selectedTeam]);

  const loadTeams = async () => {
    try {
      setError(null);
      const response = await fetch("/api/admin/teams");
      if (!response.ok) throw new Error("Failed to fetch teams");
      const teamsData = await response.json();
      setTeams(
        teamsData.map((team: any) => ({
          ...team,
          createdAt: team.createdAt
            ? new Date(team.createdAt.seconds * 1000)
            : new Date(),
          updatedAt: team.updatedAt
            ? new Date(team.updatedAt.seconds * 1000)
            : new Date(),
        }))
      );
      if (teamsData.length > 0) {
        setSelectedTeam(teamsData[0].id);
      }
    } catch (err) {
      setError("Erreur lors du chargement des équipes");
      console.error("Error loading teams:", err);
    }
  };

  const loadPlayers = async () => {
    try {
      setError(null);
      console.log("[v0] Loading players for team:", selectedTeam);
      const response = await fetch(`/api/admin/players?teamId=${selectedTeam}`);
      if (!response.ok) throw new Error("Failed to fetch players");
      const playersData = await response.json();
      console.log("[v0] Players loaded:", playersData.length);
      setPlayers(
        playersData.map((player: any) => ({
          ...player,
          createdAt: player.createdAt
            ? new Date(player.createdAt.seconds * 1000)
            : new Date(),
          updatedAt: player.updatedAt
            ? new Date(player.updatedAt.seconds * 1000)
            : new Date(),
        }))
      );
    } catch (err) {
      console.error("[v0] Error loading players:", err);
      setError("Erreur lors du chargement des joueurs");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Le nom du joueur est requis");
      return;
    }

    if (
      !formData.number ||
      Number.parseInt(formData.number) < 1 ||
      Number.parseInt(formData.number) > 99
    ) {
      setError("Le numéro doit être entre 1 et 99");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (editingId) {
        const response = await fetch("/api/admin/players", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingId,
            name: formData.name,
            number: Number.parseInt(formData.number),
            position: formData.position,
            nationality: formData.nationality,
            photo: formData.photo,
            // Nouvelles informations personnelles
            birthDate: formData.birthDate,
            age: formData.birthDate
              ? new Date().getFullYear() -
                new Date(formData.birthDate).getFullYear()
              : undefined,
            height: formData.height
              ? Number.parseInt(formData.height)
              : undefined,
            weight: formData.weight
              ? Number.parseInt(formData.weight)
              : undefined,
            birthPlace: formData.birthPlace,
            school: formData.school,
            grade: formData.grade,
            favoriteSubject: formData.favoriteSubject,
            languages: formData.languages,
            alternativePositions: formData.alternativePositions,
            strongFoot: formData.strongFoot,
            experienceYears: formData.experienceYears
              ? Number.parseInt(formData.experienceYears)
              : undefined,
            preferredNumber: formData.preferredNumber
              ? Number.parseInt(formData.preferredNumber)
              : undefined,
            overall: formData.overall,
            seasonStats: formData.seasonStats,
          }),
        });
        if (!response.ok) throw new Error("Failed to update player");
        setSuccess("Joueur mis à jour avec succès");
      } else {
        const response = await fetch("/api/admin/players", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formData.name,
            number: Number.parseInt(formData.number),
            position: formData.position,
            teamId: selectedTeam,
            nationality: formData.nationality,
            photo: formData.photo,
            // Nouvelles informations personnelles
            birthDate: formData.birthDate,
            age: formData.birthDate
              ? new Date().getFullYear() -
                new Date(formData.birthDate).getFullYear()
              : undefined,
            height: formData.height
              ? Number.parseInt(formData.height)
              : undefined,
            weight: formData.weight
              ? Number.parseInt(formData.weight)
              : undefined,
            birthPlace: formData.birthPlace,
            school: formData.school,
            grade: formData.grade,
            favoriteSubject: formData.favoriteSubject,
            languages: formData.languages,
            alternativePositions: formData.alternativePositions,
            strongFoot: formData.strongFoot,
            experienceYears: formData.experienceYears
              ? Number.parseInt(formData.experienceYears)
              : undefined,
            preferredNumber: formData.preferredNumber
              ? Number.parseInt(formData.preferredNumber)
              : undefined,
            overall: formData.overall,
            seasonStats: formData.seasonStats,
          }),
        });
        if (!response.ok) throw new Error("Failed to create player");
        setSuccess("Joueur ajouté avec succès");
      }

      setFormData({
        name: "",
        number: "",
        position: "Milieu",
        nationality: "Égypte",
        photo: "",
        // Nouvelles informations personnelles
        birthDate: "",
        height: "",
        weight: "",
        birthPlace: "Le Caire",
        school: "Lycée Français du Caire",
        grade: "Terminale S",
        favoriteSubject: "Mathématiques",
        languages: ["Arabe", "Français"],
        alternativePositions: [],
        strongFoot: "Droit",
        experienceYears: "",
        preferredNumber: "",
        overall: 75,
        seasonStats: {
          goals: 0,
          assists: 0,
          matches: 0,
          yellowCards: 0,
          redCards: 0,
        },
      });
      setShowForm(false);
      setEditingId(null);
      await loadPlayers();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Une erreur s'est produite lors de l'enregistrement");
      console.error("Error saving player:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, playerName: string) => {
    if (
      confirm(`Êtes-vous sûr de vouloir supprimer le joueur "${playerName}"?`)
    ) {
      try {
        setError(null);
        const response = await fetch(`/api/admin/players?id=${id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Failed to delete player");
        setSuccess("Joueur supprimé avec succès");
        await loadPlayers();
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError("Erreur lors de la suppression du joueur");
        console.error("Error deleting player:", err);
      }
    }
  };

  const handleEdit = (player: Player) => {
    setFormData({
      name: player.name,
      number: player.number.toString(),
      position: player.position,
      nationality: player.nationality || "Égypte",
      photo: player.photo || "",
      // Nouvelles informations personnelles
      birthDate: player.birthDate || "",
      height: player.height?.toString() || "",
      weight: player.weight?.toString() || "",
      birthPlace: player.birthPlace || "Le Caire",
      school: player.school || "Lycée Français du Caire",
      grade: player.grade || "Terminale S",
      favoriteSubject: player.favoriteSubject || "Mathématiques",
      languages: player.languages || ["Arabe", "Français"],
      alternativePositions: player.alternativePositions || [],
      strongFoot: player.strongFoot || "Droit",
      experienceYears: player.experienceYears?.toString() || "",
      preferredNumber: player.preferredNumber?.toString() || "",
      overall: player.overall || 75,
      seasonStats: player.seasonStats || {
        goals: 0,
        assists: 0,
        matches: 0,
        yellowCards: 0,
        redCards: 0,
      },
    });
    setEditingId(player.id);
    setShowForm(true);
    setError(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      name: "",
      number: "",
      position: "Milieu",
      nationality: "Égypte",
      photo: "",
      // Nouvelles informations personnelles
      birthDate: "",
      height: "",
      weight: "",
      birthPlace: "Le Caire",
      school: "Lycée Français du Caire",
      grade: "Terminale S",
      favoriteSubject: "Mathématiques",
      languages: ["Arabe", "Français"],
      alternativePositions: [],
      strongFoot: "Droit",
      experienceYears: "",
      preferredNumber: "",
      overall: 75,
      seasonStats: {
        goals: 0,
        assists: 0,
        matches: 0,
        yellowCards: 0,
        redCards: 0,
      },
    });
    setError(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          Gestion des Joueurs
        </h2>
        <button
          onClick={() => {
            handleCancel();
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
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
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sélectionner une équipe pour voir/ajouter ses joueurs
        </label>
        <select
          value={selectedTeam}
          onChange={(e) => setSelectedTeam(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
        >
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Chaque équipe doit avoir au moins 8 joueurs (5 titulaires + 3
          remplaçants)
        </p>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de base */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Informations de base
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du joueur *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Lionel Messi"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de maillot *
                  </label>
                  <input
                    type="number"
                    placeholder="Ex: 10"
                    min="1"
                    max="99"
                    value={formData.number}
                    onChange={(e) =>
                      setFormData({ ...formData, number: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position sur le terrain
                  </label>
                  <select
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {POSITIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nationalité
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Maroc, France, Espagne..."
                    value={formData.nationality}
                    onChange={(e) =>
                      setFormData({ ...formData, nationality: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Photo du joueur (optionnel)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/photo-joueur.jpg"
                  value={formData.photo}
                  onChange={(e) =>
                    setFormData({ ...formData, photo: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Laissez vide pour utiliser une photo par défaut
                </p>
              </div>
            </div>

            {/* Informations personnelles */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Informations personnelles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) =>
                      setFormData({ ...formData, birthDate: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taille (cm)
                  </label>
                  <input
                    type="number"
                    placeholder="175"
                    min="150"
                    max="210"
                    value={formData.height}
                    onChange={(e) =>
                      setFormData({ ...formData, height: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Poids (kg)
                  </label>
                  <input
                    type="number"
                    placeholder="70"
                    min="50"
                    max="120"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({ ...formData, weight: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville de naissance
                  </label>
                  <select
                    value={formData.birthPlace}
                    onChange={(e) =>
                      setFormData({ ...formData, birthPlace: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {BIRTH_PLACES.map((place) => (
                      <option key={place} value={place}>
                        {place}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pied fort
                  </label>
                  <select
                    value={formData.strongFoot}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        strongFoot: e.target.value as
                          | "Droit"
                          | "Gauche"
                          | "Ambidextre",
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="Droit">Droit</option>
                    <option value="Gauche">Gauche</option>
                    <option value="Ambidextre">Ambidextre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Années d'expérience
                  </label>
                  <input
                    type="number"
                    placeholder="5"
                    min="1"
                    max="20"
                    value={formData.experienceYears}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        experienceYears: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Informations scolaires */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Informations scolaires
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    École
                  </label>
                  <select
                    value={formData.school}
                    onChange={(e) =>
                      setFormData({ ...formData, school: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {SCHOOLS.map((school) => (
                      <option key={school} value={school}>
                        {school}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Classe/Niveau
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) =>
                      setFormData({ ...formData, grade: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {GRADES.map((grade) => (
                      <option key={grade} value={grade}>
                        {grade}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Matière préférée
                  </label>
                  <select
                    value={formData.favoriteSubject}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        favoriteSubject: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {SUBJECTS.map((subject) => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro préféré
                  </label>
                  <input
                    type="number"
                    placeholder="7"
                    min="1"
                    max="99"
                    value={formData.preferredNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferredNumber: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Informations sportives */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Informations sportives
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Positions alternatives
                  </label>
                  <div className="space-y-2">
                    {ALTERNATIVE_POSITIONS[formData.position].map((pos) => (
                      <label key={pos} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.alternativePositions.includes(pos)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                alternativePositions: [
                                  ...formData.alternativePositions,
                                  pos,
                                ],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                alternativePositions:
                                  formData.alternativePositions.filter(
                                    (p) => p !== pos
                                  ),
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">{pos}</span>
                      </label>
                    ))}
                    {ALTERNATIVE_POSITIONS[formData.position].length === 0 && (
                      <p className="text-sm text-gray-500">
                        Aucune position alternative pour les gardiens
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note générale (1-99)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={formData.overall}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        overall: parseInt(e.target.value) || 75,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Note générale du joueur pour l'affichage sur la carte
                  </p>
                </div>
              </div>
            </div>

            {/* Statistiques de saison */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Statistiques de saison
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Entrez les performances du joueur pour cette saison (laissez à 0
                si nouveau joueur).
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buts marqués
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.seasonStats.goals}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seasonStats: {
                          ...formData.seasonStats,
                          goals: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Nombre de buts</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Passes décisives
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.seasonStats.assists}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seasonStats: {
                          ...formData.seasonStats,
                          assists: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Assists réalisées
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Matchs joués
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.seasonStats.matches}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seasonStats: {
                          ...formData.seasonStats,
                          matches: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Nombre de matchs</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cartons jaunes
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.seasonStats.yellowCards}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seasonStats: {
                          ...formData.seasonStats,
                          yellowCards: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Avertissements</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cartons rouges
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={formData.seasonStats.redCards}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        seasonStats: {
                          ...formData.seasonStats,
                          redCards: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Exclusions</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading
                  ? "Enregistrement..."
                  : editingId
                  ? "Mettre à jour"
                  : "Ajouter"}
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
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Nom
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                N°
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Poste
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                École
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Âge
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Note
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Pied
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {players.map((player) => {
              const overall = player.overall || 75;

              return (
                <tr key={player.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                    {player.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-bold">
                    {player.number}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {player.position}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {player.school || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-semibold">
                    {player.age || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`font-bold px-2 py-1 rounded text-xs ${
                        overall >= 85
                          ? "bg-yellow-100 text-yellow-800"
                          : overall >= 80
                          ? "bg-purple-100 text-purple-800"
                          : overall >= 75
                          ? "bg-blue-100 text-blue-800"
                          : overall >= 70
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {overall}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {player.strongFoot || "N/A"}
                  </td>
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
              );
            })}
          </tbody>
        </table>
        {players.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Aucun joueur pour cette équipe
          </div>
        )}
      </div>
    </div>
  );
}
