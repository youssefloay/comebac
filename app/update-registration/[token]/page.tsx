"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Users, Check, AlertCircle, Loader, Plus, Trash2 } from 'lucide-react'
import { SimpleLogo } from '@/components/ui/logo'

interface Player {
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

interface Registration {
  teamName: string
  schoolName: string
  teamGrade: string
  captain: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  players: Player[]
}

export default function UpdateRegistrationPage() {
  const params = useParams()
  const token = params.token as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [registration, setRegistration] = useState<Registration | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    loadRegistration()
  }, [token])

  const loadRegistration = async () => {
    try {
      const res = await fetch(`/api/get-registration-by-token?token=${token}`)
      if (res.ok) {
        const data = await res.json()
        setRegistration(data.registration)
      } else {
        const data = await res.json()
        setError(data.error || 'Lien invalide ou expiré')
      }
    } catch (err) {
      setError('Erreur de chargement')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const res = await fetch('/api/update-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          registration
        })
      })

      if (res.ok) {
        setSuccess(true)
      } else {
        const data = await res.json()
        setError(data.error || 'Erreur lors de la sauvegarde')
      }
    } catch (err) {
      setError('Erreur de connexion')
    } finally {
      setSaving(false)
    }
  }

  const updatePlayer = (index: number, field: keyof Player, value: string) => {
    if (!registration) return
    const newPlayers = [...registration.players]
    newPlayers[index] = { ...newPlayers[index], [field]: value }
    setRegistration({ ...registration, players: newPlayers })
  }

  const addPlayer = () => {
    if (!registration || registration.players.length >= 10) return
    setRegistration({
      ...registration,
      players: [...registration.players, {
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
        grade: registration.teamGrade
      }]
    })
  }

  const removePlayer = (index: number) => {
    if (!registration || registration.players.length <= 7) return
    setRegistration({
      ...registration,
      players: registration.players.filter((_, i) => i !== index)
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    )
  }

  if (error && !registration) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Lien invalide</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Modifications enregistrées!</h1>
          <p className="text-gray-600 mb-4">
            Vos modifications ont été soumises avec succès.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
            <p className="text-sm text-blue-800">
              <strong>Prochaines étapes:</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 list-disc list-inside">
              <li>Un administrateur va valider vos modifications</li>
              <li>Vous serez contacté par email</li>
              <li>La validation prend généralement 24-48h</li>
            </ul>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 light">
      <style jsx global>{`
        input, select, textarea {
          color: #111827 !important;
          background-color: white !important;
        }
      `}</style>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center mb-8">
          <SimpleLogo className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Mettre à jour l'inscription
          </h1>
          <p className="text-gray-600">
            Équipe: <strong>{registration?.teamName}</strong>
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team Info */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Informations de l'équipe</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'équipe
                </label>
                <input
                  type="text"
                  value={registration?.teamName || ''}
                  onChange={(e) => setRegistration(registration ? {...registration, teamName: e.target.value} : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  École
                </label>
                <input
                  type="text"
                  value={registration?.schoolName || ''}
                  onChange={(e) => setRegistration(registration ? {...registration, schoolName: e.target.value} : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Captain Info */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Capitaine</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                <input
                  type="text"
                  value={registration?.captain.firstName || ''}
                  onChange={(e) => setRegistration(registration ? {...registration, captain: {...registration.captain, firstName: e.target.value}} : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                <input
                  type="text"
                  value={registration?.captain.lastName || ''}
                  onChange={(e) => setRegistration(registration ? {...registration, captain: {...registration.captain, lastName: e.target.value}} : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={registration?.captain.email || ''}
                  onChange={(e) => setRegistration(registration ? {...registration, captain: {...registration.captain, email: e.target.value}} : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                <input
                  type="tel"
                  value={registration?.captain.phone || ''}
                  onChange={(e) => setRegistration(registration ? {...registration, captain: {...registration.captain, phone: e.target.value}} : null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Players */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Joueurs ({registration?.players.length}/10)
              </h2>
              {registration && registration.players.length < 10 && (
                <button
                  type="button"
                  onClick={addPlayer}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </button>
              )}
            </div>

            <div className="space-y-4">
              {registration?.players.map((player, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">Joueur {index + 1}</h3>
                    {registration.players.length > 7 && (
                      <button
                        type="button"
                        onClick={() => removePlayer(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Prénom *</label>
                      <input
                        type="text"
                        value={player.firstName}
                        onChange={(e) => updatePlayer(index, 'firstName', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nom *</label>
                      <input
                        type="text"
                        value={player.lastName}
                        onChange={(e) => updatePlayer(index, 'lastName', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Surnom</label>
                      <input
                        type="text"
                        value={player.nickname}
                        onChange={(e) => updatePlayer(index, 'nickname', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                        maxLength={15}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
                      <input
                        type="email"
                        value={player.email}
                        onChange={(e) => updatePlayer(index, 'email', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone *</label>
                      <input
                        type="tel"
                        value={player.phone}
                        onChange={(e) => updatePlayer(index, 'phone', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Date de naissance *</label>
                      <input
                        type="date"
                        value={player.birthDate}
                        onChange={(e) => updatePlayer(index, 'birthDate', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Taille (cm) *</label>
                      <input
                        type="number"
                        value={player.height}
                        onChange={(e) => updatePlayer(index, 'height', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                        min="100"
                        max="250"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">T-shirt *</label>
                      <select
                        value={player.tshirtSize}
                        onChange={(e) => updatePlayer(index, 'tshirtSize', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
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
                      <label className="block text-xs font-medium text-gray-600 mb-1">Position *</label>
                      <select
                        value={player.position}
                        onChange={(e) => updatePlayer(index, 'position', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
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
                      <label className="block text-xs font-medium text-gray-600 mb-1">Pied *</label>
                      <select
                        value={player.foot}
                        onChange={(e) => updatePlayer(index, 'foot', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                        required
                      >
                        <option value="">Sélectionner...</option>
                        <option value="Droitier">Droitier</option>
                        <option value="Gaucher">Gaucher</option>
                        <option value="Ambidextre">Ambidextre</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">N° Maillot *</label>
                      <input
                        type="number"
                        value={player.jerseyNumber}
                        onChange={(e) => updatePlayer(index, 'jerseyNumber', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                        min="1"
                        max="99"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
