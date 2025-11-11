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

  // Get top players for highlights
  const topScorers = [...players]
    .sort((a, b) => (b.seasonStats?.goals || 0) - (a.seasonStats?.goals || 0))
    .slice(0, 3)
  
  const topRated = [...players]
    .sort((a, b) => (b.overall || 0) - (a.overall || 0))
    .slice(0, 3)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Compact Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-sofa-text-primary mb-2">
          🎮 Cartes FIFA des Joueurs
        </h1>
        <p className="text-sofa-text-secondary">
          Découvrez tous les joueurs de la ComeBac League avec leurs statistiques FIFA
        </p>
      </div>

      {/* Top Players Highlights - Priority Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Scorers */}
        <div className="sofa-card p-6">
          <h2 className="text-lg font-bold text-sofa-text-primary mb-4 flex items-center gap-2">
            ⚽ Meilleurs Buteurs
          </h2>
          <div className="space-y-3">
            {topScorers.map((player, index) => {
              const team = teams.find(t => t.id === player.teamId)
              return (
                <div key={player.id} className="flex items-center gap-3 p-3 bg-sofa-bg-tertiary rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    index === 0 ? 'bg-sofa-green' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sofa-text-primary">{player.name}</div>
                    <div className="text-sm text-sofa-text-muted">{team?.name} • #{player.number}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-sofa-text-accent">{player.seasonStats?.goals || 0}</div>
                    <div className="text-xs text-sofa-text-muted">buts</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Rated */}
        <div className="sofa-card p-6">
          <h2 className="text-lg font-bold text-sofa-text-primary mb-4 flex items-center gap-2">
            ⭐ Meilleures Notes
          </h2>
          <div className="space-y-3">
            {topRated.map((player, index) => {
              const team = teams.find(t => t.id === player.teamId)
              return (
                <div key={player.id} className="flex items-center gap-3 p-3 bg-sofa-bg-tertiary rounded-lg">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    index === 0 ? 'bg-sofa-green' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sofa-text-primary">{player.name}</div>
                    <div className="text-sm text-sofa-text-muted">{team?.name} • {player.position}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-sofa-text-accent">{player.overall || 0}</div>
                    <div className="text-xs text-sofa-text-muted">note</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats - More Compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="sofa-stat-card">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-sofa-blue" />
            <span className="text-sm font-medium text-sofa-text-secondary">Total</span>
          </div>
          <div className="sofa-stat-number text-xl">{players.length}</div>
        </div>

        <div className="sofa-stat-card">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">⭐</span>
            <span className="text-sm font-medium text-sofa-text-secondary">Elite (80+)</span>
          </div>
          <div className="sofa-stat-number text-xl">
            {players.filter((p) => p.overall && p.overall >= 80).length}
          </div>
        </div>

        <div className="sofa-stat-card">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">⚽</span>
            <span className="text-sm font-medium text-sofa-text-secondary">Buts</span>
          </div>
          <div className="sofa-stat-number text-xl">
            {players.reduce((sum, p) => sum + (p.seasonStats?.goals || 0), 0)}
          </div>
        </div>

        <div className="sofa-stat-card">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🎯</span>
            <span className="text-sm font-medium text-sofa-text-secondary">Passes</span>
          </div>
          <div className="sofa-stat-number text-xl">
            {players.reduce((sum, p) => sum + (p.seasonStats?.assists || 0), 0)}
          </div>
        </div>
      </div>

      {/* Improved Filters */}
      <div className="sofa-card p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-sofa-text-primary flex items-center gap-2">
            <Search className="w-4 h-4" />
            Recherche et Filtres
          </h2>
          <span className="text-sm text-sofa-text-muted">
            {filteredPlayers.length} joueur{filteredPlayers.length > 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-sofa-text-muted" />
              <input
                type="text"
                placeholder="Nom ou numéro..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-sofa-border rounded-lg bg-sofa-bg-card text-sofa-text-primary placeholder-sofa-text-muted focus:ring-2 focus:ring-sofa-text-accent outline-none"
              />
            </div>
          </div>

          {/* Team Filter */}
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="px-3 py-2 border border-sofa-border rounded-lg bg-sofa-bg-card text-sofa-text-primary focus:ring-2 focus:ring-sofa-text-accent outline-none"
          >
            <option value="all">Toutes équipes</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>

          {/* Position Filter */}
          <select
            value={selectedPosition}
            onChange={(e) => setSelectedPosition(e.target.value)}
            className="px-3 py-2 border border-sofa-border rounded-lg bg-sofa-bg-card text-sofa-text-primary focus:ring-2 focus:ring-sofa-text-accent outline-none"
          >
            <option value="all">Toutes positions</option>
            {positions.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-sofa-border rounded-lg bg-sofa-bg-card text-sofa-text-primary focus:ring-2 focus:ring-sofa-text-accent outline-none"
          >
            <option value="overall">Note générale</option>
            <option value="name">Nom A-Z</option>
            <option value="goals">Plus de buts</option>
            <option value="assists">Plus de passes</option>
          </select>
        </div>

        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-sofa-border">
          <button
            onClick={() => {
              setSelectedPosition("all")
              setSortBy("overall")
            }}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedPosition === "all" && sortBy === "overall"
                ? 'bg-sofa-text-accent text-white' 
                : 'bg-sofa-bg-tertiary text-sofa-text-muted hover:bg-sofa-bg-hover'
            }`}
          >
            🌟 Tous les talents
          </button>
          <button
            onClick={() => {
              setSelectedPosition("Attaquant")
              setSortBy("goals")
            }}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedPosition === "Attaquant" && sortBy === "goals"
                ? 'bg-sofa-red text-white' 
                : 'bg-sofa-bg-tertiary text-sofa-text-muted hover:bg-sofa-bg-hover'
            }`}
          >
            ⚽ Buteurs
          </button>
          <button
            onClick={() => {
              setSelectedPosition("Milieu")
              setSortBy("assists")
            }}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedPosition === "Milieu" && sortBy === "assists"
                ? 'bg-sofa-blue text-white' 
                : 'bg-sofa-bg-tertiary text-sofa-text-muted hover:bg-sofa-bg-hover'
            }`}
          >
            🎯 Passeurs
          </button>
          <button
            onClick={() => {
              setSelectedPosition("Gardien")
              setSortBy("overall")
            }}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedPosition === "Gardien"
                ? 'bg-sofa-green text-white' 
                : 'bg-sofa-bg-tertiary text-sofa-text-muted hover:bg-sofa-bg-hover'
            }`}
          >
            🥅 Gardiens
          </button>
        </div>
      </div>

      {/* Players Grid - Improved Layout */}
      <div className="space-y-6">
        {filteredPlayers.length > 0 ? (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-sofa-text-primary">
                Cartes des Joueurs
              </h2>
              <div className="text-sm text-sofa-text-muted">
                {filteredPlayers.length} résultat{filteredPlayers.length > 1 ? 's' : ''}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 justify-items-center">
              {filteredPlayers.map((player, index) => {
                const team = teams.find((t) => t.id === player.teamId);

                return (
                  <div 
                    key={player.id}
                    className="transform transition-all duration-200 hover:scale-105"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <FifaCardPersonal player={player} team={team} />
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="sofa-card p-12 text-center">
            <Users className="w-16 h-16 text-sofa-text-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-sofa-text-primary mb-2">
              Aucun joueur trouvé
            </h3>
            <p className="text-sofa-text-muted mb-4">
              Essayez de modifier vos critères de recherche
            </p>
            <button
              onClick={() => {
                setSearchTerm("")
                setSelectedTeam("all")
                setSelectedPosition("all")
                setSortBy("overall")
              }}
              className="sofa-btn-secondary sofa-btn"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>

      {/* Card Legend - Improved */}
      <div className="sofa-card p-6 mt-8">
        <h3 className="text-lg font-semibold text-sofa-text-primary mb-4 flex items-center gap-2">
          🎨 Légende des Cartes FIFA
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="flex items-center gap-3 p-3 bg-sofa-bg-tertiary rounded-lg">
            <div className="w-6 h-6 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg shadow-sm"></div>
            <div>
              <div className="font-medium text-sofa-text-primary">Légende</div>
              <div className="text-xs text-sofa-text-muted">90+ Note</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-sofa-bg-tertiary rounded-lg">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg shadow-sm"></div>
            <div>
              <div className="font-medium text-sofa-text-primary">Héros</div>
              <div className="text-xs text-sofa-text-muted">85-89 Note</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-sofa-bg-tertiary rounded-lg">
            <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg shadow-sm"></div>
            <div>
              <div className="font-medium text-sofa-text-primary">Rare</div>
              <div className="text-xs text-sofa-text-muted">80-84 Note</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-sofa-bg-tertiary rounded-lg">
            <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-green-600 rounded-lg shadow-sm"></div>
            <div>
              <div className="font-medium text-sofa-text-primary">Non-rare</div>
              <div className="text-xs text-sofa-text-muted">75-79 Note</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-sofa-bg-tertiary rounded-lg">
            <div className="w-6 h-6 bg-gradient-to-r from-gray-400 to-gray-600 rounded-lg shadow-sm"></div>
            <div>
              <div className="font-medium text-sofa-text-primary">Bronze</div>
              <div className="text-xs text-sofa-text-muted">&lt;75 Note</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
