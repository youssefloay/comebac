"use client";

import type React from "react";
import { useState, useEffect } from "react";
// Removed old imports - using API endpoints instead
import type { Team, Player } from "@/lib/types";
import { Plus, Trash2, Edit2, AlertCircle, Users, Crown, UserCheck, Mail, Phone, Calendar, X, Save, Search, Filter, ChevronDown, ChevronUp } from "lucide-react";
import CaptainsCoachesManager from "@/components/admin/captains-coaches-manager";

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

interface PlayerAccount {
  id: string
  email: string
  firstName: string
  lastName: string
  name: string
  phone?: string
  position?: string
  jerseyNumber?: number
  birthDate?: string
  height?: string
  tshirtSize?: string
  foot?: string
  nickname?: string
}

interface CoachAccount {
  id: string
  email: string
  firstName: string
  lastName: string
  name: string
  phone?: string
  birthDate?: string
}

export default function PlayersTab() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>("");
  const [players, setPlayers] = useState<Player[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCoach, setIsCoach] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [manageTeamId, setManageTeamId] = useState<string>('');
  const [teamAccounts, setTeamAccounts] = useState<{ players: PlayerAccount[]; coaches: CoachAccount[] }>({ players: [], coaches: [] });
  const [editingAccount, setEditingAccount] = useState<{ id: string; type: 'player' | 'coach'; data: PlayerAccount | CoachAccount } | null>(null);
  const [showManageForm, setShowManageForm] = useState(false);
  const [managePlayerData, setManagePlayerData] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    email: '',
    phone: '',
    birthDate: '',
    height: '',
    tshirtSize: 'M',
    position: '',
    foot: '',
    jerseyNumber: ''
  });
  const [manageIsCoach, setManageIsCoach] = useState(false);
  const [manageLoading, setManageLoading] = useState(false);
  const [teamCoachInfo, setTeamCoachInfo] = useState<{ coach?: CoachAccount; actingCoach?: PlayerAccount; captain?: any } | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<{ type: 'coach' | 'actingCoach' | 'captain' | 'player'; data: any } | null>(null);
  const [showCaptainsCoachesModal, setShowCaptainsCoachesModal] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    searchTerm: '',
    position: '',
    teamId: '',
    schoolName: '',
    teamGrade: '',
    status: '' as 'active' | 'inactive' | 'neverLoggedIn' | '',
    minGoals: '',
    minAssists: '',
    minMatches: '',
    sortBy: 'name' as 'goals' | 'assists' | 'matches' | 'name' | 'team',
    sortOrder: 'asc' as 'asc' | 'desc'
  });
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [useSearchMode, setUseSearchMode] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
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
      loadTeamInfo();
      // Charger aussi les teamAccounts pour avoir les infos complètes
      setManageTeamId(selectedTeam);
    } else {
      setPlayers([]);
      setTeamCoachInfo(null);
      setManageTeamId('');
    }
  }, [selectedTeam]);

  const loadTeamInfo = async () => {
    if (!selectedTeam) return;
    try {
      // Charger les comptes de l'équipe
      const accountsRes = await fetch('/api/admin/team-accounts');
      if (accountsRes.ok) {
        const accountsData = await accountsRes.json();
        const team = accountsData.teams?.find((t: any) => t.id === selectedTeam);
        
        if (team) {
          const info: { coach?: CoachAccount; actingCoach?: PlayerAccount; captain?: any } = {};
          
          // Coach
          if (team.coaches && team.coaches.length > 0) {
            info.coach = team.coaches[0];
          }
          
          // Coach intérimaire
          if (team.players) {
            const actingCoach = team.players.find((p: any) => p.isActingCoach === true);
            if (actingCoach) {
              info.actingCoach = actingCoach;
            }
          }
          
          // Capitaine - chercher dans la collection players
          const playersRes = await fetch(`/api/admin/players?teamId=${selectedTeam}`);
          if (playersRes.ok) {
            const playersData = await playersRes.json();
            const captain = playersData.find((p: any) => p.isCaptain === true);
            if (captain) {
              // Trouver le compte correspondant
              const captainAccount = team.players?.find((p: any) => p.email === captain.email);
              info.captain = captainAccount || { ...captain, name: captain.name || `${captain.firstName || ''} ${captain.lastName || ''}`.trim() };
            }
          }
          
          setTeamCoachInfo(info);
        }
      }
    } catch (error) {
      console.error('Erreur chargement infos équipe:', error);
    }
  };

  useEffect(() => {
    if (manageTeamId) {
      loadTeamAccounts();
    } else {
      setTeamAccounts({ players: [], coaches: [] });
    }
  }, [manageTeamId]);

  const loadTeamAccounts = async () => {
    if (!manageTeamId) return;
    try {
      const response = await fetch('/api/admin/team-accounts');
      if (response.ok) {
        const data = await response.json();
        const team = data.teams?.find((t: any) => t.id === manageTeamId);
        if (team) {
          setTeamAccounts({
            players: team.players || [],
            coaches: team.coaches || []
          });
        }
      }
    } catch (error) {
      console.error('Erreur chargement comptes:', error);
    }
  };

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
          Gestion des Joueurs & Coaches
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCaptainsCoachesModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Users className="w-5 h-5" />
            Gestion Capitaines & Coachs
          </button>
          <button
            onClick={() => {
              setManageTeamId(selectedTeam || '');
              setShowManageModal(true);
              setEditingAccount(null);
              setShowManageForm(false);
              setManagePlayerData({
                firstName: '',
                lastName: '',
                nickname: '',
                email: '',
                phone: '',
                birthDate: '',
                height: '',
                tshirtSize: 'M',
                position: '',
                foot: '',
                jerseyNumber: ''
              });
              if (selectedTeam) {
                loadTeamAccounts();
              }
            }}
            className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
          >
            <Plus className="w-5 h-5" />
            Gérer joueurs/coaches
          </button>
        </div>
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
          <option value="">-- Sélectionner une équipe --</option>
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

      {/* Affichage des infos de l'équipe sélectionnée */}
      {selectedTeam && teamCoachInfo && (
        <div className="mb-6 bg-white rounded-lg shadow p-6">
          <div className="mb-4 pb-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              {teams.find(t => t.id === selectedTeam)?.name || 'Équipe'}
            </h3>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              {(teams.find(t => t.id === selectedTeam)?.schoolName || teams.find(t => t.id === selectedTeam)?.school) && (
                <div className="flex items-center gap-1">
                  <span className="font-medium text-gray-700">École:</span>
                  <span>{teams.find(t => t.id === selectedTeam)?.schoolName || teams.find(t => t.id === selectedTeam)?.school}</span>
                </div>
              )}
              {teams.find(t => t.id === selectedTeam)?.teamGrade && (
                <div className="flex items-center gap-1">
                  <span className="font-medium text-gray-700">Classe:</span>
                  <span>{teams.find(t => t.id === selectedTeam)?.teamGrade}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Coach */}
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="w-4 h-4 text-orange-600" />
                <span className="font-semibold text-orange-900">Coach</span>
              </div>
              {teamCoachInfo.coach ? (
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/admin/get-account-details?accountId=${teamCoachInfo.coach.id}&accountType=coach`);
                      const accountData = await response.json();
                      if (response.ok && accountData) {
                        setSelectedPerson({ type: 'coach', data: accountData });
                      } else {
                        setSelectedPerson({ type: 'coach', data: teamCoachInfo.coach });
                      }
                      setShowDetailsModal(true);
                    } catch (error) {
                      setSelectedPerson({ type: 'coach', data: teamCoachInfo.coach });
                      setShowDetailsModal(true);
                    }
                  }}
                  className="text-left w-full hover:underline"
                >
                  <p className="font-medium text-gray-900">{teamCoachInfo.coach.name}</p>
                  <p className="text-sm text-gray-600">{teamCoachInfo.coach.email}</p>
                </button>
              ) : teamCoachInfo.actingCoach ? (
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch(`/api/admin/get-account-details?accountId=${teamCoachInfo.actingCoach.id}&accountType=player`);
                      const accountData = await response.json();
                      if (response.ok && accountData) {
                        setSelectedPerson({ type: 'actingCoach', data: accountData });
                      } else {
                        setSelectedPerson({ type: 'actingCoach', data: teamCoachInfo.actingCoach });
                      }
                      setShowDetailsModal(true);
                    } catch (error) {
                      setSelectedPerson({ type: 'actingCoach', data: teamCoachInfo.actingCoach });
                      setShowDetailsModal(true);
                    }
                  }}
                  className="text-left w-full hover:underline"
                >
                  <div className="flex items-center gap-1 mb-1">
                    <Crown className="w-3 h-3 text-orange-600" />
                    <p className="font-medium text-gray-900">{teamCoachInfo.actingCoach.name}</p>
                  </div>
                  <p className="text-xs text-orange-700">Coach Intérimaire</p>
                  <p className="text-sm text-gray-600">{teamCoachInfo.actingCoach.email}</p>
                </button>
              ) : (
                <p className="text-sm text-gray-500">Aucun coach</p>
              )}
            </div>

            {/* Capitaine */}
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-yellow-600" />
                <span className="font-semibold text-yellow-900">Capitaine</span>
              </div>
              {teamCoachInfo.captain ? (
                <button
                  onClick={async () => {
                    try {
                      if (teamCoachInfo.captain.id) {
                        const response = await fetch(`/api/admin/get-account-details?accountId=${teamCoachInfo.captain.id}&accountType=player`);
                        const accountData = await response.json();
                        if (response.ok && accountData) {
                          setSelectedPerson({ type: 'captain', data: accountData });
                        } else {
                          setSelectedPerson({ type: 'captain', data: teamCoachInfo.captain });
                        }
                      } else {
                        setSelectedPerson({ type: 'captain', data: teamCoachInfo.captain });
                      }
                      setShowDetailsModal(true);
                    } catch (error) {
                      setSelectedPerson({ type: 'captain', data: teamCoachInfo.captain });
                      setShowDetailsModal(true);
                    }
                  }}
                  className="text-left w-full hover:underline"
                >
                  <p className="font-medium text-gray-900">{teamCoachInfo.captain.name}</p>
                  <p className="text-sm text-gray-600">{teamCoachInfo.captain.email}</p>
                  {teamCoachInfo.captain.jerseyNumber && (
                    <p className="text-xs text-gray-500">#{teamCoachInfo.captain.jerseyNumber}</p>
                  )}
                </button>
              ) : (
                <p className="text-sm text-gray-500">Aucun capitaine</p>
              )}
            </div>

            {/* Joueurs */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-blue-900">Joueurs</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{players.length}</p>
              <p className="text-sm text-gray-600">joueur{players.length > 1 ? 's' : ''}</p>
            </div>
          </div>

          {/* Liste des joueurs */}
          {players.length > 0 && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 mb-3">Liste des joueurs</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {players.map((player) => (
                  <button
                    key={player.id}
                    onClick={async () => {
                      // Trouver le compte du joueur
                      const playerAccount = teamAccounts.players?.find((p: any) => p.email === player.email);
                      try {
                        if (playerAccount?.id) {
                          const response = await fetch(`/api/admin/get-account-details?accountId=${playerAccount.id}&accountType=player`);
                          const accountData = await response.json();
                          if (response.ok && accountData) {
                            setSelectedPerson({ type: 'player', data: accountData });
                          } else {
                            setSelectedPerson({ 
                              type: 'player', 
                              data: playerAccount || { ...player, name: player.name || `${player.firstName || ''} ${player.lastName || ''}`.trim() }
                            });
                          }
                        } else {
                          setSelectedPerson({ 
                            type: 'player', 
                            data: playerAccount || { ...player, name: player.name || `${player.firstName || ''} ${player.lastName || ''}`.trim() }
                          });
                        }
                        setShowDetailsModal(true);
                      } catch (error) {
                        setSelectedPerson({ 
                          type: 'player', 
                          data: playerAccount || { ...player, name: player.name || `${player.firstName || ''} ${player.lastName || ''}`.trim() }
                        });
                        setShowDetailsModal(true);
                      }
                    }}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition text-left"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                        {player.number || '?'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{player.name}</p>
                        <p className="text-xs text-gray-600">{player.position}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

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


      {/* Modal Gérer joueurs/coaches */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => {
          setShowManageModal(false)
          setEditingAccount(null)
          setShowManageForm(false)
        }}>
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                {editingAccount ? `Modifier ${editingAccount.type === 'coach' ? 'l\'entraîneur' : 'le joueur'}` : 'Gérer joueurs/coaches'}
              </h2>
              <button
                onClick={() => {
                  setShowManageModal(false)
                  setEditingAccount(null)
                  setShowManageForm(false)
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {/* Sélection équipe */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Équipe *</label>
              <select
                value={manageTeamId}
                onChange={(e) => {
                  setManageTeamId(e.target.value)
                  setEditingAccount(null)
                  setShowManageForm(false)
                }}
                className="w-full px-4 py-2 border rounded-lg"
                required
              >
                <option value="">Sélectionner une équipe</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>

            {/* Liste des joueurs/coaches si équipe sélectionnée */}
            {manageTeamId && (
              <div className="mb-6 space-y-4">
                {/* Liste des joueurs */}
                {teamAccounts.players.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Joueurs ({teamAccounts.players.length})</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {teamAccounts.players.map((player) => (
                        <div key={player.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium">{player.name}</p>
                            <p className="text-sm text-gray-600">{player.email}</p>
                            {player.position && <p className="text-xs text-gray-500">#{player.jerseyNumber} - {player.position}</p>}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                setManageIsCoach(false)
                                setShowManageForm(true)
                                setManageLoading(true)
                                try {
                                  const response = await fetch(`/api/admin/get-account-details?accountId=${player.id}&accountType=player`)
                                  const accountData = await response.json()
                                  
                                  if (response.ok && accountData) {
                                    setEditingAccount({ id: player.id, type: 'player', data: accountData })
                                    setManagePlayerData({
                                      firstName: accountData.firstName || '',
                                      lastName: accountData.lastName || '',
                                      nickname: accountData.nickname || '',
                                      email: accountData.email || '',
                                      phone: accountData.phone || '',
                                      birthDate: accountData.birthDate || '',
                                      height: accountData.height?.toString() || '',
                                      tshirtSize: accountData.tshirtSize || 'M',
                                      position: accountData.position || '',
                                      foot: accountData.foot || '',
                                      jerseyNumber: accountData.jerseyNumber?.toString() || ''
                                    })
                                  } else {
                                    setEditingAccount({ id: player.id, type: 'player', data: player })
                                    setManagePlayerData({
                                      firstName: player.firstName || '',
                                      lastName: player.lastName || '',
                                      nickname: player.nickname || '',
                                      email: player.email || '',
                                      phone: player.phone || '',
                                      birthDate: player.birthDate || '',
                                      height: player.height?.toString() || '',
                                      tshirtSize: player.tshirtSize || 'M',
                                      position: player.position || '',
                                      foot: player.foot || '',
                                      jerseyNumber: player.jerseyNumber?.toString() || ''
                                    })
                                  }
                                } catch (error) {
                                  console.error('Erreur chargement données:', error)
                                  setEditingAccount({ id: player.id, type: 'player', data: player })
                                  setManagePlayerData({
                                    firstName: player.firstName || '',
                                    lastName: player.lastName || '',
                                    nickname: player.nickname || '',
                                    email: player.email || '',
                                    phone: player.phone || '',
                                    birthDate: player.birthDate || '',
                                    height: player.height?.toString() || '',
                                    tshirtSize: player.tshirtSize || 'M',
                                    position: player.position || '',
                                    foot: player.foot || '',
                                    jerseyNumber: player.jerseyNumber?.toString() || ''
                                  })
                                } finally {
                                  setManageLoading(false)
                                }
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm(`Supprimer ${player.name} ?`)) return
                                setManageLoading(true)
                                try {
                                  const response = await fetch('/api/admin/delete-account', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      accountId: player.id,
                                      accountType: 'player',
                                      email: player.email
                                    })
                                  })
                                  const data = await response.json()
                                  if (response.ok) {
                                    setSuccess(data.message)
                                    loadTeamAccounts()
                                    loadPlayers()
                                  } else {
                                    setError(data.error)
                                  }
                                } catch (error) {
                                  setError('Erreur lors de la suppression')
                                } finally {
                                  setManageLoading(false)
                                }
                              }}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Liste des coaches */}
                {teamAccounts.coaches.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Coaches ({teamAccounts.coaches.length})</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {teamAccounts.coaches.map((coach) => (
                        <div key={coach.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                          <div>
                            <p className="font-medium">{coach.name}</p>
                            <p className="text-sm text-gray-600">{coach.email}</p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                setManageIsCoach(true)
                                setShowManageForm(true)
                                setManageLoading(true)
                                try {
                                  const response = await fetch(`/api/admin/get-account-details?accountId=${coach.id}&accountType=coach`)
                                  const accountData = await response.json()
                                  
                                  if (response.ok && accountData) {
                                    setEditingAccount({ id: coach.id, type: 'coach', data: accountData })
                                    setManagePlayerData({
                                      firstName: accountData.firstName || '',
                                      lastName: accountData.lastName || '',
                                      nickname: '',
                                      email: accountData.email || '',
                                      phone: accountData.phone || '',
                                      birthDate: accountData.birthDate || '',
                                      height: '',
                                      tshirtSize: 'M',
                                      position: '',
                                      foot: '',
                                      jerseyNumber: ''
                                    })
                                  } else {
                                    setEditingAccount({ id: coach.id, type: 'coach', data: coach })
                                    setManagePlayerData({
                                      firstName: coach.firstName || '',
                                      lastName: coach.lastName || '',
                                      nickname: '',
                                      email: coach.email || '',
                                      phone: coach.phone || '',
                                      birthDate: coach.birthDate || '',
                                      height: '',
                                      tshirtSize: 'M',
                                      position: '',
                                      foot: '',
                                      jerseyNumber: ''
                                    })
                                  }
                                } catch (error) {
                                  console.error('Erreur chargement données:', error)
                                  setEditingAccount({ id: coach.id, type: 'coach', data: coach })
                                  setManagePlayerData({
                                    firstName: coach.firstName || '',
                                    lastName: coach.lastName || '',
                                    nickname: '',
                                    email: coach.email || '',
                                    phone: coach.phone || '',
                                    birthDate: coach.birthDate || '',
                                    height: '',
                                    tshirtSize: 'M',
                                    position: '',
                                    foot: '',
                                    jerseyNumber: ''
                                  })
                                } finally {
                                  setManageLoading(false)
                                }
                              }}
                              className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                            >
                              Modifier
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm(`Supprimer ${coach.name} ?`)) return
                                setManageLoading(true)
                                try {
                                  const response = await fetch('/api/admin/delete-account', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      accountId: coach.id,
                                      accountType: 'coach',
                                      email: coach.email
                                    })
                                  })
                                  const data = await response.json()
                                  if (response.ok) {
                                    setSuccess(data.message)
                                    loadTeamAccounts()
                                  } else {
                                    setError(data.error)
                                  }
                                } catch (error) {
                                  setError('Erreur lors de la suppression')
                                } finally {
                                  setManageLoading(false)
                                }
                              }}
                              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Boutons ajouter */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      setEditingAccount(null)
                      setManageIsCoach(false)
                      setShowManageForm(true)
                      setManagePlayerData({
                        firstName: '',
                        lastName: '',
                        nickname: '',
                        email: '',
                        phone: '',
                        birthDate: '',
                        height: '',
                        tshirtSize: 'M',
                        position: '',
                        foot: '',
                        jerseyNumber: ''
                      })
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    + Ajouter un joueur
                  </button>
                  <button
                    onClick={() => {
                      setEditingAccount(null)
                      setManageIsCoach(true)
                      setShowManageForm(true)
                      setManagePlayerData({
                        firstName: '',
                        lastName: '',
                        nickname: '',
                        email: '',
                        phone: '',
                        birthDate: '',
                        height: '',
                        tshirtSize: 'M',
                        position: '',
                        foot: '',
                        jerseyNumber: ''
                      })
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                  >
                    + Ajouter un coach
                  </button>
                </div>
              </div>
            )}

            {/* Formulaire d'ajout/modification */}
            {manageTeamId && showManageForm && (
              <div className="mt-6 border-t-2 border-gray-200 pt-6 bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">{editingAccount ? '✏️ Modifier' : '➕ Ajouter'} un {manageIsCoach ? 'entraîneur' : 'joueur'}</h3>
                
                {/* Type - seulement si on ajoute (pas en mode édition) */}
                {!editingAccount && (
                  <div className="mb-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={manageIsCoach}
                        onChange={(e) => setManageIsCoach(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-medium">C'est un entraîneur</span>
                    </label>
                  </div>
                )}

                {/* Infos de l'équipe sélectionnée */}
                {teams.find(t => t.id === manageTeamId) && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2">📋 Informations de l'équipe</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Équipe:</span> {teams.find(t => t.id === manageTeamId)?.name}</p>
                      {(teams.find(t => t.id === manageTeamId)?.schoolName || teams.find(t => t.id === manageTeamId)?.school) && (
                        <p><span className="font-medium">École:</span> {teams.find(t => t.id === manageTeamId)?.schoolName || teams.find(t => t.id === manageTeamId)?.school}</p>
                      )}
                      {teams.find(t => t.id === manageTeamId)?.teamGrade && (
                        <p><span className="font-medium">Classe:</span> {teams.find(t => t.id === manageTeamId)?.teamGrade}</p>
                      )}
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                      ℹ️ Le joueur/coach sera {editingAccount ? 'modifié' : 'ajouté'} à cette équipe avec ces informations communes
                    </p>
                  </div>
                )}

                {/* Formulaire */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Prénom *</label>
                    <input
                      type="text"
                      value={managePlayerData.firstName}
                      onChange={(e) => setManagePlayerData({...managePlayerData, firstName: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Nom *</label>
                    <input
                      type="text"
                      value={managePlayerData.lastName}
                      onChange={(e) => setManagePlayerData({...managePlayerData, lastName: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  {!manageIsCoach && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Surnom</label>
                      <input
                        type="text"
                        value={managePlayerData.nickname}
                        onChange={(e) => setManagePlayerData({...managePlayerData, nickname: e.target.value})}
                        className="w-full px-4 py-2 border rounded-lg"
                        maxLength={15}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-2">Email *</label>
                    <input
                      type="email"
                      value={managePlayerData.email}
                      onChange={(e) => setManagePlayerData({...managePlayerData, email: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Téléphone *</label>
                    <input
                      type="tel"
                      value={managePlayerData.phone}
                      onChange={(e) => setManagePlayerData({...managePlayerData, phone: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Date de naissance</label>
                    <input
                      type="date"
                      value={managePlayerData.birthDate}
                      onChange={(e) => setManagePlayerData({...managePlayerData, birthDate: e.target.value})}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                  </div>
                  {!manageIsCoach && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">Taille (cm)</label>
                        <input
                          type="number"
                          value={managePlayerData.height}
                          onChange={(e) => setManagePlayerData({...managePlayerData, height: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Taille T-shirt</label>
                        <select
                          value={managePlayerData.tshirtSize}
                          onChange={(e) => setManagePlayerData({...managePlayerData, tshirtSize: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg"
                        >
                          <option value="XS">XS</option>
                          <option value="S">S</option>
                          <option value="M">M</option>
                          <option value="L">L</option>
                          <option value="XL">XL</option>
                          <option value="XXL">XXL</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Position *</label>
                        <select
                          value={managePlayerData.position}
                          onChange={(e) => setManagePlayerData({...managePlayerData, position: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg"
                          required
                        >
                          <option value="">Sélectionner...</option>
                          <option value="Gardien">Gardien</option>
                          <option value="Défenseur">Défenseur</option>
                          <option value="Milieu">Milieu</option>
                          <option value="Attaquant">Attaquant</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Pied *</label>
                        <select
                          value={managePlayerData.foot}
                          onChange={(e) => setManagePlayerData({...managePlayerData, foot: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg"
                          required
                        >
                          <option value="">Sélectionner...</option>
                          <option value="Droitier">Droitier</option>
                          <option value="Gaucher">Gaucher</option>
                          <option value="Ambidextre">Ambidextre</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">N° Maillot *</label>
                        <input
                          type="number"
                          value={managePlayerData.jerseyNumber}
                          onChange={(e) => setManagePlayerData({...managePlayerData, jerseyNumber: e.target.value})}
                          className="w-full px-4 py-2 border rounded-lg"
                          min="1"
                          max="99"
                          required
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Boutons */}
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setShowManageForm(false)
                      setEditingAccount(null)
                    }}
                    className="flex-1 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={async () => {
                      if (!manageTeamId || !managePlayerData.firstName || !managePlayerData.lastName || !managePlayerData.email || !managePlayerData.phone) {
                        alert('Veuillez remplir tous les champs obligatoires')
                        return
                      }
                      if (!manageIsCoach && (!managePlayerData.position || !managePlayerData.foot || !managePlayerData.jerseyNumber)) {
                        alert('Veuillez remplir tous les champs obligatoires du joueur')
                        return
                      }
                      
                      setManageLoading(true)
                      try {
                        if (editingAccount) {
                          // Mode modification
                          const response = await fetch('/api/admin/update-account', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              accountId: editingAccount.id,
                              accountType: editingAccount.type,
                              teamId: manageTeamId,
                              updates: {
                                firstName: managePlayerData.firstName,
                                lastName: managePlayerData.lastName,
                                email: managePlayerData.email,
                                phone: managePlayerData.phone,
                                birthDate: managePlayerData.birthDate,
                                ...(manageIsCoach ? {} : {
                                  nickname: managePlayerData.nickname,
                                  height: managePlayerData.height,
                                  tshirtSize: managePlayerData.tshirtSize,
                                  foot: managePlayerData.foot,
                                  position: managePlayerData.position,
                                  jerseyNumber: parseInt(managePlayerData.jerseyNumber) || 0
                                })
                              }
                            })
                          })
                          
                          const data = await response.json()
                          if (response.ok) {
                            setSuccess(`${editingAccount.type === 'coach' ? 'Entraîneur' : 'Joueur'} modifié avec succès!`)
                            setEditingAccount(null)
                            setShowManageForm(false)
                            loadTeamAccounts()
                            loadPlayers()
                            setManagePlayerData({
                              firstName: '',
                              lastName: '',
                              nickname: '',
                              email: '',
                              phone: '',
                              birthDate: '',
                              height: '',
                              tshirtSize: 'M',
                              position: '',
                              foot: '',
                              jerseyNumber: ''
                            })
                          } else {
                            setError(data.error)
                          }
                        } else {
                          // Mode ajout
                          const response = await fetch('/api/admin/add-player-to-team', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              teamId: manageTeamId,
                              player: managePlayerData,
                              isCoach: manageIsCoach
                            })
                          })
                          
                          const data = await response.json()
                          if (response.ok) {
                            setSuccess(data.message)
                            setShowManageForm(false)
                            loadTeamAccounts()
                            loadPlayers()
                            setManagePlayerData({
                              firstName: '',
                              lastName: '',
                              nickname: '',
                              email: '',
                              phone: '',
                              birthDate: '',
                              height: '',
                              tshirtSize: 'M',
                              position: '',
                              foot: '',
                              jerseyNumber: ''
                            })
                            setManageIsCoach(false)
                          } else {
                            setError(data.error)
                          }
                        }
                      } catch (error) {
                        setError(`Erreur lors de ${editingAccount ? 'la modification' : 'l\'ajout'}`)
                      } finally {
                        setManageLoading(false)
                      }
                    }}
                    disabled={manageLoading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {manageLoading ? (editingAccount ? 'Modification en cours...' : 'Ajout en cours...') : (editingAccount ? 'Modifier' : 'Ajouter')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de détails avec modification */}
      {showDetailsModal && selectedPerson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {selectedPerson.type === 'coach' && 'Coach'}
                  {selectedPerson.type === 'actingCoach' && 'Coach Intérimaire'}
                  {selectedPerson.type === 'captain' && 'Capitaine'}
                  {selectedPerson.type === 'player' && 'Joueur'}
                </h3>
                <p className="text-gray-600 mt-1">{selectedPerson.data.name}</p>
              </div>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedPerson(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Informations de contact */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600" />
                  Informations de contact
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                    <input
                      type="text"
                      value={selectedPerson.data.firstName || ''}
                      onChange={(e) => {
                        const firstName = e.target.value;
                        const lastName = selectedPerson.data.lastName || '';
                        setSelectedPerson({
                          ...selectedPerson,
                          data: { 
                            ...selectedPerson.data, 
                            firstName,
                            name: `${firstName} ${lastName}`.trim() || selectedPerson.data.name
                          }
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                    <input
                      type="text"
                      value={selectedPerson.data.lastName || ''}
                      onChange={(e) => {
                        const lastName = e.target.value;
                        const firstName = selectedPerson.data.firstName || '';
                        setSelectedPerson({
                          ...selectedPerson,
                          data: { 
                            ...selectedPerson.data, 
                            lastName,
                            name: `${firstName} ${lastName}`.trim() || selectedPerson.data.name
                          }
                        });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={selectedPerson.data.email || ''}
                      onChange={(e) => setSelectedPerson({
                        ...selectedPerson,
                        data: { ...selectedPerson.data, email: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={selectedPerson.data.phone || ''}
                      onChange={(e) => setSelectedPerson({
                        ...selectedPerson,
                        data: { ...selectedPerson.data, phone: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date de naissance
                    </label>
                    <input
                      type="date"
                      value={selectedPerson.data.birthDate || ''}
                      onChange={(e) => setSelectedPerson({
                        ...selectedPerson,
                        data: { ...selectedPerson.data, birthDate: e.target.value }
                      })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  {selectedPerson.type === 'player' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Surnom</label>
                        <input
                          type="text"
                          value={selectedPerson.data.nickname || ''}
                          onChange={(e) => setSelectedPerson({
                            ...selectedPerson,
                            data: { ...selectedPerson.data, nickname: e.target.value }
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Numéro de maillot</label>
                        <input
                          type="number"
                          value={selectedPerson.data.jerseyNumber || selectedPerson.data.number || ''}
                          onChange={(e) => setSelectedPerson({
                            ...selectedPerson,
                            data: { ...selectedPerson.data, jerseyNumber: parseInt(e.target.value) || 0, number: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                        <select
                          value={selectedPerson.data.position || ''}
                          onChange={(e) => setSelectedPerson({
                            ...selectedPerson,
                            data: { ...selectedPerson.data, position: e.target.value }
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                          <option value="">-- Sélectionner --</option>
                          {POSITIONS.map((pos) => (
                            <option key={pos} value={pos}>{pos}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Taille (cm)</label>
                        <input
                          type="number"
                          value={selectedPerson.data.height || ''}
                          onChange={(e) => setSelectedPerson({
                            ...selectedPerson,
                            data: { ...selectedPerson.data, height: parseInt(e.target.value) || 0 }
                          })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedPerson(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  onClick={async () => {
                    try {
                      setManageLoading(true);
                      const accountType = selectedPerson.type === 'coach' ? 'coach' : 'player';
                      const accountId = selectedPerson.data.id;
                      
                      const firstName = selectedPerson.data.firstName || '';
                      const lastName = selectedPerson.data.lastName || '';
                      const fullName = `${firstName} ${lastName}`.trim() || selectedPerson.data.name || '';
                      
                      const response = await fetch('/api/admin/update-account', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          accountId,
                          accountType,
                          updates: {
                            firstName,
                            lastName,
                            name: fullName,
                            email: selectedPerson.data.email,
                            phone: selectedPerson.data.phone,
                            birthDate: selectedPerson.data.birthDate,
                            nickname: selectedPerson.data.nickname,
                            height: selectedPerson.data.height,
                            position: selectedPerson.data.position,
                            jerseyNumber: selectedPerson.data.jerseyNumber || selectedPerson.data.number
                          }
                        })
                      });

                      const result = await response.json();
                      if (response.ok) {
                        setSuccess('Informations mises à jour avec succès!');
                        await loadTeamInfo();
                        await loadTeamAccounts();
                        await loadPlayers();
                        setShowDetailsModal(false);
                        setSelectedPerson(null);
                        setTimeout(() => setSuccess(null), 3000);
                      } else {
                        setError(result.error || 'Erreur lors de la mise à jour');
                      }
                    } catch (error) {
                      setError('Erreur lors de la mise à jour');
                    } finally {
                      setManageLoading(false);
                    }
                  }}
                  disabled={manageLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {manageLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Enregistrer les modifications
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gestion des Capitaines et Coachs */}
      {showCaptainsCoachesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowCaptainsCoachesModal(false)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">Gestion des Capitaines et Coachs</h3>
              <button
                onClick={() => setShowCaptainsCoachesModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <CaptainsCoachesManager />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
