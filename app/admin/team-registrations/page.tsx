"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useRouter } from 'next/navigation'
import { collection, query, getDocs, doc, updateDoc, addDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Check, X, Eye, Users, Clock, CheckCircle, XCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Player {
  firstName: string
  lastName: string
  email: string
  phone: string
  birthDate?: string
  age?: number
  height: number
  tshirtSize?: string
  position: string
  foot: string
  jerseyNumber: number
  grade?: '1ère' | 'Terminale'
}

interface Registration {
  id: string
  teamName: string
  schoolName?: string
  teamGrade?: '1ère' | 'Terminale'
  captain: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  players: Player[]
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: any
  processedAt?: any
  processedBy?: string
}

export default function TeamRegistrationsPage() {
  const { user, loading: authLoading, isAdmin } = useAuth()
  const router = useRouter()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null)
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending')

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login')
      } else if (!isAdmin) {
        router.push('/public')
      }
    }
  }, [user, authLoading, isAdmin, router])

  useEffect(() => {
    if (user && isAdmin) {
      loadRegistrations()
    }
  }, [user, isAdmin])

  const loadRegistrations = async () => {
    try {
      const q = query(collection(db, 'teamRegistrations'), orderBy('submittedAt', 'desc'))
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Registration[]
      setRegistrations(data)
    } catch (error) {
      console.error('Erreur lors du chargement des inscriptions:', error)
      setMessage({ type: 'error', text: 'Erreur lors du chargement des inscriptions' })
    } finally {
      setLoading(false)
    }
  }

  const approveRegistration = async (registration: Registration) => {
    if (!confirm(`Approuver l'équipe "${registration.teamName}" ?`)) return

    setProcessing(true)
    setMessage(null)

    try {
      // 1. Créer l'équipe
      const teamRef = await addDoc(collection(db, 'teams'), {
        name: registration.teamName,
        schoolName: registration.schoolName,
        teamGrade: registration.teamGrade,
        createdAt: serverTimestamp(),
        captain: registration.captain
      })

      // 2. Créer les joueurs avec le format attendu par le système
      const playerPromises = registration.players.map(player =>
        addDoc(collection(db, 'players'), {
          name: `${player.firstName} ${player.lastName}`,
          number: player.jerseyNumber,
          position: player.position,
          teamId: teamRef.id,
          nationality: 'Égypte',
          // Informations du formulaire d'inscription
          height: player.height,
          strongFoot: player.foot === 'Droitier' ? 'Droit' : player.foot === 'Gaucher' ? 'Gauche' : 'Ambidextre',
          grade: player.grade || registration.teamGrade,
          school: registration.schoolName,
          // Valeurs par défaut
          overall: 75,
          seasonStats: {
            goals: 0,
            assists: 0,
            matches: 0,
            yellowCards: 0,
            redCards: 0
          },
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
      )
      await Promise.all(playerPromises)

      // 3. Initialiser les statistiques de l'équipe
      await addDoc(collection(db, 'teamStatistics'), {
        teamId: teamRef.id,
        points: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        matchesPlayed: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })

      // 4. Mettre à jour le statut de l'inscription
      await updateDoc(doc(db, 'teamRegistrations', registration.id), {
        status: 'approved',
        processedAt: serverTimestamp(),
        processedBy: user?.email,
        teamId: teamRef.id
      })

      setMessage({ type: 'success', text: `Équipe "${registration.teamName}" approuvée avec succès!` })
      setSelectedRegistration(null)
      loadRegistrations()
    } catch (error) {
      console.error('Erreur lors de l\'approbation:', error)
      setMessage({ type: 'error', text: 'Erreur lors de l\'approbation de l\'équipe' })
    } finally {
      setProcessing(false)
    }
  }

  const rejectRegistration = async (registration: Registration) => {
    const reason = prompt(`Raison du rejet de l'équipe "${registration.teamName}" (optionnel):`)
    if (reason === null) return // User cancelled

    setProcessing(true)
    setMessage(null)

    try {
      await updateDoc(doc(db, 'teamRegistrations', registration.id), {
        status: 'rejected',
        processedAt: serverTimestamp(),
        processedBy: user?.email,
        rejectionReason: reason || 'Non spécifié'
      })

      setMessage({ type: 'success', text: `Équipe "${registration.teamName}" rejetée` })
      setSelectedRegistration(null)
      loadRegistrations()
    } catch (error) {
      console.error('Erreur lors du rejet:', error)
      setMessage({ type: 'error', text: 'Erreur lors du rejet de l\'équipe' })
    } finally {
      setProcessing(false)
    }
  }

  const deleteRegistration = async (registration: Registration) => {
    if (!confirm(`Supprimer définitivement l'inscription de "${registration.teamName}" ?`)) return

    setProcessing(true)
    setMessage(null)

    try {
      await deleteDoc(doc(db, 'teamRegistrations', registration.id))
      setMessage({ type: 'success', text: 'Inscription supprimée' })
      setSelectedRegistration(null)
      loadRegistrations()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la suppression' })
    } finally {
      setProcessing(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!user || !isAdmin) {
    return null
  }

  const filteredRegistrations = registrations.filter(reg => 
    filter === 'all' ? true : reg.status === filter
  )

  const stats = {
    pending: registrations.filter(r => r.status === 'pending').length,
    approved: registrations.filter(r => r.status === 'approved').length,
    rejected: registrations.filter(r => r.status === 'rejected').length
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            Validation des Inscriptions d'Équipes
          </h1>
          <p className="text-gray-600">Gérez les demandes d'inscription des équipes</p>
        </div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">En attente</p>
                <p className="text-3xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <Clock className="w-12 h-12 text-orange-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approuvées</p>
                <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejetées</p>
                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="w-12 h-12 text-red-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Toutes ({registrations.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'pending' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              En attente ({stats.pending})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'approved' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Approuvées ({stats.approved})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'rejected' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Rejetées ({stats.rejected})
            </button>
          </div>
        </div>

        {/* Registrations List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRegistrations.length === 0 ? (
            <div className="col-span-2 bg-white p-12 rounded-lg border border-gray-200 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Aucune inscription trouvée</p>
            </div>
          ) : (
            filteredRegistrations.map((registration, index) => (
              <motion.div
                key={registration.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{registration.teamName}</h3>
                    {registration.schoolName && (
                      <p className="text-sm text-blue-600 font-medium">
                        🏫 {registration.schoolName}
                      </p>
                    )}
                    {registration.teamGrade && (
                      <p className="text-sm text-purple-600 font-medium">
                        📚 Classe: {registration.teamGrade}
                      </p>
                    )}
                    <p className="text-sm text-gray-600 mt-1">
                      {registration.players.length} joueur{registration.players.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    registration.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                    registration.status === 'approved' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {registration.status === 'pending' ? 'En attente' :
                     registration.status === 'approved' ? 'Approuvée' : 'Rejetée'}
                  </span>
                </div>

                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-semibold text-gray-700 mb-1">Capitaine</p>
                  <p className="text-sm text-gray-900">
                    {registration.captain.firstName} {registration.captain.lastName}
                  </p>
                  <p className="text-xs text-gray-600">{registration.captain.email}</p>
                  <p className="text-xs text-gray-600">{registration.captain.phone}</p>
                </div>

                <p className="text-xs text-gray-500 mb-4">
                  Soumis le {registration.submittedAt?.toDate?.()?.toLocaleDateString('fr-FR') || 'N/A'}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedRegistration(registration)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <Eye className="w-4 h-4" />
                    Détails
                  </button>
                  
                  {registration.status === 'pending' && (
                    <>
                      <button
                        onClick={() => approveRegistration(registration)}
                        disabled={processing}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => rejectRegistration(registration)}
                        disabled={processing}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedRegistration && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={() => setSelectedRegistration(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedRegistration.teamName}</h2>
                  {selectedRegistration.schoolName && (
                    <p className="text-sm text-blue-600 font-medium">🏫 {selectedRegistration.schoolName}</p>
                  )}
                  {selectedRegistration.teamGrade && (
                    <p className="text-sm text-purple-600 font-medium">📚 Classe: {selectedRegistration.teamGrade}</p>
                  )}
                  <p className="text-sm text-gray-600">Détails de l'inscription</p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Captain Info */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Capitaine</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-900"><span className="font-semibold">Nom:</span> {selectedRegistration.captain.firstName} {selectedRegistration.captain.lastName}</p>
                      <p className="text-sm text-gray-900"><span className="font-semibold">Email:</span> {selectedRegistration.captain.email}</p>
                      <p className="text-sm text-gray-900"><span className="font-semibold">Téléphone:</span> {selectedRegistration.captain.phone}</p>
                    </div>
                  </div>

                  {/* Players */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">
                      Joueurs ({selectedRegistration.players.length})
                    </h3>
                    <div className="space-y-3">
                      {selectedRegistration.players.map((player, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg">
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div>
                              <p className="text-xs text-gray-600">Nom</p>
                              <p className="text-sm font-semibold text-gray-900">{player.firstName} {player.lastName}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Email</p>
                              <p className="text-sm font-semibold text-gray-900">{player.email}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Téléphone</p>
                              <p className="text-sm font-semibold text-gray-900">{player.phone}</p>
                            </div>
                            {player.birthDate && (
                              <div>
                                <p className="text-xs text-gray-600">Date de naissance</p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {new Date(player.birthDate).toLocaleDateString('fr-FR')}
                                  {player.age && <span className="text-gray-600"> ({player.age} ans)</span>}
                                </p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-gray-600">Position</p>
                              <p className="text-sm font-semibold text-gray-900">{player.position}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">N° Maillot</p>
                              <p className="text-sm font-semibold text-gray-900">{player.jerseyNumber}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-600">Taille</p>
                              <p className="text-sm font-semibold text-gray-900">{player.height} cm</p>
                            </div>
                            {player.tshirtSize && (
                              <div>
                                <p className="text-xs text-gray-600">T-shirt</p>
                                <p className="text-sm font-semibold text-gray-900">{player.tshirtSize}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-xs text-gray-600">Pied</p>
                              <p className="text-sm font-semibold text-gray-900">{player.foot}</p>
                            </div>
                            {player.grade && (
                              <div>
                                <p className="text-xs text-gray-600">Classe</p>
                                <p className="text-sm font-semibold text-gray-900">{player.grade}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex gap-3">
                  {selectedRegistration.status === 'pending' && (
                    <>
                      <button
                        onClick={() => approveRegistration(selectedRegistration)}
                        disabled={processing}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium"
                      >
                        <Check className="w-5 h-5" />
                        Approuver
                      </button>
                      <button
                        onClick={() => rejectRegistration(selectedRegistration)}
                        disabled={processing}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition font-medium"
                      >
                        <X className="w-5 h-5" />
                        Rejeter
                      </button>
                    </>
                  )}
                  {selectedRegistration.status !== 'pending' && (
                    <button
                      onClick={() => deleteRegistration(selectedRegistration)}
                      disabled={processing}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition font-medium"
                    >
                      <X className="w-5 h-5" />
                      Supprimer
                    </button>
                  )}
                  <button
                    onClick={() => setSelectedRegistration(null)}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
                  >
                    Fermer
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
