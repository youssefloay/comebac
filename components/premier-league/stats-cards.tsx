"use client";

import { motion } from "framer-motion";
import {
  Trophy,
  Target,
  Users,
  Calendar,
  TrendingUp,
  Award,
  Zap,
  Shield,
  Clock,
  Star,
  Activity,
  BarChart3,
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  gradient: string;
  index: number;
  subtitle?: string;
  trend?: number;
}

export function PremierLeagueStatCard({ 
  title, 
  value, 
  icon: Icon, 
  gradient, 
  index, 
  subtitle,
  trend 
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white border border-pl-border rounded-lg p-6 hover:shadow-lg transition-all duration-300 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pl-primary rounded-lg flex items-center justify-center">
            <Icon className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-pl-text-muted uppercase tracking-wide">{title}</h3>
            {subtitle && (
              <p className="text-xs text-pl-text-muted mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        {trend && (
          <div className={`text-xs font-bold px-2 py-1 rounded ${
            trend > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      
      <div className="text-3xl font-bold text-pl-primary mb-1">{value}</div>
    </motion.div>
  );
}

// Composant pour les stats principales - Style Premier League
export function MainStatsGrid({ stats }: { stats: any }) {
  const mainStats = [
    {
      title: "Équipes",
      value: stats.teams || 0,
      icon: Users,
      gradient: "",
      subtitle: "Inscrites cette saison"
    },
    {
      title: "Matchs",
      value: stats.matchesPlayed || 0,
      icon: Calendar,
      gradient: "",
      subtitle: "Joués cette saison"
    },
    {
      title: "Buts",
      value: stats.totalGoals || 0,
      icon: Target,
      gradient: "",
      subtitle: "Marqués au total"
    },
    {
      title: "Restants",
      value: stats.remainingMatches || 0,
      icon: Clock,
      gradient: "",
      subtitle: "Matchs à jouer"
    },
  ];

  return (
    <div className="bg-white border border-pl-border rounded-lg p-6 mb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-pl-primary rounded flex items-center justify-center">
          <BarChart3 className="w-4 h-4 text-white" />
        </div>
        <h2 className="text-xl font-bold text-pl-primary">Statistiques de la Saison</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {mainStats.map((stat, index) => (
          <div key={stat.title} className="text-center">
            <div className="w-12 h-12 bg-pl-bg-secondary rounded-lg flex items-center justify-center mx-auto mb-3">
              <stat.icon className="w-6 h-6 text-pl-primary" />
            </div>
            <div className="text-2xl font-bold text-pl-primary mb-1">{stat.value}</div>
            <div className="text-sm font-medium text-pl-text-primary mb-1">{stat.title}</div>
            <div className="text-xs text-pl-text-muted">{stat.subtitle}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Composant pour les stats avancées
export function AdvancedStatsGrid({ stats }: { stats: any }) {
  const advancedStats = [
    {
      title: "Moyenne Buts/Match",
      value: stats.avgGoalsPerMatch?.toFixed(1) || "0.0",
      icon: BarChart3,
      gradient: "from-cyan-500 to-cyan-600",
      trend: 5.2
    },
    {
      title: "Meilleur Buteur",
      value: stats.topScorer?.goals || 0,
      icon: Award,
      gradient: "from-yellow-500 to-yellow-600",
      subtitle: stats.topScorer?.name || "N/A"
    },
    {
      title: "Équipe Leader",
      value: stats.leader?.points || 0,
      icon: Trophy,
      gradient: "from-red-500 to-red-600",
      subtitle: stats.leader?.name || "N/A"
    },
    {
      title: "Matchs Nuls",
      value: stats.draws || 0,
      icon: Activity,
      gradient: "from-gray-500 to-gray-600",
      subtitle: "Cette saison"
    },
    {
      title: "Cartons Jaunes",
      value: stats.yellowCards || 0,
      icon: Zap,
      gradient: "from-yellow-400 to-yellow-500",
      subtitle: "Total saison"
    },
    {
      title: "Cartons Rouges",
      value: stats.redCards || 0,
      icon: Shield,
      gradient: "from-red-400 to-red-500",
      subtitle: "Total saison"
    },
    {
      title: "Clean Sheets",
      value: stats.cleanSheets || 0,
      icon: Star,
      gradient: "from-indigo-500 to-indigo-600",
      subtitle: "Cages inviolées"
    },
    {
      title: "Spectateurs",
      value: stats.totalSpectators || 0,
      icon: TrendingUp,
      gradient: "from-pink-500 to-pink-600",
      subtitle: "Total saison",
      trend: 12.5
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {advancedStats.map((stat, index) => (
        <PremierLeagueStatCard key={stat.title} {...stat} index={index} />
      ))}
    </div>
  );
}