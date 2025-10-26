"use client"

import { motion } from 'framer-motion'
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface SofaStandingsTableProps {
  standings: Array<{
    id: string
    teamName: string
    points: number
    wins: number
    draws: number
    losses: number
    goalsFor: number
    goalsAgainst: number
    matchesPlayed: number
  }>
}

export function SofaStandingsTable({ standings }: SofaStandingsTableProps) {
  const getPositionIcon = (position: number) => {
    if (position <= 3) {
      return <Trophy className="w-4 h-4 text-sofa-yellow" />
    }
    return null
  }

  const getPositionChange = (position: number) => {
    // Simulate position changes (in real app, this would come from data)
    const changes = [0, 1, -1, 0, 2, -1, 1, 0]
    const change = changes[position - 1] || 0
    
    if (change > 0) {
      return <TrendingUp className="w-4 h-4 text-sofa-green" />
    } else if (change < 0) {
      return <TrendingDown className="w-4 h-4 text-sofa-red" />
    }
    return <Minus className="w-4 h-4 text-sofa-text-muted" />
  }

  const getGoalDifference = (goalsFor: number, goalsAgainst: number) => {
    const diff = goalsFor - goalsAgainst
    return {
      value: diff,
      color: diff > 0 ? 'text-sofa-green' : diff < 0 ? 'text-sofa-red' : 'text-sofa-text-muted'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sofa-table"
    >
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left">Pos</th>
            <th className="text-left">Équipe</th>
            <th className="text-center">MJ</th>
            <th className="text-center">V</th>
            <th className="text-center">N</th>
            <th className="text-center">D</th>
            <th className="text-center">BP</th>
            <th className="text-center">BC</th>
            <th className="text-center">Diff</th>
            <th className="text-center">Pts</th>
          </tr>
        </thead>
        <tbody>
          {standings.map((team, index) => {
            const position = index + 1
            const goalDiff = getGoalDifference(team.goalsFor, team.goalsAgainst)
            
            return (
              <motion.tr
                key={team.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="group"
              >
                <td>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sofa-text-primary min-w-[24px]">
                        {position}
                      </span>
                      {getPositionChange(position)}
                    </div>
                    {getPositionIcon(position)}
                  </div>
                </td>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="sofa-team-logo text-sm">
                      ⚽
                    </div>
                    <span className="font-semibold text-sofa-text-primary group-hover:text-sofa-text-accent transition-colors">
                      {team.teamName}
                    </span>
                  </div>
                </td>
                <td className="text-center text-sofa-text-secondary">
                  {team.matchesPlayed}
                </td>
                <td className="text-center">
                  <span className="font-semibold text-sofa-green">
                    {team.wins}
                  </span>
                </td>
                <td className="text-center">
                  <span className="font-semibold text-sofa-orange">
                    {team.draws}
                  </span>
                </td>
                <td className="text-center">
                  <span className="font-semibold text-sofa-red">
                    {team.losses}
                  </span>
                </td>
                <td className="text-center text-sofa-text-secondary">
                  {team.goalsFor}
                </td>
                <td className="text-center text-sofa-text-secondary">
                  {team.goalsAgainst}
                </td>
                <td className="text-center">
                  <span className={`font-semibold ${goalDiff.color}`}>
                    {goalDiff.value > 0 ? '+' : ''}{goalDiff.value}
                  </span>
                </td>
                <td className="text-center">
                  <span className="font-bold text-lg text-sofa-text-accent">
                    {team.points}
                  </span>
                </td>
              </motion.tr>
            )
          })}
        </tbody>
      </table>
    </motion.div>
  )
}