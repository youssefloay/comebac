"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Users, Loader, Check } from 'lucide-react'
import Link from 'next/link'
import { SimpleLogo } from '@/components/ui/logo'
import { useParams } from 'next/navigation'

interface TeamRegistration {
  id: string
  teamName: string
  schoolName: string
  teamGrade: string
  coach?: {
    email?: string
    name?: string
  }
  status: string
}

export default function JoinTeamCoachPage() {
  const params = useParams()
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
  const [birthDate, setBirthDate] = useState('')

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

        // Check if team has coach option enabled
        if (!(data as any).hasCoach) {
          setError('Cette équipe n\'a pas d\'entraîneur')
          setLoading(false)
          return
        }

        // Check if coach already registered
        if (data.coach && (data.coach as any).firstName) {
          setError('L\'entraîneur a déjà complété son inscription')
          setLoading(false)
          return
        }

        setRegistration(data)
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
      if (!birthDate) {
        throw new Error('La date de naissance est requise')
      }

      // Update coach info
      const coachData = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        birthDate: birthDate,
        completedAt: new Date().toISOString()
      }

      await updateDoc(doc(db, 'teamRegistrations', registration.id), {
        coach: coachData
      })

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
            Vous êtes maintenant entraîneur de l'équipe <strong>{registration?.teamName}</strong>!
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
              Inscription Entraîneur
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              {registration?.teamName}
            </h1>
            <p className="text-gray-600">
              {registration?.schoolName} • {registration?.teamGrade}
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

                {/* Birth Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de naissance *
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
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
                  Compléter mon inscription
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
