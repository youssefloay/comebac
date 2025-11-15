"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { doc, getDoc, onSnapshot, collection, query, where, getDocs, updateDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Users, Link as LinkIcon, Copy, Check, Loader, Send, ArrowRight, Clock } from 'lucide-react'
import Link from 'next/link'
import { SimpleLogo } from '@/components/ui/logo'
import { useParams } from 'next/navigation'

interface Player {
  firstName: string
  lastName: string
  email: string
  phone: string
  position: string
  jerseyNumber: string
  joinedAt: any
}

interface TeamRegistration {
  teamName: string
  schoolName: string
  teamGrade: string
  captain: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  players: Player[]
  status: string
  inviteToken: string
  minPlayers: number
  maxPlayers: number
  createdAt: any
}

export default function TeamStatusPage() {
  const params = useParams()
  const token = params.token as string
  
  const [registration, setRegistration] = useState<TeamRegistration | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const inviteLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/join-team/${token}`
    : ''

  // Force light mode
  useEffect(() => {
    document.documentElement.classList.remove('dark')
  }, [])

  // Load registration and listen for updates
  useEffect(() => {
    if (!token) return

    const loadRegistration = async () => {
      try {
        // Find registration by token
        const registrationsRef = collection(db, 'teamRegistrations')
        const q = query(registrationsRef, where('inviteToken', '==', token))
        const snapshot = await getDocs(q)

        if (snapshot.empty) {
          setError('Inscription non trouvée')
          setLoading(false)
          return
        }

        const docData = snapshot.docs[0]
        const data = { id: docData.id, ...docData.data() } as any

        setRegistration(data)
        setLoading(false)

        // Listen for real-time updates
        const unsubscribe = onSnapshot(doc(db, 'teamRegistrations', docData.id), (doc) => {
          if (doc.exists()) {
            setRegistration({ id: doc.id, ...doc.data() } as any)
          }
        })

        return () => unsubscribe()
      } catch (err: any) {
        console.error('Erreur:', err)
        setError('Erreur lors du chargement')
        setLoading(false)
      }
    }

    loadRegistration()
  }, [token])



  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmitForValidation = async () => {
    if (!registration) return
    
    if (registration.players.length < registration.minPlayers) {
      alert(`Vous devez avoir au moins ${registration.minPlayers} joueurs inscrits`)
      return
    }

    if (!confirm('Soumettre l\'équipe pour validation par l\'administration?')) return

    setSubmitting(true)
    try {
      await updateDoc(doc(db, 'teamRegistrations', (registration as any).id), {
        status: 'pending_validation',
        submittedForValidationAt: serverTimestamp()
      })
      alert('✅ Équipe soumise pour validation!')
    } catch (err) {
      console.error('Erreur:', err)
      alert('❌ Erreur lors de la soumission')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteRegistration = async () => {
    if (!registration) return

    const confirmMessage = `⚠️ ATTENTION ⚠️\n\nÊtes-vous sûr de vouloir supprimer complètement l'inscription de l'équipe "${registration.teamName}" ?\n\nCette action est IRRÉVERSIBLE et supprimera:\n- Toutes les informations de l'équipe\n- Tous les joueurs inscrits\n- Tous les liens d'invitation\n\nTapez "SUPPRIMER" pour confirmer.`
    
    const userInput = prompt(confirmMessage)
    
    if (userInput !== 'SUPPRIMER') {
      if (userInput !== null) {
        alert('❌ Suppression annulée - vous devez taper exactement "SUPPRIMER"')
      }
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/admin/delete-team-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId: (registration as any).id
        })
      })

      if (response.ok) {
        alert('✅ Inscription supprimée avec succès!')
        window.location.href = '/register-team-new'
      } else {
        throw new Error('Erreur lors de la suppression')
      }
    } catch (err) {
      console.error('Erreur:', err)
      alert('❌ Erreur lors de la suppression')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-green-600" />
      </div>
    )
  }

  if (error || !registration) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Inscription non trouvée'}</p>
          <Link href="/register-team-new" className="text-green-600 hover:text-green-700">
            Retour
          </Link>
        </div>
      </div>
    )
  }

  const playerCount = registration.players.length
  const progress = (playerCount / registration.maxPlayers) * 100
  const canSubmit = playerCount >= registration.minPlayers && registration.status === 'pending_players'

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <SimpleLogo className="w-10 h-10" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                ComeBac League
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Status Badge */}
          <div className="text-center">
            {registration.status === 'pending_players' && (
              <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full text-sm font-semibold">
                <Loader className="w-4 h-4 animate-spin" />
                En attente des joueurs
              </div>
            )}
            {registration.status === 'pending_validation' && (
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-semibold">
                <Clock className="w-4 h-4" />
                En attente de validation admin
              </div>
            )}
            {registration.status === 'approved' && (
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
                <Check className="w-4 h-4" />
                Équipe validée
              </div>
            )}
          </div>

          {/* Team Info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{registration.teamName}</h1>
                <p className="text-gray-600">{registration.schoolName} • {registration.teamGrade}</p>
                <p className="text-sm text-gray-500 mt-2">
                  Capitaine: {registration.captain.firstName} {registration.captain.lastName}
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Link
                  href={`/update-registration/${token}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  ✏️ Modifier
                </Link>
                <button
                  onClick={handleDeleteRegistration}
                  disabled={submitting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium disabled:opacity-50"
                >
                  🗑️ Supprimer
                </button>
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">Progression</h2>
              <span className="text-2xl font-bold text-green-600">
                {playerCount}/{registration.maxPlayers}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
            
            <p className="text-sm text-gray-600">
              {playerCount < registration.minPlayers ? (
                <>Minimum {registration.minPlayers} joueurs requis</>
              ) : (
                <>✅ Minimum atteint! Vous pouvez soumettre pour validation</>
              )}
            </p>
          </div>

          {/* Invite Link */}
          {registration.status === 'pending_players' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Lien d'invitation</h2>
              
              <div className="space-y-4">
                {/* Link */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                  <button
                    onClick={copyLink}
                    className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                  >
                    {copied ? (
                      <>
                        <Check className="w-5 h-5" />
                        <span className="hidden sm:inline">Copié!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        <span className="hidden sm:inline">Copier</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-sm text-gray-600 text-center">
                  Partagez ce lien avec vos joueurs pour qu'ils s'inscrivent
                </p>
              </div>
            </div>
          )}

          {/* Players List */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Joueurs inscrits</h2>
            
            {playerCount === 0 ? (
              <p className="text-gray-500 text-center py-8">
                Aucun joueur inscrit pour le moment
              </p>
            ) : (
              <div className="space-y-3">
                {registration.players.map((player, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {player.firstName} {player.lastName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {player.position} • #{player.jerseyNumber}
                      </p>
                    </div>
                    <Check className="w-5 h-5 text-green-600" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit Button */}
          {canSubmit && (
            <button
              onClick={handleSubmitForValidation}
              disabled={submitting}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Soumission en cours...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Soumettre pour validation
                </>
              )}
            </button>
          )}
        </motion.div>
      </div>
    </div>
  )
}
