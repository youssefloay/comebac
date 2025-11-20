"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [captainNickname, setCaptainNickname] = useState('')
  const [captainEmail, setCaptainEmail] = useState('')
  const [captainPhone, setCaptainPhone] = useState('')
  const [captainBirthDate, setCaptainBirthDate] = useState('')
  const [captainHeight, setCaptainHeight] = useState('')
  const [captainTshirtSize, setCaptainTshirtSize] = useState<'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL'>('M')
  const [captainPosition, setCaptainPosition] = useState<'Gardien' | 'Défenseur' | 'Milieu' | 'Attaquant' | ''>('')
  const [captainFoot, setCaptainFoot] = useState<'Droitier' | 'Gaucher' | 'Ambidextre' | ''>('')
  const [captainJerseyNumber, setCaptainJerseyNumber] = useState('')
  
  // Coach option
  const [hasCoach, setHasCoach] = useState(false)
  
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
      if (!captainNickname.trim()) {
        throw new Error('Le surnom sur T-shirt est requis')
      }
      if (!captainBirthDate) {
        throw new Error('La date de naissance est requise')
      }
      if (!captainHeight) {
        throw new Error('La taille est requise')
      }
      if (!captainPosition) {
        throw new Error('La position est requise')
      }
      if (!captainFoot) {
        throw new Error('Le pied est requis')
      }
      if (!captainJerseyNumber) {
        throw new Error('Le numéro de maillot est requis')
      }

      // Générer un token unique
      const token = Math.random().toString(36).substring(2) + Date.now().toString(36)

      // Créer l'inscription
      const finalSchoolName = schoolName === 'Autre' ? customSchool : schoolName
      const finalGrade = teamGrade === 'Autre' ? customGrade : teamGrade

      const registrationData: any = {
        teamName: teamName.trim(),
        schoolName: finalSchoolName.trim(),
        teamGrade: finalGrade,
        captain: {
          firstName: captainFirstName.trim(),
          lastName: captainLastName.trim(),
          nickname: captainNickname.trim(),
          email: captainEmail.trim().toLowerCase(),
          phone: captainPhone.trim(),
          birthDate: captainBirthDate,
          height: captainHeight,
          tshirtSize: captainTshirtSize,
          position: captainPosition,
          foot: captainFoot,
          jerseyNumber: captainJerseyNumber.trim()
        },
        players: [{
          firstName: captainFirstName.trim(),
          lastName: captainLastName.trim(),
          nickname: captainNickname.trim(),
          email: captainEmail.trim().toLowerCase(),
          phone: captainPhone.trim(),
          birthDate: captainBirthDate,
          height: parseFloat(captainHeight),
          tshirtSize: captainTshirtSize,
          position: captainPosition,
          foot: captainFoot,
          jerseyNumber: parseInt(captainJerseyNumber),
          isCaptain: true
        }],
        hasCoach: hasCoach,
        status: 'pending_players',
        registrationMode: 'collaborative',
        inviteToken: token,
        minPlayers: 7,
        maxPlayers: 10,
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }

      const docRef = await addDoc(collection(db, 'teamRegistrations'), registrationData)

      // Envoyer l'email au capitaine avec les liens
      try {
        const emailResponse = await fetch('/api/send-captain-invite-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            captainEmail: captainEmail.trim().toLowerCase(),
            captainName: `${captainFirstName.trim()} ${captainLastName.trim()}`,
            teamName: teamName.trim(),
            token,
            hasCoach: hasCoach
          })
        })
        
        if (!emailResponse.ok) {
          const errorData = await emailResponse.json()
          console.error('Erreur envoi email:', errorData)
          // Continue quand même mais log l'erreur
        } else {
          console.log('✅ Email envoyé avec succès au capitaine')
        }
      } catch (emailError) {
        console.error('Erreur envoi email capitaine:', emailError)
        // Continue même si l'email échoue
      }

      // Notifier l'admin qu'un lien collaboratif a été créé
      try {
        const notifyResponse = await fetch('/api/notify-admin-collaborative-created', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            teamName: teamName.trim(),
            schoolName: finalSchoolName.trim(),
            teamGrade: finalGrade,
            captainName: `${captainFirstName.trim()} ${captainLastName.trim()}`,
            captainEmail: captainEmail.trim().toLowerCase(),
            token,
            registrationId: docRef.id
          })
        })
        
        if (!notifyResponse.ok) {
          const errorData = await notifyResponse.json()
          console.error('Erreur notification admin:', errorData)
        } else {
          console.log('✅ Notification admin envoyée pour lien collaboratif')
        }
      } catch (notifyError) {
        console.error('Erreur notification admin:', notifyError)
        // Continue même si la notification échoue
      }

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
            <Link href="/register-team" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
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

            {/* Coach Option */}
            <div>
              <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">Avez-vous un entraîneur ?</h3>
                  <p className="text-sm text-gray-600">Vous recevrez un lien supplémentaire à lui partager</p>
                </div>
                <button
                  type="button"
                  onClick={() => setHasCoach(!hasCoach)}
                  className={`px-4 py-2 rounded-lg transition font-medium ${
                    hasCoach 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {hasCoach ? 'Oui ✓' : 'Non'}
                </button>
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
                    Surnom sur T-shirt *
                  </label>
                  <input
                    type="text"
                    maxLength={15}
                    value={captainNickname}
                    onChange={(e) => setCaptainNickname(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Max 15 caractères"
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date de naissance *
                  </label>
                  <input
                    type="date"
                    value={captainBirthDate}
                    onChange={(e) => setCaptainBirthDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taille (cm) *
                  </label>
                  <input
                    type="number"
                    min="140"
                    max="220"
                    value={captainHeight}
                    onChange={(e) => setCaptainHeight(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="175"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taille T-shirt *
                  </label>
                  <select
                    value={captainTshirtSize}
                    onChange={(e) => setCaptainTshirtSize(e.target.value as any)}
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position *
                  </label>
                  <select
                    value={captainPosition}
                    onChange={(e) => setCaptainPosition(e.target.value as any)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pied *
                  </label>
                  <select
                    value={captainFoot}
                    onChange={(e) => setCaptainFoot(e.target.value as any)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  >
                    <option value="">Sélectionner...</option>
                    <option value="Droitier">Droitier</option>
                    <option value="Gaucher">Gaucher</option>
                    <option value="Ambidextre">Ambidextre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    N° Maillot *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={captainJerseyNumber}
                    onChange={(e) => setCaptainJerseyNumber(e.target.value)}
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
