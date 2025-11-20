"use client"

import { useState, useEffect } from "react"
import type { Match, Team, MatchResult } from "@/lib/types"
import type { Player } from "@/lib/types"
// Using API endpoints instead of direct DB calls
import { Button } from "@/components/ui/button"
import { 
  Trophy, 
  Target, 
  Users, 
  Plus, 
  Trash2, 
  Home, 
  Plane, 
  AlertCircle,
  CheckCircle,
  User,
  UserPlus,
  Edit3,
  Save,
  Calendar,
  Clock,
  Square,
  Minus
} from "lucide-react"

interface MatchResultFormProps {
  match: Match & { homeTeam?: Team; awayTeam?: Team; result?: MatchResult }
  onSubmit: (match: Match & { homeTeam?: Team; awayTeam?: Team; result?: MatchResult }, result: MatchResult) => Promise<void>
  isSubmitting: boolean
}

export function MatchResultForm({ match, onSubmit, isSubmitting }: MatchResultFormProps) {
  const [homeScore, setHomeScore] = useState(match.result?.homeTeamScore || 0)
  const [awayScore, setAwayScore] = useState(match.result?.awayTeamScore || 0)
  const [homeScorers, setHomeScorers] = useState<Array<{ playerId?: string; playerName: string; assists?: string; isPenalty?: boolean; isPenaltyMissed?: boolean; isOwnGoal?: boolean }>>(
    (match.result?.homeTeamGoalScorers || []).map(s => ({ 
      playerId: (s as any).playerId || '', 
      playerName: s.playerName, 
      assists: s.assists,
      isPenalty: (s as any).isPenalty || false,
      isPenaltyMissed: (s as any).isPenaltyMissed || false,
      isOwnGoal: (s as any).isOwnGoal || false
    }))
  )
  const [awayScorers, setAwayScorers] = useState<Array<{ playerId?: string; playerName: string; assists?: string; isPenalty?: boolean; isPenaltyMissed?: boolean; isOwnGoal?: boolean }>>(
    (match.result?.awayTeamGoalScorers || []).map(s => ({ 
      playerId: (s as any).playerId || '', 
      playerName: s.playerName, 
      assists: s.assists,
      isPenalty: (s as any).isPenalty || false,
      isPenaltyMissed: (s as any).isPenaltyMissed || false,
      isOwnGoal: (s as any).isOwnGoal || false
    }))
  )

  const [homePlayers, setHomePlayers] = useState<Player[]>([])
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([])
  const [homeYellowCards, setHomeYellowCards] = useState<string[]>(
    (match.result?.homeTeamYellowCards || []).map(c => c.playerName)
  )
  const [awayYellowCards, setAwayYellowCards] = useState<string[]>(
    (match.result?.awayTeamYellowCards || []).map(c => c.playerName)
  )
  const [homeRedCards, setHomeRedCards] = useState<string[]>(
    (match.result?.homeTeamRedCards || []).map(c => c.playerName)
  )
  const [awayRedCards, setAwayRedCards] = useState<string[]>(
    (match.result?.awayTeamRedCards || []).map(c => c.playerName)
  )

  const handleAddScorer = (team: 'home' | 'away') => {
    if (team === 'home') {
      setHomeScorers([...homeScorers, { playerId: '', playerName: '', assists: '', isPenalty: false, isPenaltyMissed: false, isOwnGoal: false }])
    } else {
      setAwayScorers([...awayScorers, { playerId: '', playerName: '', assists: '', isPenalty: false, isPenaltyMissed: false, isOwnGoal: false }])
    }
  }

  const handleAddCard = (team: 'home' | 'away', cardType: 'yellow' | 'red', playerName: string) => {
    if (!playerName) return
    
    if (team === 'home') {
      if (cardType === 'yellow') {
        if (!homeYellowCards.includes(playerName)) {
          setHomeYellowCards([...homeYellowCards, playerName])
        }
      } else {
        if (!homeRedCards.includes(playerName)) {
          setHomeRedCards([...homeRedCards, playerName])
        }
      }
    } else {
      if (cardType === 'yellow') {
        if (!awayYellowCards.includes(playerName)) {
          setAwayYellowCards([...awayYellowCards, playerName])
        }
      } else {
        if (!awayRedCards.includes(playerName)) {
          setAwayRedCards([...awayRedCards, playerName])
        }
      }
    }
  }

  const handleRemoveCard = (team: 'home' | 'away', cardType: 'yellow' | 'red', playerName: string) => {
    if (team === 'home') {
      if (cardType === 'yellow') {
        setHomeYellowCards(homeYellowCards.filter(name => name !== playerName))
      } else {
        setHomeRedCards(homeRedCards.filter(name => name !== playerName))
      }
    } else {
      if (cardType === 'yellow') {
        setAwayYellowCards(awayYellowCards.filter(name => name !== playerName))
      } else {
        setAwayRedCards(awayRedCards.filter(name => name !== playerName))
      }
    }
  }



  const handleScorerChange = (
    team: 'home' | 'away',
    index: number,
    field: 'playerId' | 'playerName' | 'assists' | 'isPenalty' | 'isPenaltyMissed' | 'isOwnGoal',
    value: string | boolean
  ) => {
    if (team === 'home') {
      const newScorers = [...homeScorers]
      newScorers[index] = { ...newScorers[index], [field]: value }
      // Si own goal est coché, réinitialiser les autres champs et changer la liste de joueurs
      if (field === 'isOwnGoal' && value === true) {
        newScorers[index].playerId = ''
        newScorers[index].playerName = ''
        newScorers[index].assists = ''
        newScorers[index].isPenalty = false
        newScorers[index].isPenaltyMissed = false
      }
      // Si penalty raté est coché, décocher penalty
      if (field === 'isPenaltyMissed' && value === true) {
        newScorers[index].isPenalty = false
      }
      // Si penalty est coché, décocher penalty raté
      if (field === 'isPenalty' && value === true) {
        newScorers[index].isPenaltyMissed = false
      }
      setHomeScorers(newScorers)
    } else {
      const newScorers = [...awayScorers]
      newScorers[index] = { ...newScorers[index], [field]: value }
      // Si own goal est coché, réinitialiser les autres champs et changer la liste de joueurs
      if (field === 'isOwnGoal' && value === true) {
        newScorers[index].playerId = ''
        newScorers[index].playerName = ''
        newScorers[index].assists = ''
        newScorers[index].isPenalty = false
        newScorers[index].isPenaltyMissed = false
      }
      // Si penalty raté est coché, décocher penalty
      if (field === 'isPenaltyMissed' && value === true) {
        newScorers[index].isPenalty = false
      }
      // Si penalty est coché, décocher penalty raté
      if (field === 'isPenalty' && value === true) {
        newScorers[index].isPenaltyMissed = false
      }
      setAwayScorers(newScorers)
    }
  }

  // Helper to update multiple fields at once to avoid stale-state overwrites
  const updateScorerFields = (
    team: 'home' | 'away',
    index: number,
    fields: Partial<{ playerId?: string; playerName?: string; assists?: string; isPenalty?: boolean; isPenaltyMissed?: boolean; isOwnGoal?: boolean }>
  ) => {
    if (team === 'home') {
      setHomeScorers((prev) => {
        const newScorers = [...prev]
        newScorers[index] = { ...newScorers[index], ...fields }
        // Si own goal est coché, réinitialiser les autres champs
        if (fields.isOwnGoal === true) {
          newScorers[index].playerId = ''
          newScorers[index].playerName = ''
          newScorers[index].assists = ''
          newScorers[index].isPenalty = false
          newScorers[index].isPenaltyMissed = false
        }
        return newScorers
      })
    } else {
      setAwayScorers((prev) => {
        const newScorers = [...prev]
        newScorers[index] = { ...newScorers[index], ...fields }
        // Si own goal est coché, réinitialiser les autres champs
        if (fields.isOwnGoal === true) {
          newScorers[index].playerId = ''
          newScorers[index].playerName = ''
          newScorers[index].assists = ''
          newScorers[index].isPenalty = false
          newScorers[index].isPenaltyMissed = false
        }
        return newScorers
      })
    }
  }

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        if (match.homeTeamId) {
          const homeResponse = await fetch(`/api/admin/players?teamId=${match.homeTeamId}`)
          if (homeResponse.ok) {
            const homePlayersData = await homeResponse.json()
            setHomePlayers(homePlayersData.map((player: any) => ({
              ...player,
              createdAt: player.createdAt ? new Date(player.createdAt.seconds * 1000) : new Date(),
              updatedAt: player.updatedAt ? new Date(player.updatedAt.seconds * 1000) : new Date()
            })))
          }
        }
        if (match.awayTeamId) {
          const awayResponse = await fetch(`/api/admin/players?teamId=${match.awayTeamId}`)
          if (awayResponse.ok) {
            const awayPlayersData = await awayResponse.json()
            setAwayPlayers(awayPlayersData.map((player: any) => ({
              ...player,
              createdAt: player.createdAt ? new Date(player.createdAt.seconds * 1000) : new Date(),
              updatedAt: player.updatedAt ? new Date(player.updatedAt.seconds * 1000) : new Date()
            })))
          }
        }
      } catch (error) {
        console.error('Error loading players for match:', error)
      }
    }
    loadPlayers()
  }, [match.homeTeamId, match.awayTeamId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Compter les buts valides (exclure les penalties ratés)
    const homeValidGoals = homeScorers.filter(s => !s.isPenaltyMissed).length
    const awayValidGoals = awayScorers.filter(s => !s.isPenaltyMissed).length
    
    // Validation
    if (homeValidGoals !== homeScore) {
      alert(`Le nombre de buts valides de l'équipe ${match.homeTeam?.name} (${homeValidGoals}) ne correspond pas au score (${homeScore}). N'oubliez pas que les penalties ratés ne comptent pas !`);
      return;
    }
    
    if (awayValidGoals !== awayScore) {
      alert(`Le nombre de buts valides de l'équipe ${match.awayTeam?.name} (${awayValidGoals}) ne correspond pas au score (${awayScore}). N'oubliez pas que les penalties ratés ne comptent pas !`);
      return;
    }
    
    // Check if all scorer names are filled (sauf penalties ratés)
    if (homeScorers.some(scorer => !scorer.isPenaltyMissed && !scorer.playerName.trim())) {
      alert(`Veuillez remplir tous les noms des buteurs de l'équipe ${match.homeTeam?.name}`);
      return;
    }
    
    if (awayScorers.some(scorer => !scorer.isPenaltyMissed && !scorer.playerName.trim())) {
      alert(`Veuillez remplir tous les noms des buteurs de l'équipe ${match.awayTeam?.name}`);
      return;
    }

    const result: MatchResult = {
      id: match.result?.id || '', // Keep existing ID if editing
      matchId: match.id,
      homeTeamScore: homeScore,
      awayTeamScore: awayScore,
      homeTeamGoalScorers: homeScorers,
      awayTeamGoalScorers: awayScorers,
      homeTeamYellowCards: homeYellowCards.map(name => ({ playerName: name })),
      awayTeamYellowCards: awayYellowCards.map(name => ({ playerName: name })),
      homeTeamRedCards: homeRedCards.map(name => ({ playerName: name })),
      awayTeamRedCards: awayRedCards.map(name => ({ playerName: name })),
      createdAt: match.result?.createdAt || new Date(),
      updatedAt: new Date()
    }

    await onSubmit(match, result)
  }

  const formatMatchDate = (date: Date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      year: "numeric", 
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date)
  }

  const getScoreValidation = () => {
    // Compter les buts valides (exclure les penalties ratés)
    const homeValidGoals = homeScorers.filter(s => !s.isPenaltyMissed && s.playerName.trim()).length
    const awayValidGoals = awayScorers.filter(s => !s.isPenaltyMissed && s.playerName.trim()).length
    
    return {
      homeValid: homeValidGoals === homeScore,
      awayValid: awayValidGoals === awayScore,
      homeScorersCount: homeValidGoals,
      awayScorersCount: awayValidGoals
    }
  }

  const validation = getScoreValidation()

  return (
    <div className="max-w-4xl mx-auto">
      {/* Match Header */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-t-xl border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Trophy className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Résultat du Match</h2>
              <p className="text-sm text-gray-600 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatMatchDate(match.date)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Journée {match.round}</p>
            <p className="text-xs text-gray-500">ID: {match.id.slice(-6)}</p>
          </div>
        </div>

        {/* Teams Header */}
        <div className="grid grid-cols-3 gap-4 items-center">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Home className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-green-700 bg-green-100 px-2 py-1 rounded">
                DOMICILE
              </span>
            </div>
            <h3 className="text-lg font-bold text-gray-900">{match.homeTeam?.name}</h3>
          </div>
          
          <div className="text-center">
            <div className="bg-white p-3 rounded-lg shadow-sm border" key={`score-${homeScore}-${awayScore}`}>
              <p className="text-sm text-gray-600 mb-1">Score Final</p>
              <div className="text-2xl font-bold text-gray-900">
                <span className="text-green-600">{homeScore}</span>
                <span className="mx-2">-</span>
                <span className="text-blue-600">{awayScore}</span>
              </div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-sm font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded">
                EXTÉRIEUR
              </span>
              <Plane className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{match.awayTeam?.name}</h3>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-b-xl">
        <div className="p-6 space-y-8">
          {/* Score Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Home Team Score */}
            <div className="bg-green-50 p-6 rounded-xl border border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Home className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{match.homeTeam?.name}</h4>
                  <p className="text-sm text-gray-600">Équipe à domicile</p>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Score de l'équipe
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={homeScore}
                    onChange={(e) => setHomeScore(Number(e.target.value))}
                    className="w-full px-4 py-3 text-2xl font-bold text-center border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white text-gray-900"
                    required
                  />
                  <Target className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
                </div>
              </div>

              {/* Validation Indicator */}
              <div className={`flex items-center gap-2 text-sm p-2 rounded ${
                validation.homeValid 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {validation.homeValid ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span>
                  {validation.homeValid 
                    ? 'Score et buteurs correspondent' 
                    : `${validation.homeScorersCount}/${homeScore} buteurs renseignés`
                  }
                </span>
              </div>
            </div>

            {/* Away Team Score */}
            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Plane className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{match.awayTeam?.name}</h4>
                  <p className="text-sm text-gray-600">Équipe à l'extérieur</p>
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Score de l'équipe
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={awayScore}
                    onChange={(e) => setAwayScore(Number(e.target.value))}
                    className="w-full px-4 py-3 text-2xl font-bold text-center border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white text-gray-900"
                    required
                  />
                  <Target className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-blue-500" />
                </div>
              </div>

              {/* Validation Indicator */}
              <div className={`flex items-center gap-2 text-sm p-2 rounded ${
                validation.awayValid 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {validation.awayValid ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span>
                  {validation.awayValid 
                    ? 'Score et buteurs correspondent' 
                    : `${validation.awayScorersCount}/${awayScore} buteurs renseignés`
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Goal Scorers Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Home Team Scorers */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Buteurs - {match.homeTeam?.name}
                </h4>
                {homeScore > homeScorers.length && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddScorer('home')}
                    className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {homeScorers.map((scorer, index) => (
                  <div key={`home-scorer-form-${index}`} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-green-100 p-1 rounded">
                        <Target className="w-4 h-4 text-green-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">But #{index + 1}</span>
                      <div className="ml-auto">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newScorers = [...homeScorers]
                            newScorers.splice(index, 1)
                            setHomeScorers(newScorers)
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {!scorer.isOwnGoal && (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              🎯 Qui a marqué ce but ?
                            </label>
                            <select
                              value={scorer.playerId || (scorer.playerName ? '__manual__' : '')}
                              onChange={(e) => {
                                const val = e.target.value
                                if (val === '__manual__') {
                                  updateScorerFields('home', index, { playerId: '', playerName: '' })
                                } else {
                                  const p = homePlayers.find((pl) => pl.id === val)
                                  if (p) {
                                    updateScorerFields('home', index, { playerId: p.id, playerName: p.name })
                                  }
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm bg-white text-gray-900 font-medium"
                              style={{ color: scorer.playerId ? '#059669' : '#6B7280' }}
                              disabled={scorer.isPenaltyMissed}
                            >
                              <option value="" className="text-gray-400">👆 Choisir le buteur dans la liste...</option>
                              {homePlayers.map((p) => (
                                <option key={p.id} value={p.id} className="text-gray-900">
                                  ⚽ #{p.number} - {p.name}
                                </option>
                              ))}
                              <option value="__manual__" className="text-blue-600">✏️ Autre joueur (saisir le nom)</option>
                            </select>
                          </div>

                          {(!scorer.playerId || scorer.playerName) && (
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                ✏️ Nom du buteur (si pas dans la liste)
                              </label>
                              <input
                                type="text"
                                placeholder="Tapez le nom du joueur qui a marqué..."
                                value={scorer.playerName}
                                onChange={(e) => handleScorerChange('home', index, 'playerName', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm bg-white text-gray-900 font-medium"
                                required={!scorer.isPenaltyMissed}
                                disabled={!!scorer.playerId || scorer.isPenaltyMissed}
                              />
                            </div>
                          )}
                        </>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          🅰️ Qui a fait la passe décisive ? (optionnel)
                        </label>
                        <select
                          value={scorer.assists ? homePlayers.find(p => p.name === scorer.assists)?.id || '__manual_assist__' : ''}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val === '__none__') {
                              updateScorerFields('home', index, { assists: '' })
                            } else if (val === '__manual_assist__') {
                              updateScorerFields('home', index, { assists: '' })
                            } else {
                              const p = homePlayers.find((pl) => pl.id === val)
                              updateScorerFields('home', index, { assists: p ? p.name : '' })
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm bg-white text-gray-900 font-medium"
                          style={{ color: scorer.assists ? '#2563EB' : '#6B7280' }}
                          disabled={scorer.isOwnGoal || scorer.isPenaltyMissed}
                        >
                          <option value="" className="text-gray-400">👆 Choisir le passeur ou laisser vide...</option>
                          {homePlayers.map((p) => (
                            <option key={p.id} value={p.id} className="text-gray-900">
                              🅰️ #{p.number} - {p.name}
                            </option>
                          ))}
                          <option value="__manual_assist__" className="text-blue-600">✏️ Autre joueur</option>
                        </select>
                      </div>

                      {/* Options spéciales */}
                      <div className="space-y-2 pt-2 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`home-penalty-${index}`}
                            checked={scorer.isPenalty || false}
                            onChange={(e) => handleScorerChange('home', index, 'isPenalty', e.target.checked)}
                            disabled={scorer.isOwnGoal || scorer.isPenaltyMissed}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <label htmlFor={`home-penalty-${index}`} className="text-xs font-medium text-gray-700 cursor-pointer">
                            ⚽ Penalty marqué
                          </label>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`home-penalty-missed-${index}`}
                            checked={scorer.isPenaltyMissed || false}
                            onChange={(e) => handleScorerChange('home', index, 'isPenaltyMissed', e.target.checked)}
                            disabled={scorer.isOwnGoal || scorer.isPenalty}
                            className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                          />
                          <label htmlFor={`home-penalty-missed-${index}`} className="text-xs font-medium text-gray-700 cursor-pointer">
                            ❌ Penalty raté (ne compte pas dans le score)
                          </label>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`home-own-goal-${index}`}
                            checked={scorer.isOwnGoal || false}
                            onChange={(e) => {
                              handleScorerChange('home', index, 'isOwnGoal', e.target.checked)
                            }}
                            disabled={scorer.isPenalty || scorer.isPenaltyMissed}
                            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                          />
                          <label htmlFor={`home-own-goal-${index}`} className="text-xs font-medium text-gray-700 cursor-pointer">
                            🚨 But contre son camp (Own Goal)
                          </label>
                        </div>

                        {/* Si own goal, afficher la liste de l'équipe adverse */}
                        {scorer.isOwnGoal && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                            <label className="block text-xs font-medium text-red-700 mb-1">
                              🎯 Joueur de l'équipe adverse qui a marqué contre son camp :
                            </label>
                            <select
                              value={scorer.playerId || (scorer.playerName ? '__manual__' : '')}
                              onChange={(e) => {
                                const val = e.target.value
                                if (val === '__manual__') {
                                  updateScorerFields('home', index, { playerId: '', playerName: '' })
                                } else {
                                  const p = awayPlayers.find((pl) => pl.id === val)
                                  if (p) {
                                    updateScorerFields('home', index, { playerId: p.id, playerName: p.name })
                                  }
                                }
                              }}
                              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm bg-white text-gray-900 font-medium"
                            >
                              <option value="" className="text-gray-400">👆 Choisir le joueur adverse...</option>
                              {awayPlayers.map((p) => (
                                <option key={p.id} value={p.id} className="text-gray-900">
                                  ⚽ #{p.number} - {p.name}
                                </option>
                              ))}
                              <option value="__manual__" className="text-blue-600">✏️ Autre joueur (saisir le nom)</option>
                            </select>
                            {(!scorer.playerId || scorer.playerName) && (
                              <input
                                type="text"
                                placeholder="Nom du joueur adverse..."
                                value={scorer.playerName}
                                onChange={(e) => handleScorerChange('home', index, 'playerName', e.target.value)}
                                className="w-full mt-2 px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm bg-white text-gray-900 font-medium"
                                required
                                disabled={!!scorer.playerId}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {homeScorers.length === 0 && homeScore > 0 && (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    <Target className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Aucun buteur ajouté</p>
                    <p className="text-xs">Cliquez sur "Ajouter" pour commencer</p>
                  </div>
                )}
              </div>
            </div>

            {/* Away Team Scorers */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Buteurs - {match.awayTeam?.name}
                </h4>
                {awayScore > awayScorers.length && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddScorer('away')}
                    className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ajouter
                  </Button>
                )}
              </div>

              <div className="space-y-3">
                {awayScorers.map((scorer, index) => (
                  <div key={`away-scorer-form-${index}`} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-blue-100 p-1 rounded">
                        <Target className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">But #{index + 1}</span>
                      <div className="ml-auto">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newScorers = [...awayScorers]
                            newScorers.splice(index, 1)
                            setAwayScorers(newScorers)
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {!scorer.isOwnGoal && (
                        <>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              🎯 Qui a marqué ce but ?
                            </label>
                            <select
                              value={scorer.playerId || (scorer.playerName ? '__manual__' : '')}
                              onChange={(e) => {
                                const val = e.target.value
                                if (val === '__manual__') {
                                  handleScorerChange('away', index, 'playerId', '')
                                  handleScorerChange('away', index, 'playerName', '')
                                } else {
                                  const p = awayPlayers.find((pl) => pl.id === val)
                                  if (p) {
                                    handleScorerChange('away', index, 'playerId', p.id)
                                    handleScorerChange('away', index, 'playerName', p.name)
                                  }
                                }
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white text-gray-900 font-medium"
                              style={{ color: scorer.playerId ? '#059669' : '#6B7280' }}
                              disabled={scorer.isPenaltyMissed}
                            >
                              <option value="" className="text-gray-400">👆 Choisir le buteur dans la liste...</option>
                              {awayPlayers.map((p) => (
                                <option key={p.id} value={p.id} className="text-gray-900">
                                  ⚽ #{p.number} - {p.name}
                                </option>
                              ))}
                              <option value="__manual__" className="text-blue-600">✏️ Autre joueur (saisir le nom)</option>
                            </select>
                          </div>

                          {(!scorer.playerId || scorer.playerName) && (
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                ✏️ Nom du buteur (si pas dans la liste)
                              </label>
                              <input
                                type="text"
                                placeholder="Tapez le nom du joueur qui a marqué..."
                                value={scorer.playerName}
                                onChange={(e) => handleScorerChange('away', index, 'playerName', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white text-gray-900 font-medium"
                                required={!scorer.isPenaltyMissed}
                                disabled={!!scorer.playerId || scorer.isPenaltyMissed}
                              />
                            </div>
                          )}
                        </>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          🅰️ Qui a fait la passe décisive ? (optionnel)
                        </label>
                        <select
                          value={scorer.assists ? awayPlayers.find(p => p.name === scorer.assists)?.id || '__manual_assist__' : ''}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val === '__none__') {
                              updateScorerFields('away', index, { assists: '' })
                            } else if (val === '__manual_assist__') {
                              updateScorerFields('away', index, { assists: '' })
                            } else {
                              const p = awayPlayers.find((pl) => pl.id === val)
                              updateScorerFields('away', index, { assists: p ? p.name : '' })
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white text-gray-900 font-medium"
                          style={{ color: scorer.assists ? '#2563EB' : '#6B7280' }}
                          disabled={scorer.isOwnGoal || scorer.isPenaltyMissed}
                        >
                          <option value="" className="text-gray-400">👆 Choisir le passeur ou laisser vide...</option>
                          {awayPlayers.map((p) => (
                            <option key={p.id} value={p.id} className="text-gray-900">
                              🅰️ #{p.number} - {p.name}
                            </option>
                          ))}
                          <option value="__manual_assist__" className="text-blue-600">✏️ Autre joueur</option>
                        </select>
                      </div>

                      {/* Options spéciales */}
                      <div className="space-y-2 pt-2 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`away-penalty-${index}`}
                            checked={scorer.isPenalty || false}
                            onChange={(e) => handleScorerChange('away', index, 'isPenalty', e.target.checked)}
                            disabled={scorer.isOwnGoal || scorer.isPenaltyMissed}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <label htmlFor={`away-penalty-${index}`} className="text-xs font-medium text-gray-700 cursor-pointer">
                            ⚽ Penalty marqué
                          </label>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`away-penalty-missed-${index}`}
                            checked={scorer.isPenaltyMissed || false}
                            onChange={(e) => handleScorerChange('away', index, 'isPenaltyMissed', e.target.checked)}
                            disabled={scorer.isOwnGoal || scorer.isPenalty}
                            className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                          />
                          <label htmlFor={`away-penalty-missed-${index}`} className="text-xs font-medium text-gray-700 cursor-pointer">
                            ❌ Penalty raté (ne compte pas dans le score)
                          </label>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`away-own-goal-${index}`}
                            checked={scorer.isOwnGoal || false}
                            onChange={(e) => {
                              handleScorerChange('away', index, 'isOwnGoal', e.target.checked)
                            }}
                            disabled={scorer.isPenalty || scorer.isPenaltyMissed}
                            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                          />
                          <label htmlFor={`away-own-goal-${index}`} className="text-xs font-medium text-gray-700 cursor-pointer">
                            🚨 But contre son camp (Own Goal)
                          </label>
                        </div>

                        {/* Si own goal, afficher la liste de l'équipe adverse */}
                        {scorer.isOwnGoal && (
                          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                            <label className="block text-xs font-medium text-red-700 mb-1">
                              🎯 Joueur de l'équipe adverse qui a marqué contre son camp :
                            </label>
                            <select
                              value={scorer.playerId || (scorer.playerName ? '__manual__' : '')}
                              onChange={(e) => {
                                const val = e.target.value
                                if (val === '__manual__') {
                                  updateScorerFields('away', index, { playerId: '', playerName: '' })
                                } else {
                                  const p = homePlayers.find((pl) => pl.id === val)
                                  if (p) {
                                    updateScorerFields('away', index, { playerId: p.id, playerName: p.name })
                                  }
                                }
                              }}
                              className="w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm bg-white text-gray-900 font-medium"
                            >
                              <option value="" className="text-gray-400">👆 Choisir le joueur adverse...</option>
                              {homePlayers.map((p) => (
                                <option key={p.id} value={p.id} className="text-gray-900">
                                  ⚽ #{p.number} - {p.name}
                                </option>
                              ))}
                              <option value="__manual__" className="text-blue-600">✏️ Autre joueur (saisir le nom)</option>
                            </select>
                            {(!scorer.playerId || scorer.playerName) && (
                              <input
                                type="text"
                                placeholder="Nom du joueur adverse..."
                                value={scorer.playerName}
                                onChange={(e) => handleScorerChange('away', index, 'playerName', e.target.value)}
                                className="w-full mt-2 px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-sm bg-white text-gray-900 font-medium"
                                required
                                disabled={!!scorer.playerId}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {awayScorers.length === 0 && awayScore > 0 && (
                  <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                    <Target className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">Aucun buteur ajouté</p>
                    <p className="text-xs">Cliquez sur "Ajouter" pour commencer</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cards Section - With Player Selection */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Home Team Cards */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Square className="w-5 h-5 text-yellow-500" />
                Cartons - {match.homeTeam?.name}
              </h4>

              {/* Yellow Cards */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-yellow-800 flex items-center gap-2">
                    <Square className="w-4 h-4 text-yellow-500" />
                    Cartons Jaunes
                  </h5>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const player = homePlayers.find(p => p.id === e.target.value)
                        if (player) {
                          handleAddCard('home', 'yellow', player.name)
                        }
                        e.target.value = '' // Reset selection
                      }
                    }}
                    className="px-3 py-1 border border-yellow-300 rounded-lg text-sm bg-white text-gray-900"
                  >
                    <option value="">Ajouter un carton jaune</option>
                    {homePlayers
                      .filter(p => !homeYellowCards.includes(p.name))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          #{p.number} - {p.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2">
                  {homeYellowCards.map((playerName, index) => (
                    <div key={`home-yellow-${index}`} className="flex items-center justify-between bg-yellow-100 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-6 bg-yellow-400 border border-yellow-600 rounded-sm shadow-sm"></div>
                        <span className="text-yellow-800 font-medium">{playerName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCard('home', 'yellow', playerName)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Red Cards */}
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-red-800 flex items-center gap-2">
                    <Square className="w-4 h-4 text-red-500" />
                    Cartons Rouges
                  </h5>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const player = homePlayers.find(p => p.id === e.target.value)
                        if (player) {
                          handleAddCard('home', 'red', player.name)
                        }
                        e.target.value = '' // Reset selection
                      }
                    }}
                    className="px-3 py-1 border border-red-300 rounded-lg text-sm bg-white text-gray-900"
                  >
                    <option value="">Ajouter un carton rouge</option>
                    {homePlayers
                      .filter(p => !homeRedCards.includes(p.name))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          #{p.number} - {p.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2">
                  {homeRedCards.map((playerName, index) => (
                    <div key={`home-red-${index}`} className="flex items-center justify-between bg-red-100 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-6 bg-red-500 border border-red-700 rounded-sm shadow-sm"></div>
                        <span className="text-red-800 font-medium">{playerName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCard('home', 'red', playerName)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Away Team Cards */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Square className="w-5 h-5 text-yellow-500" />
                Cartons - {match.awayTeam?.name}
              </h4>

              {/* Yellow Cards */}
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-yellow-800 flex items-center gap-2">
                    <Square className="w-4 h-4 text-yellow-500" />
                    Cartons Jaunes
                  </h5>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const player = awayPlayers.find(p => p.id === e.target.value)
                        if (player) {
                          handleAddCard('away', 'yellow', player.name)
                        }
                        e.target.value = '' // Reset selection
                      }
                    }}
                    className="px-3 py-1 border border-yellow-300 rounded-lg text-sm bg-white text-gray-900"
                  >
                    <option value="">Ajouter un carton jaune</option>
                    {awayPlayers
                      .filter(p => !awayYellowCards.includes(p.name))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          #{p.number} - {p.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2">
                  {awayYellowCards.map((playerName, index) => (
                    <div key={`away-yellow-${index}`} className="flex items-center justify-between bg-yellow-100 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-6 bg-yellow-400 border border-yellow-600 rounded-sm shadow-sm"></div>
                        <span className="text-yellow-800 font-medium">{playerName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCard('away', 'yellow', playerName)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Red Cards */}
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-medium text-red-800 flex items-center gap-2">
                    <Square className="w-4 h-4 text-red-500" />
                    Cartons Rouges
                  </h5>
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        const player = awayPlayers.find(p => p.id === e.target.value)
                        if (player) {
                          handleAddCard('away', 'red', player.name)
                        }
                        e.target.value = '' // Reset selection
                      }
                    }}
                    className="px-3 py-1 border border-red-300 rounded-lg text-sm bg-white text-gray-900"
                  >
                    <option value="">Ajouter un carton rouge</option>
                    {awayPlayers
                      .filter(p => !awayRedCards.includes(p.name))
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          #{p.number} - {p.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-2">
                  {awayRedCards.map((playerName, index) => (
                    <div key={`away-red-${index}`} className="flex items-center justify-between bg-red-100 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-6 bg-red-500 border border-red-700 rounded-sm shadow-sm"></div>
                        <span className="text-red-800 font-medium">{playerName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCard('away', 'red', playerName)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="bg-gray-50 px-6 py-4 rounded-b-xl border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {!validation.homeValid && (
                <div className="flex items-center gap-1 text-yellow-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>Vérifiez les buteurs de {match.homeTeam?.name}</span>
                </div>
              )}
              {!validation.awayValid && (
                <div className="flex items-center gap-1 text-yellow-600">
                  <AlertCircle className="w-4 h-4" />
                  <span>Vérifiez les buteurs de {match.awayTeam?.name}</span>
                </div>
              )}
              {validation.homeValid && validation.awayValid && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Toutes les informations sont correctes</span>
                </div>
              )}
            </div>
            
            <Button 
              type="submit" 
              disabled={isSubmitting || !validation.homeValid || !validation.awayValid}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Enregistrer le résultat
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}