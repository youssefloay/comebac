"use client";

import { motion } from "framer-motion";
import { Trophy, Target, Zap, Shield, Star, Activity } from "lucide-react";

interface PlayerStat {
  id: string;
  name: string;
  team: string;
  position: string;
  goals: number;
  assists: number;
  matches: number;
  yellowCards: number;
  redCards: number;
  rating: number;
}

interface PlayerStatsProps {
  players: PlayerStat[];
  category: 'goals' | 'assists' | 'cards' | 'rating';
}

export function PlayerStatsTable({ players, category }: PlayerStatsProps) {
  const getTitle = () => {
    switch (category) {
      case 'goals': return 'Meilleurs Buteurs';
      case 'assists': return 'Meilleurs Passeurs';
      case 'cards': return 'Discipline';
      case 'rating': return 'Meilleures Notes';
      default: return 'Statistiques Joueurs';
    }
  };

  const getIcon = () => {
    switch (category) {
      case 'goals': return Target;
      case 'assists': return Activity;
      case 'cards': return Zap;
      case 'rating': return Star;
      default: return Trophy;
    }
  };

  const Icon = getIcon();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-pl-border rounded-lg overflow-hidden"
    >
      {/* Header Premier League style */}
      <div className="bg-pl-primary text-white p-4">
        <div className="flex items-center gap-3">
          <Icon className="w-6 h-6" />
          <h3 className="text-xl font-bold">{getTitle()}</h3>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-pl-bg-secondary">
            <tr>
              <th className="text-left py-3 px-4 text-xs font-bold text-pl-text-muted uppercase tracking-wider">Rang</th>
              <th className="text-left py-3 px-4 text-xs font-bold text-pl-text-muted uppercase tracking-wider">Joueur</th>
              <th className="text-left py-3 px-4 text-xs font-bold text-pl-text-muted uppercase tracking-wider">Club</th>
              <th className="text-center py-3 px-2 text-xs font-bold text-pl-text-muted uppercase tracking-wider">MJ</th>
              {category === 'goals' && <th className="text-center py-3 px-2 text-xs font-bold text-pl-text-muted uppercase tracking-wider">Buts</th>}
              {category === 'assists' && <th className="text-center py-3 px-2 text-xs font-bold text-pl-text-muted uppercase tracking-wider">Passes D.</th>}
              {category === 'cards' && (
                <>
                  <th className="text-center py-3 px-2 text-xs font-bold text-pl-text-muted uppercase tracking-wider">Jaunes</th>
                  <th className="text-center py-3 px-2 text-xs font-bold text-pl-text-muted uppercase tracking-wider">Rouges</th>
                </>
              )}
              {category === 'rating' && <th className="text-center py-3 px-2 text-xs font-bold text-pl-text-muted uppercase tracking-wider">Note</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-pl-border">
            {players.slice(0, 10).map((player, index) => (
              <motion.tr
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`hover:bg-pl-bg-hover transition-colors ${
                  index === 0 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100' :
                  index < 3 ? 'bg-gradient-to-r from-green-50 to-green-100' : ''
                }`}
              >
                <td className="py-4 px-4">
                  <div className={`w-8 h-8 rounded-sm flex items-center justify-center text-sm font-bold text-white ${
                    index === 0 ? 'bg-pl-gold' :
                    index === 1 ? 'bg-pl-silver text-gray-800' :
                    index === 2 ? 'bg-pl-bronze' :
                    'bg-gray-400'
                  }`}>
                    {index + 1}
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div>
                    <div className="font-semibold text-pl-text-primary text-sm">{player.name}</div>
                    <div className="text-xs text-pl-text-muted uppercase tracking-wide">{player.position}</div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-pl-primary rounded-sm flex items-center justify-center">
                      <span className="text-white font-bold text-xs">
                        {player.team.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-pl-text-secondary">{player.team}</span>
                  </div>
                </td>
                <td className="text-center py-4 px-2 text-sm font-medium text-pl-text-primary">{player.matches}</td>
                {category === 'goals' && (
                  <td className="text-center py-4 px-2">
                    <div className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      <Target className="w-3 h-3" />
                      <span className="font-bold text-sm">{player.goals}</span>
                    </div>
                  </td>
                )}
                {category === 'assists' && (
                  <td className="text-center py-4 px-2">
                    <div className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      <Activity className="w-3 h-3" />
                      <span className="font-bold text-sm">{player.assists}</span>
                    </div>
                  </td>
                )}
                {category === 'cards' && (
                  <>
                    <td className="text-center py-4 px-2">
                      <div className="inline-flex items-center justify-center w-8 h-6 bg-yellow-400 text-yellow-900 text-xs font-bold rounded">
                        {player.yellowCards}
                      </div>
                    </td>
                    <td className="text-center py-4 px-2">
                      <div className="inline-flex items-center justify-center w-8 h-6 bg-red-500 text-white text-xs font-bold rounded">
                        {player.redCards}
                      </div>
                    </td>
                  </>
                )}
                {category === 'rating' && (
                  <td className="text-center py-4 px-2">
                    <div className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="font-bold text-sm">{player.rating.toFixed(1)}</span>
                    </div>
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// Composant pour les stats rapides des joueurs
export function QuickPlayerStats({ stats }: { stats: any }) {
  const quickStats = [
    {
      label: "Meilleur Buteur",
      value: `${stats.topScorer?.goals || 0} buts`,
      player: stats.topScorer?.name || "N/A",
      icon: Target,
      color: "from-red-500 to-red-600"
    },
    {
      label: "Meilleur Passeur",
      value: `${stats.topAssister?.assists || 0} passes`,
      player: stats.topAssister?.name || "N/A",
      icon: Activity,
      color: "from-blue-500 to-blue-600"
    },
    {
      label: "Meilleure Note",
      value: `${stats.topRated?.rating?.toFixed(1) || 0}/10`,
      player: stats.topRated?.name || "N/A",
      icon: Star,
      color: "from-yellow-500 to-yellow-600"
    },
    {
      label: "Plus Discipliné",
      value: `${stats.mostDisciplined?.cards || 0} cartons`,
      player: stats.mostDisciplined?.name || "N/A",
      icon: Shield,
      color: "from-green-500 to-green-600"
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {quickStats.map((stat, index) => (
        <motion.div
          key={stat.label}
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
              <div className="text-sm font-medium text-pl-text-secondary">{stat.label}</div>
              <div className="font-bold text-pl-text-primary">{stat.value}</div>
            </div>
          </div>
          <div className="text-sm text-pl-text-muted bg-pl-bg-secondary px-3 py-2 rounded-lg">
            {stat.player}
          </div>
        </motion.div>
      ))}
    </div>
  );
}