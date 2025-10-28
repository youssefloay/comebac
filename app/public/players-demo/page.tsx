"use client"

import { FIFAPlayerCard } from "@/components/fifa/player-card"
import type { Team, Player } from "@/lib/types"

// Données de démonstration avec photos génériques
const demoTeams: Team[] = [
  {
    id: "1",
    name: "FC Casablanca",
    logo: "https://images.unsplash.com/photo-1614632537190-23e4b21ff3c3?w=200&h=200&fit=crop",
    color: "#FF6B35",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "2", 
    name: "Raja Athletic",
    logo: "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=200&h=200&fit=crop",
    color: "#00A86B",
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "3",
    name: "Wydad AC", 
    logo: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=200&h=200&fit=crop",
    color: "#DC143C",
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

const demoPlayers: Player[] = [
  {
    id: "1",
    name: "Ahmed Benali",
    number: 10,
    position: "Attaquant",
    teamId: "1",
    photo: "https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?w=400&h=400&fit=crop&crop=face",
    age: 22,
    nationality: "Maroc",
    height: 178,
    weight: 72,
    stats: {
      overall: 89,
      pace: 85,
      shooting: 92,
      passing: 78,
      dribbling: 88,
      defending: 35,
      physical: 76
    },
    seasonStats: {
      goals: 15,
      assists: 8,
      matches: 12,
      yellowCards: 2,
      redCards: 0,
      minutesPlayed: 1080
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "2",
    name: "Youssef Amrani",
    number: 8,
    position: "Milieu",
    teamId: "2",
    photo: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=400&h=400&fit=crop&crop=face",
    age: 20,
    nationality: "Maroc",
    height: 175,
    weight: 68,
    stats: {
      overall: 84,
      pace: 78,
      shooting: 72,
      passing: 91,
      dribbling: 85,
      defending: 68,
      physical: 71
    },
    seasonStats: {
      goals: 6,
      assists: 12,
      matches: 14,
      yellowCards: 3,
      redCards: 0,
      minutesPlayed: 1260
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "3",
    name: "Mohamed Ziani",
    number: 4,
    position: "Défenseur",
    teamId: "3",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    age: 24,
    nationality: "Maroc",
    height: 185,
    weight: 78,
    stats: {
      overall: 82,
      pace: 65,
      shooting: 45,
      passing: 82,
      dribbling: 58,
      defending: 89,
      physical: 85
    },
    seasonStats: {
      goals: 2,
      assists: 3,
      matches: 15,
      yellowCards: 4,
      redCards: 1,
      minutesPlayed: 1350
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "4",
    name: "Karim Alami",
    number: 1,
    position: "Gardien",
    teamId: "1",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
    age: 26,
    nationality: "Maroc",
    height: 188,
    weight: 82,
    stats: {
      overall: 86,
      pace: 45,
      shooting: 25,
      passing: 68,
      dribbling: 42,
      defending: 88,
      physical: 79
    },
    seasonStats: {
      goals: 0,
      assists: 1,
      matches: 13,
      yellowCards: 1,
      redCards: 0,
      minutesPlayed: 1170
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "5",
    name: "Omar Benjelloun",
    number: 11,
    position: "Attaquant",
    teamId: "2",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    age: 19,
    nationality: "Maroc",
    height: 172,
    weight: 65,
    stats: {
      overall: 78,
      pace: 88,
      shooting: 81,
      passing: 65,
      dribbling: 84,
      defending: 28,
      physical: 62
    },
    seasonStats: {
      goals: 11,
      assists: 5,
      matches: 11,
      yellowCards: 2,
      redCards: 0,
      minutesPlayed: 990
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "6",
    name: "Amine Tazi",
    number: 7,
    position: "Milieu",
    teamId: "3",
    photo: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face",
    age: 21,
    nationality: "France",
    height: 180,
    weight: 74,
    stats: {
      overall: 80,
      pace: 75,
      shooting: 78,
      passing: 85,
      dribbling: 82,
      defending: 55,
      physical: 68
    },
    seasonStats: {
      goals: 8,
      assists: 9,
      matches: 13,
      yellowCards: 1,
      redCards: 0,
      minutesPlayed: 1170
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "7",
    name: "Rachid Hakimi",
    number: 2,
    position: "Défenseur",
    teamId: "1",
    photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face",
    age: 23,
    nationality: "Maroc",
    height: 182,
    weight: 76,
    stats: {
      overall: 79,
      pace: 78,
      shooting: 52,
      passing: 79,
      dribbling: 72,
      defending: 84,
      physical: 77
    },
    seasonStats: {
      goals: 1,
      assists: 4,
      matches: 12,
      yellowCards: 3,
      redCards: 0,
      minutesPlayed: 1080
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: "8",
    name: "Saad Lamrani",
    number: 9,
    position: "Attaquant",
    teamId: "3",
    photo: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=400&h=400&fit=crop&crop=face",
    age: 25,
    nationality: "Maroc",
    height: 183,
    weight: 79,
    stats: {
      overall: 85,
      pace: 72,
      shooting: 89,
      passing: 68,
      dribbling: 75,
      defending: 32,
      physical: 84
    },
    seasonStats: {
      goals: 13,
      assists: 3,
      matches: 14,
      yellowCards: 2,
      redCards: 0,
      minutesPlayed: 1260
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export default function PlayersDemoPage() {
  const getTeamForPlayer = (teamId: string) => demoTeams.find(t => t.id === teamId)

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-sofa-text-primary mb-4">
          🎮 Cartes Joueurs FIFA - Démo
        </h1>
        <p className="text-lg text-sofa-text-secondary">
          Aperçu des cartes joueurs avec photos et statistiques réelles
        </p>
      </div>

      {/* Carte vedette */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-sofa-text-primary mb-6 text-center">⭐ Joueur Vedette</h2>
        <div className="flex justify-center">
          <FIFAPlayerCard
            player={demoPlayers[0]} // Ahmed Benali
            team={getTeamForPlayer(demoPlayers[0].teamId)}
            variant="standard"
          />
        </div>
      </div>

      {/* Top 3 joueurs */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-sofa-text-primary mb-6">🏆 Top 3 Joueurs</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {demoPlayers
            .sort((a, b) => (b.stats?.overall || 0) - (a.stats?.overall || 0))
            .slice(0, 3)
            .map((player, index) => (
              <div key={player.id} className="relative">
                {index === 0 && (
                  <div className="absolute -top-4 -right-4 z-10 bg-sofa-yellow text-white rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold shadow-lg">
                    👑
                  </div>
                )}
                {index === 1 && (
                  <div className="absolute -top-4 -right-4 z-10 bg-gray-400 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold shadow-lg">
                    🥈
                  </div>
                )}
                {index === 2 && (
                  <div className="absolute -top-4 -right-4 z-10 bg-orange-500 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold shadow-lg">
                    🥉
                  </div>
                )}
                <FIFAPlayerCard
                  player={player}
                  team={getTeamForPlayer(player.teamId)}
                  variant="standard"
                />
              </div>
            ))}
        </div>
      </div>

      {/* Grille compacte */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-sofa-text-primary mb-6">📱 Vue Compacte</h2>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 justify-items-center">
          {demoPlayers.map((player) => (
            <FIFAPlayerCard
              key={player.id}
              player={player}
              team={demoTeams.find(t => t.id === player.teamId)}
              variant="compact"
            />
          ))}
        </div>
      </div>

      {/* Toutes les cartes */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-sofa-text-primary mb-6">🃏 Toutes les Cartes</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
          {demoPlayers.map((player) => (
            <FIFAPlayerCard
              key={player.id}
              player={player}
              team={demoTeams.find(t => t.id === player.teamId)}
              variant="standard"
            />
          ))}
        </div>
      </div>

      {/* Statistiques par équipe */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-sofa-text-primary mb-6">📊 Statistiques par Équipe</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {demoTeams.map(team => {
            const teamPlayers = demoPlayers.filter(p => p.teamId === team.id)
            const totalGoals = teamPlayers.reduce((sum, p) => sum + (p.seasonStats?.goals || 0), 0)
            const totalAssists = teamPlayers.reduce((sum, p) => sum + (p.seasonStats?.assists || 0), 0)
            const avgOverall = Math.round(teamPlayers.reduce((sum, p) => sum + (p.stats?.overall || 0), 0) / teamPlayers.length)
            
            return (
              <div key={team.id} className="sofa-card p-6">
                <div className="flex items-center gap-4 mb-4">
                  <img 
                    src={team.logo} 
                    alt={team.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <h3 className="text-lg font-bold text-sofa-text-primary">{team.name}</h3>
                    <p className="text-sm text-sofa-text-secondary">{teamPlayers.length} joueurs</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-sofa-green">{totalGoals}</div>
                    <div className="text-xs text-sofa-text-muted">Buts</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-sofa-blue">{totalAssists}</div>
                    <div className="text-xs text-sofa-text-muted">Passes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-sofa-text-accent">{avgOverall}</div>
                    <div className="text-xs text-sofa-text-muted">Moy. Note</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="sofa-card p-6 text-center">
        <h3 className="text-lg font-bold text-sofa-text-primary mb-4">💡 Comment utiliser</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          <div>
            <h4 className="font-semibold text-sofa-text-primary mb-2">🖱️ Interactions</h4>
            <ul className="text-sm text-sofa-text-secondary space-y-1">
              <li>• Cliquez sur une carte pour la retourner</li>
              <li>• Survolez pour voir les effets</li>
              <li>• Les couleurs indiquent le niveau</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sofa-text-primary mb-2">🎨 Couleurs des cartes</h4>
            <ul className="text-sm text-sofa-text-secondary space-y-1">
              <li>• <span className="text-yellow-500">Or</span>: Légende (90+)</li>
              <li>• <span className="text-purple-500">Violet</span>: Héros (85+)</li>
              <li>• <span className="text-blue-500">Bleu</span>: Rare (80+)</li>
              <li>• <span className="text-green-500">Vert</span>: Commun (75+)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}