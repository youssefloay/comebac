"use client"

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Calendar } from 'lucide-react'

interface PlayerCardProps {
  player: {
    id: string
    name: string
    age?: number
    position: string
    number?: number
    avatar?: string
  }
  index?: number
}

export function PlayerCard({ player, index = 0 }: PlayerCardProps) {
  const getPositionColor = (position: string) => {
    switch (position.toLowerCase()) {
      case 'gardien':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'défenseur':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'milieu':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'attaquant':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPositionIcon = (position: string) => {
    switch (position.toLowerCase()) {
      case 'gardien':
        return '🥅'
      case 'défenseur':
        return '🛡️'
      case 'milieu':
        return '⚽'
      case 'attaquant':
        return '🎯'
      default:
        return '👤'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-3">
            {player.avatar ? (
              <img 
                src={player.avatar} 
                alt={player.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                {player.number || <User className="w-6 h-6" />}
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {player.name}
              </h3>
              {player.age && (
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Calendar className="w-3 h-3" />
                  {player.age} ans
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Badge className={getPositionColor(player.position)} variant="outline">
              <span className="mr-1">{getPositionIcon(player.position)}</span>
              {player.position}
            </Badge>
            
            {player.number && (
              <div className="text-lg font-bold text-gray-600">
                #{player.number}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}