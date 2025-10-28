"use client";

import { motion } from "framer-motion";
import { Trophy, Target, Shield, TrendingUp, Users, Award } from "lucide-react";

interface TeamStat {
  id: string;
  name: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string[];
  homeWins: number;
  awayWins: number;
  cleanSheets: number;
}

interface TeamStatsProps {
  teams: TeamStat[];
}

export function TeamStatsTable({ teams }: TeamStatsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-pl-border rounded-lg overflow-hidden"
    >
      {/* Header avec style Premier League */}
      <div className="bg-pl-primary text-white p-4">
        <div className="flex items-center gap-3">
          <Trophy className="w-6 h-6" />
          <h2 className="text-xl font-bold">Classement Premier League</h2>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-pl-bg-secondary">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-bold text-pl-text-muted uppercase tracking-wider">Position</th>
              <th className="text-left py-3 px-4 text-xs font-bold text-pl-text-muted uppercase tracking-wider">Club</th>
              <th className="text-center py-3 px-2 text-xs font-bold text-pl-text-muted uppercase tracking-wider">MJ</th>
              <th className="text-center py-3 px-2 text-xs font-bold text-pl-text-muted uppercase tracking-wider">V</th>
              <th className="text-center py-3 px-2 text-xs font-bold text-pl-text-muted uppercase tracking-wider">N</th>
              <th className="text-center py-3 px-2 text-xs font-bold text-pl-text-muted uppercase tracking-wider">D</th>
              <th className="text-center py-3 px-2 text-xs font-bold text-pl-text-muted uppercase tracking-wider">BP</th>
              <th className="text-center py-3 px-2 text-xs font-bold text-pl-text-muted uppercase tracking-wider">BC</th>
              <th className="text-center py-3 px-2 text-xs font-bold text-pl-text-muted uppercase tracking-wider">+/-</th>
              <th className="text-center py-3 px-2 text-xs font-bold text-pl-text-muted uppercase tracking-wider">Pts</th>
              <th className="text-center py-3 px-4 text-xs font-bold text-pl-text-muted uppercase tracking-wider">Forme</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-pl-border">
            {teams.map((team, index) => (
              <motion.tr
                key={team.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`hover:bg-pl-bg-hover transition-colors ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100' :
                  index < 4 ? 'bg-gradient-to-r from-green-50 to-green-100' :
                  index >= teams.length - 3 ? 'bg-gradient-to-r from-red-50 to-red-100' : ''
                }`}
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-sm flex items-center justify-center text-xs font-bold text-white ${
                      index === 0 ? 'bg-pl-gold' :
                      index === 1 ? 'bg-pl-silver text-gray-800' :
                      index === 2 ? 'bg-pl-bronze' :
                      index < 4 ? 'bg-green-600' :
                      index >= teams.length - 3 ? 'bg-red-600' :
                      'bg-gray-400'
                    }`}>
                      {index + 1}
                    </div>
                    {index < 4 && (
                      <div className="w-1 h-6 bg-green-500 rounded-full"></div>
                    )}
                    {index >= teams.length - 3 && (
                      <div className="w-1 h-6 bg-red-500 rounded-full"></div>
                    )}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-pl-primary rounded-sm flex items-center justify-center">
                      <span className="text-white font-bold text-xs">
                        {team.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <span className="font-semibold text-pl-text-primary">{team.name}</span>
                  </div>
                </td>
                <td className="text-center py-4 px-2 text-sm font-medium text-pl-text-primary">{team.matches}</td>
                <td className="text-center py-4 px-2 text-sm font-bold text-green-600">{team.wins}</td>
                <td className="text-center py-4 px-2 text-sm font-bold text-yellow-600">{team.draws}</td>
                <td className="text-center py-4 px-2 text-sm font-bold text-red-600">{team.losses}</td>
                <td className="text-center py-4 px-2 text-sm font-medium text-pl-text-primary">{team.goalsFor}</td>
                <td className="text-center py-4 px-2 text-sm font-medium text-pl-text-primary">{team.goalsAgainst}</td>
                <td className={`text-center py-4 px-2 text-sm font-bold ${
                  team.goalDifference > 0 ? 'text-green-600' :
                  team.goalDifference < 0 ? 'text-red-600' : 'text-pl-text-muted'
                }`}>
                  {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                </td>
                <td className="text-center py-4 px-2">
                  <span className="text-lg font-bold text-pl-primary">{team.points}</span>
                </td>
                <td className="text-center py-4 px-4">
                  <div className="flex gap-1 justify-center">
                    {team.form.slice(-5).map((result, i) => (
                      <div
                        key={i}
                        className={`w-6 h-6 rounded-sm flex items-center justify-center text-xs font-bold text-white ${
                          result === 'W' ? 'bg-green-600' :
                          result === 'D' ? 'bg-gray-500' :
                          'bg-red-600'
                        }`}
                      >
                        {result}
                      </div>
                    ))}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Légende */}
      <div className="bg-pl-bg-secondary p-4 border-t border-pl-border">
        <div className="flex flex-wrap gap-4 text-xs text-pl-text-muted">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
            <span>Qualification Champions League</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-600 rounded-sm"></div>
            <span>Relégation</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Composant pour les stats avancées des équipes
export function TeamAdvancedStats({ teams }: { teams: TeamStat[] }) {
  const bestAttack = teams.reduce((prev, current) => 
    (prev.goalsFor > current.goalsFor) ? prev : current
  );
  
  const bestDefense = teams.reduce((prev, current) => 
    (prev.goalsAgainst < current.goalsAgainst) ? prev : current
  );

  const bestHome = teams.reduce((prev, current) => 
    (prev.homeWins > current.homeWins) ? prev : current
  );

  const bestAway = teams.reduce((prev, current) => 
    (prev.awayWins > current.awayWins) ? prev : current
  );

  const advancedStats = [
    {
      title: "Meilleure Attaque",
      team: bestAttack.name,
      value: `${bestAttack.goalsFor} buts`,
      icon: Target,
      color: "from-red-500 to-red-600"
    },
    {
      title: "Meilleure Défense",
      team: bestDefense.name,
      value: `${bestDefense.goalsAgainst} buts encaissés`,
      icon: Shield,
      color: "from-blue-500 to-blue-600"
    },
    {
      title: "Roi à Domicile",
      team: bestHome.name,
      value: `${bestHome.homeWins} victoires`,
      icon: Award,
      color: "from-green-500 to-green-600"
    },
    {
      title: "Meilleur Visiteur",
      team: bestAway.name,
      value: `${bestAway.awayWins} victoires`,
      icon: TrendingUp,
      color: "from-purple-500 to-purple-600"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {advancedStats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="pl-card group hover:scale-105 transition-transform"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-pl-text-secondary">{stat.title}</div>
              <div className="font-bold text-pl-text-primary">{stat.value}</div>
            </div>
          </div>
          <div className="text-sm text-pl-text-muted bg-pl-bg-secondary px-3 py-2 rounded-lg">
            {stat.team}
          </div>
        </motion.div>
      ))}
    </div>
  );
}