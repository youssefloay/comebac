"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MainStatsGrid, AdvancedStatsGrid } from "./stats-cards";
import { PlayerStatsTable, QuickPlayerStats } from "./player-stats";
import { TeamStatsTable, TeamAdvancedStats } from "./team-stats";
import { 
  BarChart3, 
  Users, 
  Trophy, 
  Target,
  TrendingUp,
  Calendar,
  Award,
  Activity
} from "lucide-react";

interface StatsPageProps {
  initialStats?: any;
}

export function PremierLeagueStatsPage({ initialStats }: StatsPageProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(initialStats || {});

  // Données de démonstration (à remplacer par de vraies données)
  const demoStats = {
    teams: 12,
    matchesPlayed: 45,
    totalGoals: 127,
    remainingMatches: 21,
    avgGoalsPerMatch: 2.8,
    draws: 15,
    yellowCards: 89,
    redCards: 12,
    cleanSheets: 23,
    totalSpectators: 15420,
    topScorer: { name: "Ahmed Benali", goals: 15, team: "FC Casablanca" },
    topAssister: { name: "Youssef Amrani", assists: 8, team: "Raja Athletic" },
    topRated: { name: "Mohamed Ziani", rating: 8.7, team: "Wydad AC" },
    mostDisciplined: { name: "Karim Alami", cards: 2, team: "FAR Rabat" },
    leader: { name: "FC Casablanca", points: 28 }
  };

  const demoPlayers = [
    { id: '1', name: 'Ahmed Benali', team: 'FC Casablanca', position: 'Attaquant', goals: 15, assists: 4, matches: 12, yellowCards: 2, redCards: 0, rating: 8.5 },
    { id: '2', name: 'Youssef Amrani', team: 'Raja Athletic', position: 'Milieu', goals: 8, assists: 12, matches: 14, yellowCards: 3, redCards: 0, rating: 8.2 },
    { id: '3', name: 'Mohamed Ziani', team: 'Wydad AC', position: 'Défenseur', goals: 2, assists: 1, matches: 15, yellowCards: 1, redCards: 0, rating: 8.7 },
    { id: '4', name: 'Karim Alami', team: 'FAR Rabat', position: 'Gardien', goals: 0, assists: 0, matches: 13, yellowCards: 1, redCards: 0, rating: 7.9 },
    { id: '5', name: 'Omar Benjelloun', team: 'Olympique Safi', position: 'Attaquant', goals: 11, assists: 3, matches: 11, yellowCards: 4, redCards: 1, rating: 7.8 },
  ];

  const demoTeams = [
    { id: '1', name: 'FC Casablanca', matches: 15, wins: 9, draws: 4, losses: 2, goalsFor: 28, goalsAgainst: 12, goalDifference: 16, points: 31, form: ['W', 'W', 'D', 'W', 'W'], homeWins: 6, awayWins: 3, cleanSheets: 8 },
    { id: '2', name: 'Raja Athletic', matches: 15, wins: 8, draws: 5, losses: 2, goalsFor: 25, goalsAgainst: 15, goalDifference: 10, points: 29, form: ['W', 'D', 'W', 'D', 'W'], homeWins: 5, awayWins: 3, cleanSheets: 6 },
    { id: '3', name: 'Wydad AC', matches: 15, wins: 7, draws: 6, losses: 2, goalsFor: 22, goalsAgainst: 14, goalDifference: 8, points: 27, form: ['D', 'W', 'D', 'W', 'D'], homeWins: 4, awayWins: 3, cleanSheets: 7 },
    { id: '4', name: 'FAR Rabat', matches: 15, wins: 6, draws: 4, losses: 5, goalsFor: 19, goalsAgainst: 18, goalDifference: 1, points: 22, form: ['L', 'W', 'D', 'L', 'W'], homeWins: 4, awayWins: 2, cleanSheets: 4 },
  ];

  const tabs = [
    { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'teams', label: 'Équipes', icon: Users },
    { id: 'players', label: 'Joueurs', icon: Trophy },
    { id: 'goals', label: 'Buteurs', icon: Target },
    { id: 'assists', label: 'Passeurs', icon: Activity },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="text-4xl font-bold text-pl-text-primary mb-4">
          Statistiques ComeBac League
        </h1>
        <p className="text-pl-text-secondary">
          Toutes les statistiques détaillées du championnat scolaire
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pl-nav-item ${activeTab === tab.id ? 'active' : ''}`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <MainStatsGrid stats={demoStats} />
            <AdvancedStatsGrid stats={demoStats} />
            <QuickPlayerStats stats={demoStats} />
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="space-y-8">
            <TeamAdvancedStats teams={demoTeams} />
            <TeamStatsTable teams={demoTeams} />
          </div>
        )}

        {activeTab === 'players' && (
          <div className="space-y-8">
            <QuickPlayerStats stats={demoStats} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <PlayerStatsTable players={demoPlayers} category="goals" />
              <PlayerStatsTable players={demoPlayers} category="assists" />
            </div>
          </div>
        )}

        {activeTab === 'goals' && (
          <div className="space-y-8">
            <PlayerStatsTable players={demoPlayers} category="goals" />
          </div>
        )}

        {activeTab === 'assists' && (
          <div className="space-y-8">
            <PlayerStatsTable players={demoPlayers} category="assists" />
          </div>
        )}
      </motion.div>
    </div>
  );
}