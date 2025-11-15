"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Users, Loader, Check, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { SimpleLogo } from '@/components/ui/logo'
import { useParams, useRouter } from 'next/navigation'

interface TeamRegistration {
  id: string
  teamName: string
  schoolName: string
  teamGrade: string
  players: any[]
  maxPlayers: number
  status: string
}

export default function JoinTeamPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  
  const [registration, setRegistration] = useState<TeamRegistration | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Form fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [position, setPosition] = useState<'Gardien' | 'Défenseur' | 'Milieu' | 'Attaquant' | ''>('')
  const [jerseyNumber, setJerseyNumber] = useState('')
  const [grade, setGrade] = useState('')

  // Force light mode
  useEffect(() => {
    document.documentElement.classList.remove('dark')
  }, [])

  // Load registration
  useEffect(() => {
    if (!token) return

    const loadRegistration = async () => {
      try {
        const registrationsRef = collection(db, 'teamRegistrations')
        const q = query(registrationsRef, where('inviteToken', '==', token))
        const snapshot = await getDocs(q)

        if (snapshot.empty) {
          setError('Lien d\'invitation invalide')
          setLoading(false)
          return
        }

        const docData = snapshot.docs[0]
        const data = { id: docData.id, ...docData.data() } as TeamRegistration

        if (data.status !== 'pending_players') {
          setError('Cette équipe n\'accepte plus de nouveaux joueurs')
          setLoading(false)
          return
        }

        if (data.players.length >= data.maxPlayers) {
          setError('L\'équipe est complète')
          setLoading(false)
          return
        }

        setRegistration(data)
        setGrade(data.teamGrade)
        setLoading(false)
      } catch (err: any) {
        console.error('Erreur:', err)
        setError('Erreur lors du chargement')
        setLoading(false)
      }
    }

    loadRegistration()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!registration) return

    setError('')
    setSubmitting(true)

    try {
      // Validation
      if (!firstName.trim() || !lastName.trim()) {
        throw new Error('Le nom et prénom sont requis')
      }
      if (!email.trim()) {
        throw new Error('L\'email est requis')
      }
      if (!phone.trim()) {
        throw new Error('Le téléphone est requis')
      }
      if (!position) {
        throw new Error('La position est requise')
      }
      if (!jerseyNumber.trim()) {
        throw new Error('Le numéro de maillot est requis')
      }

      // Check if email already exists
      const emailExists = registration.players.some(
        p => p.email.toLowerCase() === email.trim().toLowerCase()
      )
      if (emailExists) {
        throw new Error('Cet email est déjà utilisé par un autre joueur')
      }

      // Check if jersey number already exists
      const numberExists = registration.players.some(
        p => p.jerseyNumber === jerseyNumber.trim()
      )
      if (numberExists) {
        throw new Error('Ce numéro de maillot est déjà pris')
      }

      // Add player
      const playerData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        position,
        jerseyNumber: jerseyNumber.trim(),
        grade: grade || registration.teamGrade,
        joinedAt: serverTimestamp()
      }

      await updateDoc(doc(db, 'teamRegistrations', registration.id), {
        players: arrayUnion(playerData)
      })

      // TODO: Create Firebase Auth account and send email

      setSuccess(true)
      
    } catch (err: any) {
      console.error('Erreur:', err)
      setError(err.message || 'Une erreur est survenue')
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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Oups!</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/register-team-new" className="text-green-600 hover:text-green-700 font-medium">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Inscription réussie!</h2>
          <p className="text-gray-600 mb-2">
            Bienvenue dans l'équipe <strong>{registration?.teamName}</strong>!
          </p>
          <p className="text-sm text-gray-500 mb-8">
            Vous recevrez bientôt un email pour créer votre mot de passe et accéder à votre compte.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-medium mb-1">📧 Vérifiez votre boîte mail</p>
            <p>Un email a été envoyé à <strong>{email}</strong></p>
          </div>
        </motion.div>
      </div>
    )
  }

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
      <div className="max-w-2xl mx-auto px-4 py-12 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold mb-4">
              <Users className="w-4 h-4" />
              Rejoindre une équipe
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {registration?.teamName}
            </h1>
            <p className="text-gray-600">
              {registration?.schoolName} • {registration?.teamGrade}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {registration?.players.length}/{registration?.maxPlayers} joueurs inscrits
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Vos informations</h2>
              
              <div className="space-y-4">
                {/* Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="votre.email@exemple.com"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="+20 123 456 7890"
                    required
                  />
                </div>

                {/* Position */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position *
                  </label>
                  <select
                    value={position}
                    onChange={(e) => setPosition(e.target.value as any)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Sélectionnez une position</option>
                    <option value="Gardien">Gardien</option>
                    <option value="Défenseur">Défenseur</option>
                    <option value="Milieu">Milieu</option>
                    <option value="Attaquant">Attaquant</option>
                  </select>
                </div>

                {/* Jersey Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de maillot *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={jerseyNumber}
                    onChange={(e) => setJerseyNumber(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="10"
                    required
                  />
                </div>

                {/* Grade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Classe
                  </label>
                  <input
                    type="text"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-gray-50"
                    placeholder={registration?.teamGrade}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Laissez vide pour utiliser la classe de l'équipe
                  </p>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Inscription en cours...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Rejoindre l'équipe
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
