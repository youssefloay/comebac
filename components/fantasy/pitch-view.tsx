"use client"

import { motion } from 'framer-motion'
import { User, Crown } from 'lucide-react'
import type { Player } from '@/lib/types'
import type { FantasyPlayer, Formation } from '@/lib/types/fantasy'

interface PitchViewProps {
  players: FantasyPlayer[]
  playerDetails: Map<string, Player>
  formation: Formation
  captainId: string
  compact?: boolean
  showPoints?: boolean
  onPlayerClick?: (playerId: string) => void
}

interface FormationLayout {
  goalkeeper: { x: number; y: number }
  defenders: { x: number; y: number }[]
  midfielders: { x: number; y: number }[]
  attackers: { x: number; y: number }[]
}

/**
 * Get the layout positions for each formation
 * Positions are in percentage (0-100) for responsive positioning
 */
function getFormationLayout(formation: Formation): FormationLayout {
  const layouts: Record<Formation, FormationLayout> = {
    '4-2-0': {
      goalkeeper: { x: 50, y: 92 },
      defenders: [
        { x: 20, y: 72 },
        { x: 40, y: 72 },
        { x: 60, y: 72 },
        { x: 80, y: 72 }
      ],
      midfielders: [
        { x: 40, y: 45 },
        { x: 60, y: 45 }
      ],
      attackers: []
    },
    '3-3-0': {
      goalkeeper: { x: 50, y: 92 },
      defenders: [
        { x: 30, y: 72 },
        { x: 50, y: 72 },
        { x: 70, y: 72 }
      ],
      midfielders: [
        { x: 30, y: 45 },
        { x: 50, y: 45 },
        { x: 70, y: 45 }
      ],
      attackers: []
    },
    '3-2-1': {
      goalkeeper: { x: 50, y: 92 },
      defenders: [
        { x: 30, y: 72 },
        { x: 50, y: 72 },
        { x: 70, y: 72 }
      ],
      midfielders: [
        { x: 40, y: 50 },
        { x: 60, y: 50 }
      ],
      attackers: [
        { x: 50, y: 20 }
      ]
    },
    '2-3-1': {
      goalkeeper: { x: 50, y: 92 },
      defenders: [
        { x: 35, y: 72 },
        { x: 65, y: 72 }
      ],
      midfielders: [
        { x: 30, y: 50 },
        { x: 50, y: 50 },
        { x: 70, y: 50 }
      ],
      attackers: [
        { x: 50, y: 20 }
      ]
    },
    '2-2-2': {
      goalkeeper: { x: 50, y: 92 },
      defenders: [
        { x: 35, y: 72 },
        { x: 65, y: 72 }
      ],
      midfielders: [
        { x: 40, y: 50 },
        { x: 60, y: 50 }
      ],
      attackers: [
        { x: 40, y: 20 },
        { x: 60, y: 20 }
      ]
    }
  }

  return layouts[formation]
}

/**
 * Get position color based on player position
 */
function getPositionColor(position: string): string {
  switch (position) {
    case 'Gardien':
      return 'bg-yellow-400 border-yellow-600'
    case 'Défenseur':
      return 'bg-blue-400 border-blue-600'
    case 'Milieu':
      return 'bg-green-400 border-green-600'
    case 'Attaquant':
      return 'bg-red-400 border-red-600'
    default:
      return 'bg-gray-400 border-gray-600'
  }
}

export function PitchView({
  players,
  playerDetails,
  formation,
  captainId,
  compact = false,
  showPoints = true,
  onPlayerClick
}: PitchViewProps) {
  const layout = getFormationLayout(formation)
  
  // Organize players by position
  const goalkeeper = players.find(p => p.position === 'Gardien')
  const defenders = players.filter(p => p.position === 'Défenseur')
  const midfielders = players.filter(p => p.position === 'Milieu')
  const attackers = players.filter(p => p.position === 'Attaquant')

  return (
    <div className={`
      relative w-full rounded-lg overflow-hidden
      bg-gradient-to-b from-green-600 via-green-700 to-green-600
      shadow-lg
      ${compact ? 'h-[280px] sm:h-[320px] md:h-[400px]' : 'h-[350px] sm:h-[450px] md:h-[550px] lg:h-[600px]'}
    `}>
      {/* Field markings */}
      <FieldMarkings />

      {/* Goalkeeper */}
      {goalkeeper && (
        <PlayerMarker
          player={goalkeeper}
          playerDetail={playerDetails.get(goalkeeper.playerId)}
          position={layout.goalkeeper}
          isCaptain={goalkeeper.playerId === captainId}
          compact={compact}
          showPoints={showPoints}
          onClick={onPlayerClick}
        />
      )}

      {/* Defenders */}
      {defenders.map((player, index) => (
        <PlayerMarker
          key={player.playerId}
          player={player}
          playerDetail={playerDetails.get(player.playerId)}
          position={layout.defenders[index]}
          isCaptain={player.playerId === captainId}
          compact={compact}
          showPoints={showPoints}
          onClick={onPlayerClick}
        />
      ))}

      {/* Midfielders */}
      {midfielders.map((player, index) => (
        <PlayerMarker
          key={player.playerId}
          player={player}
          playerDetail={playerDetails.get(player.playerId)}
          position={layout.midfielders[index]}
          isCaptain={player.playerId === captainId}
          compact={compact}
          showPoints={showPoints}
          onClick={onPlayerClick}
        />
      ))}

      {/* Attackers */}
      {attackers.map((player, index) => (
        <PlayerMarker
          key={player.playerId}
          player={player}
          playerDetail={playerDetails.get(player.playerId)}
          position={layout.attackers[index]}
          isCaptain={player.playerId === captainId}
          compact={compact}
          showPoints={showPoints}
          onClick={onPlayerClick}
        />
      ))}
    </div>
  )
}

/**
 * Field markings component (lines, circles, etc.)
 */
function FieldMarkings() {
  return (
    <div className="absolute inset-0 opacity-20">
      {/* Center line */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white" />
      
      {/* Center circle */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white rounded-full" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full" />
      
      {/* Penalty areas */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-48 h-20 border-2 border-white border-b-0" />
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-48 h-20 border-2 border-white border-t-0" />
      
      {/* Goal areas */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-10 border-2 border-white border-b-0" />
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-10 border-2 border-white border-t-0" />
    </div>
  )
}

interface PlayerMarkerProps {
  player: FantasyPlayer
  playerDetail?: Player
  position: { x: number; y: number }
  isCaptain: boolean
  compact: boolean
  showPoints: boolean
  onClick?: (playerId: string) => void
}

/**
 * Individual player marker on the pitch
 */
function PlayerMarker({
  player,
  playerDetail,
  position,
  isCaptain,
  compact,
  showPoints,
  onClick
}: PlayerMarkerProps) {
  const positionColor = getPositionColor(player.position)
  const size = compact ? 'w-10 h-10 sm:w-12 sm:h-12' : 'w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 lg:w-20 lg:h-20'
  const photoSize = compact ? 'w-8 h-8 sm:w-10 sm:h-10' : 'w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-18 lg:h-18'

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3, type: 'spring' }}
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`
      }}
    >
      <div
        className={`
          relative flex flex-col items-center gap-1
          ${onClick ? 'cursor-pointer' : ''}
        `}
        onClick={() => onClick?.(player.playerId)}
      >
        {/* Captain badge */}
        {isCaptain && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="absolute -top-2 -right-2 z-20"
          >
            <div className="bg-yellow-400 rounded-full p-1 shadow-lg border-2 border-yellow-600">
              <Crown className="w-3 h-3 md:w-4 md:h-4 text-yellow-900" fill="currentColor" />
            </div>
          </motion.div>
        )}

        {/* Player photo/avatar */}
        <div className={`
          ${size}
          rounded-full
          border-4 ${positionColor}
          shadow-lg
          overflow-hidden
          bg-white
          relative
          ${onClick ? 'hover:scale-110 transition-transform duration-200' : ''}
        `}>
          {playerDetail?.photo ? (
            <img
              src={playerDetail.photo}
              alt={playerDetail.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              {playerDetail?.number ? (
                <span className="text-white font-bold text-lg md:text-xl">
                  {playerDetail.number}
                </span>
              ) : (
                <User className="w-6 h-6 md:w-8 md:h-8 text-white" />
              )}
            </div>
          )}
        </div>

        {/* Player name */}
        <div className="text-center max-w-[80px] sm:max-w-[100px] md:max-w-none">
          <div className={`
            bg-white/90 backdrop-blur-sm rounded px-1.5 sm:px-2 py-0.5
            shadow-md
            ${compact ? 'text-[10px] sm:text-xs' : 'text-[10px] sm:text-xs md:text-sm'}
          `}>
            <p className="font-semibold text-gray-900 truncate">
              {playerDetail?.name?.split(' ').slice(-1)[0] || 'Unknown'}
            </p>
          </div>

          {/* Points display */}
          {showPoints && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className={`
                mt-1 bg-sofa-green text-white rounded-full px-1.5 sm:px-2 py-0.5
                shadow-md font-bold
                ${compact ? 'text-[10px] sm:text-xs' : 'text-[10px] sm:text-xs md:text-sm'}
              `}
            >
              {player.gameweekPoints > 0 ? (
                <span>{player.gameweekPoints} pts</span>
              ) : (
                <span>0 pts</span>
              )}
              {isCaptain && player.gameweekPoints > 0 && (
                <span className="ml-0.5 sm:ml-1 text-yellow-300">×2</span>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
