"use client";

import { useEffect, useState } from "react";
// Using API endpoints instead of direct DB calls
import { FifaCardPersonal } from "@/components/fifa/fifa-card-personal";
import type { Team, Player } from "@/lib/types";
import { Users, Search } from "lucide-react";

export default function PlayersPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedPosition, setSelectedPosition] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("overall");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterPlayers();
  }, [players, searchTerm, selectedTeam, selectedPosition, sortBy]);

  const loadData = async () => {
    try {
      const [teamsResponse, playersResponse] = await Promise.all([
        fetch("/api/admin/teams"),
        fetch("/api/admin/players"),
      ]);

      if (!teamsResponse.ok || !playersResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const teamsData = await teamsResponse.json();
      const playersData = await playersResponse.json();

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
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterPlayers = () => {
    let filtered = [...players];

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(
        (player) =>
          player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          player.number.toString().includes(searchTerm)
      );
    }

    // Filtre par équipe
    if (selectedTeam !== "all") {
      filtered = filtered.filter((player) => player.teamId === selectedTeam);
    }

    // Filtre par position
    if (selectedPosition !== "all") {
      filtered = filtered.filter(
        (player) => player.position === selectedPosition
      );
    }

    // Tri
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "overall":
          return (b.overall || 0) - (a.overall || 0);
        case "name":
          return a.name.localeCompare(b.name);
        case "goals":
          return (b.seasonStats?.goals || 0) - (a.seasonStats?.goals || 0);
        case "assists":
          return (b.seasonStats?.assists || 0) - (a.seasonStats?.assists || 0);
        default:
          return 0;
      }
    });

    setFilteredPlayers(filtered);
  };

  const positions = ["Gardien", "Défenseur", "Milieu", "Attaquant"];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des joueurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-500 mb-4">
          🎮 FIFA Ultimate Team - Cartes Authentiques
        </h1>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="bg-white rounded-lg shadow p-3 md:p-4 text-center">
          <div className="text-xl md:text-2xl font-bold text-blue-600 mb-1">
            {players.length}
          </div>
          <div className="text-xs md:text-sm text-gray-600">Joueurs Total</div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 md:p-4 text-center">
          <div className="text-xl md:text-2xl font-bold text-green-600 mb-1">
            {players.filter((p) => p.overall && p.overall >= 80).length}
          </div>
          <div className="text-xs md:text-sm text-gray-600">
            Joueurs Elite (80+)
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 md:p-4 text-center">
          <div className="text-xl md:text-2xl font-bold text-blue-600 mb-1">
            {players.reduce((sum, p) => sum + (p.seasonStats?.goals || 0), 0)}
          </div>
          <div className="text-xs md:text-sm text-gray-600">Buts Total</div>
        </div>

        <div className="bg-white rounded-lg shadow p-3 md:p-4 text-center">
          <div className="text-xl md:text-2xl font-bold text-yellow-600 mb-1">
            {players.reduce((sum, p) => sum + (p.seasonStats?.assists || 0), 0)}
          </div>
          <div className="text-xs md:text-sm text-gray-600">Passes Total</div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="bg-white rounded-lg shadow p-4 md:p-6 mb-8">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-4 items-stretch sm:items-center">
          {/* Recherche */}
          <div className="flex-1 min-w-full sm:min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un joueur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Filtre équipe */}
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Toutes les équipes</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>

          {/* Filtre position */}
          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">Toutes les positions</option>
            {positions.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>

          {/* Tri */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="overall">Note générale</option>
            <option value="name">Nom</option>
            <option value="goals">Buts</option>
            <option value="assists">Passes</option>
          </select>
        </div>
      </div>

      {/* Grille de cartes */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Tous les Joueurs ({filteredPlayers.length})
          </h2>
        </div>

        {filteredPlayers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8 justify-items-center">
            {filteredPlayers.map((player) => {
              const team = teams.find((t) => t.id === player.teamId);

              return (
                <FifaCardPersonal key={player.id} player={player} team={team} />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Aucun joueur trouvé
            </h3>
            <p className="text-gray-600">
              Essayez de modifier vos critères de recherche
            </p>
          </div>
        )}
      </div>

      {/* Légende des couleurs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Légende des Cartes
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded"></div>
            <span className="text-sm text-gray-600">
              Légende (90+)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-purple-400 to-purple-600 rounded"></div>
            <span className="text-sm text-gray-600">
              Héros (85+)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-blue-400 to-blue-600 rounded"></div>
            <span className="text-sm text-gray-600">Rare (80+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-green-600 rounded"></div>
            <span className="text-sm text-gray-600">
              Non-rare (75+)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gradient-to-r from-gray-400 to-gray-600 rounded"></div>
            <span className="text-sm text-gray-600">
              Bronze (&lt;75)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
