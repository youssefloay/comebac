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
  const [nickname, setNickname] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [height, setHeight] = useState('')
  const [tshirtSize, setTshirtSize] = useState<'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'>('M')
  const [position, setPosition] = useState<'Gardien' | 'Défenseur' | 'Milieu' | 'Attaquant' | ''>('')
  const [foot, setFoot] = useState<'Droitier' | 'Gaucher' | 'Ambidextre' | ''>('')
  const [jerseyNumber, setJerseyNumber] = useState('')

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
        nickname: nickname.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        birthDate: birthDate,
        height: height,
        tshirtSize: tshirtSize,
        position,
        foot,
        jerseyNumber: jerseyNumber.trim(),
        joinedAt: new Date().toISOString()
      }

      await updateDoc(doc(db, 'teamRegistrations', registration.id), {
        players: arrayUnion(playerData)
      })

      // Vérifier si on a atteint 10 joueurs et notifier l'admin (une seule fois)
      const updatedPlayersCount = registration.players.length + 1
      const registrationData = registration as any
      if (updatedPlayersCount >= 10 && !registrationData.adminNotifiedAt10Players) {
        try {
          const captain = registrationData.captain || {}
          const notifyResponse = await fetch('/api/notify-admin-team-ready', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              teamName: registration.teamName,
              schoolName: registration.schoolName,
              teamGrade: registration.teamGrade,
              captainName: captain.firstName && captain.lastName ? `${captain.firstName} ${captain.lastName}` : 'Non spécifié',
              captainEmail: captain.email || '',
              playersCount: updatedPlayersCount,
              registrationId: registration.id,
              token: registrationData.inviteToken || ''
            })
          })
          
          if (notifyResponse.ok) {
            // Marquer que l'admin a été notifié
            await updateDoc(doc(db, 'teamRegistrations', registration.id), {
              adminNotifiedAt10Players: true,
              adminNotifiedAt10PlayersAt: new Date().toISOString()
            })
            console.log('✅ Notification admin envoyée - équipe prête à valider')
          } else {
            const errorData = await notifyResponse.json()
            console.error('Erreur notification admin:', errorData)
          }
        } catch (notifyError) {
          console.error('Erreur notification admin:', notifyError)
          // Continue même si la notification échoue
        }
      }

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
          <Link href="/register-team" className="text-green-600 hover:text-green-700 font-medium">
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
          {/* Contact Instagram */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center mb-6">
            <p className="text-sm text-gray-700 mb-2">
              Vous avez un problème ou une question concernant l'inscription ?
            </p>
            <a
              href="https://www.instagram.com/comebac.league/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
              </svg>
              Contactez-nous sur Instagram
            </a>
          </div>

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

                {/* Nickname */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Surnom sur T-shirt *
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Max 15 caractères"
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

                {/* Height */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taille (cm) *
                  </label>
                  <input
                    type="number"
                    min="140"
                    max="220"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="175"
                    required
                  />
                </div>

                {/* T-shirt Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taille T-shirt *
                  </label>
                  <select
                    value={tshirtSize}
                    onChange={(e) => setTshirtSize(e.target.value as any)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                  </select>
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

                {/* Foot */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pied *
                  </label>
                  <select
                    value={foot}
                    onChange={(e) => setFoot(e.target.value as any)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Sélectionnez...</option>
                    <option value="Droitier">Droitier</option>
                    <option value="Gaucher">Gaucher</option>
                    <option value="Ambidextre">Ambidextre</option>
                  </select>
                </div>

                {/* Jersey Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    N° Maillot *
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
