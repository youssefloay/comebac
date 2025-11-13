"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Calendar, Trophy, Clock, MapPin } from 'lucide-react'

interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  homeScore?: number
  awayScore?: number
  date: Date
  location: string
  status: 'upcoming' | 'live' | 'finished'
}

export default function CoachMatchesPage() {
  const { user } = useAuth()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [teamId, setTeamId] = useState<string | null>(null)

  useEffect(() => {
    const loadMatches = async () => {
      if (!user?.email) return

      try {
        let tid = ''
        
        // Vérifier si on est en mode impersonation
        const impersonateCoachId = sessionStorage.getItem('impersonateCoachId')
        
        if (impersonateCoachId) {
          // Mode impersonation: charger les données du coach spécifique
          const coachDoc = await getDoc(doc(db, 'coachAccounts', impersonateCoachId))
          if (coachDoc.exists()) {
            tid = coachDoc.data().teamId
          }
        } else {
          // Utilisateur normal: chercher par email
          const coachQuery = query(
            collection(db, 'coachAccounts'),
            where('email', '==', user.email)
          )
          const coachSnap = await getDocs(coachQuery)

          if (!coachSnap.empty) {
            const coachData = coachSnap.docs[0].data()
            tid = coachData.teamId
          }
        }

        if (tid) {
          setTeamId(tid)

          // Charger les matchs de l'équipe
          const matchesQuery = query(
            collection(db, 'matches'),
            where('teams', 'array-contains', tid)
          )
          const matchesSnap = await getDocs(matchesQuery)

          const matchesData = matchesSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate() || new Date()
          })) as Match[]

          // Trier par date décroissante (plus récent en premier)
          matchesData.sort((a, b) => b.date.getTime() - a.date.getTime())

          setMatches(matchesData)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des matchs:', error)
      } finally {
        setLoading(false)
      }
    }

    loadMatches()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const upcomingMatches = matches.filter(m => m.status === 'upcoming')
  const pastMatches = matches.filter(m => m.status === 'finished')

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-600" />
            Calendrier des Matchs
          </h1>
          <p className="text-gray-600">
            Gérez vos matchs et consultez les résultats
          </p>
        </div>

        {/* Upcoming Matches */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Matchs à Venir</h2>
          {upcomingMatches.length > 0 ? (
            <div className="space-y-4">
              {upcomingMatches.map((match) => (
                <div
                  key={match.id}
                  className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Clock className="w-5 h-5" />
                      <span className="font-medium">
                        {match.date.toLocaleDateString('fr-FR', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      À venir
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center flex-1">
                      <p className="font-bold text-gray-900 text-lg">{match.homeTeam}</p>
                    </div>
                    <div className="px-6 text-gray-400 font-bold text-xl">VS</div>
                    <div className="text-center flex-1">
                      <p className="font-bold text-gray-900 text-lg">{match.awayTeam}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{match.location}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 text-center">
              <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun match à venir</p>
            </div>
          )}
        </div>

        {/* Past Matches */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Matchs Passés</h2>
          {pastMatches.length > 0 ? (
            <div className="space-y-4">
              {pastMatches.map((match) => (
                <div
                  key={match.id}
                  className="bg-white p-6 rounded-lg shadow-md border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-5 h-5" />
                      <span className="font-medium">
                        {match.date.toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                      Terminé
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-center flex-1">
                      <p className="font-bold text-gray-900 text-lg mb-2">{match.homeTeam}</p>
                      <p className="text-3xl font-black text-gray-900">{match.homeScore ?? '-'}</p>
                    </div>
                    <div className="px-6">
                      <Trophy className="w-8 h-8 text-yellow-500" />
                    </div>
                    <div className="text-center flex-1">
                      <p className="font-bold text-gray-900 text-lg mb-2">{match.awayTeam}</p>
                      <p className="text-3xl font-black text-gray-900">{match.awayScore ?? '-'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{match.location}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 text-center">
              <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Aucun match passé</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
