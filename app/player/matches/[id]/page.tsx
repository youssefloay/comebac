"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { ArrowLeft, Clock, MapPin, Users, AlertCircle, Lock } from 'lucide-react'
import { t } from '@/lib/i18n'
import Link from 'next/link'

interface Match {
  id: string
  homeTeamId: string
  awayTeamId: string
  homeTeam: string
  awayTeam: string
  date: Date
  location: string
  homeTeamScore?: number
  awayTeamScore?: number
  status: 'upcoming' | 'live' | 'finished'
}

interface Player {
  id: string
  firstName: string
  lastName: string
  position: string
  jerseyNumber: number
}

interface Lineup {
  teamId: string
  starters: string[]
  substitutes: string[]
  formation: string
  validated: boolean
}

export default function MatchDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params.id as string
  
  const [match, setMatch] = useState<Match | null>(null)
  const [homeLineup, setHomeLineup] = useState<Lineup | null>(null)
  const [awayLineup, setAwayLineup] = useState<Lineup | null>(null)
  const [homePlayers, setHomePlayers] = useState<Player[]>([])
  const [awayPlayers, setAwayPlayers] = useState<Player[]>([])
  const [homeTeamColor, setHomeTeamColor] = useState('#3B82F6')
  const [awayTeamColor, setAwayTeamColor] = useState('#EF4444')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMatchDetails()
  }, [matchId])

  const loadMatchDetails = async () => {
    try {
      // Charger le match
      const matchDoc = await getDoc(doc(db, 'matches', matchId))
      if (!matchDoc.exists()) {
        router.push('/player/matches')
        return
      }

      const matchData = matchDoc.data()
      
      // Charger les noms des équipes
      const homeTeamDoc = await getDoc(doc(db, 'teams', matchData.homeTeamId))
      const awayTeamDoc = await getDoc(doc(db, 'teams', matchData.awayTeamId))
      
      const homeTeamData = homeTeamDoc.data()
      const awayTeamData = awayTeamDoc.data()
      
      setHomeTeamColor(homeTeamData?.color || '#3B82F6')
      setAwayTeamColor(awayTeamData?.color || '#EF4444')

      const matchInfo: Match = {
        id: matchDoc.id,
        homeTeamId: matchData.homeTeamId,
        awayTeamId: matchData.awayTeamId,
        homeTeam: homeTeamData?.name || 'Équipe',
        awayTeam: awayTeamData?.name || 'Équipe',
        date: matchData.date?.toDate() || new Date(),
        location: matchData.location || 'À définir',
        homeTeamScore: matchData.homeTeamScore,
        awayTeamScore: matchData.awayTeamScore,
        status: matchData.status || 'upcoming'
      }
      setMatch(matchInfo)

      // Charger les joueurs des deux équipes
      const homePlayersQuery = query(
        collection(db, 'playerAccounts'),
        where('teamId', '==', matchData.homeTeamId)
      )
      const homePlayersSnap = await getDocs(homePlayersQuery)
      const homePlayersData = homePlayersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Player[]
      setHomePlayers(homePlayersData)

      const awayPlayersQuery = query(
        collection(db, 'playerAccounts'),
        where('teamId', '==', matchData.awayTeamId)
      )
      const awayPlayersSnap = await getDocs(awayPlayersQuery)
      const awayPlayersData = awayPlayersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Player[]
      setAwayPlayers(awayPlayersData)

      // Charger les compositions
      const lineupsQuery = query(
        collection(db, 'lineups'),
        where('matchId', '==', matchId)
      )
      const lineupsSnap = await getDocs(lineupsQuery)
      
      lineupsSnap.docs.forEach(doc => {
        const lineupData = doc.data() as Lineup
        if (lineupData.teamId === matchData.homeTeamId) {
          setHomeLineup(lineupData)
        } else if (lineupData.teamId === matchData.awayTeamId) {
          setAwayLineup(lineupData)
        }
      })

    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const canViewLineups = () => {
    if (!match) return false
    // Les joueurs peuvent voir les compositions dès qu'elles sont validées par le coach
    // Vérifier si au moins une des deux compositions est validée
    return (homeLineup?.validated === true) || (awayLineup?.validated === true) || match.status !== 'upcoming'
  }

  const getPlayerById = (players: Player[], id: string) => {
    return players.find(p => p.id === id)
  }

  const getPositionPlayers = (lineup: Lineup | null, players: Player[]) => {
    if (!lineup) return { defenders: [], midfielders: [], forwards: [] }
    
    const starters = lineup.starters.map(id => getPlayerById(players, id)).filter(Boolean) as Player[]
    return {
      defenders: starters.filter(p => p.position.toLowerCase().includes('défenseur')).slice(0, 2),
      midfielders: starters.filter(p => p.position.toLowerCase().includes('milieu')).slice(0, 2),
      forwards: starters.filter(p => p.position.toLowerCase().includes('attaquant')).slice(0, 1)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!match) {
    return null
  }

  const showLineups = canViewLineups()
  const homePositions = getPositionPlayers(homeLineup, homePlayers)
  const awayPositions = getPositionPlayers(awayLineup, awayPlayers)

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link
          href="/player/matches"
          className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Retour aux matchs
        </Link>

        {/* Match Header */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              match.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
              match.status === 'live' ? 'bg-red-100 text-red-700' :
              'bg-green-100 text-green-700'
            }`}>
              {match.status === 'upcoming' ? t('player.matches.status.upcoming') :
               match.status === 'live' ? t('player.matches.status.live') :
               t('player.matches.status.completed')}
            </span>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-4 h-4" />
              <span className="text-sm">
                {match.date.toLocaleDateString('fr-FR', { 
                  weekday: 'long',
                  day: 'numeric', 
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 text-center">
              <h2 className="text-2xl font-bold text-gray-900">{match.homeTeam}</h2>
            </div>
            <div className="px-8">
              {match.status === 'finished' ? (
                <div className="flex items-center gap-4 text-3xl font-bold">
                  <span>{match.homeTeamScore ?? 0}</span>
                  <span className="text-gray-400">-</span>
                  <span>{match.awayTeamScore ?? 0}</span>
                </div>
              ) : (
                <div className="text-2xl font-bold text-gray-400">VS</div>
              )}
            </div>
            <div className="flex-1 text-center">
              <h2 className="text-2xl font-bold text-gray-900">{match.awayTeam}</h2>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-gray-600">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{match.location}</span>
          </div>
        </div>

        {/* Compositions */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Compositions Officielles
          </h2>

          {!showLineups ? (
            <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200 text-center">
              <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Compositions non encore validées
              </h3>
              <p className="text-gray-600">
                Les compositions seront visibles dès qu'elles sont validées par les coaches
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Composition Domicile */}
              <TeamLineupCard
                teamName={match.homeTeam}
                lineup={homeLineup}
                players={homePlayers}
                positions={homePositions}
                color={homeTeamColor}
              />

              {/* Composition Extérieur */}
              <TeamLineupCard
                teamName={match.awayTeam}
                lineup={awayLineup}
                players={awayPlayers}
                positions={awayPositions}
                color={awayTeamColor}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function TeamLineupCard({ 
  teamName, 
  lineup, 
  players, 
  positions, 
  color 
}: { 
  teamName: string
  lineup: Lineup | null
  players: Player[]
  positions: { defenders: Player[], midfielders: Player[], forwards: Player[] }
  color: string
}) {
  const getPlayerById = (id: string) => players.find(p => p.id === id)

  if (!lineup || !lineup.validated) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
        <h3 className="text-lg font-bold text-gray-900 mb-4">{teamName}</h3>
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-3" />
          <p className="text-yellow-800 font-medium">
            Composition non validée
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-4">{teamName}</h3>
      
      {/* Mini-terrain */}
      <div 
        className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-lg mb-4"
        style={{
          background: `
            linear-gradient(180deg, 
              #0a2e0a 0%,
              #1a4d1a 20%,
              #2d6b2d 40%,
              #3d8b3d 50%,
              #2d6b2d 60%,
              #1a4d1a 80%,
              #0a2e0a 100%
            )
          `,
          boxShadow: 'inset 0 0 100px rgba(0,0,0,0.4)'
        }}
      >
        {/* Ligne médiane */}
        <div 
          className="absolute top-1/2 left-0 right-0 h-0.5 transform -translate-y-1/2"
          style={{
            background: 'rgba(255,255,255,0.95)',
            boxShadow: '0 0 10px rgba(255,255,255,0.5)'
          }}
        ></div>

        {/* Attaquant */}
        <div className="absolute top-[10%] left-1/2 transform -translate-x-1/2">
          {positions.forwards[0] && (
            <PlayerCard player={positions.forwards[0]} color={color} />
          )}
        </div>

        {/* Milieux */}
        <div className="absolute top-[35%] left-0 right-0 flex justify-center gap-8">
          {positions.midfielders.map((player, i) => (
            <PlayerCard key={i} player={player} color={color} />
          ))}
        </div>

        {/* Défenseurs */}
        <div className="absolute top-[60%] left-0 right-0 flex justify-center gap-8">
          {positions.defenders.map((player, i) => (
            <PlayerCard key={i} player={player} color={color} />
          ))}
        </div>
      </div>

      {/* Remplaçants */}
      <div>
        <h4 className="text-sm font-bold text-gray-700 mb-2">
          Remplaçants ({lineup.substitutes.length})
        </h4>
        <div className="grid grid-cols-3 gap-2">
          {lineup.substitutes.map(id => {
            const player = getPlayerById(id)
            return player ? (
              <div key={id} className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex flex-col items-center gap-1">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: color }}
                  >
                    {player.jerseyNumber}
                  </div>
                  <div className="text-center w-full">
                    <p className="text-xs font-bold text-gray-900 truncate">
                      {player.lastName}
                    </p>
                  </div>
                </div>
              </div>
            ) : null
          })}
        </div>
      </div>
    </div>
  )
}

function PlayerCard({ player, color }: { player: Player; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg"
        style={{ backgroundColor: color }}
      >
        {player.jerseyNumber}
      </div>
      <div className="mt-1 px-2 py-0.5 bg-white rounded shadow-md">
        <p className="text-xs font-bold text-gray-900 whitespace-nowrap">
          {player.lastName.toUpperCase()}
        </p>
      </div>
    </div>
  )
}
