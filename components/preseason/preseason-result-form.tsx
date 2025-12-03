'use client'

import { useState, useEffect } from 'react'
import { 
  Trophy, 
  Target, 
  Users, 
  Plus, 
  Trash2, 
  Save,
  AlertCircle,
  CheckCircle,
  Square,
  XCircle,
  CheckCircle2
} from 'lucide-react'
import type { PreseasonMatch } from '@/lib/types'
import { Button } from '@/components/ui/button'

interface Player {
  id: string
  name: string
  nickname?: string
  number: number
  email?: string
}

interface PreseasonResultFormProps {
  match: PreseasonMatch
  onSubmit: (result: any) => Promise<void>
  isSubmitting: boolean
}

export function PreseasonResultForm({ match, onSubmit, isSubmitting }: PreseasonResultFormProps) {
  const [scoreA, setScoreA] = useState(match.scoreA || 0)
  const [scoreB, setScoreB] = useState(match.scoreB || 0)
  
  const [teamAScorers, setTeamAScorers] = useState<Array<{
    playerId?: string
    playerName: string
    assists?: string
    isPenalty?: boolean
    isPenaltyMissed?: boolean
    isOwnGoal?: boolean
  }>>(match.teamAGoalScorers || [])
  
  const [teamBScorers, setTeamBScorers] = useState<Array<{
    playerId?: string
    playerName: string
    assists?: string
    isPenalty?: boolean
    isPenaltyMissed?: boolean
    isOwnGoal?: boolean
  }>>(match.teamBGoalScorers || [])
  
  const [teamAPlayers, setTeamAPlayers] = useState<Player[]>([])
  const [teamBPlayers, setTeamBPlayers] = useState<Player[]>([])
  
  const [teamAYellowCards, setTeamAYellowCards] = useState<Array<{ playerId?: string; playerName: string }>>(
    match.teamAYellowCards || []
  )
  const [teamBYellowCards, setTeamBYellowCards] = useState<Array<{ playerId?: string; playerName: string }>>(
    match.teamBYellowCards || []
  )
  const [teamARedCards, setTeamARedCards] = useState<Array<{ playerId?: string; playerName: string }>>(
    match.teamARedCards || []
  )
  const [teamBRedCards, setTeamBRedCards] = useState<Array<{ playerId?: string; playerName: string }>>(
    match.teamBRedCards || []
  )
  
  const [penaltyShootout, setPenaltyShootout] = useState<{
    teamAPlayers: Array<{ playerId?: string; playerName: string; nickname?: string; scored: boolean }>
    teamBPlayers: Array<{ playerId?: string; playerName: string; nickname?: string; scored: boolean }>
  }>(match.penaltyShootout || { teamAPlayers: [], teamBPlayers: [] })
  
  const isDraw = scoreA === scoreB

  useEffect(() => {
    loadPlayers()
  }, [match.teamAId, match.teamBId])

  const loadPlayers = async () => {
    try {
      const [teamARes, teamBRes] = await Promise.all([
        fetch(`/api/admin/players?teamId=${match.teamAId}`),
        fetch(`/api/admin/players?teamId=${match.teamBId}`),
      ])

      if (teamARes.ok) {
        const data = await teamARes.json()
        setTeamAPlayers(data.map((p: any) => ({
          id: p.id,
          name: p.name || `${p.firstName} ${p.lastName}`,
          nickname: p.nickname,
          number: p.number || p.jerseyNumber || 0,
          email: p.email,
        })))
      }

      if (teamBRes.ok) {
        const data = await teamBRes.json()
        setTeamBPlayers(data.map((p: any) => ({
          id: p.id,
          name: p.name || `${p.firstName} ${p.lastName}`,
          nickname: p.nickname,
          number: p.number || p.jerseyNumber || 0,
          email: p.email,
        })))
      }
    } catch (error) {
      console.error('Error loading players:', error)
    }
  }

  const handleAddScorer = (team: 'A' | 'B') => {
    if (team === 'A') {
      setTeamAScorers([...teamAScorers, { playerName: '', assists: '', isPenalty: false, isPenaltyMissed: false, isOwnGoal: false }])
    } else {
      setTeamBScorers([...teamBScorers, { playerName: '', assists: '', isPenalty: false, isPenaltyMissed: false, isOwnGoal: false }])
    }
  }

  const handleScorerChange = (
    team: 'A' | 'B',
    index: number,
    field: 'playerId' | 'playerName' | 'assists' | 'isPenalty' | 'isPenaltyMissed' | 'isOwnGoal',
    value: string | boolean
  ) => {
    if (team === 'A') {
      const newScorers = [...teamAScorers]
      newScorers[index] = { ...newScorers[index], [field]: value }
      if (field === 'isOwnGoal' && value === true) {
        newScorers[index].playerId = ''
        newScorers[index].playerName = ''
        newScorers[index].assists = ''
        newScorers[index].isPenalty = false
        newScorers[index].isPenaltyMissed = false
      }
      if (field === 'isPenaltyMissed' && value === true) {
        newScorers[index].isPenalty = false
      }
      if (field === 'isPenalty' && value === true) {
        newScorers[index].isPenaltyMissed = false
      }
      setTeamAScorers(newScorers)
    } else {
      const newScorers = [...teamBScorers]
      newScorers[index] = { ...newScorers[index], [field]: value }
      if (field === 'isOwnGoal' && value === true) {
        newScorers[index].playerId = ''
        newScorers[index].playerName = ''
        newScorers[index].assists = ''
        newScorers[index].isPenalty = false
        newScorers[index].isPenaltyMissed = false
      }
      if (field === 'isPenaltyMissed' && value === true) {
        newScorers[index].isPenalty = false
      }
      if (field === 'isPenalty' && value === true) {
        newScorers[index].isPenaltyMissed = false
      }
      setTeamBScorers(newScorers)
    }
  }

  const handleAddCard = (team: 'A' | 'B', cardType: 'yellow' | 'red', playerName: string) => {
    if (!playerName) return
    
    if (team === 'A') {
      if (cardType === 'yellow') {
        if (!teamAYellowCards.find(c => c.playerName === playerName)) {
          setTeamAYellowCards([...teamAYellowCards, { playerName }])
        }
      } else {
        if (!teamARedCards.find(c => c.playerName === playerName)) {
          setTeamARedCards([...teamARedCards, { playerName }])
        }
      }
    } else {
      if (cardType === 'yellow') {
        if (!teamBYellowCards.find(c => c.playerName === playerName)) {
          setTeamBYellowCards([...teamBYellowCards, { playerName }])
        }
      } else {
        if (!teamBRedCards.find(c => c.playerName === playerName)) {
          setTeamBRedCards([...teamBRedCards, { playerName }])
        }
      }
    }
  }

  const handleRemoveCard = (team: 'A' | 'B', cardType: 'yellow' | 'red', playerName: string) => {
    if (team === 'A') {
      if (cardType === 'yellow') {
        setTeamAYellowCards(teamAYellowCards.filter(c => c.playerName !== playerName))
      } else {
        setTeamARedCards(teamARedCards.filter(c => c.playerName !== playerName))
      }
    } else {
      if (cardType === 'yellow') {
        setTeamBYellowCards(teamBYellowCards.filter(c => c.playerName !== playerName))
      } else {
        setTeamBRedCards(teamBRedCards.filter(c => c.playerName !== playerName))
      }
    }
  }

  const handleAddPenaltyPlayer = (team: 'A' | 'B') => {
    if (team === 'A') {
      setPenaltyShootout({
        ...penaltyShootout,
        teamAPlayers: [...penaltyShootout.teamAPlayers, { playerName: '', scored: false }]
      })
    } else {
      setPenaltyShootout({
        ...penaltyShootout,
        teamBPlayers: [...penaltyShootout.teamBPlayers, { playerName: '', scored: false }]
      })
    }
  }

  const handlePenaltyPlayerChange = (
    team: 'A' | 'B',
    index: number,
    field: 'playerId' | 'playerName' | 'nickname' | 'scored',
    value: string | boolean
  ) => {
    if (team === 'A') {
      const newPlayers = [...penaltyShootout.teamAPlayers]
      newPlayers[index] = { ...newPlayers[index], [field]: value }
      setPenaltyShootout({ ...penaltyShootout, teamAPlayers: newPlayers })
    } else {
      const newPlayers = [...penaltyShootout.teamBPlayers]
      newPlayers[index] = { ...newPlayers[index], [field]: value }
      setPenaltyShootout({ ...penaltyShootout, teamBPlayers: newPlayers })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const teamAValidGoals = teamAScorers.filter(s => !s.isPenaltyMissed).length
    const teamBValidGoals = teamBScorers.filter(s => !s.isPenaltyMissed).length

    if (teamAValidGoals !== scoreA) {
      alert(`Le nombre de buts valides de ${match.teamAName} (${teamAValidGoals}) ne correspond pas au score (${scoreA})`)
      return
    }

    if (teamBValidGoals !== scoreB) {
      alert(`Le nombre de buts valides de ${match.teamBName} (${teamBValidGoals}) ne correspond pas au score (${scoreB})`)
      return
    }

    // Validation tirs au but si égalité
    if (isDraw) {
      const teamAScored = penaltyShootout.teamAPlayers.filter(p => p.scored).length
      const teamBScored = penaltyShootout.teamBPlayers.filter(p => p.scored).length
      
      if (teamAScored === teamBScored) {
        alert('En cas d\'égalité, les tirs au but doivent avoir un gagnant. Vérifiez que les scores des tirs au but sont différents.')
        return
      }

      if (penaltyShootout.teamAPlayers.length === 0 || penaltyShootout.teamBPlayers.length === 0) {
        alert('Veuillez renseigner les tirs au but pour les deux équipes')
        return
      }
    }

    const result = {
      matchId: match.id,
      scoreA,
      scoreB,
      teamAGoalScorers: teamAScorers,
      teamBGoalScorers: teamBScorers,
      teamAYellowCards,
      teamBYellowCards,
      teamARedCards,
      teamBRedCards,
      penaltiesA: isDraw ? penaltyShootout.teamAPlayers.filter(p => p.scored).length : undefined,
      penaltiesB: isDraw ? penaltyShootout.teamBPlayers.filter(p => p.scored).length : undefined,
      penaltyShootout: isDraw ? penaltyShootout : undefined,
    }

    await onSubmit(result)
  }

  const getValidation = () => {
    const teamAValidGoals = teamAScorers.filter(s => !s.isPenaltyMissed && s.playerName.trim()).length
    const teamBValidGoals = teamBScorers.filter(s => !s.isPenaltyMissed && s.playerName.trim()).length

    return {
      teamAValid: teamAValidGoals === scoreA,
      teamBValid: teamBValidGoals === scoreB,
      teamAScorersCount: teamAValidGoals,
      teamBScorersCount: teamBValidGoals,
      penaltiesValid: !isDraw || (
        penaltyShootout.teamAPlayers.length > 0 &&
        penaltyShootout.teamBPlayers.length > 0 &&
        penaltyShootout.teamAPlayers.filter(p => p.scored).length !== penaltyShootout.teamBPlayers.filter(p => p.scored).length
      ),
    }
  }

  const validation = getValidation()

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-xl border border-orange-200 dark:border-orange-800">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">{match.teamAName}</h4>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Score</label>
            <input
              type="number"
              min="0"
              max="20"
              value={scoreA}
              onChange={(e) => setScoreA(Number(e.target.value))}
              className="w-full px-4 py-3 text-2xl font-bold text-center border-2 border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none bg-white dark:bg-gray-800"
              required
            />
          </div>
          <div className={`flex items-center gap-2 text-sm p-2 rounded ${
            validation.teamAValid ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30'
          }`}>
            {validation.teamAValid ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{validation.teamAValid ? 'Score et buteurs correspondent' : `${validation.teamAScorersCount}/${scoreA} buteurs`}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">{match.teamBName}</h4>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Score</label>
            <input
              type="number"
              min="0"
              max="20"
              value={scoreB}
              onChange={(e) => setScoreB(Number(e.target.value))}
              className="w-full px-4 py-3 text-2xl font-bold text-center border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-800"
              required
            />
          </div>
          <div className={`flex items-center gap-2 text-sm p-2 rounded ${
            validation.teamBValid ? 'bg-green-100 text-green-700 dark:bg-green-900/30' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30'
          }`}>
            {validation.teamBValid ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{validation.teamBValid ? 'Score et buteurs correspondent' : `${validation.teamBScorersCount}/${scoreB} buteurs`}</span>
          </div>
        </div>
      </div>

      {/* Goal Scorers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team A Scorers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-600" />
              Buteurs - {match.teamAName}
            </h4>
            {scoreA > teamAScorers.length && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddScorer('A')}
                className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
              >
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {teamAScorers.map((scorer, index) => (
              <div key={`teamA-scorer-${index}`} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">But #{index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newScorers = [...teamAScorers]
                      newScorers.splice(index, 1)
                      setTeamAScorers(newScorers)
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {!scorer.isOwnGoal && (
                    <>
                      <div>
                        <label className="block text-xs font-medium mb-1">Buteur</label>
                        <select
                          value={scorer.playerId || (scorer.playerName ? '__manual__' : '')}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val === '__manual__') {
                              handleScorerChange('A', index, 'playerId', '')
                              handleScorerChange('A', index, 'playerName', '')
                            } else {
                              const p = teamAPlayers.find(pl => pl.id === val)
                              if (p) {
                                handleScorerChange('A', index, 'playerId', p.id)
                                handleScorerChange('A', index, 'playerName', p.name)
                              }
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-700"
                          disabled={scorer.isPenaltyMissed}
                        >
                          <option value="">Choisir le buteur...</option>
                          {teamAPlayers.map((p) => (
                            <option key={p.id} value={p.id}>
                              #{p.number} - {p.name} {p.nickname ? `(${p.nickname})` : ''}
                            </option>
                          ))}
                          <option value="__manual__">Autre joueur (saisir le nom)</option>
                        </select>
                      </div>

                      {(!scorer.playerId || scorer.playerName) && (
                        <div>
                          <label className="block text-xs font-medium mb-1">Nom du buteur</label>
                          <input
                            type="text"
                            value={scorer.playerName}
                            onChange={(e) => handleScorerChange('A', index, 'playerName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Nom du joueur"
                            required={!scorer.isPenaltyMissed}
                            disabled={!!scorer.playerId || scorer.isPenaltyMissed}
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium mb-1">Passe décisive (optionnel)</label>
                        <select
                          value={scorer.assists ? teamAPlayers.find(p => p.name === scorer.assists)?.id || '__manual__' : ''}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val === '' || val === '__manual__') {
                              handleScorerChange('A', index, 'assists', '')
                            } else {
                              const p = teamAPlayers.find(pl => pl.id === val)
                              handleScorerChange('A', index, 'assists', p ? p.name : '')
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-700"
                          disabled={scorer.isOwnGoal || scorer.isPenaltyMissed}
                        >
                          <option value="">Aucune passe décisive</option>
                          {teamAPlayers.map((p) => (
                            <option key={p.id} value={p.id}>
                              #{p.number} - {p.name} {p.nickname ? `(${p.nickname})` : ''}
                            </option>
                          ))}
                          <option value="__manual__">Autre joueur</option>
                        </select>
                      </div>
                    </>
                  )}

                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={scorer.isPenalty || false}
                        onChange={(e) => handleScorerChange('A', index, 'isPenalty', e.target.checked)}
                        disabled={scorer.isOwnGoal || scorer.isPenaltyMissed}
                        className="w-4 h-4"
                      />
                      <label className="text-xs font-medium">Penalty marqué</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={scorer.isPenaltyMissed || false}
                        onChange={(e) => handleScorerChange('A', index, 'isPenaltyMissed', e.target.checked)}
                        disabled={scorer.isOwnGoal || scorer.isPenalty}
                        className="w-4 h-4"
                      />
                      <label className="text-xs font-medium">Penalty raté</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={scorer.isOwnGoal || false}
                        onChange={(e) => handleScorerChange('A', index, 'isOwnGoal', e.target.checked)}
                        disabled={scorer.isPenalty || scorer.isPenaltyMissed}
                        className="w-4 h-4"
                      />
                      <label className="text-xs font-medium">But contre son camp</label>
                    </div>

                    {scorer.isOwnGoal && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                        <label className="block text-xs font-medium mb-1">Joueur adverse</label>
                        <select
                          value={scorer.playerId || ''}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val === '__manual__') {
                              handleScorerChange('A', index, 'playerId', '')
                              handleScorerChange('A', index, 'playerName', '')
                            } else {
                              const p = teamBPlayers.find(pl => pl.id === val)
                              if (p) {
                                handleScorerChange('A', index, 'playerId', p.id)
                                handleScorerChange('A', index, 'playerName', p.name)
                              }
                            }
                          }}
                          className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm"
                        >
                          <option value="">Choisir le joueur adverse...</option>
                          {teamBPlayers.map((p) => (
                            <option key={p.id} value={p.id}>
                              #{p.number} - {p.name} {p.nickname ? `(${p.nickname})` : ''}
                            </option>
                          ))}
                          <option value="__manual__">Autre joueur</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Team B Scorers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Buteurs - {match.teamBName}
            </h4>
            {scoreB > teamBScorers.length && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddScorer('B')}
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </Button>
            )}
          </div>

          <div className="space-y-3">
            {teamBScorers.map((scorer, index) => (
              <div key={`teamB-scorer-${index}`} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">But #{index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newScorers = [...teamBScorers]
                      newScorers.splice(index, 1)
                      setTeamBScorers(newScorers)
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {!scorer.isOwnGoal && (
                    <>
                      <div>
                        <label className="block text-xs font-medium mb-1">Buteur</label>
                        <select
                          value={scorer.playerId || (scorer.playerName ? '__manual__' : '')}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val === '__manual__') {
                              handleScorerChange('B', index, 'playerId', '')
                              handleScorerChange('B', index, 'playerName', '')
                            } else {
                              const p = teamBPlayers.find(pl => pl.id === val)
                              if (p) {
                                handleScorerChange('B', index, 'playerId', p.id)
                                handleScorerChange('B', index, 'playerName', p.name)
                              }
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-700"
                          disabled={scorer.isPenaltyMissed}
                        >
                          <option value="">Choisir le buteur...</option>
                          {teamBPlayers.map((p) => (
                            <option key={p.id} value={p.id}>
                              #{p.number} - {p.name} {p.nickname ? `(${p.nickname})` : ''}
                            </option>
                          ))}
                          <option value="__manual__">Autre joueur (saisir le nom)</option>
                        </select>
                      </div>

                      {(!scorer.playerId || scorer.playerName) && (
                        <div>
                          <label className="block text-xs font-medium mb-1">Nom du buteur</label>
                          <input
                            type="text"
                            value={scorer.playerName}
                            onChange={(e) => handleScorerChange('B', index, 'playerName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            placeholder="Nom du joueur"
                            required={!scorer.isPenaltyMissed}
                            disabled={!!scorer.playerId || scorer.isPenaltyMissed}
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-medium mb-1">Passe décisive (optionnel)</label>
                        <select
                          value={scorer.assists ? teamBPlayers.find(p => p.name === scorer.assists)?.id || '__manual__' : ''}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val === '' || val === '__manual__') {
                              handleScorerChange('B', index, 'assists', '')
                            } else {
                              const p = teamBPlayers.find(pl => pl.id === val)
                              handleScorerChange('B', index, 'assists', p ? p.name : '')
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-700"
                          disabled={scorer.isOwnGoal || scorer.isPenaltyMissed}
                        >
                          <option value="">Aucune passe décisive</option>
                          {teamBPlayers.map((p) => (
                            <option key={p.id} value={p.id}>
                              #{p.number} - {p.name} {p.nickname ? `(${p.nickname})` : ''}
                            </option>
                          ))}
                          <option value="__manual__">Autre joueur</option>
                        </select>
                      </div>
                    </>
                  )}

                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={scorer.isPenalty || false}
                        onChange={(e) => handleScorerChange('B', index, 'isPenalty', e.target.checked)}
                        disabled={scorer.isOwnGoal || scorer.isPenaltyMissed}
                        className="w-4 h-4"
                      />
                      <label className="text-xs font-medium">Penalty marqué</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={scorer.isPenaltyMissed || false}
                        onChange={(e) => handleScorerChange('B', index, 'isPenaltyMissed', e.target.checked)}
                        disabled={scorer.isOwnGoal || scorer.isPenalty}
                        className="w-4 h-4"
                      />
                      <label className="text-xs font-medium">Penalty raté</label>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={scorer.isOwnGoal || false}
                        onChange={(e) => handleScorerChange('B', index, 'isOwnGoal', e.target.checked)}
                        disabled={scorer.isPenalty || scorer.isPenaltyMissed}
                        className="w-4 h-4"
                      />
                      <label className="text-xs font-medium">But contre son camp</label>
                    </div>

                    {scorer.isOwnGoal && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                        <label className="block text-xs font-medium mb-1">Joueur adverse</label>
                        <select
                          value={scorer.playerId || ''}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val === '__manual__') {
                              handleScorerChange('B', index, 'playerId', '')
                              handleScorerChange('B', index, 'playerName', '')
                            } else {
                              const p = teamAPlayers.find(pl => pl.id === val)
                              if (p) {
                                handleScorerChange('B', index, 'playerId', p.id)
                                handleScorerChange('B', index, 'playerName', p.name)
                              }
                            }
                          }}
                          className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm"
                        >
                          <option value="">Choisir le joueur adverse...</option>
                          {teamAPlayers.map((p) => (
                            <option key={p.id} value={p.id}>
                              #{p.number} - {p.name} {p.nickname ? `(${p.nickname})` : ''}
                            </option>
                          ))}
                          <option value="__manual__">Autre joueur</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team A Cards */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold flex items-center gap-2">
            <Square className="w-5 h-5 text-yellow-500" />
            Cartons - {match.teamAName}
          </h4>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-yellow-800 dark:text-yellow-300">Cartons Jaunes</h5>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    const player = teamAPlayers.find(p => p.id === e.target.value)
                    if (player) {
                      handleAddCard('A', 'yellow', player.name)
                      e.target.value = ''
                    }
                  }
                }}
                className="px-3 py-1 border border-yellow-300 rounded-lg text-sm bg-white dark:bg-gray-700"
              >
                <option value="">Ajouter un carton jaune</option>
                {teamAPlayers.filter(p => !teamAYellowCards.find(c => c.playerName === p.name)).map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.number} - {p.name} {p.nickname ? `(${p.nickname})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              {teamAYellowCards.map((card, index) => (
                <div key={`teamA-yellow-${index}`} className="flex items-center justify-between bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-6 bg-yellow-400 border border-yellow-600 rounded-sm"></div>
                    <span className="text-yellow-800 dark:text-yellow-300 font-medium">{card.playerName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCard('A', 'yellow', card.playerName)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-red-800 dark:text-red-300">Cartons Rouges</h5>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    const player = teamAPlayers.find(p => p.id === e.target.value)
                    if (player) {
                      handleAddCard('A', 'red', player.name)
                      e.target.value = ''
                    }
                  }
                }}
                className="px-3 py-1 border border-red-300 rounded-lg text-sm bg-white dark:bg-gray-700"
              >
                <option value="">Ajouter un carton rouge</option>
                {teamAPlayers.filter(p => !teamARedCards.find(c => c.playerName === p.name)).map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.number} - {p.name} {p.nickname ? `(${p.nickname})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              {teamARedCards.map((card, index) => (
                <div key={`teamA-red-${index}`} className="flex items-center justify-between bg-red-100 dark:bg-red-900/30 p-2 rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-6 bg-red-500 border border-red-700 rounded-sm"></div>
                    <span className="text-red-800 dark:text-red-300 font-medium">{card.playerName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCard('A', 'red', card.playerName)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Team B Cards */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold flex items-center gap-2">
            <Square className="w-5 h-5 text-yellow-500" />
            Cartons - {match.teamBName}
          </h4>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-yellow-800 dark:text-yellow-300">Cartons Jaunes</h5>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    const player = teamBPlayers.find(p => p.id === e.target.value)
                    if (player) {
                      handleAddCard('B', 'yellow', player.name)
                      e.target.value = ''
                    }
                  }
                }}
                className="px-3 py-1 border border-yellow-300 rounded-lg text-sm bg-white dark:bg-gray-700"
              >
                <option value="">Ajouter un carton jaune</option>
                {teamBPlayers.filter(p => !teamBYellowCards.find(c => c.playerName === p.name)).map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.number} - {p.name} {p.nickname ? `(${p.nickname})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              {teamBYellowCards.map((card, index) => (
                <div key={`teamB-yellow-${index}`} className="flex items-center justify-between bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-6 bg-yellow-400 border border-yellow-600 rounded-sm"></div>
                    <span className="text-yellow-800 dark:text-yellow-300 font-medium">{card.playerName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCard('B', 'yellow', card.playerName)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200">
            <div className="flex items-center justify-between mb-3">
              <h5 className="font-medium text-red-800 dark:text-red-300">Cartons Rouges</h5>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    const player = teamBPlayers.find(p => p.id === e.target.value)
                    if (player) {
                      handleAddCard('B', 'red', player.name)
                      e.target.value = ''
                    }
                  }
                }}
                className="px-3 py-1 border border-red-300 rounded-lg text-sm bg-white dark:bg-gray-700"
              >
                <option value="">Ajouter un carton rouge</option>
                {teamBPlayers.filter(p => !teamBRedCards.find(c => c.playerName === p.name)).map((p) => (
                  <option key={p.id} value={p.id}>
                    #{p.number} - {p.name} {p.nickname ? `(${p.nickname})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              {teamBRedCards.map((card, index) => (
                <div key={`teamB-red-${index}`} className="flex items-center justify-between bg-red-100 dark:bg-red-900/30 p-2 rounded">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-6 bg-red-500 border border-red-700 rounded-sm"></div>
                    <span className="text-red-800 dark:text-red-300 font-medium">{card.playerName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCard('B', 'red', card.playerName)}
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

      {/* Penalty Shootout (only if draw) */}
      {isDraw && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-6 h-6 text-purple-600" />
            <h4 className="text-lg font-semibold">Tirs au but</h4>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Team A Penalties */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="font-semibold">{match.teamAName}</h5>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPenaltyPlayer('A')}
                  className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
              </div>

              <div className="space-y-2">
                {penaltyShootout.teamAPlayers.map((player, index) => (
                  <div key={`teamA-penalty-${index}`} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-3">
                    <div className="flex-1">
                      <select
                        value={player.playerId || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === '__manual__') {
                            handlePenaltyPlayerChange('A', index, 'playerId', '')
                            handlePenaltyPlayerChange('A', index, 'playerName', '')
                          } else {
                            const p = teamAPlayers.find(pl => pl.id === val)
                            if (p) {
                              handlePenaltyPlayerChange('A', index, 'playerId', p.id)
                              handlePenaltyPlayerChange('A', index, 'playerName', p.name)
                              handlePenaltyPlayerChange('A', index, 'nickname', p.nickname || '')
                            }
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-700"
                      >
                        <option value="">Choisir le joueur...</option>
                        {teamAPlayers.map((p) => (
                          <option key={p.id} value={p.id}>
                            #{p.number} - {p.name} {p.nickname ? `(${p.nickname})` : ''}
                          </option>
                        ))}
                        <option value="__manual__">Autre joueur</option>
                      </select>
                      {!player.playerId && (
                        <input
                          type="text"
                          value={player.playerName}
                          onChange={(e) => handlePenaltyPlayerChange('A', index, 'playerName', e.target.value)}
                          placeholder="Nom du joueur"
                          className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      )}
                      {player.nickname && (
                        <div className="text-xs text-gray-500 mt-1">Surnom: {player.nickname}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={player.scored}
                          onChange={(e) => handlePenaltyPlayerChange('A', index, 'scored', e.target.checked)}
                          className="w-5 h-5"
                        />
                        <span className="text-sm font-medium">{player.scored ? '✅ Marqué' : '❌ Raté'}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const newPlayers = [...penaltyShootout.teamAPlayers]
                          newPlayers.splice(index, 1)
                          setPenaltyShootout({ ...penaltyShootout, teamAPlayers: newPlayers })
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                Score: {penaltyShootout.teamAPlayers.filter(p => p.scored).length} / {penaltyShootout.teamAPlayers.length}
              </div>
            </div>

            {/* Team B Penalties */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h5 className="font-semibold">{match.teamBName}</h5>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPenaltyPlayer('B')}
                  className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter
                </Button>
              </div>

              <div className="space-y-2">
                {penaltyShootout.teamBPlayers.map((player, index) => (
                  <div key={`teamB-penalty-${index}`} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-3">
                    <div className="flex-1">
                      <select
                        value={player.playerId || ''}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === '__manual__') {
                            handlePenaltyPlayerChange('B', index, 'playerId', '')
                            handlePenaltyPlayerChange('B', index, 'playerName', '')
                          } else {
                            const p = teamBPlayers.find(pl => pl.id === val)
                            if (p) {
                              handlePenaltyPlayerChange('B', index, 'playerId', p.id)
                              handlePenaltyPlayerChange('B', index, 'playerName', p.name)
                              handlePenaltyPlayerChange('B', index, 'nickname', p.nickname || '')
                            }
                          }
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-700"
                      >
                        <option value="">Choisir le joueur...</option>
                        {teamBPlayers.map((p) => (
                          <option key={p.id} value={p.id}>
                            #{p.number} - {p.name} {p.nickname ? `(${p.nickname})` : ''}
                          </option>
                        ))}
                        <option value="__manual__">Autre joueur</option>
                      </select>
                      {!player.playerId && (
                        <input
                          type="text"
                          value={player.playerName}
                          onChange={(e) => handlePenaltyPlayerChange('B', index, 'playerName', e.target.value)}
                          placeholder="Nom du joueur"
                          className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      )}
                      {player.nickname && (
                        <div className="text-xs text-gray-500 mt-1">Surnom: {player.nickname}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={player.scored}
                          onChange={(e) => handlePenaltyPlayerChange('B', index, 'scored', e.target.checked)}
                          className="w-5 h-5"
                        />
                        <span className="text-sm font-medium">{player.scored ? '✅ Marqué' : '❌ Raté'}</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          const newPlayers = [...penaltyShootout.teamBPlayers]
                          newPlayers.splice(index, 1)
                          setPenaltyShootout({ ...penaltyShootout, teamBPlayers: newPlayers })
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-sm font-semibold text-purple-700 dark:text-purple-300">
                Score: {penaltyShootout.teamBPlayers.filter(p => p.scored).length} / {penaltyShootout.teamBPlayers.length}
              </div>
            </div>
          </div>

          {!validation.penaltiesValid && (
            <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-sm text-yellow-800 dark:text-yellow-300">
              <AlertCircle className="w-4 h-4 inline mr-2" />
              Les tirs au but doivent avoir un gagnant. Vérifiez que les scores sont différents.
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="flex items-center gap-4 text-sm">
          {(!validation.teamAValid || !validation.teamBValid || !validation.penaltiesValid) && (
            <div className="flex items-center gap-1 text-yellow-600">
              <AlertCircle className="w-4 h-4" />
              <span>Vérifiez toutes les informations</span>
            </div>
          )}
          {validation.teamAValid && validation.teamBValid && validation.penaltiesValid && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span>Toutes les informations sont correctes</span>
            </div>
          )}
        </div>
        <Button
          type="submit"
          disabled={isSubmitting || !validation.teamAValid || !validation.teamBValid || !validation.penaltiesValid}
          className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded-lg flex items-center gap-2"
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
    </form>
  )
}

