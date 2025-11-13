"use client"

import { useState } from "react"
import { Calendar, Clock, Trophy, Users, TrendingUp, Filter, ChevronDown, ArrowRight } from "lucide-react"
import "@/styles/score365-theme.css"

export default function TestScore365Page() {
  const [showFilters, setShowFilters] = useState(false)

  // Données de test
  const testMatches = [
    {
      id: "1",
      teamA: "FC Barcelona",
      teamB: "Real Madrid",
      scoreA: 3,
      scoreB: 1,
      status: "completed",
      date: "15 Jan",
      time: "20:00",
      round: 5
    },
    {
      id: "2",
      teamA: "PSG",
      teamB: "Manchester United",
      scoreA: 2,
      scoreB: 2,
      status: "live",
      date: "15 Jan",
      time: "21:00",
      round: 5
    },
    {
      id: "3",
      teamA: "Liverpool",
      teamB: "Chelsea",
      scoreA: null,
      scoreB: null,
      status: "upcoming",
      date: "16 Jan",
      time: "19:00",
      round: 5
    },
    {
      id: "4",
      teamA: "Arsenal",
      teamB: "Tottenham",
      scoreA: 1,
      scoreB: 0,
      status: "completed",
      date: "14 Jan",
      time: "18:00",
      round: 4
    }
  ]

  const testStandings = [
    { position: 1, team: "FC Barcelona", played: 5, won: 4, drawn: 1, lost: 0, goalsFor: 12, goalsAgainst: 3, points: 13 },
    { position: 2, team: "Real Madrid", played: 5, won: 3, drawn: 2, lost: 0, goalsFor: 10, goalsAgainst: 5, points: 11 },
    { position: 3, team: "PSG", played: 5, won: 3, drawn: 1, lost: 1, goalsFor: 9, goalsAgainst: 6, points: 10 },
    { position: 4, team: "Arsenal", played: 5, won: 2, drawn: 2, lost: 1, goalsFor: 8, goalsAgainst: 7, points: 8 },
    { position: 5, team: "Liverpool", played: 4, won: 2, drawn: 1, lost: 1, goalsFor: 7, goalsAgainst: 5, points: 7 },
    { position: 6, team: "Chelsea", played: 4, won: 1, drawn: 2, lost: 1, goalsFor: 5, goalsAgainst: 6, points: 5 },
    { position: 7, team: "Tottenham", played: 4, won: 1, drawn: 1, lost: 2, goalsFor: 4, goalsAgainst: 7, points: 4 },
    { position: 8, team: "Manchester United", played: 4, won: 0, drawn: 2, lost: 2, goalsFor: 3, goalsAgainst: 8, points: 2 }
  ]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "live":
        return <span className="score365-badge score365-badge-live">Live</span>
      case "completed":
        return <span className="score365-badge score365-badge-completed">Terminé</span>
      case "upcoming":
        return <span className="score365-badge score365-badge-scheduled">À venir</span>
      default:
        return null
    }
  }

  return (
    <div className="score365-theme min-h-screen">
      {/* Header - Minimalist */}
      <div className="score365-header">
        <div className="max-w-7xl mx-auto px-6">
          <h1>ComeBac League</h1>
          <p>Championnat scolaire — Saison 2024</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Quick Stats - Minimalist */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          <div className="score365-stat-card">
            <div className="score365-stat-number">24</div>
            <div className="score365-stat-label">Matchs</div>
          </div>
          
          <div className="score365-stat-card">
            <div className="score365-stat-number">8</div>
            <div className="score365-stat-label">Équipes</div>
          </div>
          
          <div className="score365-stat-card">
            <div className="score365-stat-number">120</div>
            <div className="score365-stat-label">Joueurs</div>
          </div>
          
          <div className="score365-stat-card">
            <div className="score365-stat-number">5</div>
            <div className="score365-stat-label">Journées</div>
          </div>
        </div>

        {/* Navigation Example - Minimalist */}
        <div className="score365-nav mb-16">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-wrap">
              <a href="#" className="score365-nav-item active">Accueil</a>
              <a href="#" className="score365-nav-item">Matchs</a>
              <a href="#" className="score365-nav-item">Classement</a>
              <a href="#" className="score365-nav-item">Statistiques</a>
              <a href="#" className="score365-nav-item">Équipes</a>
            </div>
          </div>
        </div>

        {/* Filters - Minimalist */}
        <div className="score365-card p-6 mb-16">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-score365-text-primary flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtres
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden flex items-center gap-2 text-score365-text-muted hover:text-score365-text-primary transition-colors"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          <div className={`flex flex-wrap gap-3 ${showFilters ? 'block' : 'hidden md:flex'}`}>
            <button className="score365-btn-secondary text-sm px-5 py-2.5">Tous</button>
            <button className="score365-btn-secondary text-sm px-5 py-2.5">En direct</button>
            <button className="score365-btn-secondary text-sm px-5 py-2.5">À venir</button>
            <button className="score365-btn-secondary text-sm px-5 py-2.5">Terminés</button>
          </div>
        </div>

        {/* Match Cards - Ultra Minimalist */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-2xl font-light text-score365-text-primary">
              Matchs
            </h2>
            <a href="#" className="text-score365-text-secondary hover:text-score365-text-primary text-sm flex items-center gap-1 transition-colors">
              Voir tout <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testMatches.map((match) => (
              <div
                key={match.id}
                className={`score365-match-card ${match.status}`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                    {getStatusBadge(match.status)}
                    <span className="text-score365-text-muted text-xs font-medium">
                      J{match.round}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-score365-text-muted text-xs">
                    <span>{match.date}</span>
                    <span>·</span>
                    <span>{match.time}</span>
                  </div>
                </div>

                {/* Teams and Score */}
                <div className="space-y-6">
                  {/* Team A */}
                  <div className="flex items-center justify-between">
                    <span className="score365-team-name large">{match.teamA}</span>
                    {match.scoreA !== null && (
                      <span className="text-2xl font-light text-score365-text-primary">
                        {match.scoreA}
                      </span>
                    )}
                  </div>

                  {/* Score Display */}
                  <div className="text-center py-4">
                    {match.status === "live" || match.status === "completed" ? (
                      <div className={`score365-score ${match.status === "live" ? "live" : ""}`}>
                        {match.scoreA} — {match.scoreB}
                      </div>
                    ) : (
                      <div className="text-score365-text-muted text-xl font-light">—</div>
                    )}
                  </div>

                  {/* Team B */}
                  <div className="flex items-center justify-between">
                    <span className="score365-team-name large">{match.teamB}</span>
                    {match.scoreB !== null && (
                      <span className="text-2xl font-light text-score365-text-primary">
                        {match.scoreB}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Standings Table - Minimalist */}
        <div className="mb-20">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-2xl font-light text-score365-text-primary">
              Classement
            </h2>
            <a href="#" className="text-score365-text-secondary hover:text-score365-text-primary text-sm flex items-center gap-1 transition-colors">
              Voir tout <ArrowRight className="w-4 h-4" />
            </a>
          </div>
          
          <div className="score365-table">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Équipe</th>
                  <th>J</th>
                  <th>G</th>
                  <th>N</th>
                  <th>P</th>
                  <th>BP</th>
                  <th>BC</th>
                  <th>Pts</th>
                </tr>
              </thead>
              <tbody>
                {testStandings.map((team) => (
                  <tr key={team.position}>
                    <td className="font-medium">{team.position}</td>
                    <td className="font-medium">{team.team}</td>
                    <td className="text-score365-text-secondary">{team.played}</td>
                    <td className="text-score365-green">{team.won}</td>
                    <td className="text-score365-text-secondary">{team.drawn}</td>
                    <td className="text-score365-red">{team.lost}</td>
                    <td>{team.goalsFor}</td>
                    <td className="text-score365-text-secondary">{team.goalsAgainst}</td>
                    <td className="font-medium">{team.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Buttons Example - Minimalist */}
        <div className="mb-20">
          <h2 className="text-2xl font-light text-score365-text-primary mb-12">
            Boutons
          </h2>
          
          <div className="flex flex-wrap gap-4">
            <button className="score365-btn">Bouton Principal</button>
            <button className="score365-btn-secondary">Bouton Secondaire</button>
          </div>
        </div>

        {/* Info Card - Minimalist */}
        <div className="score365-card p-12">
          <h3 className="text-xl font-light text-score365-text-primary mb-6">
            Design Minimaliste & Professionnel
          </h3>
          <p className="text-score365-text-secondary mb-6 leading-relaxed">
            Ce design se caractérise par une approche ultra-minimaliste avec un focus sur la typographie, 
            l'espace blanc et les détails subtils. Chaque élément est pensé pour créer une expérience 
            visuelle épurée et professionnelle.
          </p>
          <ul className="space-y-3 text-score365-text-secondary leading-relaxed">
            <li className="flex items-start gap-3">
              <span className="text-score365-text-primary mt-1">—</span>
              <span>Typographie moderne avec weights subtils (300-600)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-score365-text-primary mt-1">—</span>
              <span>Espace blanc généreux pour une respiration visuelle</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-score365-text-primary mt-1">—</span>
              <span>Ombres subtiles et animations douces</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-score365-text-primary mt-1">—</span>
              <span>Palette de couleurs monochrome avec accents discrets</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-score365-text-primary mt-1">—</span>
              <span>Bordures minimales ou absentes, focus sur le contenu</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
