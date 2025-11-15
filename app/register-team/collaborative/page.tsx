"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Users, ArrowLeft, Loader, Check } from 'lucide-react'
import Link from 'next/link'
import { SimpleLogo } from '@/components/ui/logo'
import { useRouter } from 'next/navigation'

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

export default function CollaborativeRegistrationPage() {
  const router = useRouter()
  
  // Force light mode
  useEffect(() => {
    document.documentElement.classList.remove('dark')
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
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Validation
      if (!teamName.trim()) {
        throw new Error('Le nom de l\'équipe est requis')
      }
      if (!schoolName) {
        throw new Error('L\'école est requise')
      }
      if (schoolName === 'Autre' && !customSchool.trim()) {
        throw new Error('Veuillez préciser le nom de l\'école')
      }
      if (!captainFirstName.trim() || !captainLastName.trim()) {
        throw new Error('Le nom du capitaine est requis')
      }
      if (!captainEmail.trim()) {
        throw new Error('L\'email du capitaine est requis')
      }
      if (!captainPhone.trim()) {
        throw new Error('Le téléphone du capitaine est requis')
      }

      // Générer un token unique
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36)

      // Créer l'inscription
      const finalSchoolName = schoolName === 'Autre' ? customSchool : schoolName
      const finalGrade = teamGrade === 'Autre' ? customGrade : teamGrade

      const registrationData = {
        teamName: teamName.trim(),
        schoolName: finalSchoolName.trim(),
        teamGrade: finalGrade,
        captain: {
          firstName: captainFirstName.trim(),
          lastName: captainLastName.trim(),
          email: captainEmail.trim().toLowerCase(),
          phone: captainPhone.trim()
        },
        players: [],
        status: 'pending_players',
        registrationMode: 'collaborative',
        inviteToken: token,
        minPlayers: 7,
        maxPlayers: 15,
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, 'teamRegistrations'), registrationData)

      // Rediriger vers la page de statut
      router.push(`/team-registration/${token}/status`)
      
    } catch (err: any) {
      console.error('Erreur:', err)
      setError(err.message || 'Une erreur est survenue')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/register-team-new" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span>Retour</span>
            </Link>
            <div className="flex items-center gap-3">
              <SimpleLogo className="w-10 h-10" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                ComeBac League
              </span>
            </div>
            <div className="w-20" /> {/* Spacer */}
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
              Mode Collaboratif
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Créez votre équipe
            </h1>
            <p className="text-gray-600">
              Remplissez les informations de base. Vous recevrez ensuite un lien à partager avec vos joueurs.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-8 space-y-6">
            {/* Team Info */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations de l'équipe</h2>
              
              <div className="space-y-4">
                {/* Team Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom de l'équipe *
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Les Champions"
                    required
                  />
                </div>

                {/* School */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    École *
                  </label>
                  <select
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Sélectionnez une école</option>
                    {CAIRO_FRENCH_SCHOOLS.map(school => (
                      <option key={school} value={school}>{school}</option>
                    ))}
                  </select>
                </div>

                {schoolName === 'Autre' && (
                  <div>
                    <input
                      type="text"
                      value={customSchool}
                      onChange={(e) => setCustomSchool(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Nom de votre école"
                      required
                    />
                  </div>
                )}

                {/* Grade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Classe *
                  </label>
                  <select
                    value={teamGrade}
                    onChange={(e) => setTeamGrade(e.target.value as any)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="1ère">1ère</option>
                    <option value="Terminale">Terminale</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                {teamGrade === 'Autre' && (
                  <div>
                    <input
                      type="text"
                      value={customGrade}
                      onChange={(e) => setCustomGrade(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Précisez la classe"
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Captain Info */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Vos informations (Capitaine)</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prénom *
                    </label>
                    <input
                      type="text"
                      value={captainFirstName}
                      onChange={(e) => setCaptainFirstName(e.target.value)}
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
                      value={captainLastName}
                      onChange={(e) => setCaptainLastName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={captainEmail}
                    onChange={(e) => setCaptainEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="votre.email@exemple.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    value={captainPhone}
                    onChange={(e) => setCaptainPhone(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="+20 123 456 7890"
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
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 rounded-lg font-semibold hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Création en cours...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Créer l'équipe et générer le lien
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
