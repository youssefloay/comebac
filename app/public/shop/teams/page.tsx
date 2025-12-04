'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Search, ShoppingBag } from 'lucide-react'
import Image from 'next/image'

interface Team {
  id: string
  name: string
  logo?: string
  school?: string
}

export default function ShopTeamsPage() {
  const router = useRouter()
  const [teams, setTeams] = useState<Team[]>([])
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeams()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      setFilteredTeams(
        teams.filter(team =>
          team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          team.school?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      )
    } else {
      setFilteredTeams(teams)
    }
  }, [searchTerm, teams])

  const fetchTeams = async () => {
    try {
      const res = await fetch('/api/teams')
      const data = await res.json()
      setTeams(data)
      setFilteredTeams(data)
    } catch (error) {
      console.error('Error fetching teams:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold mb-4">Choisissez votre équipe</h1>
          <p className="text-gray-600 dark:text-gray-300">
            Sélectionnez l'équipe pour laquelle vous souhaitez commander
          </p>
        </motion.div>

        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher une équipe..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredTeams.map((team) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => router.push(`/public/shop/${team.id}`)}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow"
            >
              <div className="w-24 h-24 mx-auto mb-4 relative">
                {team.logo ? (
                  <Image
                    src={team.logo}
                    alt={team.name}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                    <ShoppingBag className="w-10 h-10 text-gray-400" />
                  </div>
                )}
              </div>
              <h3 className="font-bold text-center mb-1">{team.name}</h3>
              {team.school && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
                  {team.school}
                </p>
              )}
            </motion.div>
          ))}
        </div>

        {filteredTeams.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Aucune équipe trouvée</p>
          </div>
        )}
      </div>
    </div>
  )
}
