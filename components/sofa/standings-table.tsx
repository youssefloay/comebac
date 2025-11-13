"use client"

import { motion } from 'framer-motion'
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { TeamLink } from '@/components/ui/team-link'

interface SofaStandingsTableProps {
  standings: Array<{
    id: string
    teamId: string
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
  const getTeamAbbreviation = (teamName: string) => {
    // Créer une abréviation intelligente du nom d'équipe
    const words = teamName.split(' ')
    if (words.length === 1) {
      return teamName.substring(0, 3).toUpperCase()
    } else if (words.length === 2) {
      return (words[0].substring(0, 2) + words[1].substring(0, 1)).toUpperCase()
    } else {
      return words.map(word => word.substring(0, 1)).join('').toUpperCase().substring(0, 3)
    }
  }

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
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[600px]">
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
                    <TeamLink 
                      teamId={team.teamId} 
                      teamName={team.teamName}
                      className="font-semibold text-sofa-text-primary group-hover:text-sofa-text-accent transition-colors"
                    />
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
      </div>

      {/* Mobile Optimized Table */}
      <div className="md:hidden">
        <table className="w-full text-xs table-fixed">
          <thead>
            <tr className="border-b border-sofa-border">
              <th className="text-left py-2 px-1" style={{width: '10%'}}>#</th>
              <th className="text-left py-2 px-1" style={{width: '32%'}}>Équipe</th>
              <th className="text-center py-2 px-1" style={{width: '8%'}}>MJ</th>
              <th className="text-center py-2 px-1" style={{width: '8%'}}>V</th>
              <th className="text-center py-2 px-1" style={{width: '8%'}}>N</th>
              <th className="text-center py-2 px-1" style={{width: '8%'}}>D</th>
              <th className="text-center py-2 px-1" style={{width: '10%'}}>Diff</th>
              <th className="text-center py-2 px-1" style={{width: '16%'}}>Pts</th>
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
                  className="border-b border-sofa-border/50 hover:bg-sofa-bg-hover"
                >
                  <td className="py-2 px-1">
                    <div className="flex items-center justify-center">
                      <span className="font-bold text-sofa-text-primary text-sm">
                        {position}
                      </span>
                      {position <= 3 && <Trophy className="w-3 h-3 text-sofa-yellow ml-1" />}
                    </div>
                  </td>
                  <td className="py-2 px-1">
                    <TeamLink 
                      teamId={team.teamId} 
                      teamName={team.teamName}
                      className="font-semibold text-sofa-text-primary text-xs leading-tight truncate hover:text-sofa-text-accent transition-colors block"
                    />
                  </td>
                  <td className="text-center py-2 px-1">
                    <span className="text-sofa-text-secondary font-medium text-xs">
                      {team.matchesPlayed}
                    </span>
                  </td>
                  <td className="text-center py-2 px-1">
                    <span className="font-semibold text-sofa-green text-xs">
                      {team.wins}
                    </span>
                  </td>
                  <td className="text-center py-2 px-1">
                    <span className="font-semibold text-sofa-orange text-xs">
                      {team.draws}
                    </span>
                  </td>
                  <td className="text-center py-2 px-1">
                    <span className="font-semibold text-sofa-red text-xs">
                      {team.losses}
                    </span>
                  </td>
                  <td className="text-center py-2 px-1">
                    <span className={`font-bold text-xs ${goalDiff.color}`}>
                      {goalDiff.value > 0 ? '+' : ''}{goalDiff.value}
                    </span>
                  </td>
                  <td className="text-center py-2 px-1">
                    <span className="font-bold text-sofa-text-accent text-sm">
                      {team.points}
                    </span>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}