"use client"

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Trophy, Target, Award, TrendingUp, Calendar, Users, Shield } from 'lucide-react'
import Link from 'next/link'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { t } from '@/lib/i18n'

interface PlayerData {
  id: string
  firstName: string
  lastName: string
  nickname?: string
  position: string
  jerseyNumber: number
  teamId: string
  teamName?: string
  stats?: {
    matchesPlayed: number
    goals: number
    assists: number
    yellowCards: number
    redCards: number
  }
}

interface TeamData {
  name: string
  logo?: string
  players?: number
}

export function PlayerDashboard() {
  const { user, isAdmin } = useAuth()
  const [playerData, setPlayerData] = useState<PlayerData | null>(null)
  const [teamData, setTeamData] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPlayerData = async () => {
      try {
        // Vérifier si on est en mode impersonation
        const impersonatePlayerId = sessionStorage.getItem('impersonatePlayerId')
        
        if (isAdmin && impersonatePlayerId) {
          // Charger les données du joueur impersonné
          const playerDocRef = doc(db, 'playerAccounts', impersonatePlayerId)
          const playerDocSnap = await getDoc(playerDocRef)
          
          if (playerDocSnap.exists()) {
            const data = playerDocSnap.data()
            const player = {
              id: playerDocSnap.id,
              firstName: data.firstName,
              lastName: data.lastName,
              nickname: data.nickname,
              position: data.position,
              jerseyNumber: data.jerseyNumber,
              teamId: data.teamId,
              teamName: data.teamName,
              stats: data.stats || {
                matchesPlayed: 0,
                goals: 0,
                assists: 0,
                yellowCards: 0,
                redCards: 0
              }
            }
            setPlayerData(player)

            // Charger les données de l'équipe
            if (data.teamId) {
              const teamDoc = await getDoc(doc(db, 'teams', data.teamId))
              if (teamDoc.exists()) {
                const teamInfo = teamDoc.data()
                
                const teamPlayersQuery = query(
                  collection(db, 'playerAccounts'),
                  where('teamId', '==', data.teamId)
                )
                const teamPlayersSnap = await getDocs(teamPlayersQuery)
                
                setTeamData({
                  name: teamInfo.name,
                  logo: teamInfo.logo,
                  players: teamPlayersSnap.size
                })
              }
            }
            setLoading(false)
            return
          }
        }

        if (!user?.email) {
          setLoading(false)
          return
        }

        // Chercher dans playerAccounts
        const playerAccountsQuery = query(
          collection(db, 'playerAccounts'),
          where('email', '==', user.email)
        )
        const playerAccountsSnap = await getDocs(playerAccountsQuery)

        if (!playerAccountsSnap.empty) {
          const playerDoc = playerAccountsSnap.docs[0]
          const data = playerDoc.data()
          
          const player = {
            id: playerDoc.id,
            firstName: data.firstName,
            lastName: data.lastName,
            nickname: data.nickname,
            position: data.position,
            jerseyNumber: data.jerseyNumber,
            teamId: data.teamId,
            teamName: data.teamName,
            stats: data.stats || {
              matchesPlayed: 0,
              goals: 0,
              assists: 0,
              yellowCards: 0,
              redCards: 0
            }
          }
          setPlayerData(player)

          // Charger les données de l'équipe
          if (data.teamId) {
            const teamDoc = await getDoc(doc(db, 'teams', data.teamId))
            if (teamDoc.exists()) {
              const teamInfo = teamDoc.data()
              
              // Compter les joueurs de l'équipe
              const teamPlayersQuery = query(
                collection(db, 'playerAccounts'),
                where('teamId', '==', data.teamId)
              )
              const teamPlayersSnap = await getDocs(teamPlayersQuery)
              
              setTeamData({
                name: teamInfo.name,
                logo: teamInfo.logo,
                players: teamPlayersSnap.size
              })
            }
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données joueur:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPlayerData()
  }, [user, isAdmin])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!playerData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">{t('player.noData')}</p>
        </div>
      </div>
    )
  }

  const stats = playerData.stats || { matchesPlayed: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0 }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {t('player.welcome')}, {playerData.firstName}! 👋
              </h1>
              <p className="text-gray-600">
                {playerData.position} • #{playerData.jerseyNumber}
              </p>
            </div>
            <NotificationBell />
          </div>
        </div>

        {/* Team Info Card */}
        {teamData && (
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-lg shadow-lg mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center overflow-hidden">
                {teamData.logo ? (
                  <img src={teamData.logo} alt={teamData.name} className="w-full h-full object-cover" />
                ) : (
                  <Shield className="w-8 h-8 text-blue-600" />
                )}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1">{teamData.name}</h2>
                <p className="text-blue-100">{t('player.myTeam')}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{teamData.players}</div>
                <p className="text-blue-100 text-sm">{t('player.players')}</p>
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
              <p className="text-sm text-gray-600">{t('player.matchesPlayed')}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex flex-col items-center text-center">
              <Target className="w-10 h-10 text-green-600 mb-3" />
              <span className="text-3xl font-bold text-gray-900 mb-1">{stats.goals}</span>
              <p className="text-sm text-gray-600">{t('player.goals')}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex flex-col items-center text-center">
              <TrendingUp className="w-10 h-10 text-purple-600 mb-3" />
              <span className="text-3xl font-bold text-gray-900 mb-1">{stats.assists}</span>
              <p className="text-sm text-gray-600">{t('player.assists')}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex flex-col items-center text-center">
              <Award className="w-10 h-10 text-yellow-600 mb-3" />
              <span className="text-3xl font-bold text-gray-900 mb-1">
                {stats.yellowCards + stats.redCards}
              </span>
              <p className="text-sm text-gray-600">Cartons</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/player/profile"
            className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Mon Profil</h3>
                <p className="text-sm text-gray-600">Voir mes informations</p>
              </div>
            </div>
          </Link>

          <Link
            href="/player/matches"
            className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Mes Matchs</h3>
                <p className="text-sm text-gray-600">Calendrier et résultats</p>
              </div>
            </div>
          </Link>

          <Link
            href="/player/badges"
            className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition">
                <Award className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Mes Badges</h3>
                <p className="text-sm text-gray-600">Récompenses débloquées</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
