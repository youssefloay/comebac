"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, TrendingDown, Users, Star, Trophy, Activity } from "lucide-react";
import type { Player, Team } from "@/lib/types";
import type { PlayerFantasyStats } from "@/lib/types/fantasy";

export default function FantasyPlayerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.id as string;

  const [player, setPlayer] = useState<Player | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [fantasyStats, setFantasyStats] = useState<PlayerFantasyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlayerData();
  }, [playerId]);

  const loadPlayerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch player data
      const playersResponse = await fetch("/api/admin/players");
      if (!playersResponse.ok) throw new Error("Failed to fetch players");
      const playersData = await playersResponse.json();
      const playerData = playersData.find((p: any) => p.id === playerId);

      if (!playerData) {
        setError("Joueur non trouvé");
        setLoading(false);
        return;
      }

      setPlayer({
        ...playerData,
        createdAt: playerData.createdAt
          ? new Date(playerData.createdAt.seconds * 1000)
          : new Date(),
        updatedAt: playerData.updatedAt
          ? new Date(playerData.updatedAt.seconds * 1000)
          : new Date(),
      });

      // Fetch team data
      if (playerData.teamId) {
        const teamsResponse = await fetch("/api/admin/teams");
        if (teamsResponse.ok) {
          const teamsData = await teamsResponse.json();
          const teamData = teamsData.find((t: any) => t.id === playerData.teamId);
          if (teamData) {
            setTeam({
              ...teamData,
              createdAt: teamData.createdAt
                ? new Date(teamData.createdAt.seconds * 1000)
                : new Date(),
              updatedAt: teamData.updatedAt
                ? new Date(teamData.updatedAt.seconds * 1000)
                : new Date(),
            });
          }
        }
      }

      // Fetch fantasy stats
      const fantasyResponse = await fetch(`/api/fantasy/player-stats/${playerId}`);
      if (fantasyResponse.ok) {
        const fantasyData = await fantasyResponse.json();
        setFantasyStats(fantasyData);
      }
    } catch (err) {
      console.error("Error loading player data:", err);
      setError("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-green-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="sofa-card p-8 text-center">
          <p className="text-red-600 mb-4">{error || "Joueur non trouvé"}</p>
          <button
            onClick={() => router.back()}
            className="sofa-btn sofa-btn-secondary"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  const priceChange = fantasyStats?.priceChange || 0;
  const form = fantasyStats?.form || [];
  const avgForm = form.length > 0 ? form.reduce((a, b) => a + b, 0) / form.length : 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sofa-text-secondary hover:text-sofa-text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Retour</span>
      </button>

      {/* Player Header */}
      <div className="sofa-card p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Player Photo */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-lg overflow-hidden bg-sofa-bg-tertiary">
              {player.photo ? (
                <img
                  src={player.photo}
                  alt={player.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-sofa-text-muted">
                  👤
                </div>
              )}
            </div>
          </div>

          {/* Player Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold text-sofa-text-primary mb-2">
                  {player.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sofa-text-secondary">
                  <span className="flex items-center gap-1">
                    <span className="font-semibold">#{player.number}</span>
                  </span>
                  <span>•</span>
                  <span>{player.position}</span>
                  {team && (
                    <>
                      <span>•</span>
                      <span>{team.name}</span>
                    </>
                  )}
                  {player.school && (
                    <>
                      <span>•</span>
                      <span>{player.school}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Fantasy Price */}
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-sofa-bg-tertiary px-4 py-2 rounded-lg">
                <div className="text-sm text-sofa-text-muted mb-1">Prix Fantasy</div>
                <div className="text-2xl font-bold text-sofa-text-accent">
                  {fantasyStats?.price?.toFixed(1) || "N/A"}M€
                </div>
              </div>

              {priceChange !== 0 && (
                <div className={`flex items-center gap-1 ${priceChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {priceChange > 0 ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                  <span className="font-semibold">
                    {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}M€
                  </span>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-sofa-bg-tertiary px-3 py-2 rounded-lg text-center">
                <div className="text-sm text-sofa-text-muted mb-1">Points</div>
                <div className="text-xl font-bold text-sofa-text-primary">
                  {fantasyStats?.totalPoints || 0}
                </div>
              </div>
              <div className="bg-sofa-bg-tertiary px-3 py-2 rounded-lg text-center">
                <div className="text-sm text-sofa-text-muted mb-1">Forme</div>
                <div className="text-xl font-bold text-sofa-text-primary">
                  {avgForm.toFixed(1)}
                </div>
              </div>
              <div className="bg-sofa-bg-tertiary px-3 py-2 rounded-lg text-center">
                <div className="text-sm text-sofa-text-muted mb-1">Popularité</div>
                <div className="text-xl font-bold text-sofa-text-primary">
                  {fantasyStats?.popularity?.toFixed(0) || 0}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fantasy Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Form Chart */}
        <div className="sofa-card p-6">
          <h2 className="text-lg font-bold text-sofa-text-primary mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Forme (5 derniers matchs)
          </h2>
          {form.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-end justify-between gap-2 h-32">
                {form.map((points, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-sofa-text-accent rounded-t transition-all"
                      style={{
                        height: `${Math.max((points / 15) * 100, 5)}%`,
                        opacity: 0.7 + (index * 0.06)
                      }}
                    ></div>
                    <span className="text-sm font-semibold text-sofa-text-primary">
                      {points}
                    </span>
                  </div>
                ))}
              </div>
              <div className="text-center pt-3 border-t border-sofa-border">
                <span className="text-sm text-sofa-text-muted">
                  Moyenne: <span className="font-semibold text-sofa-text-primary">{avgForm.toFixed(1)} pts</span>
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sofa-text-muted text-center py-8">
              Aucune donnée de forme disponible
            </p>
          )}
        </div>

        {/* Popularity */}
        <div className="sofa-card p-6">
          <h2 className="text-lg font-bold text-sofa-text-primary mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Popularité
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-sofa-text-muted">Sélectionné par</span>
                <span className="font-semibold text-sofa-text-primary">
                  {fantasyStats?.popularity?.toFixed(1) || 0}% des équipes
                </span>
              </div>
              <div className="w-full bg-sofa-bg-tertiary rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-sofa-text-accent rounded-full transition-all"
                  style={{ width: `${Math.min(fantasyStats?.popularity || 0, 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="pt-4 border-t border-sofa-border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-sofa-text-muted">Équipes</span>
                <span className="text-2xl font-bold text-sofa-text-primary">
                  {fantasyStats?.selectedBy || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real Stats */}
      <div className="sofa-card p-6 mb-6">
        <h2 className="text-lg font-bold text-sofa-text-primary mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Statistiques Réelles
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="text-center p-3 bg-sofa-bg-tertiary rounded-lg">
            <div className="text-2xl mb-1">⚽</div>
            <div className="text-2xl font-bold text-sofa-text-primary mb-1">
              {player.seasonStats?.goals || 0}
            </div>
            <div className="text-xs text-sofa-text-muted">Buts</div>
          </div>
          <div className="text-center p-3 bg-sofa-bg-tertiary rounded-lg">
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-2xl font-bold text-sofa-text-primary mb-1">
              {player.seasonStats?.assists || 0}
            </div>
            <div className="text-xs text-sofa-text-muted">Passes</div>
          </div>
          <div className="text-center p-3 bg-sofa-bg-tertiary rounded-lg">
            <div className="text-2xl mb-1">🏃</div>
            <div className="text-2xl font-bold text-sofa-text-primary mb-1">
              {player.seasonStats?.matches || 0}
            </div>
            <div className="text-xs text-sofa-text-muted">Matchs</div>
          </div>
          <div className="text-center p-3 bg-sofa-bg-tertiary rounded-lg">
            <div className="text-2xl mb-1">⏱️</div>
            <div className="text-2xl font-bold text-sofa-text-primary mb-1">
              {player.seasonStats?.minutesPlayed || 0}
            </div>
            <div className="text-xs text-sofa-text-muted">Minutes</div>
          </div>
          <div className="text-center p-3 bg-sofa-bg-tertiary rounded-lg">
            <div className="text-2xl mb-1">🟨</div>
            <div className="text-2xl font-bold text-sofa-text-primary mb-1">
              {player.seasonStats?.yellowCards || 0}
            </div>
            <div className="text-xs text-sofa-text-muted">Jaunes</div>
          </div>
          <div className="text-center p-3 bg-sofa-bg-tertiary rounded-lg">
            <div className="text-2xl mb-1">🟥</div>
            <div className="text-2xl font-bold text-sofa-text-primary mb-1">
              {player.seasonStats?.redCards || 0}
            </div>
            <div className="text-xs text-sofa-text-muted">Rouges</div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="sofa-card p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-sofa-text-primary mb-1">
              Ajouter à votre équipe Fantasy
            </h3>
            <p className="text-sm text-sofa-text-muted">
              Prix: {fantasyStats?.price?.toFixed(1) || "N/A"}M€ • Points: {fantasyStats?.totalPoints || 0}
            </p>
          </div>
          <button
            onClick={() => router.push('/public/fantasy/squad')}
            className="sofa-btn sofa-btn-primary flex items-center gap-2"
          >
            <Star className="w-5 h-5" />
            <span>Gérer mon équipe</span>
          </button>
        </div>
      </div>
    </div>
  );
}
