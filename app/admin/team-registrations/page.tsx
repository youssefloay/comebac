"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useRouter } from 'next/navigation'
import { collection, query, where, getDocs, doc, getDoc, updateDoc, addDoc, deleteDoc, serverTimestamp, orderBy } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Check, X, Eye, Users, Clock, CheckCircle, XCircle, Link as LinkIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { capitalizeWords } from '@/lib/text-utils'

interface Player {
  firstName: string
  lastName: string
  nickname?: string
  email: string
  phone: string
  birthDate?: string
  age?: number
  height: number
  tshirtSize?: string
  position: string
  foot: string
  jerseyNumber: number
  grade?: string
}

interface Registration {
  id: string
  teamName: string
  schoolName?: string
  teamGrade?: string
  coach?: {
    firstName: string
    lastName: string
    birthDate: string
    email: string
    phone: string
  }
  captain: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  players: Player[]
  status: 'pending' | 'approved' | 'rejected' | 'pending_players' | 'pending_validation'
  registrationMode?: 'collaborative' | 'complete'
  inviteToken?: string
  isWaitingList?: boolean
  submittedAt: any
  createdAt?: any
  processedAt?: any
  processedBy?: string
  adminNotifiedAt10PlayersAt?: string
}

export default function TeamRegistrationsPage() {
  const { user, loading: authLoading, isAdmin } = useAuth()
  const router = useRouter()
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editedRegistration, setEditedRegistration] = useState<Registration | null>(null)
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'waiting-list'>('pending')
  const [activeTab, setActiveTab] = useState<'registrations' | 'waiting-list'>('registrations')

  // Vérifier les paramètres URL pour les actions depuis l'email
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    const error = params.get('error')
    const registrationId = params.get('registrationId')
    const teamName = params.get('teamName')

    if (success) {
      if (success === 'marked_for_validation') {
        setMessage({ type: 'success', text: `✅ Équipe marquée pour validation. Veuillez finaliser l'approbation ci-dessous.` })
        if (registrationId) {
          // Sélectionner automatiquement l'inscription
          const registration = registrations.find(r => r.id === registrationId)
          if (registration) {
            setSelectedRegistration(registration)
          }
        }
      } else if (success === 'rejected') {
        setMessage({ type: 'success', text: `✅ Équipe rejetée avec succès.` })
      } else if (success === 'already_approved') {
        setMessage({ type: 'success', text: `ℹ️ L'équipe "${teamName || ''}" est déjà approuvée.` })
      } else if (success === 'already_rejected') {
        setMessage({ type: 'success', text: `ℹ️ L'équipe "${teamName || ''}" est déjà rejetée.` })
      }
      // Nettoyer l'URL
      window.history.replaceState({}, '', '/admin/team-registrations')
    }

    if (error) {
      let errorMessage = 'Une erreur est survenue'
      if (error === 'missing_params') {
        errorMessage = 'Paramètres manquants dans l\'URL'
      } else if (error === 'invalid_action') {
        errorMessage = 'Action invalide'
      } else if (error === 'not_found') {
        errorMessage = 'Inscription non trouvée'
      } else {
        errorMessage = decodeURIComponent(error)
      }
      setMessage({ type: 'error', text: `❌ ${errorMessage}` })
      // Nettoyer l'URL
      window.history.replaceState({}, '', '/admin/team-registrations')
    }
  }, [registrations])

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

  // Helper function pour formater les dates/heures
  const formatDateTime = (dateValue: any): string => {
    if (!dateValue) return 'N/A'
    
    try {
      let date: Date | null = null
      
      // Si c'est un objet Firestore Timestamp avec méthode toDate()
      if (typeof dateValue === 'object' && typeof dateValue.toDate === 'function') {
        date = dateValue.toDate()
      }
      // Si c'est un objet Firestore Timestamp avec _seconds (sérialisé)
      else if (typeof dateValue === 'object' && '_seconds' in dateValue) {
        const timestamp = dateValue._seconds * 1000 + (dateValue._nanoseconds || 0) / 1000000
        date = new Date(timestamp)
      }
      // Si c'est une string ISO
      else if (typeof dateValue === 'string') {
        date = new Date(dateValue)
      }
      // Si c'est déjà une Date
      else if (dateValue instanceof Date) {
        date = dateValue
      }
      
      if (date && !isNaN(date.getTime())) {
        return date.toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
      
      return 'N/A'
    } catch (error) {
      console.error('Erreur formatage date:', error)
      return 'N/A'
    }
  }

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

  const saveEdits = async () => {
    if (!editedRegistration) return

    setProcessing(true)
    setMessage(null)

    try {
      // 1. Mettre à jour l'inscription
      await updateDoc(doc(db, 'teamRegistrations', editedRegistration.id), {
        teamName: editedRegistration.teamName,
        schoolName: editedRegistration.schoolName,
        teamGrade: editedRegistration.teamGrade,
        captain: editedRegistration.captain,
        players: editedRegistration.players,
        coach: editedRegistration.coach || null
      })

      // 2. Si l'équipe est approuvée, mettre à jour aussi l'équipe et les joueurs dans la DB
      if (editedRegistration.status === 'approved') {
        // Trouver l'équipe
        const teamsSnap = await getDocs(collection(db, 'teams'))
        const teamDoc = teamsSnap.docs.find(doc => doc.data().name === selectedRegistration?.teamName)
        
        if (teamDoc) {
          // Mettre à jour le nom de l'équipe
          const teamUpdateData: any = {
            name: capitalizeWords(editedRegistration.teamName),
            schoolName: capitalizeWords(editedRegistration.schoolName),
            teamGrade: editedRegistration.teamGrade,
            captain: editedRegistration.captain
          }
          
          // Ajouter ou mettre à jour l'entraîneur
          if (editedRegistration.coach && editedRegistration.coach.firstName && editedRegistration.coach.lastName && editedRegistration.coach.email) {
            teamUpdateData.coach = {
              firstName: capitalizeWords(editedRegistration.coach.firstName),
              lastName: capitalizeWords(editedRegistration.coach.lastName),
              email: editedRegistration.coach.email,
              phone: editedRegistration.coach.phone || '',
              birthDate: editedRegistration.coach.birthDate || ''
            }

            // Créer le compte entraîneur s'il n'existe pas déjà
            try {
              const coachQuery = query(
                collection(db, 'coachAccounts'),
                where('email', '==', editedRegistration.coach.email)
              )
              const coachSnap = await getDocs(coachQuery)

              if (coachSnap.empty) {
                // Créer le compte dans coachAccounts
                await addDoc(collection(db, 'coachAccounts'), {
                  email: editedRegistration.coach.email,
                  firstName: editedRegistration.coach.firstName,
                  lastName: editedRegistration.coach.lastName,
                  phone: editedRegistration.coach.phone || '',
                  birthDate: editedRegistration.coach.birthDate || '',
                  teamId: teamDoc.id,
                  teamName: editedRegistration.teamName,
                  photo: '',
                  createdAt: serverTimestamp(),
                  updatedAt: serverTimestamp()
                })

                // Créer le compte Firebase Auth et envoyer l'email
                await fetch('/api/admin/create-coach-account', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: editedRegistration.coach.email,
                    firstName: editedRegistration.coach.firstName,
                    lastName: editedRegistration.coach.lastName,
                    teamName: editedRegistration.teamName
                  })
                })
              }
            } catch (coachError) {
              console.error('Erreur lors de la création du compte entraîneur:', coachError)
            }
          }
          
          // Mettre à jour aussi les joueurs dans l'équipe pour synchroniser le nickname
          const currentTeamData = teamDoc.data()
          if (currentTeamData.players && Array.isArray(currentTeamData.players)) {
            const updatedTeamPlayers = currentTeamData.players.map((teamPlayer: any) => {
              const matchingPlayer = editedRegistration.players.find((p: any) => p.email === teamPlayer.email)
              if (matchingPlayer) {
                return {
                  ...teamPlayer,
                  nickname: matchingPlayer.nickname || '',
                  firstName: matchingPlayer.firstName,
                  lastName: matchingPlayer.lastName
                }
              }
              return teamPlayer
            })
            teamUpdateData.players = updatedTeamPlayers
          }

          await updateDoc(doc(db, 'teams', teamDoc.id), teamUpdateData)

          // Récupérer les joueurs existants de cette équipe
          const playersSnap = await getDocs(collection(db, 'players'))
          const existingPlayers = playersSnap.docs.filter(doc => doc.data().teamId === teamDoc.id)

          // Mettre à jour ou créer les joueurs
          for (let i = 0; i < editedRegistration.players.length; i++) {
            const player = editedRegistration.players[i]
            const existingPlayer = existingPlayers[i]

            const playerData: any = {
              name: `${player.firstName} ${player.lastName}`,
              number: player.jerseyNumber,
              position: player.position,
              teamId: teamDoc.id,
              nationality: 'Égypte',
              isCaptain: i === 0, // Le premier joueur est le capitaine
              email: player.email,
              phone: player.phone,
              firstName: player.firstName,
              lastName: player.lastName,
              nickname: player.nickname || '',
              birthDate: player.birthDate || '',
              height: player.height || 0,
              tshirtSize: player.tshirtSize || 'M',
              strongFoot: player.foot === 'Droitier' ? 'Droit' : player.foot === 'Gaucher' ? 'Gauche' : 'Ambidextre',
              grade: player.grade || editedRegistration.teamGrade,
              school: editedRegistration.schoolName,
              updatedAt: serverTimestamp()
            }

            if (player.age && player.age > 0) {
              playerData.age = player.age
            }

            if (existingPlayer) {
              // Mettre à jour le joueur existant
              await updateDoc(doc(db, 'players', existingPlayer.id), playerData)
            } else {
              // Créer un nouveau joueur
              await addDoc(collection(db, 'players'), {
                ...playerData,
                overall: 75,
                seasonStats: {
                  goals: 0,
                  assists: 0,
                  matches: 0,
                  yellowCards: 0,
                  redCards: 0
                },
                createdAt: serverTimestamp()
              })
            }
          }

          // Supprimer les joueurs en trop si on en a retiré
          if (existingPlayers.length > editedRegistration.players.length) {
            for (let i = editedRegistration.players.length; i < existingPlayers.length; i++) {
              await deleteDoc(doc(db, 'players', existingPlayers[i].id))
            }
          }

          // Mettre à jour les comptes joueurs (playerAccounts)
          const playerAccountsSnap = await getDocs(collection(db, 'playerAccounts'))
          const existingAccounts = playerAccountsSnap.docs.filter(doc => doc.data().teamId === teamDoc.id)

          for (let i = 0; i < editedRegistration.players.length; i++) {
            const player = editedRegistration.players[i]
            const existingAccount = existingAccounts.find(acc => acc.data().email === player.email)

            const accountData = {
              firstName: player.firstName,
              lastName: player.lastName,
              nickname: player.nickname || '',
              email: player.email,
              phone: player.phone,
              position: player.position,
              jerseyNumber: player.jerseyNumber,
              teamId: teamDoc.id,
              teamName: editedRegistration.teamName,
              birthDate: player.birthDate || '',
              height: player.height || 0,
              tshirtSize: player.tshirtSize || 'M',
              foot: player.foot,
              grade: player.grade || editedRegistration.teamGrade
            }

            if (existingAccount) {
              await updateDoc(doc(db, 'playerAccounts', existingAccount.id), accountData)
            } else {
              // Créer le nouveau compte joueur et envoyer l'email
              try {
                await fetch('/api/admin/create-player-accounts', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    teamId: teamDoc.id,
                    players: [player]
                  })
                })
                console.log(`✅ Compte créé et email envoyé pour ${player.firstName} ${player.lastName}`)
              } catch (error) {
                console.error(`❌ Erreur création compte pour ${player.firstName}:`, error)
              }
            }
          }

          // Gérer l'entraîneur si ajouté/modifié
          if (editedRegistration.coach && editedRegistration.coach.email && editedRegistration.coach.firstName && editedRegistration.coach.lastName) {
            // Vérifier si l'entraîneur existe déjà dans les joueurs
            const coachPlayerExists = playersSnap.docs.find(doc => 
              doc.data().teamId === teamDoc.id && 
              doc.data().isCoach === true
            )

            if (!coachPlayerExists) {
              // Créer le joueur entraîneur
              await addDoc(collection(db, 'players'), {
                name: `${editedRegistration.coach.firstName} ${editedRegistration.coach.lastName}`,
                number: 0,
                position: 'Entraîneur',
                teamId: teamDoc.id,
                nationality: 'Égypte',
                isCoach: true,
                email: editedRegistration.coach.email,
                phone: editedRegistration.coach.phone,
                firstName: editedRegistration.coach.firstName,
                lastName: editedRegistration.coach.lastName,
                birthDate: editedRegistration.coach.birthDate || '',
                overall: 0,
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

              // Créer le compte pour l'entraîneur
              try {
                const coachAccountResponse = await fetch('/api/admin/create-player-accounts', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    teamId: teamDoc.id,
                    players: [{
                      firstName: editedRegistration.coach.firstName,
                      lastName: editedRegistration.coach.lastName,
                      email: editedRegistration.coach.email,
                      phone: editedRegistration.coach.phone,
                      position: 'Entraîneur',
                      jerseyNumber: 0,
                      height: 0,
                      foot: 'Droitier',
                      grade: editedRegistration.teamGrade
                    }]
                  })
                })

                if (coachAccountResponse.ok) {
                  console.log('✅ Compte entraîneur créé avec succès')
                }
              } catch (coachError) {
                console.error('Erreur lors de la création du compte entraîneur:', coachError)
              }
            } else {
              // Mettre à jour l'entraîneur existant
              try {
                // Vérifier que le document existe toujours
                const coachDocRef = doc(db, 'players', coachPlayerExists.id)
                const coachDocSnap = await getDoc(coachDocRef)
                
                if (coachDocSnap.exists()) {
                  await updateDoc(coachDocRef, {
                    name: `${editedRegistration.coach.firstName} ${editedRegistration.coach.lastName}`,
                    email: editedRegistration.coach.email,
                    phone: editedRegistration.coach.phone,
                    firstName: editedRegistration.coach.firstName,
                    lastName: editedRegistration.coach.lastName,
                    birthDate: editedRegistration.coach.birthDate || '',
                    updatedAt: serverTimestamp()
                  })
                } else {
                  // Le document n'existe plus, le recréer
                  await addDoc(collection(db, 'players'), {
                    name: `${editedRegistration.coach.firstName} ${editedRegistration.coach.lastName}`,
                    number: 0,
                    position: 'Entraîneur',
                    teamId: teamDoc.id,
                    nationality: 'Égypte',
                    isCoach: true,
                    email: editedRegistration.coach.email,
                    phone: editedRegistration.coach.phone,
                    firstName: editedRegistration.coach.firstName,
                    lastName: editedRegistration.coach.lastName,
                    birthDate: editedRegistration.coach.birthDate || '',
                    overall: 0,
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
                }
              } catch (updateError) {
                console.error('Erreur lors de la mise à jour de l\'entraîneur:', updateError)
              }

              // Mettre à jour le compte
              const coachAccount = existingAccounts.find(acc => acc.data().email === editedRegistration.coach!.email)
              if (coachAccount) {
                try {
                  await updateDoc(doc(db, 'playerAccounts', coachAccount.id), {
                    firstName: editedRegistration.coach.firstName,
                    lastName: editedRegistration.coach.lastName,
                    email: editedRegistration.coach.email,
                    phone: editedRegistration.coach.phone,
                    birthDate: editedRegistration.coach.birthDate || ''
                  })
                } catch (accountError) {
                  console.error('Erreur lors de la mise à jour du compte:', accountError)
                }
              }
            }
          }
        }
      }

      setMessage({ type: 'success', text: 'Modifications sauvegardées!' })
      setEditMode(false)
      setSelectedRegistration(editedRegistration)
      loadRegistrations()
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' })
    } finally {
      setProcessing(false)
    }
  }

  const startEdit = () => {
    if (selectedRegistration) {
      setEditedRegistration(JSON.parse(JSON.stringify(selectedRegistration)))
      setEditMode(true)
    }
  }

  const cancelEdit = () => {
    setEditMode(false)
    setEditedRegistration(null)
  }

  const addPlayer = () => {
    if (!editedRegistration) return
    
    const newPlayer: Player = {
      firstName: '',
      lastName: '',
      nickname: '',
      email: '',
      phone: '',
      height: 170,
      position: 'Milieu',
      foot: 'Droitier',
      jerseyNumber: 1,
      grade: editedRegistration.teamGrade || '1ère'
    }
    
    setEditedRegistration({
      ...editedRegistration,
      players: [...editedRegistration.players, newPlayer]
    })
  }

  const removePlayer = (index: number) => {
    if (!editedRegistration) return
    
    // Permettre de descendre jusqu'à 6 joueurs minimum
    if (editedRegistration.players.length <= 6) {
      if (!confirm('⚠️ L\'équipe aura moins de 7 joueurs. Continuer quand même ?')) {
        return
      }
    }
    
    const newPlayers = editedRegistration.players.filter((_, i) => i !== index)
    setEditedRegistration({
      ...editedRegistration,
      players: newPlayers
    })
  }

  const resendEmails = async (registration: Registration) => {
    if (!confirm(`Renvoyer les emails de création de mot de passe à tous les joueurs de "${registration.teamName}" ?`)) return

    setProcessing(true)
    setMessage(null)

    try {
      // Trouver l'équipe créée pour cette inscription
      const teamsSnap = await getDocs(collection(db, 'teams'))
      const team = teamsSnap.docs.find(doc => doc.data().name === registration.teamName)
      
      if (!team) {
        setMessage({ type: 'error', text: 'Équipe non trouvée' })
        return
      }

      const response = await fetch('/api/admin/resend-player-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamId: team.id })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: data.message })
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors du renvoi' })
      }
    } catch (error) {
      console.error('Erreur:', error)
      setMessage({ type: 'error', text: 'Erreur lors du renvoi des emails' })
    } finally {
      setProcessing(false)
    }
  }

  const resendPlayerEmail = async (player: Player, teamName: string) => {
    if (!confirm(`Renvoyer l'email de création de mot de passe à ${player.firstName} ${player.lastName} ?`)) return

    setProcessing(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/resend-player-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerEmail: player.email,
          playerName: `${player.firstName} ${player.lastName}`,
          teamName: teamName
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: data.message })
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors du renvoi' })
      }
    } catch (error) {
      console.error('Erreur:', error)
      setMessage({ type: 'error', text: 'Erreur lors du renvoi de l\'email' })
    } finally {
      setProcessing(false)
    }
  }

  const approveRegistration = async (registration: Registration) => {
    // Vérifier le nombre de joueurs
    const playerCount = registration.players.length
    let confirmMessage = `Approuver l'équipe "${registration.teamName}" avec ${playerCount} joueur(s) ?\n\nCela va créer automatiquement des comptes joueurs et envoyer des emails pour créer leur mot de passe.`
    
    if (playerCount < 7) {
      confirmMessage = `⚠️ ATTENTION: L'équipe "${registration.teamName}" n'a que ${playerCount} joueur(s) (minimum recommandé: 7).\n\nVoulez-vous quand même approuver cette équipe ?\n\nDes comptes seront créés et des emails envoyés.`
    }
    
    if (!confirm(confirmMessage)) return

    setProcessing(true)
    setMessage(null)

    try {
      // 1. Créer l'équipe
      const teamData: any = {
        name: registration.teamName,
        schoolName: registration.schoolName,
        teamGrade: registration.teamGrade,
        createdAt: serverTimestamp(),
        captain: registration.captain
      }
      
      // Ajouter l'entraîneur si présent
      if (registration.coach) {
        teamData.coach = registration.coach
      }
      
      const teamRef = await addDoc(collection(db, 'teams'), teamData)

      // 2. Créer les joueurs avec le format attendu par le système
      const playerPromises = registration.players.map((player, index) => {
        const playerData: any = {
          name: `${player.firstName} ${player.lastName}`,
          number: player.jerseyNumber,
          position: player.position,
          teamId: teamRef.id,
          nationality: 'Égypte',
          isCaptain: index === 0, // Le premier joueur est le capitaine
          // Informations du formulaire d'inscription
          email: player.email,
          phone: player.phone,
          firstName: player.firstName,
          lastName: player.lastName,
          nickname: player.nickname || '',
          birthDate: player.birthDate || '',
          height: player.height || 0,
          tshirtSize: player.tshirtSize || 'M',
          strongFoot: player.foot === 'Droitier' ? 'Droit' : player.foot === 'Gaucher' ? 'Gauche' : 'Ambidextre',
          grade: player.grade || registration.teamGrade,
          school: registration.schoolName,
        }
        
        // N'ajouter age que s'il existe et est valide
        if (player.age && player.age > 0) {
          playerData.age = player.age
        }
        
        return addDoc(collection(db, 'players'), {
          ...playerData,
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
      })
      await Promise.all(playerPromises)

      // 3. Créer les comptes joueurs et envoyer les emails
      try {
        const accountsResponse = await fetch('/api/admin/create-player-accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teamId: teamRef.id,
            players: registration.players
          })
        })
        
        const accountsData = await accountsResponse.json()
        
        if (accountsData.errors && accountsData.errors.length > 0) {
          console.warn('Certains comptes n\'ont pas pu être créés:', accountsData.errors)
        }
      } catch (accountError) {
        console.error('Erreur lors de la création des comptes:', accountError)
        // On continue même si la création des comptes échoue
      }

      // 3.5. Créer le compte entraîneur si présent
      if (registration.coach && registration.coach.email) {
        try {
          // Créer le compte entraîneur dans coachAccounts
          await addDoc(collection(db, 'coachAccounts'), {
            email: registration.coach.email,
            firstName: registration.coach.firstName,
            lastName: registration.coach.lastName,
            phone: registration.coach.phone,
            birthDate: registration.coach.birthDate || '',
            teamId: teamRef.id,
            teamName: registration.teamName,
            photo: '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          })

          // Créer le compte Firebase Auth et envoyer l'email
          const coachAccountResponse = await fetch('/api/admin/create-coach-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: registration.coach.email,
              firstName: registration.coach.firstName,
              lastName: registration.coach.lastName,
              teamName: registration.teamName
            })
          })

          if (coachAccountResponse.ok) {
            console.log('✅ Compte entraîneur créé avec succès')
          } else {
            console.error('❌ Erreur lors de la création du compte entraîneur')
          }
        } catch (coachError) {
          console.error('Erreur lors de la création du compte entraîneur:', coachError)
          // On continue même si la création du compte entraîneur échoue
        }
      }

      // 4. Initialiser les statistiques de l'équipe
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

      // 5. Mettre à jour le statut de l'inscription
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

  const generateUpdateLink = async (registration: Registration) => {
    try {
      const res = await fetch('/api/admin/generate-update-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: registration.id })
      })

      if (res.ok) {
        const data = await res.json()
        // Copier le lien dans le presse-papier
        await navigator.clipboard.writeText(data.updateLink)
        alert(`✅ Lien copié dans le presse-papier!\n\n${data.updateLink}\n\n📧 Envoyez ce lien au capitaine (${registration.captain.email}) pour qu'il puisse mettre à jour toutes les informations de l'équipe.\n\n♾️ Le lien n'expire jamais et peut être utilisé plusieurs fois.\n🔒 Vous pouvez le désactiver manuellement à tout moment.`)
        loadRegistrations() // Recharger pour voir le statut du lien
      } else {
        alert('❌ Erreur lors de la génération du lien')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('❌ Erreur de connexion')
    }
  }

  const disableUpdateLink = async (registration: Registration) => {
    if (!confirm(`Désactiver le lien de mise à jour pour "${registration.teamName}"?\n\nLe capitaine ne pourra plus modifier les informations.`)) return

    try {
      const res = await fetch('/api/admin/generate-update-link', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrationId: registration.id })
      })

      if (res.ok) {
        alert('✅ Lien désactivé avec succès')
        loadRegistrations()
      } else {
        alert('❌ Erreur lors de la désactivation du lien')
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('❌ Erreur de connexion')
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

  const filteredRegistrations = registrations.filter(reg => {
    if (filter === 'all') return true
    if (filter === 'waiting-list') return reg.isWaitingList === true
    if (filter === 'pending') return (reg.status === 'pending' || reg.status === 'pending_players' || reg.status === 'pending_validation') && !reg.isWaitingList
    return reg.status === filter
  })

  const stats = {
    pending: registrations.filter(r => (r.status === 'pending' || r.status === 'pending_players' || r.status === 'pending_validation') && !r.isWaitingList).length,
    approved: registrations.filter(r => r.status === 'approved').length,
    rejected: registrations.filter(r => r.status === 'rejected').length,
    waitingList: registrations.filter(r => r.isWaitingList === true).length
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

        {/* Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('registrations')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors border-b-2 ${
                  activeTab === 'registrations'
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Users className="w-5 h-5" />
                  Inscriptions
                </div>
              </button>
              <button
                onClick={() => setActiveTab('waiting-list')}
                className={`flex-1 px-6 py-4 text-center font-medium transition-colors border-b-2 ${
                  activeTab === 'waiting-list'
                    ? 'border-amber-600 text-amber-600 bg-amber-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Clock className="w-5 h-5" />
                  Waiting List
                </div>
              </button>
            </nav>
          </div>
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

        {/* Waiting List Tab Content */}
        {activeTab === 'waiting-list' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <WaitingListContent />
          </div>
        )}

        {/* Registrations Tab Content */}
        {activeTab === 'registrations' && (
          <>
            {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Waiting List</p>
                <p className="text-3xl font-bold text-amber-600">{stats.waitingList}</p>
              </div>
              <Clock className="w-12 h-12 text-amber-600 opacity-20" />
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
            <button
              onClick={() => setFilter('waiting-list')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'waiting-list' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              ⏳ Waiting List ({stats.waitingList})
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
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-bold text-gray-900">{registration.teamName}</h3>
                      {registration.registrationMode === 'collaborative' && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold flex items-center gap-1">
                          <LinkIcon className="w-3 h-3" />
                          Collaboratif
                        </span>
                      )}
                    </div>
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
                    registration.status === 'pending' || registration.status === 'pending_players' || registration.status === 'pending_validation' ? 'bg-orange-100 text-orange-800' :
                    registration.status === 'approved' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {registration.status === 'pending' || registration.status === 'pending_players' || registration.status === 'pending_validation' ? 'En attente' :
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
                  
                  {/* Lien collaboratif */}
                  {registration.registrationMode === 'collaborative' && registration.inviteToken && (
                    <div className="mt-2">
                      <button
                        onClick={async (e) => {
                          e.stopPropagation()
                          const link = `${window.location.origin}/team-registration/${registration.inviteToken}/status`
                          await navigator.clipboard.writeText(link)
                          alert(`✅ Lien collaboratif copié!\n\n${link}`)
                        }}
                        className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full hover:bg-green-200 transition"
                      >
                        🔗 Copier lien collaboratif
                      </button>
                    </div>
                  )}
                  
                  {(registration as any).updateToken && (registration as any).updateTokenActive && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        🔗 Lien actif
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          disableUpdateLink(registration)
                        }}
                        className="text-xs text-red-600 hover:text-red-700 underline"
                      >
                        Désactiver
                      </button>
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500 mb-4 space-y-1">
                  {registration.registrationMode === 'collaborative' ? (
                    <>
                      <p className="text-blue-600 font-semibold">
                        🔗 Lien collaboratif créé le : {formatDateTime(registration.submittedAt || registration.createdAt)}
                      </p>
                      {registration.players.length >= 10 && registration.adminNotifiedAt10PlayersAt && (
                        <p className="text-green-600 font-medium">
                          ✅ 10 joueurs atteints le : {formatDateTime(registration.adminNotifiedAt10PlayersAt)}
                        </p>
                      )}
                      {registration.players.length < 10 && (
                        <p className="text-orange-600">
                          ⏳ En attente de {10 - registration.players.length} joueur{10 - registration.players.length > 1 ? 's' : ''} supplémentaire{10 - registration.players.length > 1 ? 's' : ''}
                        </p>
                      )}
                    </>
                  ) : (
                    <p>
                      📅 Inscrit le : {formatDateTime(registration.submittedAt || registration.createdAt)}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedRegistration(registration)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    <Eye className="w-4 h-4" />
                    Détails
                  </button>
                  
                  {(registration.status === 'pending' || registration.status === 'pending_players' || registration.status === 'pending_validation') && (
                    <>
                      <button
                        onClick={() => generateUpdateLink(registration)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                        title="Générer un lien pour que le capitaine mette à jour les infos"
                      >
                        <LinkIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => approveRegistration(registration)}
                        disabled={processing}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition"
                        title="Approuver l'équipe"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => rejectRegistration(registration)}
                        disabled={processing}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition"
                        title="Rejeter l'équipe"
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
                  {editMode && editedRegistration ? (
                    <>
                      <input
                        type="text"
                        value={editedRegistration.teamName}
                        onChange={(e) => setEditedRegistration({...editedRegistration, teamName: e.target.value})}
                        className="text-2xl font-bold text-gray-900 bg-white border-b-2 border-blue-600 mb-2 w-full px-2 py-1"
                      />
                      <input
                        type="text"
                        value={editedRegistration.schoolName || ''}
                        onChange={(e) => setEditedRegistration({...editedRegistration, schoolName: e.target.value})}
                        className="text-sm text-gray-900 bg-white font-medium border-b border-blue-300 mb-1 w-full px-2 py-1"
                        placeholder="École"
                      />
                      <div className="space-y-2">
                        <select
                          value={editedRegistration.teamGrade || '1ère'}
                          onChange={(e) => setEditedRegistration({...editedRegistration, teamGrade: e.target.value})}
                          className="text-sm text-gray-900 bg-white font-medium border border-purple-300 rounded px-2 py-1"
                        >
                          <option value="1ère">1ère</option>
                          <option value="Terminale">Terminale</option>
                          <option value="Autre">Autre</option>
                        </select>
                        {editedRegistration.teamGrade === 'Autre' && (
                          <input
                            type="text"
                            value={editedRegistration.teamGrade === 'Autre' ? '' : editedRegistration.teamGrade}
                            onChange={(e) => setEditedRegistration({...editedRegistration, teamGrade: e.target.value})}
                            className="text-sm text-gray-900 bg-white font-medium border border-purple-300 rounded px-2 py-1 w-full"
                            placeholder="Précisez la classe (ex: 2nde, 3ème...)"
                          />
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-gray-900">{selectedRegistration.teamName}</h2>
                      {selectedRegistration.schoolName && (
                        <p className="text-sm text-blue-600 font-medium">🏫 {selectedRegistration.schoolName}</p>
                      )}
                      {selectedRegistration.teamGrade && (
                        <p className="text-sm text-purple-600 font-medium">📚 Classe: {selectedRegistration.teamGrade}</p>
                      )}
                      {selectedRegistration.registrationMode === 'collaborative' && (
                        <div className="mt-2 mb-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <LinkIcon className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-700">Inscription Collaborative</span>
                          </div>
                          <p className="text-xs text-blue-600">
                            🔗 Lien collaboratif créé le : {formatDateTime(selectedRegistration.submittedAt || selectedRegistration.createdAt)}
                          </p>
                        </div>
                      )}
                      <div className="mt-2 space-y-1 text-xs text-gray-600">
                        {selectedRegistration.registrationMode !== 'collaborative' && (
                          <p>
                            📅 <strong>Inscrit le :</strong> {formatDateTime(selectedRegistration.submittedAt || selectedRegistration.createdAt)}
                          </p>
                        )}
                        {selectedRegistration.registrationMode === 'collaborative' && selectedRegistration.players.length >= 10 && selectedRegistration.adminNotifiedAt10PlayersAt && (
                          <p className="text-green-600 font-medium">
                            ✅ <strong>10 joueurs atteints le :</strong> {formatDateTime(selectedRegistration.adminNotifiedAt10PlayersAt)}
                          </p>
                        )}
                        {selectedRegistration.registrationMode === 'collaborative' && selectedRegistration.players.length < 10 && (
                          <p className="text-orange-600 font-medium">
                            ⏳ <strong>En attente de {10 - selectedRegistration.players.length} joueur{10 - selectedRegistration.players.length > 1 ? 's' : ''} supplémentaire{10 - selectedRegistration.players.length > 1 ? 's' : ''}</strong>
                          </p>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">Détails de l'inscription</p>
                    </>
                  )}
                </div>

                <div className="p-6 space-y-6">
                  {/* Captain Info */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-3">Capitaine</h3>
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                      {editMode && editedRegistration ? (
                        <>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={editedRegistration.captain.firstName}
                              onChange={(e) => setEditedRegistration({
                                ...editedRegistration,
                                captain: {...editedRegistration.captain, firstName: e.target.value}
                              })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
                              placeholder="Prénom"
                            />
                            <input
                              type="text"
                              value={editedRegistration.captain.lastName}
                              onChange={(e) => setEditedRegistration({
                                ...editedRegistration,
                                captain: {...editedRegistration.captain, lastName: e.target.value}
                              })}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
                              placeholder="Nom"
                            />
                          </div>
                          <input
                            type="email"
                            value={editedRegistration.captain.email}
                            onChange={(e) => setEditedRegistration({
                              ...editedRegistration,
                              captain: {...editedRegistration.captain, email: e.target.value}
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
                            placeholder="Email"
                          />
                          <input
                            type="tel"
                            value={editedRegistration.captain.phone}
                            onChange={(e) => setEditedRegistration({
                              ...editedRegistration,
                              captain: {...editedRegistration.captain, phone: e.target.value}
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
                            placeholder="Téléphone"
                          />
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-gray-900"><span className="font-semibold">Nom:</span> {selectedRegistration.captain.firstName} {selectedRegistration.captain.lastName}</p>
                          <p className="text-sm text-gray-900"><span className="font-semibold">Email:</span> {selectedRegistration.captain.email}</p>
                          <p className="text-sm text-gray-900"><span className="font-semibold">Téléphone:</span> {selectedRegistration.captain.phone}</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Coach Info */}
                  {(selectedRegistration.coach || (editMode && editedRegistration)) && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-3">Entraîneur</h3>
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100">
                        {editMode && editedRegistration ? (
                          <div className="space-y-2">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={editedRegistration.coach?.firstName || ''}
                                onChange={(e) => setEditedRegistration({
                                  ...editedRegistration,
                                  coach: {...(editedRegistration.coach || {firstName: '', lastName: '', birthDate: '', email: '', phone: ''}), firstName: e.target.value}
                                })}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
                                placeholder="Prénom"
                              />
                              <input
                                type="text"
                                value={editedRegistration.coach?.lastName || ''}
                                onChange={(e) => setEditedRegistration({
                                  ...editedRegistration,
                                  coach: {...(editedRegistration.coach || {firstName: '', lastName: '', birthDate: '', email: '', phone: ''}), lastName: e.target.value}
                                })}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
                                placeholder="Nom"
                              />
                            </div>
                            <input
                              type="date"
                              value={editedRegistration.coach?.birthDate || ''}
                              onChange={(e) => setEditedRegistration({
                                ...editedRegistration,
                                coach: {...(editedRegistration.coach || {firstName: '', lastName: '', birthDate: '', email: '', phone: ''}), birthDate: e.target.value}
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
                              placeholder="Date de naissance"
                            />
                            <input
                              type="email"
                              value={editedRegistration.coach?.email || ''}
                              onChange={(e) => setEditedRegistration({
                                ...editedRegistration,
                                coach: {...(editedRegistration.coach || {firstName: '', lastName: '', birthDate: '', email: '', phone: ''}), email: e.target.value}
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
                              placeholder="Email"
                            />
                            <input
                              type="tel"
                              value={editedRegistration.coach?.phone || ''}
                              onChange={(e) => setEditedRegistration({
                                ...editedRegistration,
                                coach: {...(editedRegistration.coach || {firstName: '', lastName: '', birthDate: '', email: '', phone: ''}), phone: e.target.value}
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-gray-900 bg-white"
                              placeholder="Téléphone"
                            />
                            
                            {/* Bouton de sauvegarde de l'entraîneur */}
                            <button
                              onClick={saveEdits}
                              disabled={processing}
                              className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {processing ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Sauvegarde...
                                </>
                              ) : (
                                <>
                                  <Check className="w-4 h-4" />
                                  Sauvegarder l'entraîneur
                                </>
                              )}
                            </button>
                          </div>
                        ) : selectedRegistration.coach ? (
                          <div className="space-y-3">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                                {selectedRegistration.coach.firstName.charAt(0)}{selectedRegistration.coach.lastName.charAt(0)}
                              </div>
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                  <p className="text-xs text-gray-600">Nom complet</p>
                                  <p className="font-semibold text-gray-900">
                                    {selectedRegistration.coach.firstName} {selectedRegistration.coach.lastName}
                                  </p>
                                </div>
                                {selectedRegistration.coach.birthDate && (
                                  <div>
                                    <p className="text-xs text-gray-600">Date de naissance</p>
                                    <p className="font-medium text-gray-900">
                                      {new Date(selectedRegistration.coach.birthDate).toLocaleDateString('fr-FR')}
                                    </p>
                                  </div>
                                )}
                                {selectedRegistration.coach.email && (
                                  <div>
                                    <p className="text-xs text-gray-600">Email</p>
                                    <p className="font-medium text-gray-900">{selectedRegistration.coach.email}</p>
                                  </div>
                                )}
                                {selectedRegistration.coach.phone && (
                                  <div>
                                    <p className="text-xs text-gray-600">Téléphone</p>
                                    <p className="font-medium text-gray-900">{selectedRegistration.coach.phone}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            {selectedRegistration.status === 'approved' && selectedRegistration.coach.email && (
                              <button
                                onClick={() => resendPlayerEmail(
                                  {
                                    firstName: selectedRegistration.coach!.firstName,
                                    lastName: selectedRegistration.coach!.lastName,
                                    email: selectedRegistration.coach!.email,
                                    phone: selectedRegistration.coach!.phone,
                                    position: 'Entraîneur',
                                    jerseyNumber: 0,
                                    height: 0,
                                    foot: 'Droitier'
                                  } as any,
                                  selectedRegistration.teamName
                                )}
                                disabled={processing}
                                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition text-sm font-medium"
                              >
                                📧 Renvoyer l'email à l'entraîneur
                              </button>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600 italic">Aucun entraîneur renseigné</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Players */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900">
                        Joueurs ({editMode && editedRegistration ? editedRegistration.players.length : selectedRegistration.players.length})
                      </h3>
                      {editMode && editedRegistration && (
                        <button
                          onClick={addPlayer}
                          disabled={editedRegistration.players.length >= 10}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition text-sm font-medium"
                        >
                          + Ajouter un joueur
                        </button>
                      )}
                    </div>
                    <div className="space-y-3">
                      {(editMode && editedRegistration ? editedRegistration.players : selectedRegistration.players).map((player, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-lg relative">
                          {editMode && editedRegistration ? (
                            <>
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-gray-700">Joueur {index + 1}</span>
                                  {index === 0 && (
                                    <span className="inline-flex items-center justify-center w-5 h-5 bg-yellow-500 text-white text-xs font-bold rounded-full" title="Capitaine">
                                      C
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => removePlayer(index)}
                                  disabled={editedRegistration.players.length <= 7}
                                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 transition text-xs"
                                >
                                  Supprimer
                                </button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <input
                                type="text"
                                value={player.firstName}
                                onChange={(e) => {
                                  const newPlayers = [...editedRegistration.players]
                                  newPlayers[index].firstName = e.target.value
                                  setEditedRegistration({...editedRegistration, players: newPlayers})
                                }}
                                className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                                placeholder="Prénom"
                              />
                              <input
                                type="text"
                                value={player.lastName}
                                onChange={(e) => {
                                  const newPlayers = [...editedRegistration.players]
                                  newPlayers[index].lastName = e.target.value
                                  setEditedRegistration({...editedRegistration, players: newPlayers})
                                }}
                                className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                                placeholder="Nom"
                              />
                              <input
                                type="text"
                                value={player.nickname || ''}
                                onChange={(e) => {
                                  const newPlayers = [...editedRegistration.players]
                                  newPlayers[index].nickname = e.target.value
                                  setEditedRegistration({...editedRegistration, players: newPlayers})
                                }}
                                className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                                placeholder="Surnom"
                              />
                              <input
                                type="email"
                                value={player.email}
                                onChange={(e) => {
                                  const newPlayers = [...editedRegistration.players]
                                  newPlayers[index].email = e.target.value
                                  setEditedRegistration({...editedRegistration, players: newPlayers})
                                }}
                                className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                                placeholder="Email"
                              />
                              <input
                                type="tel"
                                value={player.phone}
                                onChange={(e) => {
                                  const newPlayers = [...editedRegistration.players]
                                  newPlayers[index].phone = e.target.value
                                  setEditedRegistration({...editedRegistration, players: newPlayers})
                                }}
                                className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                                placeholder="Téléphone"
                              />
                              <input
                                type="date"
                                value={player.birthDate || ''}
                                onChange={(e) => {
                                  const newPlayers = [...editedRegistration.players]
                                  newPlayers[index].birthDate = e.target.value
                                  setEditedRegistration({...editedRegistration, players: newPlayers})
                                }}
                                className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                                placeholder="Date de naissance"
                              />
                              <select
                                value={player.position}
                                onChange={(e) => {
                                  const newPlayers = [...editedRegistration.players]
                                  newPlayers[index].position = e.target.value
                                  setEditedRegistration({...editedRegistration, players: newPlayers})
                                }}
                                className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                              >
                                <option value="Gardien">Gardien</option>
                                <option value="Défenseur">Défenseur</option>
                                <option value="Milieu">Milieu</option>
                                <option value="Attaquant">Attaquant</option>
                              </select>
                              <input
                                type="number"
                                value={player.jerseyNumber}
                                onChange={(e) => {
                                  const newPlayers = [...editedRegistration.players]
                                  newPlayers[index].jerseyNumber = parseInt(e.target.value)
                                  setEditedRegistration({...editedRegistration, players: newPlayers})
                                }}
                                className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                                placeholder="N° Maillot"
                                min="1"
                                max="99"
                              />
                              <input
                                type="number"
                                value={player.height}
                                onChange={(e) => {
                                  const newPlayers = [...editedRegistration.players]
                                  newPlayers[index].height = parseFloat(e.target.value)
                                  setEditedRegistration({...editedRegistration, players: newPlayers})
                                }}
                                className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                                placeholder="Taille (cm)"
                              />
                              <select
                                value={player.foot}
                                onChange={(e) => {
                                  const newPlayers = [...editedRegistration.players]
                                  newPlayers[index].foot = e.target.value
                                  setEditedRegistration({...editedRegistration, players: newPlayers})
                                }}
                                className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                              >
                                <option value="Droitier">Droitier</option>
                                <option value="Gaucher">Gaucher</option>
                                <option value="Ambidextre">Ambidextre</option>
                              </select>
                              <select
                                value={player.tshirtSize || 'M'}
                                onChange={(e) => {
                                  const newPlayers = [...editedRegistration.players]
                                  newPlayers[index].tshirtSize = e.target.value
                                  setEditedRegistration({...editedRegistration, players: newPlayers})
                                }}
                                className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 bg-white"
                              >
                                <option value="XS">XS</option>
                                <option value="S">S</option>
                                <option value="M">M</option>
                                <option value="L">L</option>
                                <option value="XL">XL</option>
                                <option value="XXL">XXL</option>
                              </select>
                              <div className="space-y-2">
                                <select
                                  value={player.grade || editedRegistration.teamGrade || '1ère'}
                                  onChange={(e) => {
                                    const newPlayers = [...editedRegistration.players]
                                    newPlayers[index].grade = e.target.value
                                    setEditedRegistration({...editedRegistration, players: newPlayers})
                                  }}
                                  className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 bg-white w-full"
                                >
                                  <option value="1ère">1ère</option>
                                  <option value="Terminale">Terminale</option>
                                  <option value="Autre">Autre</option>
                                </select>
                                {player.grade === 'Autre' && (
                                  <input
                                    type="text"
                                    value={player.grade === 'Autre' ? '' : player.grade}
                                    onChange={(e) => {
                                      const newPlayers = [...editedRegistration.players]
                                      newPlayers[index].grade = e.target.value
                                      setEditedRegistration({...editedRegistration, players: newPlayers})
                                    }}
                                    className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 bg-white w-full"
                                    placeholder="Précisez la classe"
                                  />
                                )}
                              </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                                <div>
                                  <p className="text-xs text-gray-600">Nom</p>
                                  <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    <span>
                                      {player.firstName} {player.lastName}
                                      {player.nickname && <span className="text-blue-600"> "{player.nickname}"</span>}
                                    </span>
                                    {index === 0 && (
                                      <span className="inline-flex items-center justify-center w-5 h-5 bg-yellow-500 text-white text-xs font-bold rounded-full" title="Capitaine">
                                        C
                                      </span>
                                    )}
                                  </p>
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
                              {selectedRegistration.status === 'approved' && (
                                <button
                                  onClick={() => resendPlayerEmail(player, selectedRegistration.teamName)}
                                  disabled={processing}
                                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition text-sm font-medium"
                                >
                                  📧 Renvoyer l'email à ce joueur
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex gap-3">
                  {selectedRegistration.status === 'pending' && !editMode && (
                    <>
                      <button
                        onClick={startEdit}
                        disabled={processing}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
                      >
                        <Eye className="w-5 h-5" />
                        Modifier
                      </button>
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
                  {editMode && (
                    <>
                      <button
                        onClick={saveEdits}
                        disabled={processing}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-medium"
                      >
                        <Check className="w-5 h-5" />
                        Sauvegarder
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={processing}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 transition font-medium"
                      >
                        <X className="w-5 h-5" />
                        Annuler
                      </button>
                    </>
                  )}
                  {(selectedRegistration.status === 'approved' || selectedRegistration.status === 'pending' || selectedRegistration.status === 'pending_players' || selectedRegistration.status === 'pending_validation') && !editMode && (
                    <>
                      <button
                        onClick={startEdit}
                        disabled={processing}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
                      >
                        <Eye className="w-5 h-5" />
                        Modifier
                      </button>
                      {selectedRegistration.status === 'approved' && (
                        <button
                          onClick={() => resendEmails(selectedRegistration)}
                          disabled={processing}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition font-medium"
                        >
                          📧 Renvoyer tous les emails
                        </button>
                      )}
                      <button
                        onClick={() => deleteRegistration(selectedRegistration)}
                        disabled={processing}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition font-medium"
                      >
                        <X className="w-5 h-5" />
                        Supprimer
                      </button>
                    </>
                  )}
                  {selectedRegistration.status === 'rejected' && (
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
          </>
        )}
      </div>
    </div>
  )
}

// Waiting List Component
function WaitingListContent() {
  const [status, setStatus] = useState<{ isWaitingListEnabled: boolean; message: string }>({
    isWaitingListEnabled: false,
    message: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [customMessage, setCustomMessage] = useState('')

  useEffect(() => {
    loadStatus()
  }, [])

  const loadStatus = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/waiting-list')
      const data = await response.json()
      setStatus(data)
      setCustomMessage(data.message || 'Nous sommes au complet pour le moment. Inscrivez-vous en liste d\'attente.')
    } catch (error) {
      console.error('Error loading waiting list status:', error)
      setMessage({ type: 'error', text: 'Erreur lors du chargement du statut' })
    } finally {
      setLoading(false)
    }
  }

  const toggleWaitingList = async (enabled: boolean) => {
    try {
      setSaving(true)
      setMessage(null)
      
      const response = await fetch('/api/admin/waiting-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isWaitingListEnabled: enabled,
          waitingListMessage: customMessage
        })
      })

      const data = await response.json()
      
      if (response.ok) {
        setStatus({
          isWaitingListEnabled: enabled,
          message: customMessage
        })
        setMessage({ 
          type: 'success', 
          text: enabled 
            ? 'Waiting list activée avec succès' 
            : 'Inscriptions normales activées avec succès'
        })
      } else {
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la mise à jour' })
      }
    } catch (error) {
      console.error('Error updating waiting list status:', error)
      setMessage({ type: 'error', text: 'Erreur lors de la mise à jour' })
    } finally {
      setSaving(false)
    }
  }

  const saveMessage = async () => {
    await toggleWaitingList(status.isWaitingListEnabled)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Clock className="w-7 h-7 text-amber-600" />
            Gestion de la Liste d'Attente
          </h2>
          <p className="text-gray-600 mt-1">
            Activez ou désactivez le système de waiting list pour les inscriptions d'équipes
          </p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="w-5 h-5 text-green-600" />
          ) : (
            <X className="w-5 h-5 text-red-600" />
          )}
          <span className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
            {message.text}
          </span>
        </motion.div>
      )}

      {/* Status Card */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Statut actuel
            </h3>
            <p className="text-sm text-gray-600">
              {status.isWaitingListEnabled 
                ? 'Les nouvelles inscriptions sont en mode waiting list'
                : 'Les inscriptions normales sont activées'}
            </p>
          </div>
          <button
            onClick={() => toggleWaitingList(!status.isWaitingListEnabled)}
            disabled={saving}
            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              status.isWaitingListEnabled
                ? 'bg-blue-600'
                : 'bg-gray-300'
            } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                status.isWaitingListEnabled ? 'translate-x-9' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Info Box */}
        <div className={`p-4 rounded-lg border ${
          status.isWaitingListEnabled
            ? 'bg-amber-50 border-amber-200'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-start gap-3">
            <CheckCircle className={`w-5 h-5 mt-0.5 ${
              status.isWaitingListEnabled
                ? 'text-amber-600'
                : 'text-blue-600'
            }`} />
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                status.isWaitingListEnabled
                  ? 'text-amber-800'
                  : 'text-blue-800'
              }`}>
                {status.isWaitingListEnabled ? (
                  <>
                    <strong>Mode Waiting List activé :</strong> Les nouvelles inscriptions seront ajoutées à la liste d'attente. 
                    Les inscriptions en cours (avec lien collaboratif) peuvent continuer à ajouter des joueurs normalement.
                  </>
                ) : (
                  <>
                    <strong>Inscriptions normales :</strong> Toutes les nouvelles équipes peuvent s'inscrire normalement.
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Message Customization */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Message personnalisé
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Ce message sera affiché aux équipes qui tentent de s'inscrire lorsque la waiting list est activée.
        </p>
        <textarea
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
          placeholder="Nous sommes au complet pour le moment. Inscrivez-vous en liste d'attente."
        />
        <button
          onClick={saveMessage}
          disabled={saving || customMessage === status.message}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <>
              <LoadingSpinner size="sm" />
              Enregistrement...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Enregistrer le message
            </>
          )}
        </button>
      </div>
    </div>
  )
}
