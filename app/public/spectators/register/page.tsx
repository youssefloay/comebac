"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Calendar, 
  User, 
  Mail, 
  Phone, 
  CheckCircle2, 
  XCircle,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  Globe,
  Info
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, where } from 'firebase/firestore'

interface Team {
  id: string
  name: string
  logo?: string
  color?: string
}

interface Match {
  id: string
  type: 'regular' | 'preseason'
  homeTeam: string
  awayTeam: string
  date: Date
  venue: string
  round: number
}

interface SpectatorLimit {
  limit: number
  approved: number
  available: number
}

const translations = {
  fr: {
    title: "Réserver ma place au match",
    subtitle: "Réservez votre place pour assister aux matchs",
    step1: "Choisir votre équipe",
    step2: "Sélectionner un match",
    step3: "Vos coordonnées",
    step4: "Confirmation",
    selectTeam: "Sélectionnez votre équipe favorite",
    noTeam: "Aucune équipe trouvée",
    upcomingMatches: "Matchs à venir",
    noMatches: "Aucun match à venir pour cette équipe",
    matchFull: "Match complet",
    placesAvailable: "places disponibles",
    placeAvailable: "place disponible",
    firstName: "Prénom",
    lastName: "Nom",
    email: "Adresse email",
    phone: "Numéro de téléphone",
    submit: "Envoyer la demande",
    back: "Retour",
    next: "Suivant",
    success: "Demande envoyée avec succès !",
    successMessage: "Votre demande a été soumise. Vous recevrez une confirmation par email une fois approuvée.",
    error: "Erreur",
    required: "Ce champ est requis",
    invalidEmail: "Email invalide",
    invalidPhone: "Numéro de téléphone invalide",
    alreadyRequested: "Vous avez déjà soumis une demande pour ce match",
    emailAlreadyUsed: "Cet email a déjà été utilisé pour une demande pour ce match",
    phoneAlreadyUsed: "Ce numéro de téléphone a déjà été utilisé pour une demande pour ce match",
    oneReservationPerPerson: "⚠️ Une seule réservation par personne est autorisée pour chaque match",
    loading: "Chargement...",
    date: "Date",
    time: "Heure",
    venue: "Lieu",
    vs: "vs"
  },
  en: {
    title: "Reserve Your Match Spot",
    subtitle: "Reserve your spot to attend matches",
    step1: "Choose your team",
    step2: "Select a match",
    step3: "Your information",
    step4: "Confirmation",
    selectTeam: "Select your favorite team",
    noTeam: "No teams found",
    upcomingMatches: "Upcoming matches",
    noMatches: "No upcoming matches for this team",
    matchFull: "Match full",
    placesAvailable: "places available",
    placeAvailable: "place available",
    firstName: "First name",
    lastName: "Last name",
    email: "Email address",
    phone: "Phone number",
    submit: "Submit request",
    back: "Back",
    next: "Next",
    success: "Request submitted successfully!",
    successMessage: "Your request has been submitted. You will receive a confirmation email once approved.",
    error: "Error",
    required: "This field is required",
    invalidEmail: "Invalid email",
    invalidPhone: "Invalid phone number",
    alreadyRequested: "You have already submitted a request for this match",
    emailAlreadyUsed: "This email has already been used for a request for this match",
    phoneAlreadyUsed: "This phone number has already been used for a request for this match",
    oneReservationPerPerson: "⚠️ Only one reservation per person is allowed for each match",
    loading: "Loading...",
    date: "Date",
    time: "Time",
    venue: "Venue",
    vs: "vs"
  }
}

export default function SpectatorRegistrationPage() {
  const { user, userProfile } = useAuth()
  const [language, setLanguage] = useState<'fr' | 'en'>('fr')
  const t = translations[language]

  const [step, setStep] = useState(1)
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [matchLimits, setMatchLimits] = useState<Map<string, SpectatorLimit>>(new Map())
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  })

  // Charger les équipes
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const teamsQuery = query(collection(db, 'teams'), where('isActive', '==', true))
        const teamsSnap = await getDocs(teamsQuery)
        const teamsData = teamsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Team[]
        teamsData.sort((a, b) => a.name.localeCompare(b.name))
        setTeams(teamsData)
      } catch (error) {
        console.error('Error loading teams:', error)
      }
    }
    loadTeams()
  }, [])

  // Pré-remplir les infos si l'utilisateur est connecté
  useEffect(() => {
    if (user && userProfile && step === 3) {
      setFormData({
        firstName: userProfile.firstName || user.displayName?.split(' ')[0] || '',
        lastName: userProfile.lastName || user.displayName?.split(' ').slice(1).join(' ') || '',
        email: user.email || '',
        phone: userProfile.phone || ''
      })
    }
  }, [user, userProfile, step])

  // Charger les matchs quand une équipe est sélectionnée
  useEffect(() => {
    if (selectedTeam) {
      loadMatches()
    }
  }, [selectedTeam])

  // Charger les limites pour tous les matchs
  useEffect(() => {
    if (matches.length > 0) {
      loadAllMatchLimits()
    }
  }, [matches])

  const loadMatches = async () => {
    if (!selectedTeam) return

    setLoading(true)
    try {
      const response = await fetch(`/api/spectators/matches?teamId=${selectedTeam.id}`)
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          try {
            const matchesData = await response.json()
            // Convertir les dates string en objets Date
            const matchesWithDates = matchesData.map((match: any) => ({
              ...match,
              date: match.date ? new Date(match.date) : new Date()
            }))
            setMatches(matchesWithDates)
          } catch (jsonError) {
            console.error('Error parsing matches JSON:', jsonError)
            setMatches([])
          }
        } else {
          console.error('Response is not JSON:', contentType)
          setMatches([])
        }
      } else {
        console.error('Failed to load matches:', response.status, response.statusText)
        setMatches([])
      }
    } catch (error) {
      console.error('Error loading matches:', error)
      setMatches([])
    } finally {
      setLoading(false)
    }
  }

  const loadAllMatchLimits = async () => {
    const limitsMap = new Map<string, SpectatorLimit>()
    
    await Promise.all(
      matches.map(async (match) => {
        try {
          const matchKey = `${match.type}_${match.id}`
          const [limitRes, allRequestsRes] = await Promise.all([
            fetch(`/api/spectators/limits?matchId=${match.id}&matchType=${match.type}`),
            fetch(`/api/spectators/requests?matchId=${match.id}&matchType=${match.type}`)
          ])

          // Vérifier que les réponses sont valides et en JSON
          if (limitRes.ok && allRequestsRes.ok) {
            const contentTypeLimit = limitRes.headers.get('content-type')
            const contentTypeRequests = allRequestsRes.headers.get('content-type')
            
            if (contentTypeLimit?.includes('application/json') && contentTypeRequests?.includes('application/json')) {
              try {
                const limitData = await limitRes.json()
                const allRequests = await allRequestsRes.json()
                
                // Compter toutes les demandes actives (pending + approved)
                const activeRequests = Array.isArray(allRequests) 
                  ? allRequests.filter((r: any) => r.status === 'pending' || r.status === 'approved')
                  : []
                const approvedRequests = Array.isArray(allRequests)
                  ? allRequests.filter((r: any) => r.status === 'approved')
                  : []
                
                const limit = limitData.limit || 100
                const approved = approvedRequests.length
                const totalActive = activeRequests.length
                const available = Math.max(0, limit - totalActive)
                
                limitsMap.set(matchKey, {
                  limit,
                  approved,
                  available,
                  totalActive: totalActive
                })
              } catch (jsonError) {
                console.error(`Error parsing JSON for match ${match.id}:`, jsonError)
                // Limite par défaut en cas d'erreur de parsing
                limitsMap.set(matchKey, {
                  limit: 100,
                  approved: 0,
                  available: 100
                })
              }
            } else {
              // Réponse n'est pas du JSON, utiliser les valeurs par défaut
              limitsMap.set(matchKey, {
                limit: 100,
                approved: 0,
                available: 100
              })
            }
          } else {
            // Réponse non-OK, utiliser les valeurs par défaut
            limitsMap.set(matchKey, {
              limit: 100,
              approved: 0,
              available: 100
            })
          }
        } catch (error) {
          console.error(`Error loading limit for match ${match.id}:`, error)
          // Limite par défaut en cas d'erreur
          limitsMap.set(`${match.type}_${match.id}`, {
            limit: 100,
            approved: 0,
            available: 100
          })
        }
      })
    )
    
    setMatchLimits(limitsMap)
  }

  const handleTeamSelect = (team: Team) => {
    setSelectedTeam(team)
    setSelectedMatch(null)
    setStep(2)
  }

  const handleMatchSelect = (match: Match) => {
    const matchKey = `${match.type}_${match.id}`
    const limit = matchLimits.get(matchKey)
    if (limit && limit.available <= 0) {
      setError(t.matchFull)
      return
    }
    setSelectedMatch(match)
    setStep(3)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedTeam || !selectedMatch) return

    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim() || !formData.phone.trim()) {
      setError(t.required)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError(t.invalidEmail)
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/spectators/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          matchType: selectedMatch.type,
          teamId: selectedTeam.id,
          teamName: selectedTeam.name,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          userId: user?.uid || null
        })
      })

      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        const text = await response.text()
        console.error('Response is not JSON:', text.substring(0, 200))
        setError(t.error + ': ' + (response.statusText || 'Invalid response'))
        setSubmitting(false)
        return
      }

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setStep(4)
      } else {
        if (data.error?.includes('email has already been used')) {
          setError(t.emailAlreadyUsed)
        } else if (data.error?.includes('phone number has already been used')) {
          setError(t.phoneAlreadyUsed)
        } else if (data.error?.includes('already submitted')) {
          setError(t.alreadyRequested)
        } else if (data.error?.includes('full')) {
          setError(t.matchFull)
        } else {
          setError(data.error || t.error)
        }
      }
    } catch (error: any) {
      setError(error.message || t.error)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date)
    if (isNaN(dateObj.getTime())) {
      return language === 'fr' ? 'Date invalide' : 'Invalid date'
    }
    return new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dateObj)
  }

  const formatTime = (date: Date | string) => {
    const dateObj = date instanceof Date ? date : new Date(date)
    if (isNaN(dateObj.getTime())) {
      return language === 'fr' ? '--:--' : '--:--'
    }
    return new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 pb-20 lg:pb-0">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">
        {/* Language Toggle */}
        <div className="flex justify-end mb-6">
          <button
            onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">{language === 'fr' ? 'EN' : 'FR'}</span>
          </button>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mb-4 shadow-lg">
            <Users className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            {t.title}
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
            {t.subtitle}
          </p>
        </motion.div>

        {/* Info Message */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-lg"
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-blue-800 dark:text-blue-200 text-sm sm:text-base">
              {t.oneReservationPerPerson}
            </p>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[1, 2, 3, 4].map((stepNum) => (
              <div key={stepNum} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-sm sm:text-base transition-all ${
                      step >= stepNum
                        ? 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {step > stepNum ? <CheckCircle2 className="w-6 h-6" /> : stepNum}
                  </div>
                  <span className="text-xs sm:text-sm mt-2 text-center text-gray-600 dark:text-gray-400 hidden sm:block">
                    {stepNum === 1 && t.step1}
                    {stepNum === 2 && t.step2}
                    {stepNum === 3 && t.step3}
                    {stepNum === 4 && t.step4}
                  </span>
                </div>
                {stepNum < 4 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-all ${
                      step > stepNum ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-red-700 dark:text-red-300">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 1: Team Selection */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8"
          >
            <h2 className="text-2xl font-bold mb-6">{t.step1}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{t.selectTeam}</p>
            
            {teams.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">{t.noTeam}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {teams.map((team) => (
                  <motion.button
                    key={team.id}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleTeamSelect(team)}
                    className="p-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 border-2 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 transition-all text-center"
                  >
                    {team.logo ? (
                      <img src={team.logo} alt={team.name} className="w-12 h-12 mx-auto mb-2 rounded-full" />
                    ) : (
                      <div 
                        className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: team.color || '#3b82f6' }}
                      >
                        {team.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {team.name}
                    </p>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 2: Match Selection */}
        {step === 2 && selectedTeam && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">{t.step2}</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {selectedTeam.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setStep(1)
                  setSelectedTeam(null)
                  setMatches([])
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.back}
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-500 dark:text-gray-400">{t.loading}</p>
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">{t.noMatches}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map((match) => {
                  const matchKey = `${match.type}_${match.id}`
                  const limit = matchLimits.get(matchKey) || null
                  return (
                    <MatchCard
                      key={matchKey}
                      match={match}
                      limit={limit}
                      onSelect={() => handleMatchSelect(match)}
                      language={language}
                      t={t}
                      formatDate={formatDate}
                      formatTime={formatTime}
                    />
                  )
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 3: Contact Information */}
        {step === 3 && selectedTeam && selectedMatch && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">{t.step3}</h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {selectedTeam.name} - {selectedMatch.homeTeam} {t.vs} {selectedMatch.awayTeam}
                </p>
              </div>
              <button
                onClick={() => {
                  setStep(2)
                  setSelectedMatch(null)
                }}
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.back}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t.firstName} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {t.lastName} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t.email} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {t.phone} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition font-semibold"
                >
                  {t.back}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition font-semibold flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      {t.loading}
                    </>
                  ) : (
                    <>
                      {t.submit}
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* Step 4: Success */}
        {step === 4 && success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 sm:p-8 text-center"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-green-600 dark:text-green-400">
              {t.success}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t.successMessage}
            </p>
            <button
              onClick={() => {
                setStep(1)
                setSelectedTeam(null)
                setSelectedMatch(null)
                setSuccess(false)
                setFormData({ firstName: '', lastName: '', email: '', phone: '' })
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
            >
              {language === 'fr' ? 'Nouvelle demande' : 'New request'}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function MatchCard({ 
  match, 
  limit, 
  onSelect, 
  language, 
  t, 
  formatDate, 
  formatTime
}: { 
  match: Match
  limit: SpectatorLimit | null
  onSelect: () => void
  language: 'fr' | 'en'
  t: typeof translations.fr
  formatDate: (date: Date) => string
  formatTime: (date: Date) => string
}) {
  const isFull = limit && limit.available <= 0

  return (
    <motion.button
      whileHover={!isFull ? { scale: 1.02 } : {}}
      whileTap={!isFull ? { scale: 0.98 } : {}}
      onClick={onSelect}
      disabled={isFull}
      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
        isFull
          ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 opacity-50 cursor-not-allowed'
          : 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 border-gray-200 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white break-words">
              {match.homeTeam || 'Équipe à domicile'} {t.vs} {match.awayTeam || 'Équipe à l\'extérieur'}
            </h3>
            {match.type === 'preseason' && (
              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-semibold whitespace-nowrap">
                Preseason
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(match.date)}
            </span>
            <span className="flex items-center gap-1">
              <span>🕐</span>
              {formatTime(match.date)}
            </span>
            {match.venue && (
              <span className="flex items-center gap-1">
                <span>📍</span>
                {match.venue}
              </span>
            )}
          </div>
        </div>
        <div className="text-right ml-4">
          {isFull ? (
            <div className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg font-semibold text-sm">
              {t.matchFull}
            </div>
          ) : limit ? (
            <div className="px-3 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg font-semibold text-sm">
              {limit.available} {limit.available === 1 ? t.placeAvailable : t.placesAvailable}
            </div>
          ) : (
            <div className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg font-semibold text-sm">
              {t.loading}
            </div>
          )}
        </div>
      </div>
    </motion.button>
  )
}
