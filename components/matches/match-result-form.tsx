"use client"

import { useState, useEffect } from "react"
import type { Match, Team, MatchResult } from "@/lib/types"
import type { Player } from "@/lib/types"
import { getPlayersByTeam } from "@/lib/db"
import { Button } from "@/components/ui/button"

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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-8">
        <div>
          <h3 className="font-semibold mb-4">{match.homeTeam?.name}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Score</label>
              <input
                type="number"
                min="0"
                value={homeScore}
                onChange={(e) => setHomeScore(Number(e.target.value))}
                className="w-20 px-2 py-1 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Buteurs</label>
              {homeScorers.map((scorer, index) => (
                <div key={index} className="flex gap-2 mb-2">
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
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value="">Sélectionner le joueur</option>
                    {homePlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.number ? `${p.number} - ` : ''}{p.name}
                      </option>
                    ))}
                    <option value="__manual__">Autre (saisir manuellement)</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Nom du buteur"
                    value={scorer.playerName}
                    onChange={(e) => handleScorerChange('home', index, 'playerName', e.target.value)}
                    className="flex-1 px-2 py-1 border rounded text-sm"
                    required
                    disabled={!!scorer.playerId}
                  />

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
                    className="flex-1 px-2 py-1 border rounded text-sm"
                  >
                    <option value="__none__">Pas de passeur</option>
                    {homePlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.number ? `${p.number} - ` : ''}{p.name}
                      </option>
                    ))}
                    <option value="__manual_assist__">Autre (saisir manuellement)</option>
                  </select>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const newScorers = [...homeScorers]
                      newScorers.splice(index, 1)
                      setHomeScorers(newScorers)
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
              {homeScore > homeScorers.length && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddScorer('home')}
                >
                  + Ajouter un buteur
                </Button>
              )}
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-4">{match.awayTeam?.name}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Score</label>
              <input
                type="number"
                min="0"
                value={awayScore}
                onChange={(e) => setAwayScore(Number(e.target.value))}
                className="w-20 px-2 py-1 border rounded"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Buteurs</label>
              {awayScorers.map((scorer, index) => (
                <div key={index} className="flex gap-2 mb-2">
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
                    className="px-2 py-1 border rounded text-sm"
                  >
                    <option value="">Sélectionner le joueur</option>
                    {awayPlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.number ? `${p.number} - ` : ''}{p.name}
                      </option>
                    ))}
                    <option value="__manual__">Autre (saisir manuellement)</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Nom du buteur"
                    value={scorer.playerName}
                    onChange={(e) => handleScorerChange('away', index, 'playerName', e.target.value)}
                    className="flex-1 px-2 py-1 border rounded text-sm"
                    required
                    disabled={!!scorer.playerId}
                  />

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
                    className="flex-1 px-2 py-1 border rounded text-sm"
                  >
                    <option value="__none__">Pas de passeur</option>
                    {awayPlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.number ? `${p.number} - ` : ''}{p.name}
                      </option>
                    ))}
                    <option value="__manual_assist__">Autre (saisir manuellement)</option>
                  </select>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const newScorers = [...awayScorers]
                      newScorers.splice(index, 1)
                      setAwayScorers(newScorers)
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
              {awayScore > awayScorers.length && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddScorer('away')}
                >
                  + Ajouter un buteur
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Enregistrement...' : 'Enregistrer le résultat'}
        </Button>
      </div>
    </form>
  )
}