"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Users, Plus, Trash2, Check, AlertCircle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { SimpleLogo } from '@/components/ui/logo'

interface Player {
  id: string
  firstName: string
  lastName: string
  nickname: string
  email: string
  phone: string
  birthDate: string
  height: string
  tshirtSize: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'
  position: 'Gardien' | 'Défenseur' | 'Milieu' | 'Attaquant'
  foot: 'Droitier' | 'Gaucher' | 'Ambidextre'
  jerseyNumber: string
  grade: string
}

const CAIRO_FRENCH_SCHOOLS = [
  'Lycée Français du Caire - Maadi',
  'Lycée Français du Caire - Zamalek',
  'Lycée International Balzac',
  'Lycée Voltaire',
  'École Française de Heliopolis',
  'École Oasis Internationale',
  'Collège de la Sainte Famille - Heliopolis',
  'Collège de la Sainte Famille - Faggala',
  'Collège du Sacré-Cœur',
  'École des Frères - Bab El Louk',
  'École des Sœurs Franciscaines',
  'Autre'
]

export default function RegisterTeamPage() {
  // Force light mode for this page
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    return () => {
      // Cleanup: restore dark mode if it was set before
    }
  }, [])

  const [teamName, setTeamName] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [customSchool, setCustomSchool] = useState('')
  const [teamGrade, setTeamGrade] = useState<'1ère' | 'Terminale' | 'Autre'>('1ère')
  const [customGrade, setCustomGrade] = useState('')
  const [captainFirstName, setCaptainFirstName] = useState('')
  const [captainLastName, setCaptainLastName] = useState('')
  const [captainEmail, setCaptainEmail] = useState('')
  const [captainPhone, setCaptainPhone] = useState('')
  const [captainIsCaptain, setCaptainIsCaptain] = useState(true) // Le capitaine est toujours joueur
  
  // Coach info (optional)
  const [hasCoach, setHasCoach] = useState(false)
  const [coachFirstName, setCoachFirstName] = useState('')
  const [coachLastName, setCoachLastName] = useState('')
  const [coachBirthDate, setCoachBirthDate] = useState('')
  const [coachEmail, setCoachEmail] = useState('')
  const [coachPhone, setCoachPhone] = useState('')
  
  const [players, setPlayers] = useState<Player[]>([
    { id: '1', firstName: '', lastName: '', nickname: '', email: '', phone: '', birthDate: '', height: '', tshirtSize: 'M', position: '' as any, foot: '' as any, jerseyNumber: '', grade: '1ère' },
    { id: '2', firstName: '', lastName: '', nickname: '', email: '', phone: '', birthDate: '', height: '', tshirtSize: 'M', position: '' as any, foot: '' as any, jerseyNumber: '', grade: '1ère' },
    { id: '3', firstName: '', lastName: '', nickname: '', email: '', phone: '', birthDate: '', height: '', tshirtSize: 'M', position: '' as any, foot: '' as any, jerseyNumber: '', grade: '1ère' },
    { id: '4', firstName: '', lastName: '', nickname: '', email: '', phone: '', birthDate: '', height: '', tshirtSize: 'M', position: '' as any, foot: '' as any, jerseyNumber: '', grade: '1ère' },
    { id: '5', firstName: '', lastName: '', nickname: '', email: '', phone: '', birthDate: '', height: '', tshirtSize: 'M', position: '' as any, foot: '' as any, jerseyNumber: '', grade: '1ère' },
    { id: '6', firstName: '', lastName: '', nickname: '', email: '', phone: '', birthDate: '', height: '', tshirtSize: 'M', position: '' as any, foot: '' as any, jerseyNumber: '', grade: '1ère' },
    { id: '7', firstName: '', lastName: '', nickname: '', email: '', phone: '', birthDate: '', height: '', tshirtSize: 'M', position: '' as any, foot: '' as any, jerseyNumber: '', grade: '1ère' }
  ])
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const resetForm = () => {
    setTeamName('')
    setSchoolName('')
    setCustomSchool('')
    setTeamGrade('1ère')
    setCustomGrade('')
    setCaptainFirstName('')
    setCaptainLastName('')
    setCaptainEmail('')
    setCaptainPhone('')
    setHasCoach(false)
    setCoachFirstName('')
    setCoachLastName('')
    setCoachBirthDate('')
    setCoachEmail('')
    setCoachPhone('')
    setPlayers([
      { id: '1', firstName: '', lastName: '', nickname: '', email: '', phone: '', birthDate: '', height: '', tshirtSize: 'M', position: '' as any, foot: '' as any, jerseyNumber: '', grade: '1ère' },
      { id: '2', firstName: '', lastName: '', nickname: '', email: '', phone: '', birthDate: '', height: '', tshirtSize: 'M', position: '' as any, foot: '' as any, jerseyNumber: '', grade: '1ère' },
      { id: '3', firstName: '', lastName: '', nickname: '', email: '', phone: '', birthDate: '', height: '', tshirtSize: 'M', position: '' as any, foot: '' as any, jerseyNumber: '', grade: '1ère' },
      { id: '4', firstName: '', lastName: '', nickname: '', email: '', phone: '', birthDate: '', height: '', tshirtSize: 'M', position: '' as any, foot: '' as any, jerseyNumber: '', grade: '1ère' },
      { id: '5', firstName: '', lastName: '', nickname: '', email: '', phone: '', birthDate: '', height: '', tshirtSize: 'M', position: '' as any, foot: '' as any, jerseyNumber: '', grade: '1ère' },
      { id: '6', firstName: '', lastName: '', nickname: '', email: '', phone: '', birthDate: '', height: '', tshirtSize: 'M', position: '' as any, foot: '' as any, jerseyNumber: '', grade: '1ère' },
      { id: '7', firstName: '', lastName: '', nickname: '', email: '', phone: '', birthDate: '', height: '', tshirtSize: 'M', position: '' as any, foot: '' as any, jerseyNumber: '', grade: '1ère' }
    ])
    setSuccess(false)
  }

  // Synchroniser le capitaine avec le premier joueur
  const updateCaptainFirstName = (value: string) => {
    setCaptainFirstName(value)
    if (captainIsCaptain) {
      setPlayers(prev => prev.map((p, idx) => idx === 0 ? { ...p, firstName: value } : p))
    }
  }

  const updateCaptainLastName = (value: string) => {
    setCaptainLastName(value)
    if (captainIsCaptain) {
      setPlayers(prev => prev.map((p, idx) => idx === 0 ? { ...p, lastName: value } : p))
    }
  }

  const updateCaptainEmail = (value: string) => {
    setCaptainEmail(value)
    if (captainIsCaptain) {
      setPlayers(prev => prev.map((p, idx) => idx === 0 ? { ...p, email: value } : p))
    }
  }

  const updateCaptainPhone = (value: string) => {
    setCaptainPhone(value)
    if (captainIsCaptain) {
      setPlayers(prev => prev.map((p, idx) => idx === 0 ? { ...p, phone: value } : p))
    }
  }

  const addPlayer = () => {
    if (players.length < 10) {
      setPlayers([...players, {
        id: Date.now().toString(),
        firstName: '',
        lastName: '',
        nickname: '',
        email: '',
        phone: '',
        birthDate: '',
        height: '',
        tshirtSize: 'M',
        position: '' as any,
        foot: '' as any,
        jerseyNumber: '',
        grade: teamGrade
      }])
    }
  }

  // Calculer l'âge à partir de la date de naissance
  const calculateAge = (birthDate: string): number => {
    if (!birthDate) return 0
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  // Mettre à jour la classe de tous les joueurs quand la classe de l'équipe change
  const updateTeamGrade = (grade: '1ère' | 'Terminale' | 'Autre') => {
    setTeamGrade(grade)
    if (grade !== 'Autre') {
      setPlayers(prev => prev.map(p => ({ ...p, grade })))
    }
  }

  const removePlayer = (id: string) => {
    if (players.length > 7) {
      setPlayers(players.filter(p => p.id !== id))
    }
  }

  const updatePlayer = (id: string, field: keyof Player, value: string) => {
    setPlayers(players.map((p, idx) => {
      if (p.id === id) {
        const updated = { ...p, [field]: value }
        // Si c'est le premier joueur, synchroniser avec le capitaine
        if (idx === 0 && captainIsCaptain) {
          if (field === 'firstName') setCaptainFirstName(value)
          if (field === 'lastName') setCaptainLastName(value)
          if (field === 'email') setCaptainEmail(value)
          if (field === 'phone') setCaptainPhone(value)
        }
        return updated
      }
      return p
    }))
  }

  // Vérifier si un email est valide
  const isEmailValid = (email: string) => {
    if (!email.trim()) return true // Ne pas valider si vide (requis géré par HTML)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
  }

  // Vérifier si un email est en double
  const isEmailDuplicate = (email: string, currentPlayerId: string) => {
    if (!email.trim()) return false
    const normalizedEmail = email.trim().toLowerCase()
    return players.some(p => 
      p.id !== currentPlayerId && 
      p.email.trim().toLowerCase() === normalizedEmail
    )
  }

  const validateForm = () => {
    if (!teamName.trim()) return 'Le nom de l\'équipe est requis'
    if (!schoolName) return 'L\'école est requise'
    if (schoolName === 'Autre' && !customSchool.trim()) return 'Veuillez préciser le nom de votre école'
    if (!teamGrade) return 'La classe de l\'équipe est requise'
    if (teamGrade === 'Autre' && !customGrade.trim()) return 'Veuillez préciser la classe'
    if (!captainFirstName.trim() || !captainLastName.trim()) return 'Le nom du capitaine est requis'
    if (!captainEmail.trim()) return 'L\'email du capitaine est requis'
    if (!isEmailValid(captainEmail)) return 'L\'email du capitaine n\'est pas valide'
    if (!captainPhone.trim()) return 'Le téléphone du capitaine est requis'
    
    if (players.length < 7) return 'Vous devez avoir au minimum 7 joueurs'
    if (players.length > 10) return 'Vous ne pouvez pas avoir plus de 10 joueurs'
    
    // Vérifier les emails en double
    const emails = players.map(p => p.email.trim().toLowerCase()).filter(e => e)
    const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index)
    if (duplicateEmails.length > 0) {
      return `Emails en double détectés: ${duplicateEmails.join(', ')}. Chaque joueur doit avoir une adresse email unique.`
    }
    
    for (const player of players) {
      if (!player.firstName.trim() || !player.lastName.trim()) {
        return 'Tous les joueurs doivent avoir un prénom et un nom'
      }
      if (!player.email.trim()) {
        return 'L\'email de tous les joueurs est requis'
      }
      if (!isEmailValid(player.email)) {
        return `L'email de ${player.firstName} ${player.lastName} n'est pas valide`
      }
      if (!player.phone.trim()) {
        return 'Le téléphone de tous les joueurs est requis'
      }
      if (!player.birthDate) {
        return 'La date de naissance de tous les joueurs est requise'
      }
      if (!player.height || parseFloat(player.height) <= 0) {
        return 'La taille de tous les joueurs est requise'
      }
      if (!player.position) {
        return 'La position de tous les joueurs est requise'
      }
      if (!player.foot) {
        return 'Le pied de tous les joueurs est requis'
      }
      if (!player.jerseyNumber || parseInt(player.jerseyNumber) <= 0) {
        return 'Le numéro de maillot de tous les joueurs est requis'
      }
    }
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')

    try {
      const registrationData: any = {
        teamName,
        schoolName: schoolName === 'Autre' ? customSchool : schoolName,
        teamGrade: teamGrade === 'Autre' ? customGrade : teamGrade,
        captain: {
          firstName: captainFirstName,
          lastName: captainLastName,
          email: captainEmail,
          phone: captainPhone
        },
        players: players.map(p => {
          const age = calculateAge(p.birthDate)
          return {
            firstName: p.firstName,
            lastName: p.lastName,
            nickname: p.nickname || '',
            email: p.email,
            phone: p.phone,
            birthDate: p.birthDate || '',
            ...(age > 0 && { age }), // N'inclure age que s'il est valide
            height: parseFloat(p.height) || 0,
            tshirtSize: p.tshirtSize,
            position: p.position,
            foot: p.foot,
            jerseyNumber: parseInt(p.jerseyNumber) || 0,
            grade: p.grade
          }
        }),
        status: 'pending',
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }
      
      // Add coach info if provided
      if (hasCoach && coachFirstName && coachLastName) {
        registrationData.coach = {
          firstName: coachFirstName,
          lastName: coachLastName,
          birthDate: coachBirthDate,
          email: coachEmail,
          phone: coachPhone
        }
      }
      
      await addDoc(collection(db, 'teamRegistrations'), registrationData)

      // Envoyer une notification à l'admin
      try {
        await fetch('/api/notify-admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teamName,
            schoolName: schoolName === 'Autre' ? customSchool : schoolName,
            captainName: `${captainFirstName} ${captainLastName}`,
            captainEmail,
            playersCount: players.length
          })
        })
      } catch (notifError) {
        console.error('Erreur notification admin:', notifError)
        // On continue même si la notification échoue
      }

      setSuccess(true)
      
    } catch (err) {
      console.error('Erreur lors de l\'inscription:', err)
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 light">
      {/* Header with Logo */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 mb-6">
        <div className="flex items-center justify-between">
          <Link href="/login" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition">
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </Link>
          <SimpleLogo className="w-12 h-12 object-contain rounded" alt="ComeBac League" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            Inscription d'Équipe
          </h1>
          <p className="text-gray-600">
            Inscrivez votre équipe à la ComeBac League (sans compte requis)
          </p>
        </motion.div>

        {/* Success Popup Modal */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
              onClick={resetForm}
            >
              <motion.div
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 20 }}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mb-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Inscription envoyée!
                  </h3>
                  <p className="text-gray-600">
                    Votre équipe <span className="font-semibold text-gray-900">{teamName}</span> a été soumise avec succès.
                  </p>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                  <p className="text-sm text-blue-800">
                    <strong>Prochaines étapes:</strong>
                  </p>
                  <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
                    <li>Un administrateur va examiner votre inscription</li>
                    <li>Vous serez contacté par email à: <strong>{captainEmail}</strong></li>
                    <li>La validation prend généralement 24-48h</li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={resetForm}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                  >
                    Nouvelle inscription
                  </button>
                  <Link
                    href="/login"
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium text-center"
                  >
                    Retour
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white p-4 mb-6 bg-red-50 border-2 border-red-500 rounded-lg"
          >
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-4">Informations de l'Équipe</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'Équipe *
                </label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 text-gray-900"
                  placeholder="Ex: Les Aigles"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  École *
                </label>
                <select
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  required
                >
                  <option value="">Sélectionnez votre école</option>
                  {CAIRO_FRENCH_SCHOOLS.map((school) => (
                    <option key={school} value={school}>
                      {school}
                    </option>
                  ))}
                </select>
              </div>

              {schoolName === 'Autre' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de votre école *
                  </label>
                  <input
                    type="text"
                    value={customSchool}
                    onChange={(e) => setCustomSchool(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 text-gray-900"
                    placeholder="Entrez le nom de votre école"
                    required
                  />
                </motion.div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Classe de l'équipe *
                </label>
                <select
                  value={teamGrade}
                  onChange={(e) => updateTeamGrade(e.target.value as '1ère' | 'Terminale' | 'Autre')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  required
                >
                  <option value="1ère">1ère</option>
                  <option value="Terminale">Terminale</option>
                  <option value="Autre">Autre</option>
                </select>
                {teamGrade === 'Autre' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2"
                  >
                    <input
                      type="text"
                      value={customGrade}
                      onChange={(e) => setCustomGrade(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 text-gray-900"
                      placeholder="Précisez la classe (ex: 2nde, 3ème...)"
                      required
                    />
                  </motion.div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Cette classe s'appliquera à tous les joueurs de l'équipe
                </p>
              </div>
            </div>
          </motion.div>

          {/* Captain Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <h2 className="text-xl font-bold text-gray-900 mb-2">Informations du Capitaine</h2>
            <p className="text-sm text-blue-600 mb-4">
              ℹ️ Le capitaine sera automatiquement ajouté comme premier joueur de l'équipe
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  value={captainFirstName}
                  onChange={(e) => updateCaptainFirstName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  value={captainLastName}
                  onChange={(e) => updateCaptainLastName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  value={captainEmail}
                  onChange={(e) => updateCaptainEmail(e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                    captainEmail && !isEmailValid(captainEmail)
                      ? 'border-red-500 focus:ring-red-500 bg-red-50'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  required
                />
                {captainEmail && !isEmailValid(captainEmail) && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Format d'email invalide
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  value={captainPhone}
                  onChange={(e) => updateCaptainPhone(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  required
                />
              </div>
            </div>
          </motion.div>

          {/* Coach Info (Optional) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Entraîneur (Optionnel)</h2>
                <p className="text-sm text-gray-600">Informations de l'entraîneur de l'équipe</p>
              </div>
              <button
                type="button"
                onClick={() => setHasCoach(!hasCoach)}
                className={`px-4 py-2 rounded-lg transition font-medium ${
                  hasCoach 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {hasCoach ? 'Retirer l\'entraîneur' : 'Ajouter un entraîneur'}
              </button>
            </div>
            
            <AnimatePresence>
              {hasCoach && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      value={coachFirstName}
                      onChange={(e) => setCoachFirstName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      required={hasCoach}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom *
                    </label>
                    <input
                      type="text"
                      value={coachLastName}
                      onChange={(e) => setCoachLastName(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      required={hasCoach}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date de naissance
                    </label>
                    <input
                      type="date"
                      value={coachBirthDate}
                      onChange={(e) => setCoachBirthDate(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={coachEmail}
                      onChange={(e) => setCoachEmail(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent ${
                        coachEmail && !isEmailValid(coachEmail)
                          ? 'border-red-500 focus:ring-red-500 bg-red-50'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      placeholder="coach@example.com"
                    />
                    {coachEmail && !isEmailValid(coachEmail) && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        Format d'email invalide
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={coachPhone}
                      onChange={(e) => setCoachPhone(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="+20 123 456 7890"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Players */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-lg shadow-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Joueurs ({players.length}/10)
                </h2>
                <p className="text-sm text-gray-600">Entre 7 et 10 joueurs requis</p>
              </div>
              <button
                type="button"
                onClick={addPlayer}
                disabled={players.length >= 10}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                Ajouter un joueur
              </button>
            </div>

            <div className="space-y-4">
              {players.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Joueur {index + 1}</h3>
                    {players.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePlayer(player.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        value={player.firstName}
                        onChange={(e) => updatePlayer(player.id, 'firstName', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                     
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Nom *
                      </label>
                      <input
                        type="text"
                        value={player.lastName}
                        onChange={(e) => updatePlayer(player.id, 'lastName', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Surnom sur T-shirt
                      </label>
                      <input
                        type="text"
                        value={player.nickname}
                        onChange={(e) => updatePlayer(player.id, 'nickname', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 text-gray-900"
                        placeholder="Ex: CR7, Messi..."
                        maxLength={15}
                      />
                      <p className="text-xs text-gray-500 mt-1">Optionnel - Max 15 caractères</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={player.email}
                        onChange={(e) => updatePlayer(player.id, 'email', e.target.value)}
                        className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:border-transparent placeholder:text-gray-400 ${
                          player.email && (!isEmailValid(player.email) || isEmailDuplicate(player.email, player.id))
                            ? 'border-red-500 focus:ring-red-500 bg-red-50'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        placeholder="joueur@email.com"
                        required
                      />
                      {player.email && !isEmailValid(player.email) && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Format d'email invalide
                        </p>
                      )}
                      {player.email && isEmailValid(player.email) && isEmailDuplicate(player.email, player.id) && (
                        <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Cet email est déjà utilisé
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Téléphone *
                      </label>
                      <input
                        type="tel"
                        value={player.phone}
                        onChange={(e) => updatePlayer(player.id, 'phone', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 text-gray-900"
                        placeholder="+20 123 456 7890"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Date de naissance *
                      </label>
                      <input
                        type="date"
                        value={player.birthDate}
                        onChange={(e) => updatePlayer(player.id, 'birthDate', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        required
                      />
                      {player.birthDate && (
                        <p className="text-xs text-gray-500 mt-1">
                          Âge: {calculateAge(player.birthDate)} ans
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Taille (cm) *
                      </label>
                      <input
                        type="number"
                        value={player.height}
                        onChange={(e) => updatePlayer(player.id, 'height', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        min="100"
                        max="250"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Taille T-shirt *
                      </label>
                      <select
                        value={player.tshirtSize}
                        onChange={(e) => updatePlayer(player.id, 'tshirtSize', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
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

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Position *
                      </label>
                      <select
                        value={player.position}
                        onChange={(e) => updatePlayer(player.id, 'position', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        required
                      >
                        <option value="">Sélectionner...</option>
                        <option value="Gardien">Gardien</option>
                        <option value="Défenseur">Défenseur</option>
                        <option value="Milieu">Milieu</option>
                        <option value="Attaquant">Attaquant</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Pied *
                      </label>
                      <select
                        value={player.foot}
                        onChange={(e) => updatePlayer(player.id, 'foot', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        required
                      >
                        <option value="">Sélectionner...</option>
                        <option value="Droitier">Droitier</option>
                        <option value="Gaucher">Gaucher</option>
                        <option value="Ambidextre">Ambidextre</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        N° Maillot *
                      </label>
                      <input
                        type="number"
                        value={player.jerseyNumber}
                        onChange={(e) => updatePlayer(player.id, 'jerseyNumber', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        min="1"
                        max="99"
                        required
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Submit */}
          <div className="flex gap-4">
            <Link href="/login" className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition text-center font-medium">
              Annuler
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              {loading ? 'Envoi en cours...' : 'Envoyer l\'inscription'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
