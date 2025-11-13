"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  User, 
  Mail,
  Phone,
  Calendar,
  Ruler,
  Users,
  Activity,
  Shield,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

interface PlayerData {
  id: string
  firstName: string
  lastName: string
  nickname?: string
  email: string
  phone: string
  position: string
  jerseyNumber: number
  teamId: string
  teamName?: string
  photo?: string
  grade: string
  height: number
  foot: string
  birthDate?: string
  tshirtSize?: string
}

interface CoachData {
  firstName: string
  lastName: string
  birthDate: string
  email: string
  phone: string
}

export default function PlayerProfilePage() {
  const { user, isAdmin } = useAuth()
  const [playerData, setPlayerData] = useState<PlayerData | null>(null)
  const [coachData, setCoachData] = useState<CoachData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPlayerData = async () => {
      try {
        let playerDoc
        let playerDataRaw

        // Vérifier si on est en mode impersonation
        const impersonatePlayerId = sessionStorage.getItem('impersonatePlayerId')
        
        if (isAdmin && impersonatePlayerId) {
          // Charger les données du joueur impersonné
          const playerDocRef = doc(db, 'playerAccounts', impersonatePlayerId)
          const playerDocSnap = await getDoc(playerDocRef)
          
          if (!playerDocSnap.exists()) {
            console.log('Joueur impersonné non trouvé')
            setLoading(false)
            return
          }
          
          playerDoc = playerDocSnap
          playerDataRaw = playerDocSnap.data()
        } else {
          if (!user?.email) {
            setLoading(false)
            return
          }

          // Trouver le joueur par email dans playerAccounts
          const playerAccountsQuery = query(
            collection(db, 'playerAccounts'),
            where('email', '==', user.email)
          )
          const playerAccountsSnap = await getDocs(playerAccountsQuery)

          if (playerAccountsSnap.empty) {
            console.log('Aucun joueur trouvé pour cet email')
            setLoading(false)
            return
          }

          playerDoc = playerAccountsSnap.docs[0]
          playerDataRaw = playerDoc.data()
        }
        
        const player: PlayerData = {
          id: playerDoc.id,
          firstName: playerDataRaw.firstName,
          lastName: playerDataRaw.lastName,
          nickname: playerDataRaw.nickname,
          email: playerDataRaw.email,
          phone: playerDataRaw.phone,
          position: playerDataRaw.position,
          jerseyNumber: playerDataRaw.jerseyNumber,
          teamId: playerDataRaw.teamId,
          teamName: playerDataRaw.teamName,
          photo: playerDataRaw.photo,
          grade: playerDataRaw.grade || '1ère',
          height: playerDataRaw.height || 0,
          foot: playerDataRaw.foot || 'Droitier',
          birthDate: playerDataRaw.birthDate,
          tshirtSize: playerDataRaw.tshirtSize
        }

        // Récupérer le nom de l'équipe et l'entraîneur si pas déjà présent
        if (player.teamId && !player.teamName) {
          const teamDoc = await getDoc(doc(db, 'teams', player.teamId))
          if (teamDoc.exists()) {
            const teamData = teamDoc.data()
            player.teamName = teamData.name
            
            // Récupérer les infos de l'entraîneur
            if (teamData.coach) {
              setCoachData(teamData.coach)
            }
          }
        }

        setPlayerData(player)
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPlayerData()
  }, [user, isAdmin])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!playerData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Profil non trouvé
          </h2>
          <p className="text-gray-600 mb-6">
            Aucun profil joueur n'est associé à votre compte.
          </p>
          <Link href="/player" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon Profil</h1>
          <p className="text-gray-600">Mes informations personnelles</p>
        </div>

        {/* Photo et infos principales */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center text-white text-3xl font-bold">
                {playerData.photo ? (
                  <img 
                    src={playerData.photo} 
                    alt={`${playerData.firstName} ${playerData.lastName}`}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  `${playerData.firstName[0]}${playerData.lastName[0]}`
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white">
                {playerData.jerseyNumber}
              </div>
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {playerData.firstName} {playerData.lastName}
                {playerData.nickname && (
                  <span className="text-lg text-blue-600 ml-2">
                    "{playerData.nickname}"
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2 text-gray-600">
                <Activity className="w-4 h-4" />
                <span>{playerData.position} • #{playerData.jerseyNumber}</span>
              </div>
            </div>
          </div>

          {/* Équipe */}
          {playerData.teamName && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Mon Équipe</p>
                  <p className="font-bold text-gray-900">{playerData.teamName}</p>
                </div>
              </div>
              
              {/* Coach Info */}
              {coachData && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-green-600 text-white flex items-center justify-center font-bold text-sm">
                      {coachData.firstName.charAt(0)}{coachData.lastName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600">Entraîneur</p>
                      <p className="font-semibold text-gray-900">
                        {coachData.firstName} {coachData.lastName}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-600">
                        {coachData.email && (
                          <span className="flex items-center gap-1">
                            📧 {coachData.email}
                          </span>
                        )}
                        {coachData.phone && (
                          <span className="flex items-center gap-1">
                            📞 {coachData.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Informations personnelles */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Informations Personnelles
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{playerData.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Téléphone</p>
                <p className="font-medium text-gray-900">{playerData.phone}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Classe</p>
                <p className="font-medium text-gray-900">{playerData.grade}</p>
              </div>
            </div>

            {playerData.birthDate && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Date de naissance</p>
                  <p className="font-medium text-gray-900">
                    {new Date(playerData.birthDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Informations sportives */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            Informations Sportives
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Users className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Position</p>
                <p className="font-medium text-gray-900">{playerData.position}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Numéro de maillot</p>
                <p className="font-medium text-gray-900">#{playerData.jerseyNumber}</p>
              </div>
            </div>

            {playerData.height > 0 && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Ruler className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Taille</p>
                  <p className="font-medium text-gray-900">{playerData.height} cm</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Activity className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Pied</p>
                <p className="font-medium text-gray-900">{playerData.foot}</p>
              </div>
            </div>

            {playerData.tshirtSize && (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-gray-600">Taille T-shirt</p>
                  <p className="font-medium text-gray-900">{playerData.tshirtSize}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Note d'information */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            💡 Pour modifier vos informations, contactez un administrateur de la ligue.
          </p>
        </div>
      </div>
    </div>
  )
}
