"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Users, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar,
  Settings,
  CheckSquare,
  Square,
  Eye,
  EyeOff,
  Globe,
  Search,
  Download,
  TrendingUp,
  AlertCircle,
  BarChart3,
  Trash2,
  Archive,
  Shield,
  User,
  Mail,
  Phone,
  X,
  Image as ImageIcon,
  Camera,
  QrCode
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
  photoUrl?: string | null
  status: 'pending' | 'approved' | 'rejected'
  checkedIn?: boolean
  checkedInAt?: Date
  userId?: string
  createdAt: Date
  updatedAt: Date
}

interface Match {
  id: string
  type: 'regular' | 'preseason'
  homeTeam: string
  awayTeam: string
  date: Date
  venue: string
}

const translations = {
  fr: {
    title: "Gestion des Spectateurs",
    pending: "En attente",
    approved: "Approuvées",
    rejected: "Refusées",
    all: "Toutes",
    filterByStatus: "Filtrer par statut",
    filterByMatch: "Filtrer par match",
    noRequests: "Aucune demande",
    name: "Nom",
    email: "Email",
    phone: "Téléphone",
    match: "Match",
    date: "Date",
    status: "Statut",
    actions: "Actions",
    approve: "Approuver",
    reject: "Refuser",
    limit: "Limite",
    setLimit: "Définir la limite",
    places: "places",
    available: "disponibles",
    approvedCount: "approuvées",
    full: "Complet",
    attendance: "Liste de présence",
    checkIn: "Cocher présent",
    uncheckIn: "Décocher",
    checkedIn: "Présent",
    notCheckedIn: "Non présent",
    today: "Aujourd'hui",
    selectMatch: "Sélectionner un match",
    noMatchesToday: "Aucun match aujourd'hui",
    save: "Enregistrer",
    cancel: "Annuler",
    limitUpdated: "Limite mise à jour",
    requestUpdated: "Demande mise à jour",
    error: "Erreur",
    delete: "Supprimer",
    deleteConfirm: "Êtes-vous sûr de vouloir supprimer cette demande ?",
    deleted: "Demande supprimée",
    loading: "Chargement...",
    limits: "Limites",
    setLimits: "Définir les limites",
    upcomingMatches: "Matchs à venir",
    archive: "Archiver",
    archived: "Archivé",
    archiveDay: "Archiver la journée",
    selectAll: "Tout sélectionner",
    deselectAll: "Tout désélectionner",
    bulkSetLimit: "Définir la limite pour les matchs sélectionnés",
    selectedMatches: "matchs sélectionnés",
    bulkLimitUpdated: "Limites mises à jour avec succès",
    viewDetails: "Voir les détails",
    requestDetails: "Détails de la demande",
    close: "Fermer",
    noPhoto: "Aucune photo fournie",
    team: "Équipe",
    submittedAt: "Soumis le",
    goToCheckIn: "Check-in sur place",
    scanQRCode: "Scanner QR Code"
  },
  en: {
    title: "Spectator Management",
    pending: "Pending",
    approved: "Approved",
    rejected: "Rejected",
    all: "All",
    filterByStatus: "Filter by status",
    filterByMatch: "Filter by match",
    noRequests: "No requests",
    name: "Name",
    email: "Email",
    phone: "Phone",
    match: "Match",
    date: "Date",
    status: "Status",
    actions: "Actions",
    approve: "Approve",
    reject: "Reject",
    limit: "Limit",
    setLimit: "Set limit",
    places: "places",
    available: "available",
    approvedCount: "approved",
    full: "Full",
    attendance: "Attendance List",
    checkIn: "Check in",
    uncheckIn: "Uncheck",
    checkedIn: "Checked in",
    notCheckedIn: "Not checked in",
    today: "Today",
    selectMatch: "Select a match",
    noMatchesToday: "No matches today",
    save: "Save",
    cancel: "Cancel",
    limitUpdated: "Limit updated",
    requestUpdated: "Request updated",
    error: "Error",
    delete: "Delete",
    deleteConfirm: "Are you sure you want to delete this request?",
    deleted: "Request deleted",
    loading: "Loading...",
    limits: "Limits",
    setLimits: "Set limits",
    upcomingMatches: "Upcoming matches",
    archive: "Archive",
    archived: "Archived",
    archiveDay: "Archive the day",
    selectAll: "Select all",
    deselectAll: "Deselect all",
    bulkSetLimit: "Set limit for selected matches",
    selectedMatches: "selected matches",
    bulkLimitUpdated: "Limits updated successfully",
    viewDetails: "View details",
    requestDetails: "Request details",
    close: "Close",
    noPhoto: "No photo provided",
    team: "Team",
    submittedAt: "Submitted on",
    goToCheckIn: "On-site Check-in",
    scanQRCode: "Scan QR Code"
  }
}

export default function SpectatorsTab() {
  const [language, setLanguage] = useState<'fr' | 'en'>('fr')
  const t = translations[language]

  const [requests, setRequests] = useState<SpectatorRequest[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [matchFilter, setMatchFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [showLimitModal, setShowLimitModal] = useState(false)
  const [limitValue, setLimitValue] = useState(100)
  const [updatingLimit, setUpdatingLimit] = useState(false)
  const [attendanceMode, setAttendanceMode] = useState(false)
  const [limitsMode, setLimitsMode] = useState(false)
  const [matchLimits, setMatchLimits] = useState<Map<string, { limit: number; approved: number; available: number }>>(new Map())
  const [allMatches, setAllMatches] = useState<Map<string, Match>>(new Map())
  const [upcomingMatchesForLimits, setUpcomingMatchesForLimits] = useState<Match[]>([])
  const [selectedMatchesForBulk, setSelectedMatchesForBulk] = useState<Set<string>>(new Set())
  const [showBulkLimitModal, setShowBulkLimitModal] = useState(false)
  const [bulkLimitValue, setBulkLimitValue] = useState(100)
  const [selectedRequest, setSelectedRequest] = useState<SpectatorRequest | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  // Charger les demandes
  useEffect(() => {
    loadRequests()
  }, [statusFilter, matchFilter])

  // Charger les limites et les matchs pour tous les matchs
  useEffect(() => {
    if (requests.length > 0) {
      loadAllMatchLimits()
      loadAllMatches()
    }
  }, [requests])

  const loadAllMatches = async () => {
    const matchesMap = new Map<string, Match>()
    const uniqueMatches = Array.from(new Set(requests.map(r => `${r.matchType}_${r.matchId}`)))
    
    await Promise.all(
      uniqueMatches.map(async (matchKey) => {
        try {
          const [matchType, matchId] = matchKey.split('_')
          
          if (matchType === 'preseason') {
            const response = await fetch('/api/preseason/matches')
            if (response.ok) {
              const data = await response.json()
              const match = (data.matches || []).find((m: any) => m.id === matchId)
              if (match) {
                const matchDate = new Date(match.date)
                if (match.time) {
                  const [hours, minutes] = match.time.split(':').map(Number)
                  if (!isNaN(hours) && !isNaN(minutes)) {
                    matchDate.setHours(hours, minutes, 0, 0)
                  }
                }
                matchesMap.set(matchKey, {
                  id: match.id,
                  type: 'preseason' as const,
                  homeTeam: match.teamA || '',
                  awayTeam: match.teamB || '',
                  date: matchDate,
                  venue: match.venue || match.location || ''
                })
              }
            }
          } else {
            const response = await fetch('/api/admin/matches')
            if (response.ok) {
              const data = await response.json()
              const match = data.find((m: any) => m.id === matchId)
              if (match) {
                matchesMap.set(matchKey, {
                  id: match.id,
                  type: 'regular' as const,
                  homeTeam: match.homeTeam || '',
                  awayTeam: match.awayTeam || '',
                  date: new Date(match.date),
                  venue: match.venue || ''
                })
              }
            }
          }
        } catch (error) {
          console.error(`Error loading match ${matchKey}:`, error)
        }
      })
    )
    
    setAllMatches(matchesMap)
  }

  // Charger les matchs du jour pour la liste de présence
  useEffect(() => {
    loadTodayMatches()
  }, [])

  // Charger les matchs à venir pour les limites
  useEffect(() => {
    if (limitsMode) {
      loadUpcomingMatches()
    }
  }, [limitsMode])

  // Recharger les limites quand les matchs à venir sont chargés
  useEffect(() => {
    if (limitsMode && upcomingMatchesForLimits.length > 0) {
      reloadLimitsForUpcomingMatches()
    }
  }, [upcomingMatchesForLimits, limitsMode])

  const loadRequests = async () => {
    setLoading(true)
    try {
      let url = '/api/spectators/requests?'
      if (statusFilter !== 'all') {
        url += `status=${statusFilter}&`
      }
      if (matchFilter !== 'all') {
        const [matchType, matchId] = matchFilter.split('_')
        url += `matchType=${matchType}&matchId=${matchId}`
      }

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setRequests(data)
      }
    } catch (error) {
      console.error('Error loading requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUpcomingMatches = async () => {
    try {
      const now = new Date()
      now.setSeconds(0, 0) // Reset seconds and milliseconds for accurate comparison
      
      const allMatches: Match[] = []
      
      // Charger les matchs réguliers
      try {
        const regularRes = await fetch('/api/admin/matches')
        if (regularRes.ok) {
          const regularData = await regularRes.json()
          const matchesArray = Array.isArray(regularData) ? regularData : []
          
          const regularMatches = matchesArray
            .filter((m: any) => {
              if (!m.date) return false
              // Gérer les dates Firestore (Timestamp) ou Date
              let matchDate: Date
              if (m.date?.toDate) {
                matchDate = m.date.toDate()
              } else if (m.date?.seconds) {
                matchDate = new Date(m.date.seconds * 1000)
              } else {
                matchDate = new Date(m.date)
              }
              
              // Ne garder que les matchs à venir (status upcoming ou in_progress)
              const isUpcoming = m.status === 'upcoming' || m.status === 'in_progress' || m.status === 'scheduled'
              return isUpcoming && matchDate >= now
            })
            .map((m: any) => {
              let matchDate: Date
              if (m.date?.toDate) {
                matchDate = m.date.toDate()
              } else if (m.date?.seconds) {
                matchDate = new Date(m.date.seconds * 1000)
              } else {
                matchDate = new Date(m.date)
              }
              
              return {
                id: m.id,
                type: 'regular' as const,
                homeTeam: m.homeTeam || m.homeTeamName || '',
                awayTeam: m.awayTeam || m.awayTeamName || '',
                date: matchDate,
                venue: m.venue || m.location || ''
              }
            })
          
          allMatches.push(...regularMatches)
        } else {
          console.warn('API /api/admin/matches returned error:', regularRes.status)
        }
      } catch (error) {
        console.error('Error loading regular matches:', error)
      }

      // Charger les matchs preseason
      try {
        const preseasonRes = await fetch('/api/preseason/matches')
        if (preseasonRes.ok) {
          const preseasonData = await preseasonRes.json()
          const matchesArray = preseasonData.matches || []
          
          const preseasonMatches = matchesArray
            .filter((m: any) => {
              if (!m.date) return false
              const matchDate = new Date(m.date)
              if (m.time) {
                const [hours, minutes] = m.time.split(':').map(Number)
                if (!isNaN(hours) && !isNaN(minutes)) {
                  matchDate.setHours(hours, minutes, 0, 0)
                }
              }
              return matchDate >= now
            })
            .map((m: any) => {
              const matchDate = new Date(m.date)
              if (m.time) {
                const [hours, minutes] = m.time.split(':').map(Number)
                if (!isNaN(hours) && !isNaN(minutes)) {
                  matchDate.setHours(hours, minutes, 0, 0)
                }
              }
              return {
                id: m.id,
                type: 'preseason' as const,
                homeTeam: m.teamAName || m.teamA || '',
                awayTeam: m.teamBName || m.teamB || '',
                date: matchDate,
                venue: m.venue || m.location || ''
              }
            })
          
          allMatches.push(...preseasonMatches)
        }
      } catch (error) {
        console.error('Error loading preseason matches:', error)
      }
      
      // Trier par date et définir l'état
      const sortedMatches = allMatches.sort((a, b) => a.date.getTime() - b.date.getTime())
      setUpcomingMatchesForLimits(sortedMatches)
      
      console.log('Loaded upcoming matches:', sortedMatches.length, sortedMatches)
    } catch (error) {
      console.error('Error loading upcoming matches:', error)
      setUpcomingMatchesForLimits([])
    }
  }

  const loadTodayMatches = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Charger les matchs réguliers
      const regularRes = await fetch('/api/admin/matches')
      const regularData = await regularRes.json()
      const regularMatches = regularData
        .filter((m: any) => {
          const matchDate = new Date(m.date)
          return matchDate >= today && matchDate < tomorrow
        })
        .map((m: any) => ({
          id: m.id,
          type: 'regular' as const,
          homeTeam: m.homeTeam || '',
          awayTeam: m.awayTeam || '',
          date: new Date(m.date),
          venue: m.venue || ''
        }))

      // Charger les matchs preseason
      const preseasonRes = await fetch('/api/preseason/matches')
      if (preseasonRes.ok) {
        const preseasonData = await preseasonRes.json()
        const preseasonMatches = (preseasonData.matches || [])
          .filter((m: any) => {
            const matchDate = new Date(m.date)
            if (m.time) {
              const [hours, minutes] = m.time.split(':').map(Number)
              if (!isNaN(hours) && !isNaN(minutes)) {
                matchDate.setHours(hours, minutes, 0, 0)
              }
            }
            return matchDate >= today && matchDate < tomorrow
          })
          .map((m: any) => {
            const matchDate = new Date(m.date)
            if (m.time) {
              const [hours, minutes] = m.time.split(':').map(Number)
              if (!isNaN(hours) && !isNaN(minutes)) {
                matchDate.setHours(hours, minutes, 0, 0)
              }
            }
            return {
              id: m.id,
              type: 'preseason' as const,
              homeTeam: m.teamA || '',
              awayTeam: m.teamB || '',
              date: matchDate,
              venue: m.venue || ''
            }
          })
        setMatches([...regularMatches, ...preseasonMatches].sort((a, b) => a.date.getTime() - b.date.getTime()))
      } else {
        setMatches(regularMatches.sort((a, b) => a.date.getTime() - b.date.getTime()))
      }
    } catch (error) {
      console.error('Error loading today matches:', error)
    }
  }

  const handleStatusUpdate = async (requestId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/spectators/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        loadRequests()
        // Recharger les limites si on est dans l'onglet Limites
        if (limitsMode && upcomingMatchesForLimits.length > 0) {
          await reloadLimitsForUpcomingMatches()
        } else {
          loadAllMatchLimits()
        }
      }
    } catch (error) {
      console.error('Error updating request:', error)
      alert(t.error)
    }
  }

  const handleCheckIn = async (requestId: string, checkedIn: boolean) => {
    try {
      const response = await fetch(`/api/spectators/requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checkedIn })
      })

      if (response.ok) {
        loadRequests()
      } else {
        // Récupérer le message d'erreur spécifique
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          const errorData = await response.json()
          alert(errorData.error || t.error)
        } else {
          alert(t.error)
        }
      }
    } catch (error) {
      console.error('Error updating check-in:', error)
      alert(t.error)
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    if (!confirm(t.deleteConfirm)) return

    try {
      const response = await fetch(`/api/spectators/requests/${requestId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert(t.deleted)
        loadRequests()
      } else {
        alert(t.error)
      }
    } catch (error) {
      console.error('Error deleting request:', error)
      alert(t.error)
    }
  }

  const handleArchiveDay = async (date: Date) => {
    if (!confirm(language === 'fr' 
      ? `Êtes-vous sûr de vouloir archiver toutes les demandes du ${formatDate(date)} ?`
      : `Are you sure you want to archive all requests from ${formatDate(date)}?`)) return

    try {
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      // Trouver tous les matchs de ce jour
      const matchesOfDay = matches.filter(m => {
        const matchDate = new Date(m.date)
        return matchDate >= dayStart && matchDate <= dayEnd
      })

      // Archiver toutes les demandes de ces matchs en les rejetant (ou on peut ajouter un champ archived)
      const requestsToArchive = requests.filter(req => 
        matchesOfDay.some(m => m.id === req.matchId && m.type === req.matchType) &&
        req.status !== 'rejected'
      )

      // Marquer comme rejetées pour les archiver (ou on peut créer une route spécifique pour archiver)
      await Promise.all(
        requestsToArchive.map(req => 
          fetch(`/api/spectators/requests/${req.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'rejected' })
          })
        )
      )

      alert(language === 'fr' ? 'Journée archivée avec succès' : 'Day archived successfully')
      loadRequests()
    } catch (error) {
      console.error('Error archiving day:', error)
      alert(t.error)
    }
  }

  const handleSetLimit = async () => {
    if (!selectedMatch) return

    setUpdatingLimit(true)
    try {
      const response = await fetch('/api/spectators/limits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: selectedMatch.id,
          matchType: selectedMatch.type,
          limit: parseInt(limitValue.toString())
        })
      })

      if (response.ok) {
        setShowLimitModal(false)
        setSelectedMatch(null)
        // Recharger les limites pour tous les matchs à venir
        await reloadLimitsForUpcomingMatches()
        alert(t.limitUpdated)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Error response:', errorData)
        alert(t.error)
      }
    } catch (error) {
      console.error('Error setting limit:', error)
      alert(t.error)
    } finally {
      setUpdatingLimit(false)
    }
  }

  const reloadLimitsForUpcomingMatches = async () => {
    if (upcomingMatchesForLimits.length === 0) {
      console.log('No upcoming matches to load limits for')
      return
    }

    const limitsMap = new Map<string, { limit: number; approved: number; available: number }>()
    
    console.log('Reloading limits for', upcomingMatchesForLimits.length, 'matches')
    
    await Promise.all(
      upcomingMatchesForLimits.map(async (match) => {
        try {
          const matchKey = `${match.type}_${match.id}`
          const [limitRes, allRequestsRes] = await Promise.all([
            fetch(`/api/spectators/limits?matchId=${match.id}&matchType=${match.type}`),
            fetch(`/api/spectators/requests?matchId=${match.id}&matchType=${match.type}`)
          ])

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
                
                limitsMap.set(matchKey, { limit, approved, available, totalActive })
                console.log(`Loaded limit for ${matchKey}:`, { limit, approved, totalActive, available })
              } catch (jsonError) {
                console.error(`Error parsing JSON for match ${matchKey}:`, jsonError)
                limitsMap.set(matchKey, { limit: 100, approved: 0, available: 100 })
              }
            } else {
              limitsMap.set(matchKey, { limit: 100, approved: 0, available: 100 })
            }
          } else {
            console.warn(`Failed to load limit for ${matchKey}:`, limitRes.status, allRequestsRes.status)
            limitsMap.set(matchKey, { limit: 100, approved: 0, available: 100 })
          }
        } catch (error) {
          console.error(`Error loading limit for match ${match.type}_${match.id}:`, error)
          const matchKey = `${match.type}_${match.id}`
          limitsMap.set(matchKey, { limit: 100, approved: 0, available: 100 })
        }
      })
    )
    
    console.log('Updated limits map with', limitsMap.size, 'entries')
    setMatchLimits(limitsMap)
  }

  const handleBulkSetLimit = async () => {
    if (selectedMatchesForBulk.size === 0) {
      alert(language === 'fr' ? 'Veuillez sélectionner au moins un match' : 'Please select at least one match')
      return
    }

    setUpdatingLimit(true)
    try {
      const updates = Array.from(selectedMatchesForBulk).map(matchKey => {
        const [matchType, matchId] = matchKey.split('_')
        return fetch('/api/spectators/limits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            matchId,
            matchType,
            limit: parseInt(bulkLimitValue.toString())
          })
        })
      })

      const results = await Promise.all(updates)
      const allSuccess = results.every(r => r.ok)

      if (allSuccess) {
        setShowBulkLimitModal(false)
        setSelectedMatchesForBulk(new Set())
        setBulkLimitValue(100)
        // Recharger les limites pour tous les matchs à venir
        await reloadLimitsForUpcomingMatches()
        alert(t.bulkLimitUpdated)
      } else {
        alert(t.error)
      }
    } catch (error) {
      console.error('Error setting bulk limits:', error)
      alert(t.error)
    } finally {
      setUpdatingLimit(false)
    }
  }

  const toggleMatchSelection = (matchKey: string) => {
    const newSelection = new Set(selectedMatchesForBulk)
    if (newSelection.has(matchKey)) {
      newSelection.delete(matchKey)
    } else {
      newSelection.add(matchKey)
    }
    setSelectedMatchesForBulk(newSelection)
  }

  const selectAllMatches = () => {
    const allKeys = new Set(upcomingMatchesForLimits.map(m => `${m.type}_${m.id}`))
    setSelectedMatchesForBulk(allKeys)
  }

  const deselectAllMatches = () => {
    setSelectedMatchesForBulk(new Set())
  }

  const getMatchLimit = async (match: Match) => {
    try {
      const response = await fetch(`/api/spectators/limits?matchId=${match.id}&matchType=${match.type}`)
      if (response.ok) {
        const data = await response.json()
        return data.limit || 100
      }
    } catch (error) {
      console.error('Error fetching limit:', error)
    }
    return 100
  }

  const loadAllMatchLimits = async () => {
    const limitsMap = new Map<string, { limit: number; approved: number; available: number }>()
    
    const uniqueMatches = Array.from(new Set(requests.map(r => `${r.matchType}_${r.matchId}`)))
    
    await Promise.all(
      uniqueMatches.map(async (matchKey) => {
        try {
          const [matchType, matchId] = matchKey.split('_')
          const [limitRes, requestsRes] = await Promise.all([
            fetch(`/api/spectators/limits?matchId=${matchId}&matchType=${matchType}`),
            fetch(`/api/spectators/requests?matchId=${matchId}&matchType=${matchType}&status=approved`)
          ])

          if (limitRes.ok && requestsRes.ok) {
            const contentTypeLimit = limitRes.headers.get('content-type')
            const contentTypeRequests = requestsRes.headers.get('content-type')
            
            if (contentTypeLimit?.includes('application/json') && contentTypeRequests?.includes('application/json')) {
              try {
                const limitData = await limitRes.json()
                const approvedRequests = await requestsRes.json()
                
                const limit = limitData.limit || 100
                const approved = Array.isArray(approvedRequests) ? approvedRequests.length : 0
                const available = Math.max(0, limit - approved)
                
                limitsMap.set(matchKey, { limit, approved, available })
              } catch (jsonError) {
                limitsMap.set(matchKey, { limit: 100, approved: 0, available: 100 })
              }
            } else {
              limitsMap.set(matchKey, { limit: 100, approved: 0, available: 100 })
            }
          } else {
            limitsMap.set(matchKey, { limit: 100, approved: 0, available: 100 })
          }
        } catch (error) {
          console.error(`Error loading limit for match ${matchKey}:`, error)
          limitsMap.set(matchKey, { limit: 100, approved: 0, available: 100 })
        }
      })
    )
    
    setMatchLimits(limitsMap)
  }

  const getMatchStats = (matchId: string, matchType: string) => {
    const matchRequests = requests.filter(r => r.matchId === matchId && r.matchType === matchType)
    const matchKey = `${matchType}_${matchId}`
    const limitInfo = matchLimits.get(matchKey) || { limit: 100, approved: 0, available: 100 }
    
    // Calculer les places disponibles en temps réel basé sur toutes les demandes (pending + approved)
    // Le nombre diminue dès qu'une demande est envoyée
    const totalRequests = matchRequests.filter(r => r.status === 'pending' || r.status === 'approved').length
    const approvedCount = matchRequests.filter(r => r.status === 'approved').length
    const available = Math.max(0, limitInfo.limit - totalRequests)
    
    return {
      pending: matchRequests.filter(r => r.status === 'pending').length,
      approved: approvedCount,
      rejected: matchRequests.filter(r => r.status === 'rejected').length,
      total: matchRequests.length,
      limit: limitInfo.limit,
      available: available,
      isFull: available <= 0
    }
  }

  const getOverallStats = () => {
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      checkedIn: requests.filter(r => r.checkedIn).length
    }
  }

  const filteredRequests = requests.filter(req => {
    if (statusFilter !== 'all' && req.status !== statusFilter) return false
    if (matchFilter !== 'all') {
      const [matchType, matchId] = matchFilter.split('_')
      if (req.matchType !== matchType || req.matchId !== matchId) return false
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      const fullName = `${req.firstName} ${req.lastName}`.toLowerCase()
      if (!fullName.includes(query) && 
          !req.email.toLowerCase().includes(query) && 
          !req.phone.includes(query) &&
          !req.teamName.toLowerCase().includes(query)) {
        return false
      }
    }
    return true
  })

  const exportAttendanceCSV = () => {
    if (!selectedMatch || todayRequests.length === 0) return

    const headers = ['Nom', 'Prénom', 'Email', 'Téléphone', 'Équipe', 'Présent', 'Heure de check-in']
    const rows = todayRequests.map(req => [
      req.lastName,
      req.firstName,
      req.email,
      req.phone,
      req.teamName,
      req.checkedIn ? 'Oui' : 'Non',
      req.checkedInAt ? formatDate(req.checkedInAt) : ''
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `presence_${selectedMatch.homeTeam}_vs_${selectedMatch.awayTeam}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const todayRequests = selectedMatch
    ? requests.filter(req => 
        req.matchId === selectedMatch.id && 
        req.matchType === selectedMatch.type &&
        req.status === 'approved'
      )
    : []

  const formatDate = (date: Date | string | any) => {
    // Vérifier si la date existe
    if (!date) {
      return language === 'fr' ? 'Date non disponible' : 'Date not available'
    }
    
    // Convertir en Date si nécessaire
    let dateObj: Date
    if (date instanceof Date) {
      dateObj = date
    } else if (typeof date === 'string') {
      dateObj = new Date(date)
    } else if (date?.toDate && typeof date.toDate === 'function') {
      // Timestamp Firestore
      dateObj = date.toDate()
    } else if (date?.seconds) {
      // Timestamp Firestore avec seconds
      dateObj = new Date(date.seconds * 1000)
    } else {
      dateObj = new Date(date)
    }
    
    // Vérifier que la date est valide
    if (isNaN(dateObj.getTime())) {
      return language === 'fr' ? 'Date invalide' : 'Invalid date'
    }
    
    return new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj)
  }

  const stats = getOverallStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6" />
            {t.title}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/admin/spectators/check-in"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all font-semibold shadow-lg hover:shadow-xl"
          >
            <Camera className="w-5 h-5" />
            {t.goToCheckIn}
          </a>
          <button
            onClick={() => setLanguage(language === 'fr' ? 'en' : 'fr')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">{language === 'fr' ? 'EN' : 'FR'}</span>
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {!attendanceMode && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-5 h-5 opacity-80" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
            <p className="text-sm opacity-90">{language === 'fr' ? 'Total demandes' : 'Total requests'}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-4 text-white shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-5 h-5 opacity-80" />
              <span className="text-2xl font-bold">{stats.pending}</span>
            </div>
            <p className="text-sm opacity-90">{t.pending}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-4 text-white shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="w-5 h-5 opacity-80" />
              <span className="text-2xl font-bold">{stats.approved}</span>
            </div>
            <p className="text-sm opacity-90">{t.approved}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-4 text-white shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <XCircle className="w-5 h-5 opacity-80" />
              <span className="text-2xl font-bold">{stats.rejected}</span>
            </div>
            <p className="text-sm opacity-90">{t.rejected}</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white shadow-lg"
          >
            <div className="flex items-center justify-between mb-2">
              <CheckSquare className="w-5 h-5 opacity-80" />
              <span className="text-2xl font-bold">{stats.checkedIn}</span>
            </div>
            <p className="text-sm opacity-90">{t.checkedIn}</p>
          </motion.div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            setAttendanceMode(false)
            setLimitsMode(false)
          }}
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
            !attendanceMode && !limitsMode
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {language === 'fr' ? 'Demandes' : 'Requests'}
        </button>
        <button
          onClick={() => {
            setAttendanceMode(false)
            setLimitsMode(true)
          }}
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
            limitsMode
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {t.limits}
        </button>
        <button
          onClick={() => {
            setAttendanceMode(true)
            setLimitsMode(false)
          }}
          className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
            attendanceMode
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {t.attendance}
        </button>
      </div>

      {/* Limits Mode */}
      {limitsMode && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {t.setLimits}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {language === 'fr' 
                ? 'Définissez les limites de places disponibles pour chaque match à venir'
                : 'Set the available spots limit for each upcoming match'}
            </p>
            
            {upcomingMatchesForLimits.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {language === 'fr' 
                    ? 'Aucun match à venir pour le moment' 
                    : 'No upcoming matches at the moment'}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  {language === 'fr' 
                    ? 'Les matchs réguliers et preseason apparaîtront ici' 
                    : 'Regular and preseason matches will appear here'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Bulk Actions */}
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={selectAllMatches}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      {t.selectAll}
                    </button>
                    <button
                      onClick={deselectAllMatches}
                      className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                    >
                      {t.deselectAll}
                    </button>
                    {selectedMatchesForBulk.size > 0 && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {selectedMatchesForBulk.size} {t.selectedMatches}
                      </span>
                    )}
                  </div>
                  {selectedMatchesForBulk.size > 0 && (
                    <button
                      onClick={() => {
                        setBulkLimitValue(100)
                        setShowBulkLimitModal(true)
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      {t.bulkSetLimit}
                    </button>
                  )}
                </div>

                {upcomingMatchesForLimits.map((match) => {
                  const matchKey = `${match.type}_${match.id}`
                  const limitInfo = matchLimits.get(matchKey) || { limit: 100, approved: 0, available: 100 }
                  // Calculer en temps réel basé sur toutes les demandes (pending + approved)
                  // Le nombre diminue dès qu'une demande est envoyée
                  const matchRequests = requests.filter(r => r.matchId === match.id && r.matchType === match.type)
                  const totalRequests = matchRequests.filter(r => r.status === 'pending' || r.status === 'approved').length
                  const approvedCount = matchRequests.filter(r => r.status === 'approved').length
                  const realAvailable = Math.max(0, limitInfo.limit - totalRequests)
                  const isSelected = selectedMatchesForBulk.has(matchKey)
                  
                  return (
                    <div
                      key={matchKey}
                      className={`flex items-center gap-3 p-4 border rounded-lg transition ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <button
                        onClick={() => toggleMatchSelection(matchKey)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3 h-3" />}
                      </button>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white">
                          {match.homeTeam} vs {match.awayTeam}
                        </h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(match.date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' }).format(match.date)}
                          </span>
                          {match.venue && (
                            <span className="flex items-center gap-1">
                              <span>📍</span>
                              {match.venue}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-2 flex-wrap">
                          <span className="text-xs px-2 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 font-semibold">
                            {match.type === 'preseason' ? 'Preseason' : 'Regular'}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {language === 'fr' ? 'Limite actuelle' : 'Current limit'}: <strong>{limitInfo.limit}</strong>
                          </span>
                          {approvedCount > 0 && (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              • {approvedCount} {t.approvedCount}
                            </span>
                          )}
                          <span className={`text-sm font-semibold ${
                            realAvailable <= 0 
                              ? 'text-red-600 dark:text-red-400' 
                              : realAvailable <= 5 
                              ? 'text-orange-600 dark:text-orange-400'
                              : 'text-green-600 dark:text-green-400'
                          }`}>
                            {realAvailable} {t.available}
                          </span>
                          {realAvailable <= 0 && (
                            <span className="text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {t.full}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          setSelectedMatch(match)
                          const limit = await getMatchLimit(match)
                          setLimitValue(limit)
                          setShowLimitModal(true)
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        {t.setLimit}
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bulk Limit Modal */}
      {showBulkLimitModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4">{t.bulkSetLimit}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {language === 'fr' 
                ? `${selectedMatchesForBulk.size} match(s) sélectionné(s)`
                : `${selectedMatchesForBulk.size} match(es) selected`}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t.limit} ({t.places})
              </label>
              <input
                type="number"
                min="0"
                value={bulkLimitValue}
                onChange={(e) => setBulkLimitValue(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowBulkLimitModal(false)
                  setBulkLimitValue(100)
                }}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleBulkSetLimit}
                disabled={updatingLimit}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
              >
                {updatingLimit ? t.loading : t.save}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Requests Mode */}
      {!attendanceMode && !limitsMode && (
        <>
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={language === 'fr' ? 'Rechercher par nom, email, téléphone ou équipe...' : 'Search by name, email, phone or team...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t.filterByStatus}
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              >
                <option value="all">{t.all}</option>
                <option value="pending">{t.pending}</option>
                <option value="approved">{t.approved}</option>
                <option value="rejected">{t.rejected}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t.filterByMatch}
              </label>
              <select
                value={matchFilter}
                onChange={(e) => setMatchFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
              >
                <option value="all">{t.all}</option>
                {Array.from(new Set(requests.map(r => `${r.matchType}_${r.matchId}`))).map(matchKey => {
                  const req = requests.find(r => `${r.matchType}_${r.matchId}` === matchKey)
                  return (
                    <option key={matchKey} value={matchKey}>
                      {req?.teamName} - {req?.matchType === 'preseason' ? 'Preseason' : 'Regular'}
                    </option>
                  )
                })}
              </select>
            </div>
          </div>

          {/* Requests List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">{t.noRequests}</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">{t.name}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">{t.email}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">{t.phone}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">{t.match}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">{language === 'fr' ? 'Date/Heure' : 'Date/Time'}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">{language === 'fr' ? 'Places' : 'Spots'}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">{t.status}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredRequests.map((request) => {
                      const matchKey = `${request.matchType}_${request.matchId}`
                      const matchStats = getMatchStats(request.matchId, request.matchType)
                      const matchInfo = allMatches.get(matchKey) || matches.find(m => m.id === request.matchId && m.type === request.matchType)
                      
                      return (
                      <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-medium">
                          {request.firstName} {request.lastName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {request.email}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {request.phone}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-900 dark:text-white font-medium">{request.teamName}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {request.matchType === 'preseason' ? 'Preseason' : 'Regular'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                          {matchInfo ? (
                            <div className="flex flex-col gap-1">
                              <span>{formatDate(matchInfo.date)}</span>
                              <span className="text-xs text-gray-500">{new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' }).format(matchInfo.date)}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            {matchStats.isFull ? (
                              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full text-xs font-semibold flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {t.full}
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold">
                                {matchStats.available} {t.available}
                              </span>
                            )}
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              / {matchStats.limit}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            request.status === 'approved'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                              : request.status === 'rejected'
                              ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                          }`}>
                            {request.status === 'approved' ? t.approved : request.status === 'rejected' ? t.rejected : t.pending}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedRequest(request)
                                setShowDetailsModal(true)
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                              title={t.viewDetails}
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            {request.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleStatusUpdate(request.id, 'approved')}
                                  className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition"
                                  title={t.approve}
                                >
                                  <CheckCircle2 className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(request.id, 'rejected')}
                                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                  title={t.reject}
                                >
                                  <XCircle className="w-5 h-5" />
                                </button>
                              </>
                            )}
                            <button
                              onClick={async () => {
                                // Trouver le match correspondant
                                const matchKey = `${request.matchType}_${request.matchId}`
                                const matchRequests = requests.filter(r => 
                                  r.matchId === request.matchId && r.matchType === request.matchType
                                )
                                
                                // Créer un objet match temporaire pour le modal
                                const tempMatch: Match = {
                                  id: request.matchId,
                                  type: request.matchType,
                                  homeTeam: request.teamName,
                                  awayTeam: '',
                                  date: new Date(),
                                  venue: ''
                                }
                                
                                setSelectedMatch(tempMatch)
                                const limit = await getMatchLimit(tempMatch)
                                setLimitValue(limit)
                                setShowLimitModal(true)
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
                              title={t.setLimit}
                            >
                              <Settings className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteRequest(request.id)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                              title={t.delete}
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Attendance Mode */}
      {attendanceMode && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t.selectMatch} ({t.today})
            </label>
            <select
              value={selectedMatch ? `${selectedMatch.type}_${selectedMatch.id}` : ''}
              onChange={(e) => {
                if (e.target.value) {
                  const [matchType, matchId] = e.target.value.split('_')
                  const match = matches.find(m => m.id === matchId && m.type === matchType)
                  setSelectedMatch(match || null)
                } else {
                  setSelectedMatch(null)
                }
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
            >
              <option value="">{t.selectMatch}</option>
              {matches.map((match) => (
                <option key={`${match.type}_${match.id}`} value={`${match.type}_${match.id}`}>
                  {match.homeTeam} vs {match.awayTeam} - {formatDate(match.date)}
                </option>
              ))}
            </select>
          </div>

          {matches.length === 0 && (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">{t.noMatchesToday}</p>
            </div>
          )}

          {selectedMatch && todayRequests.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-bold mb-2">
                  {selectedMatch.homeTeam} vs {selectedMatch.awayTeam}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formatDate(selectedMatch.date)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleArchiveDay(selectedMatch.date)}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  <Archive className="w-4 h-4" />
                  <span>{t.archiveDay}</span>
                </button>
                <button
                  onClick={exportAttendanceCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>{language === 'fr' ? 'Exporter CSV' : 'Export CSV'}</span>
                </button>
              </div>
            </div>
              <div className="space-y-2">
                {todayRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleCheckIn(request.id, !request.checkedIn)}
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition ${
                          request.checkedIn
                            ? 'bg-green-600 border-green-600 text-white'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {request.checkedIn && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {request.firstName} {request.lastName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {request.email} • {request.phone}
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${
                      request.checkedIn
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-400'
                    }`}>
                      {request.checkedIn ? t.checkedIn : t.notCheckedIn}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedMatch && todayRequests.length === 0 && (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                {language === 'fr' ? 'Aucun spectateur approuvé pour ce match' : 'No approved spectators for this match'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Limit Modal */}
      {showLimitModal && selectedMatch && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4">{t.setLimit}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {selectedMatch.homeTeam} vs {selectedMatch.awayTeam}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {t.limit} ({t.places})
              </label>
              <input
                type="number"
                min="0"
                value={limitValue}
                onChange={(e) => setLimitValue(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLimitModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSetLimit}
                disabled={updatingLimit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {updatingLimit ? t.loading : t.save}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailsModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold">{t.requestDetails}</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Photo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {language === 'fr' ? 'Photo de profil' : 'Profile Photo'}
                </label>
                {selectedRequest.photoUrl ? (
                  <div className="flex justify-center">
                    <img 
                      src={selectedRequest.photoUrl} 
                      alt={`${selectedRequest.firstName} ${selectedRequest.lastName}`}
                      className="w-48 h-48 object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-48 h-48 bg-gray-100 dark:bg-gray-700 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t.noPhoto}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Informations personnelles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t.name}
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {selectedRequest.firstName} {selectedRequest.lastName}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t.email}
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{selectedRequest.email}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t.phone}
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{selectedRequest.phone}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t.team}
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Users className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">{selectedRequest.teamName}</span>
                  </div>
                </div>
              </div>

              {/* Informations du match */}
              {(() => {
                const matchKey = `${selectedRequest.matchType}_${selectedRequest.matchId}`
                const matchInfo = allMatches.get(matchKey) || matches.find(m => m.id === selectedRequest.matchId && m.type === selectedRequest.matchType)
                return matchInfo ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      {t.match}
                    </label>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-white font-medium">
                          {matchInfo.homeTeam} vs {matchInfo.awayTeam}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(matchInfo.date)}</span>
                        <span className="ml-2">
                          {new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }).format(matchInfo.date)}
                        </span>
                      </div>
                      {matchInfo.venue && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          📍 {matchInfo.venue}
                        </div>
                      )}
                    </div>
                  </div>
                ) : null
              })()}

              {/* Statut et dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t.status}
                  </label>
                  <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedRequest.status === 'approved'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : selectedRequest.status === 'rejected'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {selectedRequest.status === 'approved' ? t.approved : selectedRequest.status === 'rejected' ? t.rejected : t.pending}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    {t.submittedAt}
                  </label>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {(() => {
                        if (!selectedRequest.createdAt) {
                          return language === 'fr' ? 'Date non disponible' : 'Date not available'
                        }
                        
                        // Convertir createdAt en Date si nécessaire
                        let dateObj: Date
                        if (selectedRequest.createdAt instanceof Date) {
                          dateObj = selectedRequest.createdAt
                        } else if (typeof selectedRequest.createdAt === 'string') {
                          dateObj = new Date(selectedRequest.createdAt)
                        } else if (selectedRequest.createdAt?.toDate && typeof selectedRequest.createdAt.toDate === 'function') {
                          dateObj = selectedRequest.createdAt.toDate()
                        } else if (selectedRequest.createdAt?.seconds) {
                          dateObj = new Date(selectedRequest.createdAt.seconds * 1000)
                        } else {
                          dateObj = new Date(selectedRequest.createdAt)
                        }
                        
                        if (isNaN(dateObj.getTime())) {
                          return language === 'fr' ? 'Date invalide' : 'Invalid date'
                        }
                        
                        const dateStr = formatDate(dateObj)
                        const timeStr = new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        }).format(dateObj)
                        
                        return `${dateStr} à ${timeStr}`
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedRequest.id, 'approved')
                      setShowDetailsModal(false)
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    {t.approve}
                  </button>
                  <button
                    onClick={() => {
                      handleStatusUpdate(selectedRequest.id, 'rejected')
                      setShowDetailsModal(false)
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" />
                    {t.reject}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
