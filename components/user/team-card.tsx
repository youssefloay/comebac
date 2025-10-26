"use client"

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface TeamCardProps {
  team: {
    id: string
    name: string
    logo?: string
    playerCount?: number
    color?: string
  }
  index?: number
}

export function TeamCard({ team, index = 0 }: TeamCardProps) {
  const router = useRouter()

  const handleClick = () => {
    router.push(`/team/${team.id}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
    >
      <Card 
        className="cursor-pointer border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-white to-gray-50 group"
        onClick={handleClick}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {team.logo ? (
                <img 
                  src={team.logo} 
                  alt={`${team.name} logo`}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                />
              ) : (
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: team.color || '#3B82F6' }}
                >
                  {team.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                  {team.name}
                </h3>
                {team.playerCount && (
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Users className="w-4 h-4" />
                    {team.playerCount} joueurs
                  </div>
                )}
              </div>
            </div>
            
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
          </div>

          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              Équipe
            </Badge>
            <div className="text-xs text-gray-500">
              Voir détails →
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}