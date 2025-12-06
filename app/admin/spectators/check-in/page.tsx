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
  Users,
  QrCode,
  Camera,
  X
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
    back: "Retour",
    scanQRCode: "Scanner QR Code",
    searchManually: "Recherche manuelle",
    qrScanner: "Scanner QR Code",
    scanning: "Scan en cours...",
    scanInstructions: "Pointez la caméra vers le QR code",
    stopScan: "Arrêter le scan",
    startScan: "Démarrer le scan",
    cameraError: "Erreur d'accès à la caméra",
    cameraPermissionDenied: "Permission caméra refusée. Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur.",
    cameraNotAvailable: "Caméra non disponible. Veuillez vérifier que votre appareil a une caméra et qu'elle n'est pas utilisée par une autre application.",
    qrCodeValid: "QR Code valide",
    qrCodeInvalid: "QR Code invalide",
    processing: "Traitement...",
    qrCodeDetails: "Détails du QR Code",
    firstTimeUse: "Première utilisation",
    alreadyValidated: "QR Code déjà validé",
    confirmCheckIn: "Confirmer le check-in",
    close: "Fermer",
    checkInTime: "Heure de check-in",
    photo: "Photo"
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
    back: "Back",
    scanQRCode: "Scan QR Code",
    searchManually: "Manual search",
    qrScanner: "QR Code Scanner",
    scanning: "Scanning...",
    scanInstructions: "Point camera at QR code",
    stopScan: "Stop scan",
    startScan: "Start scan",
    cameraError: "Camera access error",
    cameraPermissionDenied: "Camera permission denied. Please allow camera access in your browser settings.",
    cameraNotAvailable: "Camera not available. Please check that your device has a camera and it's not being used by another application.",
    qrCodeValid: "Valid QR Code",
    qrCodeInvalid: "Invalid QR Code",
    processing: "Processing...",
    qrCodeDetails: "QR Code Details",
    firstTimeUse: "First time use",
    alreadyValidated: "QR Code already validated",
    confirmCheckIn: "Confirm check-in",
    close: "Close",
    checkInTime: "Check-in time",
    photo: "Photo"
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
  const [scanMode, setScanMode] = useState<'search' | 'scan'>('search')
  const [scanning, setScanning] = useState(false)
  const [qrScanner, setQrScanner] = useState<any>(null)
  const [scannerElementId] = useState(`qr-scanner-${Date.now()}`)
  const [qrPopupData, setQrPopupData] = useState<{
    show: boolean
    data: any
    isAlreadyCheckedIn: boolean
    token: string
  } | null>(null)
  const [isProcessingQR, setIsProcessingQR] = useState(false)
  const [enlargedPhoto, setEnlargedPhoto] = useState<string | null>(null)

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
        const regularData = await regularRes.json()
        // S'assurer que c'est un tableau
        const regularMatches = Array.isArray(regularData) ? regularData : []
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
        const preseasonData = await preseasonRes.json()
        // L'API retourne { matches: [...] }, donc on extrait le tableau
        const preseasonMatches = Array.isArray(preseasonData) 
          ? preseasonData 
          : (preseasonData.matches || [])
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

  // Fonctions pour le scan QR code
  const startQRScan = async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode(scannerElementId)
      
      setQrScanner(scanner)
      setScanning(true)
      setError(null)
      
      await scanner.start(
        { facingMode: 'environment' }, // Utiliser la caméra arrière
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          disableFlip: false
        },
        async (decodedText: string) => {
          // QR code détecté - arrêter immédiatement pour éviter les scans multiples
          try {
            await scanner.stop()
            await scanner.clear()
            setQrScanner(null)
            setScanning(false)
          } catch (e) {
            // Ignorer les erreurs d'arrêt
          }
          // Traiter le QR code
          handleQRCodeScanned(decodedText)
        },
        (errorMessage: string) => {
          // Erreur de scan (ignorer les erreurs de décodage)
        }
      )
    } catch (error: any) {
      console.error('Error starting QR scan:', error)
      
      // Gérer les différents types d'erreurs
      let errorMessage = t.cameraError
      if (error.name === 'NotAllowedError' || error.message?.includes('Permission denied') || error.message?.includes('NotAllowedError')) {
        errorMessage = t.cameraPermissionDenied
      } else if (error.name === 'NotFoundError' || error.message?.includes('not found') || error.message?.includes('NotFoundError')) {
        errorMessage = t.cameraNotAvailable
      } else {
        errorMessage = t.cameraError + ': ' + (error.message || 'Unknown error')
      }
      
      setError(errorMessage)
      setScanning(false)
    }
  }

  const stopQRScan = async () => {
    if (qrScanner) {
      try {
        await qrScanner.stop()
        await qrScanner.clear()
      } catch (error) {
        console.error('Error stopping QR scan:', error)
      }
      setQrScanner(null)
    }
    setScanning(false)
  }

  const handleQRCodeScanned = async (qrData: string) => {
    // Éviter les traitements multiples simultanés
    if (isProcessingQR) {
      return
    }

    setIsProcessingQR(true)

    try {
      // Extraire le token du QR code (format: /api/spectators/qr/{token})
      const tokenMatch = qrData.match(/\/api\/spectators\/qr\/([a-f0-9]+)/)
      if (!tokenMatch || !tokenMatch[1]) {
        setError(t.qrCodeInvalid)
        setIsProcessingQR(false)
        return
      }

      const token = tokenMatch[1]
      setError(null)
      setSuccess(null)

      // D'abord, récupérer les détails via GET avec timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 secondes max

      try {
        const getResponse = await fetch(`/api/spectators/qr/${token}`, {
          signal: controller.signal
        })
        clearTimeout(timeoutId)

        const getData = await getResponse.json()

        if (!getResponse.ok || !getData.valid) {
          setError(getData.error || t.qrCodeInvalid)
          setIsProcessingQR(false)
          return
        }

        // Afficher le popup avec les détails
        setQrPopupData({
          show: true,
          data: getData.request,
          isAlreadyCheckedIn: getData.alreadyCheckedIn || false,
          token: token
        })
      } catch (fetchError: any) {
        clearTimeout(timeoutId)
        if (fetchError.name === 'AbortError') {
          setError('La requête a pris trop de temps. Veuillez réessayer.')
        } else {
          throw fetchError
        }
      }
    } catch (error: any) {
      console.error('Error fetching QR code details:', error)
      setError(error.message || t.error)
    } finally {
      setIsProcessingQR(false)
    }
  }

  const handleConfirmCheckIn = async () => {
    if (!qrPopupData) return

    setError(null)
    setSuccess(t.processing)

    try {
      // Faire le check-in via POST
      const response = await fetch(`/api/spectators/qr/${qrPopupData.token}`, {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Check-in réussi
        setSuccess(t.success)
        setResult({
          id: data.request.id,
          matchId: qrPopupData.data.matchId || '',
          matchType: qrPopupData.data.matchType || 'regular',
          teamId: '',
          teamName: data.request.teamName || qrPopupData.data.teamName || '',
          firstName: data.request.firstName,
          lastName: data.request.lastName,
          email: data.request.email,
          phone: qrPopupData.data.phone || '',
          status: 'approved',
          checkedIn: true,
          checkedInAt: new Date(data.request.checkedInAt)
        } as SpectatorRequest)
        
        // Fermer le popup
        setQrPopupData(null)
        
        // Recharger les matchs si nécessaire
        if (match) {
          loadTodayMatches()
        }
      } else if (data.alreadyCheckedIn) {
        // Mettre à jour le popup pour indiquer qu'il est déjà check-in
        setQrPopupData({
          ...qrPopupData,
          isAlreadyCheckedIn: true,
          data: {
            ...qrPopupData.data,
            checkedInAt: data.request.checkedInAt
          }
        })
        setError(t.alreadyCheckedIn)
      } else {
        setError(data.error || t.qrCodeInvalid)
      }
    } catch (error: any) {
      console.error('Error processing QR code check-in:', error)
      setError(error.message || t.error)
    }
  }

  // Nettoyer le scanner quand on quitte
  useEffect(() => {
    return () => {
      if (qrScanner) {
        stopQRScan()
      }
    }
  }, [])

  // Arrêter le scan quand on change de mode
  useEffect(() => {
    if (scanMode === 'search' && scanning) {
      stopQRScan()
    }
  }, [scanMode])

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

        {/* Mode Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-3 mb-6 justify-center"
        >
          <button
            onClick={() => {
              setScanMode('search')
              stopQRScan()
            }}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              scanMode === 'search'
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Search className="w-5 h-5" />
            {t.searchManually}
          </button>
          <button
            onClick={() => {
              setScanMode('scan')
            }}
            className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${
              scanMode === 'scan'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg scale-105'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Camera className="w-5 h-5" />
            {t.scanQRCode}
          </button>
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

        {/* Search or QR Scanner */}
        {scanMode === 'search' ? (
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
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 mb-6"
          >
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {t.qrScanner}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t.scanInstructions}
              </p>
            </div>

            {/* QR Scanner Container */}
            <div className="relative">
              <div 
                id={scannerElementId}
                className="w-full rounded-lg overflow-hidden bg-black"
                style={{ minHeight: '300px' }}
              />
              
              {!scanning && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 rounded-lg backdrop-blur-sm">
                  <div className="mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center shadow-xl">
                      <Camera className="w-10 h-10 text-white" />
                    </div>
                  </div>
                  <button
                    onClick={startQRScan}
                    className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all font-bold text-lg flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Camera className="w-6 h-6" />
                    {t.startScan}
                  </button>
                  <p className="text-white/80 text-sm mt-4 text-center px-4">
                    {t.scanInstructions}
                  </p>
                </div>
              )}

              {scanning && (
                <div className="absolute top-4 right-4">
                  <button
                    onClick={stopQRScan}
                    className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                    title={t.stopScan}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {scanning && (
              <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
                {t.scanning}
              </p>
            )}
          </motion.div>
        )}

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
                  {error.includes('Permission') && !duplicateWarning && (
                    <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border border-red-200 dark:border-red-800">
                      <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                        {language === 'fr' ? 'Comment autoriser la caméra :' : 'How to allow camera:'}
                      </p>
                      <ul className="text-sm text-red-700 dark:text-red-300 space-y-1 list-disc list-inside ml-2">
                        <li>{language === 'fr' ? 'Cliquez sur l\'icône de cadenas 🔒 ou "i" dans la barre d\'adresse' : 'Click on the lock 🔒 or "i" icon in the address bar'}</li>
                        <li>{language === 'fr' ? 'Sélectionnez "Autoriser" pour l\'accès à la caméra' : 'Select "Allow" for camera access'}</li>
                        <li>{language === 'fr' ? 'Actualisez la page et réessayez' : 'Refresh the page and try again'}</li>
                      </ul>
                    </div>
                  )}
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

        {/* QR Code Popup Modal */}
        <AnimatePresence>
          {qrPopupData?.show && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
              onClick={() => setQrPopupData(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-6 ${
                  qrPopupData.isAlreadyCheckedIn 
                    ? 'border-4 border-red-500' 
                    : 'border-4 border-green-500'
                }`}
              >
                {/* Header avec indicateur de couleur */}
                <div className={`flex items-center justify-between mb-4 pb-4 border-b ${
                  qrPopupData.isAlreadyCheckedIn 
                    ? 'border-red-200 dark:border-red-800' 
                    : 'border-green-200 dark:border-green-800'
                }`}>
                  <div className="flex items-center gap-3">
                    {qrPopupData.isAlreadyCheckedIn ? (
                      <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                        <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {t.qrCodeDetails}
                      </h3>
                      <p className={`text-sm font-semibold ${
                        qrPopupData.isAlreadyCheckedIn 
                          ? 'text-red-600 dark:text-red-400' 
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {qrPopupData.isAlreadyCheckedIn ? t.alreadyValidated : t.firstTimeUse}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setQrPopupData(null)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
                  >
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                {/* Photo si disponible */}
                {qrPopupData.data.photoUrl && (
                  <div className="mb-4 flex justify-center">
                    <button
                      onClick={() => setEnlargedPhoto(qrPopupData.data.photoUrl)}
                      className="relative group cursor-pointer transition-transform hover:scale-105"
                      title={language === 'fr' ? 'Cliquer pour agrandir' : 'Click to enlarge'}
                    >
                      <img
                        src={qrPopupData.data.photoUrl}
                        alt={`${qrPopupData.data.firstName} ${qrPopupData.data.lastName}`}
                        className="w-24 h-24 rounded-full object-cover border-4 border-gray-200 dark:border-gray-700 group-hover:border-blue-400 dark:group-hover:border-blue-500 transition-colors"
                      />
                      <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                          />
                        </svg>
                      </div>
                    </button>
                  </div>
                )}

                {/* Détails de la personne */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t.name}</p>
                      <p className="font-semibold text-lg text-gray-900 dark:text-white">
                        {qrPopupData.data.firstName} {qrPopupData.data.lastName}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t.email}</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {qrPopupData.data.email}
                      </p>
                    </div>
                  </div>

                  {qrPopupData.data.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.phone}</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {qrPopupData.data.phone}
                        </p>
                      </div>
                    </div>
                  )}

                  {qrPopupData.data.teamName && (
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.team}</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {qrPopupData.data.teamName}
                        </p>
                      </div>
                    </div>
                  )}

                  {qrPopupData.isAlreadyCheckedIn && qrPopupData.data.checkedInAt && (
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 dark:text-gray-400">{t.checkInTime}</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatTime(new Date(qrPopupData.data.checkedInAt))}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Boutons d'action */}
                <div className="flex gap-3">
                  {!qrPopupData.isAlreadyCheckedIn && (
                    <button
                      onClick={handleConfirmCheckIn}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-semibold flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      {t.confirmCheckIn}
                    </button>
                  )}
                  <button
                    onClick={() => setQrPopupData(null)}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                      qrPopupData.isAlreadyCheckedIn
                        ? 'flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {t.close}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Photo Enlarged Modal */}
        <AnimatePresence>
          {enlargedPhoto && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
              onClick={() => setEnlargedPhoto(null)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-4xl max-h-[90vh] w-full"
              >
                <button
                  onClick={() => setEnlargedPhoto(null)}
                  className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  title={language === 'fr' ? 'Fermer' : 'Close'}
                >
                  <X className="w-6 h-6 text-white" />
                </button>
                <img
                  src={enlargedPhoto}
                  alt="Photo agrandie"
                  className="w-full h-auto rounded-lg shadow-2xl max-h-[90vh] object-contain"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
