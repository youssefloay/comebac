"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
  Check,
  Users
} from 'lucide-react'

interface SpectatorRequest {
  id: string
  matchId: string
  matchType: 'regular' | 'preseason'
  teamId: string
  teamName: string
  firstName: string
  lastName: string
  email: string
  phone: string
  status: 'pending' | 'approved' | 'rejected'
  checkedIn?: boolean
  checkedInAt?: Date
  createdAt: Date
}

interface Match {
  id: string
  type: 'regular' | 'preseason'
  homeTeam: string
  awayTeam: string
  date: Date
  venue?: string
}

const translations = {
  fr: {
    title: "Check-in sur place",
    subtitle: "Recherchez un spectateur par email ou téléphone",
    searchPlaceholder: "Email ou numéro de téléphone...",
    search: "Rechercher",
    selectMatch: "Sélectionner un match",
    noMatch: "Aucun match sélectionné",
    noResults: "Aucun résultat trouvé",
    notFound: "Aucune demande trouvée pour cet email/téléphone",
    alreadyCheckedIn: "Déjà check-in",
    checkIn: "Check-in",
    checkedIn: "Présent",
    notCheckedIn: "Non présent",
    approved: "Approuvé",
    pending: "En attente",
    rejected: "Refusé",
    error: "Erreur",
    success: "Check-in effectué avec succès",
    duplicateError: "Cette personne est déjà check-in pour ce match",
    duplicateEmailWarning: "Cet email est déjà utilisé par une autre personne qui est check-in",
    duplicatePhoneWarning: "Ce téléphone est déjà utilisé par une autre personne qui est check-in",
    notApprovedError: "Cette demande n'est pas approuvée",
    verifyIdentity: "Vérifiez l'identité de la personne avant le check-in",
    name: "Nom",
    email: "Email",
    phone: "Téléphone",
    team: "Équipe",
    match: "Match",
    date: "Date",
    status: "Statut",
    checkInTime: "Heure de check-in",
    back: "Retour"
  },
  en: {
    title: "On-site Check-in",
    subtitle: "Search for a spectator by email or phone",
    searchPlaceholder: "Email or phone number...",
    search: "Search",
    selectMatch: "Select a match",
    noMatch: "No match selected",
    noResults: "No results found",
    notFound: "No request found for this email/phone",
    alreadyCheckedIn: "Already checked in",
    checkIn: "Check-in",
    checkedIn: "Checked in",
    notCheckedIn: "Not checked in",
    approved: "Approved",
    pending: "Pending",
    rejected: "Rejected",
    error: "Error",
    success: "Check-in successful",
    duplicateError: "This person is already checked in for this match",
    duplicateEmailWarning: "This email is already used by another person who is checked in",
    duplicatePhoneWarning: "This phone is already used by another person who is checked in",
    notApprovedError: "This request is not approved",
    verifyIdentity: "Verify the person's identity before check-in",
    name: "Name",
    email: "Email",
    phone: "Phone",
    team: "Team",
    match: "Match",
    date: "Date",
    status: "Status",
    checkInTime: "Check-in time",
    back: "Back"
  }
}

export default function OnSiteCheckInPage() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr')
  const t = translations[language]
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState<SpectatorRequest | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<{ name: string; email?: string; phone?: string } | null>(null)
  const [match, setMatch] = useState<Match | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    loadTodayMatches()
  }, [])

  const loadTodayMatches = async () => {
    try {
      setLoading(true)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      // Charger les matchs du jour (regular et preseason)
      const [regularRes, preseasonRes] = await Promise.all([
        fetch('/api/admin/matches'),
        fetch('/api/preseason/matches')
      ])

      const allMatches: Match[] = []

      if (regularRes.ok) {
        const regularMatches = await regularRes.json()
        regularMatches.forEach((m: any) => {
          const matchDate = m.date?.toDate ? m.date.toDate() : new Date(m.date)
          if (matchDate >= today) {
            allMatches.push({
              id: m.id,
              type: 'regular' as const,
              homeTeam: m.homeTeam?.name || m.homeTeamId,
              awayTeam: m.awayTeam?.name || m.awayTeamId,
              date: matchDate,
              venue: m.venue || m.location
            })
          }
        })
      }

      if (preseasonRes.ok) {
        const preseasonMatches = await preseasonRes.json()
        preseasonMatches.forEach((m: any) => {
          const matchDate = m.date ? new Date(m.date) : new Date()
          if (matchDate >= today) {
            allMatches.push({
              id: m.id,
              type: 'preseason' as const,
              homeTeam: m.teamAName || m.teamA,
              awayTeam: m.teamBName || m.teamB,
              date: matchDate,
              venue: m.location || m.venue
            })
          }
        })
      }

      // Trier par date
      allMatches.sort((a, b) => a.date.getTime() - b.date.getTime())
      setMatches(allMatches)
      
      // Sélectionner le premier match par défaut
      if (allMatches.length > 0 && !match) {
        setMatch(allMatches[0])
      }
    } catch (error) {
      console.error('Error loading matches:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim() || !match) {
      setError(language === 'fr' ? 'Veuillez entrer un email/téléphone et sélectionner un match' : 'Please enter email/phone and select a match')
      return
    }

    setSearching(true)
    setError(null)
    setResult(null)
    setSuccess(null)

    try {
      const query = searchQuery.trim().toLowerCase()
      const isEmail = query.includes('@')
      
      // Rechercher toutes les demandes pour ce match
      const response = await fetch(`/api/spectators/requests?matchId=${match.id}&matchType=${match.type}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch requests')
      }

      const requests: SpectatorRequest[] = await response.json()
      
      // Trouver TOUTES les demandes avec cet email ou téléphone
      const allMatches: SpectatorRequest[] = []
      
      requests.forEach(req => {
        let matches = false
        if (isEmail) {
          matches = req.email.toLowerCase() === query
        } else {
          // Normaliser le téléphone (supprimer espaces)
          const reqPhone = req.phone.replace(/\s+/g, '')
          const searchPhone = query.replace(/\s+/g, '')
          matches = reqPhone === searchPhone
        }
        if (matches) {
          allMatches.push(req)
        }
      })

      if (allMatches.length === 0) {
        setError(t.notFound)
        setResult(null)
        setDuplicateWarning(null)
        return
      }

      // Vérifier s'il y a déjà quelqu'un d'autre qui est check-in avec le même email/téléphone
      const alreadyCheckedIn = allMatches.find(req => req.checkedIn && req.id !== allMatches[0].id)
      
      if (alreadyCheckedIn) {
        // Quelqu'un d'autre est déjà check-in avec cet email/téléphone
        setDuplicateWarning({
          name: `${alreadyCheckedIn.firstName} ${alreadyCheckedIn.lastName}`,
          email: isEmail ? alreadyCheckedIn.email : undefined,
          phone: !isEmail ? alreadyCheckedIn.phone : undefined
        })
        setError(language === 'fr' 
          ? `⚠️ Cet email/téléphone est déjà utilisé par ${alreadyCheckedIn.firstName} ${alreadyCheckedIn.lastName} qui est déjà check-in !`
          : `⚠️ This email/phone is already used by ${alreadyCheckedIn.firstName} ${alreadyCheckedIn.lastName} who is already checked in!`
        )
        setResult(null)
        return
      }

      // Vérifier si la première demande trouvée est déjà check-in
      if (allMatches[0].checkedIn) {
        setResult(allMatches[0])
        setDuplicateWarning(null)
        setError(null)
        return
      }

      // Si plusieurs demandes avec le même email/téléphone mais aucune check-in, prendre la première
      setResult(allMatches[0])
      setDuplicateWarning(null)
      setError(null)
    } catch (error: any) {
      console.error('Error searching:', error)
      setError(error.message || t.error)
    } finally {
      setSearching(false)
    }
  }

  const handleCheckIn = async () => {
    if (!result || !match) return

    setError(null)
    setSuccess(null)

    try {
      const response = await fetch(`/api/spectators/requests/${result.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkedIn: true })
      })

      if (response.ok) {
        setSuccess(t.success)
        // Recharger le résultat pour mettre à jour le statut
        const updatedResponse = await fetch(`/api/spectators/requests?matchId=${match.id}&matchType=${match.type}`)
        if (updatedResponse.ok) {
          const requests: SpectatorRequest[] = await updatedResponse.json()
          const updated = requests.find(r => r.id === result.id)
          if (updated) {
            setResult(updated)
          }
        }
        // Réinitialiser la recherche après 2 secondes
        setTimeout(() => {
          setSearchQuery('')
          setResult(null)
          setSuccess(null)
          setDuplicateWarning(null)
        }, 2000)
      } else {
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          const errorData = await response.json()
          setError(errorData.error || t.error)
        } else {
          setError(t.error)
        }
      }
    } catch (error: any) {
      console.error('Error checking in:', error)
      setError(error.message || t.error)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mb-4 shadow-lg">
            <Shield className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            {t.title}
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
            {t.subtitle}
          </p>
        </motion.div>

        {/* Match Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6"
        >
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            {t.selectMatch}
          </label>
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <select
              value={match ? `${match.type}_${match.id}` : ''}
              onChange={(e) => {
                if (e.target.value) {
                  const [matchType, matchId] = e.target.value.split('_')
                  const selected = matches.find(m => m.id === matchId && m.type === matchType)
                  setMatch(selected || null)
                  setResult(null)
                  setError(null)
                  setSuccess(null)
                  setDuplicateWarning(null)
                  setSearchQuery('')
                }
              }}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{t.selectMatch}</option>
              {matches.map((m) => (
                <option key={`${m.type}_${m.id}`} value={`${m.type}_${m.id}`}>
                  {m.homeTeam} vs {m.awayTeam} - {formatDate(m.date)}
                </option>
              ))}
            </select>
          )}
          {!match && matches.length === 0 && !loading && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{t.noMatch}</p>
          )}
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6"
        >
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={t.searchPlaceholder}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!match || searching}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={!match || searching || !searchQuery.trim()}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
            >
              {searching ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                t.search
              )}
            </button>
          </div>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-6 p-4 border-l-4 rounded-lg ${
                duplicateWarning 
                  ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500' 
                  : 'bg-red-50 dark:bg-red-900/20 border-red-500'
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  duplicateWarning 
                    ? 'text-orange-600 dark:text-orange-400' 
                    : 'text-red-600 dark:text-red-400'
                }`} />
                <div className="flex-1">
                  <p className={`font-semibold ${
                    duplicateWarning 
                      ? 'text-orange-700 dark:text-orange-300' 
                      : 'text-red-700 dark:text-red-300'
                  }`}>
                    {error}
                  </p>
                  {duplicateWarning && (
                    <div className="mt-2 p-3 bg-white dark:bg-gray-800 rounded border border-orange-200 dark:border-orange-800">
                      <p className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1">
                        {language === 'fr' ? 'Personne déjà check-in :' : 'Already checked in person:'}
                      </p>
                      <p className="text-sm text-orange-700 dark:text-orange-300">
                        <strong>{duplicateWarning.name}</strong>
                        {duplicateWarning.email && ` • ${duplicateWarning.email}`}
                        {duplicateWarning.phone && ` • ${duplicateWarning.phone}`}
                      </p>
                      <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                        {t.verifyIdentity}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success Message */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-lg"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="text-green-700 dark:text-green-300">{success}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6"
            >
              <div className="space-y-4">
                {/* Status Badge */}
                <div className="flex items-center justify-between">
                  <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    result.status === 'approved' 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : result.status === 'pending'
                      ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  }`}>
                    {result.status === 'approved' ? t.approved : result.status === 'pending' ? t.pending : t.rejected}
                  </div>
                  {result.checkedIn && (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-semibold">{t.alreadyCheckedIn}</span>
                    </div>
                  )}
                </div>

                {/* Person Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t.name}</p>
                      <p className="font-semibold text-lg text-gray-900 dark:text-white">
                        {result.firstName} {result.lastName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t.email}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{result.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t.phone}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{result.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t.team}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{result.teamName}</p>
                    </div>
                  </div>

                  {result.checkedIn && result.checkedInAt && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.checkInTime}</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatTime(result.checkedInAt)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Check-in Button */}
                {result.status === 'approved' && !result.checkedIn && (
                  <button
                    onClick={handleCheckIn}
                    className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all font-semibold text-lg flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    {t.checkIn}
                  </button>
                )}

                {result.status !== 'approved' && (
                  <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg">
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                      {t.notApprovedError}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
