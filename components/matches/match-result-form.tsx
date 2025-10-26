"use client"

import { useState, useEffect } from "react"
import type { Match, Team, MatchResult } from "@/lib/types"
import type { Player } from "@/lib/types"
import { getPlayersByTeam } from "@/lib/db"
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
  Clock
} from "lucide-react"

interface MatchResultFormProps {
  match: Match & { homeTeam?: Team; awayTeam?: Team; result?: MatchResult }
  onSubmit: (match: Match & { homeTeam?: Team; awayTeam?: Team; result?: MatchResult }, result: MatchResult) => Promise<void>
  isSubmitting: boolean
}

export function MatchResultForm({ match, onSubmit, isSubmitting }: MatchResultFormProps) {
  const [homeScore, setHomeScore] = useState(match.result?.homeTeamScore || 0)
  const [awayScore, setAwayScore] = useState(match.result?.awayTeamScore || 0)
  const [homeScorers, setHomeScorers] = useState<Array<{ playerId?: string; playerName: string; assists?: string }>>(
    (match.result?.homeTeamGoalScorers || []).map(s => ({ playerId: (s as any).playerId || '', playerName: s.playerName, assists: s.assists }))
  )
  const [awayScorers, setAwayScorers] = useState<Array<{ playerId?: string; playerName: string; assists?: string }>>(
    (match.result?.awayTeamGoalScorers || []).map(s => ({ playerId: (s as any).playerId || '', playerName: s.playerName, assists: s.assists }))
  )

  const [homePlayers, setHomePlayers] = useState<Player[]>([])
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([])

  const handleAddScorer = (team: 'home' | 'away') => {
    if (team === 'home') {
      setHomeScorers([...homeScorers, { playerId: '', playerName: '', assists: '' }])
    } else {
      setAwayScorers([...awayScorers, { playerId: '', playerName: '', assists: '' }])
    }
  }

  const handleScorerChange = (
    team: 'home' | 'away',
    index: number,
    field: 'playerId' | 'playerName' | 'assists',
    value: string
  ) => {
    if (team === 'home') {
      const newScorers = [...homeScorers]
      newScorers[index] = { ...newScorers[index], [field]: value }
      setHomeScorers(newScorers)
    } else {
      const newScorers = [...awayScorers]
      newScorers[index] = { ...newScorers[index], [field]: value }
      setAwayScorers(newScorers)
    }
  }

  // Helper to update multiple fields at once to avoid stale-state overwrites
  const updateScorerFields = (
    team: 'home' | 'away',
    index: number,
    fields: Partial<{ playerId?: string; playerName?: string; assists?: string }>
  ) => {
    if (team === 'home') {
      setHomeScorers((prev) => {
        const newScorers = [...prev]
        newScorers[index] = { ...newScorers[index], ...fields }
        return newScorers
      })
    } else {
      setAwayScorers((prev) => {
        const newScorers = [...prev]
        newScorers[index] = { ...newScorers[index], ...fields }
        return newScorers
      })
    }
  }

  useEffect(() => {
    const loadPlayers = async () => {
      try {
        if (match.homeTeamId) {
          const h = await getPlayersByTeam(match.homeTeamId)
          setHomePlayers(h)
        }
        if (match.awayTeamId) {
          const a = await getPlayersByTeam(match.awayTeamId)
          setAwayPlayers(a)
        }
      } catch (error) {
        console.error('Error loading players for match:', error)
      }
    }
    loadPlayers()
  }, [match.homeTeamId, match.awayTeamId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (homeScorers.length !== homeScore) {
      alert(`Le nombre de buteurs de l'équipe ${match.homeTeam?.name} (${homeScorers.length}) ne correspond pas au score (${homeScore})`);
      return;
    }
    
    if (awayScorers.length !== awayScore) {
      alert(`Le nombre de buteurs de l'équipe ${match.awayTeam?.name} (${awayScorers.length}) ne correspond pas au score (${awayScore})`);
      return;
    }
    
    // Check if all scorer names are filled
    if (homeScorers.some(scorer => !scorer.playerName.trim())) {
      alert(`Veuillez remplir tous les noms des buteurs de l'équipe ${match.homeTeam?.name}`);
      return;
    }
    
    if (awayScorers.some(scorer => !scorer.playerName.trim())) {
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
    const homeScorersCount = homeScorers.filter(s => s.playerName.trim()).length
    const awayScorersCount = awayScorers.filter(s => s.playerName.trim()).length
    
    return {
      homeValid: homeScorersCount === homeScore,
      awayValid: awayScorersCount === awayScore,
      homeScorersCount,
      awayScorersCount
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
            <div className="bg-white p-3 rounded-lg shadow-sm border">
              <p className="text-sm text-gray-600 mb-1">Score Final</p>
              <div className="text-2xl font-bold text-gray-900">
                {homeScore} - {awayScore}
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
                    className="w-full px-4 py-3 text-2xl font-bold text-center border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none bg-white"
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
                    className="w-full px-4 py-3 text-2xl font-bold text-center border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
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
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Sélectionner le buteur
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                        >
                          <option value="">Choisir un joueur...</option>
                          {homePlayers.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.number ? `#${p.number} - ` : ''}{p.name}
                            </option>
                          ))}
                          <option value="__manual__">✏️ Saisir manuellement</option>
                        </select>
                      </div>

                      {(!scorer.playerId || scorer.playerName) && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Nom du buteur
                          </label>
                          <input
                            type="text"
                            placeholder="Nom du joueur"
                            value={scorer.playerName}
                            onChange={(e) => handleScorerChange('home', index, 'playerName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                            required
                            disabled={!!scorer.playerId}
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Passeur décisif (optionnel)
                        </label>
                        <select
                          value={scorer.assists || ''}
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-sm"
                        >
                          <option value="">Aucun passeur</option>
                          {homePlayers.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.number ? `#${p.number} - ` : ''}{p.name}
                            </option>
                          ))}
                          <option value="__manual_assist__">✏️ Autre joueur</option>
                        </select>
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
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Sélectionner le buteur
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                        >
                          <option value="">Choisir un joueur...</option>
                          {awayPlayers.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.number ? `#${p.number} - ` : ''}{p.name}
                            </option>
                          ))}
                          <option value="__manual__">✏️ Saisir manuellement</option>
                        </select>
                      </div>

                      {(!scorer.playerId || scorer.playerName) && (
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Nom du buteur
                          </label>
                          <input
                            type="text"
                            placeholder="Nom du joueur"
                            value={scorer.playerName}
                            onChange={(e) => handleScorerChange('away', index, 'playerName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                            required
                            disabled={!!scorer.playerId}
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Passeur décisif (optionnel)
                        </label>
                        <select
                          value={scorer.assists || ''}
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                        >
                          <option value="">Aucun passeur</option>
                          {awayPlayers.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.number ? `#${p.number} - ` : ''}{p.name}
                            </option>
                          ))}
                          <option value="__manual_assist__">✏️ Autre joueur</option>
                        </select>
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