"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Trophy, Users, Calendar, TrendingUp, Clipboard, BarChart3, Shield, Target, AlertCircle, Plus } from 'lucide-react'
import Link from 'next/link'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { t } from '@/lib/i18n'

interface CoachData {
  id: string
  firstName: string
  lastName: string
  teamId: string
  teamName?: string
}

interface TeamData {
  name: string
  logo?: string
  color?: string
  players?: number
  stats?: {
    matchesPlayed: number
    wins: number
    draws: number
    losses: number
    goalsFor: number
    goalsAgainst: number
  }
}

interface Match {
  id: string
  homeTeam: string
  awayTeam: string
  homeTeamId: string
  awayTeamId: string
  homeScore?: number
  awayScore?: number
  date: Date
  location: string
  status: 'upcoming' | 'live' | 'finished'
  hasLineup?: boolean
}

export function CoachDashboard() {
  const { user, isAdmin } = useAuth()
  const [coachData, setCoachData] = useState<CoachData | null>(null)
  const [teamData, setTeamData] = useState<TeamData | null>(null)
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([])
  const [recentMatches, setRecentMatches] = useState<Match[]>([])
  const [teamRanking, setTeamRanking] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCoachData = async () => {
      if (!user?.email) return

      try {
        let teamId = ''
        
        // Vérifier si on est en mode impersonation
        const impersonateCoachId = sessionStorage.getItem('impersonateCoachId')
        
        if (impersonateCoachId) {
          // Mode impersonation: charger les données du coach spécifique
          const coachDoc = await getDoc(doc(db, 'coachAccounts', impersonateCoachId))
          
          if (coachDoc.exists()) {
            const data = coachDoc.data()
            const coach = {
              id: coachDoc.id,
              firstName: data.firstName,
              lastName: data.lastName,
              teamId: data.teamId,
              teamName: data.teamName
            }
            setCoachData(coach)
            teamId = data.teamId
          }
        } else if (isAdmin) {
          // Admin sans impersonation: données de démo
          setCoachData({
            id: 'admin',
            firstName: 'Admin',
            lastName: 'Comebac',
            teamId: 'demo',
            teamName: 'Équipe Demo'
          })
          teamId = 'demo'
        } else {
          // Utilisateur normal: chercher par email
          const coachAccountsQuery = query(
            collection(db, 'coachAccounts'),
            where('email', '==', user.email)
          )
          const coachAccountsSnap = await getDocs(coachAccountsQuery)

          if (!coachAccountsSnap.empty) {
            const coachDoc = coachAccountsSnap.docs[0]
            const data = coachDoc.data()
            
            const coach = {
              id: coachDoc.id,
              firstName: data.firstName,
              lastName: data.lastName,
              teamId: data.teamId,
              teamName: data.teamName
            }
            setCoachData(coach)
            teamId = data.teamId
          }
        }

        if (teamId && teamId !== 'demo') {
          // Charger les données de l'équipe
          const teamDoc = await getDoc(doc(db, 'teams', teamId))
          if (teamDoc.exists()) {
            const teamInfo = teamDoc.data()
            
            // Compter les joueurs de l'équipe
            const teamPlayersQuery = query(
              collection(db, 'playerAccounts'),
              where('teamId', '==', teamId)
            )
            const teamPlayersSnap = await getDocs(teamPlayersQuery)
            
            setTeamData({
              name: teamInfo.name,
              logo: teamInfo.logo,
              color: teamInfo.color || '#3B82F6',
              players: teamPlayersSnap.size,
              stats: teamInfo.stats || {
                matchesPlayed: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goalsFor: 0,
                goalsAgainst: 0
              }
            })
          }

          // Charger les matchs à venir
          const now = new Date()
          const upcomingQuery = query(
            collection(db, 'matches'),
            where('teams', 'array-contains', teamId),
            where('status', '==', 'upcoming')
          )
          const upcomingSnap = await getDocs(upcomingQuery)
          const upcoming = upcomingSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate() || new Date()
          })) as Match[]
          // Trier par date croissante et limiter à 3
          upcoming.sort((a, b) => a.date.getTime() - b.date.getTime())
          setUpcomingMatches(upcoming.slice(0, 3))

          // Charger les matchs récents
          const recentQuery = query(
            collection(db, 'matches'),
            where('teams', 'array-contains', teamId),
            where('status', '==', 'finished')
          )
          const recentSnap = await getDocs(recentQuery)
          const recent = recentSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: doc.data().date?.toDate() || new Date()
          })) as Match[]
          // Trier par date décroissante et limiter à 3
          recent.sort((a, b) => b.date.getTime() - a.date.getTime())
          setRecentMatches(recent.slice(0, 3))

          // Calculer le classement (simplifié)
          const allTeamsSnap = await getDocs(collection(db, 'teams'))
          const teams = allTeamsSnap.docs.map(doc => ({
            id: doc.id,
            stats: doc.data().stats || { wins: 0, draws: 0 }
          }))
          teams.sort((a, b) => {
            const pointsA = (a.stats.wins * 3) + (a.stats.draws * 1)
            const pointsB = (b.stats.wins * 3) + (b.stats.draws * 1)
            return pointsB - pointsA
          })
          const rank = teams.findIndex(t => t.id === teamId) + 1
          setTeamRanking(rank)
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données entraîneur:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCoachData()
  }, [user, isAdmin])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!coachData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">{t('coach.noData')}</p>
        </div>
      </div>
    )
  }

  const stats = teamData?.stats || { matchesPlayed: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0 }
  const winRate = stats.matchesPlayed > 0 ? Math.round((stats.wins / stats.matchesPlayed) * 100) : 0

  // Vérifier les alertes de composition
  const needsLineupAlert = upcomingMatches.some(match => {
    const hoursUntilMatch = (match.date.getTime() - new Date().getTime()) / (1000 * 60 * 60)
    return hoursUntilMatch <= 24 && !match.hasLineup
  })

  const nextMatch = upcomingMatches[0]

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('coach.welcomeCoach')} {coachData.firstName}! 🏆
              </h1>
              <p className="text-gray-600">
                {t('coach.manageTeam')}
              </p>
            </div>
            <NotificationBell />
          </div>
        </div>

        {/* Alerte composition manquante */}
        {needsLineupAlert && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-red-900 mb-1">{t('coach.missingLineup')}</h3>
                <p className="text-red-700 text-sm mb-3">
                  {t('coach.missingLineupDesc')}
                </p>
                <Link
                  href="/coach/lineups"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium text-sm"
                >
                  <Clipboard className="w-4 h-4" />
                  {t('coach.createLineupNow')}
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Team Info Card */}
        {teamData && (
          <div 
            className="text-white p-6 rounded-lg shadow-lg mb-8"
            style={{
              background: `linear-gradient(135deg, ${teamData.color} 0%, ${teamData.color}dd 100%)`
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden">
                {teamData.logo ? (
                  <img src={teamData.logo} alt={teamData.name} className="w-full h-full object-cover" />
                ) : (
                  <Shield className="w-8 h-8" style={{ color: teamData.color }} />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">{teamData.name}</h2>
                <p className="text-white/90">{t('coach.myTeam')}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{teamData.players}</div>
                <p className="text-white/90 text-sm">{t('coach.players')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex flex-col items-center text-center">
              <Trophy className="w-10 h-10 text-blue-600 mb-3" />
              <span className="text-3xl font-bold text-gray-900 mb-1">{stats.matchesPlayed}</span>
              <p className="text-sm text-gray-600">{t('coach.matchesPlayed')}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex flex-col items-center text-center">
              <Target className="w-10 h-10 text-green-600 mb-3" />
              <span className="text-3xl font-bold text-gray-900 mb-1">{stats.wins}</span>
              <p className="text-sm text-gray-600">Victoires</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex flex-col items-center text-center">
              <TrendingUp className="w-10 h-10 text-purple-600 mb-3" />
              <span className="text-3xl font-bold text-gray-900 mb-1">{winRate}%</span>
              <p className="text-sm text-gray-600">Taux de Victoire</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex flex-col items-center text-center">
              <BarChart3 className="w-10 h-10 text-orange-600 mb-3" />
              <span className="text-3xl font-bold text-gray-900 mb-1">
                {stats.goalsFor}/{stats.goalsAgainst}
              </span>
              <p className="text-sm text-gray-600">Buts Pour/Contre</p>
            </div>
          </div>
        </div>

        {/* Classement et Prochain Match */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Position au classement */}
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center gap-3 mb-3">
              <Trophy className="w-8 h-8" />
              <h3 className="text-xl font-bold">{t('coach.rankingPosition')}</h3>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 mb-1">Votre équipe est</p>
                <p className="text-sm text-purple-100">
                  {stats.matchesPlayed} matchs • {stats.wins}V {stats.draws}N {stats.losses}D
                </p>
              </div>
              <div className="text-right">
                <p className="text-6xl font-black">{teamRanking > 0 ? teamRanking : '-'}</p>
                <p className="text-purple-100 text-sm">ème</p>
              </div>
            </div>
          </div>

          {/* Prochain match */}
          {nextMatch ? (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Prochain Match</h3>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  {nextMatch.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600 mb-2">{nextMatch.homeTeam} vs {nextMatch.awayTeam}</p>
                <p className="text-xs text-gray-500">{nextMatch.location}</p>
              </div>
              <Link
                href="/coach/lineups"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                <Plus className="w-5 h-5" />
                Créer la composition
              </Link>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>Aucun match à venir</p>
              </div>
            </div>
          )}
        </div>

        {/* Prochains Matchs */}
        {upcomingMatches.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{t('coach.upcomingMatches')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {upcomingMatches.map((match) => {
                const hoursUntilMatch = (match.date.getTime() - new Date().getTime()) / (1000 * 60 * 60)
                const needsLineup = hoursUntilMatch <= 24 && !match.hasLineup
                
                return (
                  <div
                    key={match.id}
                    className={`bg-white p-4 rounded-lg shadow-md border-2 ${
                      needsLineup ? 'border-red-500' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-gray-600">
                        {match.date.toLocaleDateString('fr-FR', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </span>
                      {needsLineup && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
                          ⚠️ Urgent
                        </span>
                      )}
                    </div>
                    <div className="text-center mb-3">
                      <p className="text-sm font-medium text-gray-900">{match.homeTeam}</p>
                      <p className="text-xs text-gray-400 my-1">vs</p>
                      <p className="text-sm font-medium text-gray-900">{match.awayTeam}</p>
                    </div>
                    <p className="text-xs text-gray-500 text-center">{match.location}</p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Derniers Résultats */}
        {recentMatches.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Derniers Résultats</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentMatches.map((match) => {
                const isHome = match.homeTeamId === coachData?.teamId
                const teamScore = isHome ? match.homeScore : match.awayScore
                const opponentScore = isHome ? match.awayScore : match.homeScore
                const won = (teamScore ?? 0) > (opponentScore ?? 0)
                const draw = teamScore === opponentScore
                
                return (
                  <div
                    key={match.id}
                    className="bg-white p-4 rounded-lg shadow-md border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-gray-600">
                        {match.date.toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        won ? 'bg-green-100 text-green-700' : 
                        draw ? 'bg-gray-100 text-gray-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        {won ? 'V' : draw ? 'N' : 'D'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900">{match.homeTeam}</p>
                      <p className="text-xl font-bold text-gray-900">{match.homeScore ?? '-'}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">{match.awayTeam}</p>
                      <p className="text-xl font-bold text-gray-900">{match.awayScore ?? '-'}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="/coach/team"
            className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t('coach.myTeam')}</h3>
                <p className="text-sm text-gray-600">Gérer les joueurs</p>
              </div>
            </div>
          </Link>

          <Link
            href="/coach/lineups"
            className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition">
                <Clipboard className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t('coach.lineups')}</h3>
                <p className="text-sm text-gray-600">{t('coach.createLineups')}</p>
              </div>
            </div>
          </Link>

          <Link
            href="/coach/matches"
            className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t('coach.matches')}</h3>
                <p className="text-sm text-gray-600">{t('coach.scheduleResults')}</p>
              </div>
            </div>
          </Link>
        </div>


      </div>
    </div>
  )
}
