"use client"

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  User, 
  Mail,
  Phone,
  Calendar,
  Ruler,
  Users,
  Activity,
  Shield,
  AlertCircle,
  Trophy,
  Target,
  Edit,
  Save,
  X,
  Camera,
  Upload
} from 'lucide-react'
import Link from 'next/link'
import { calculatePlayerBadges } from '@/lib/player-badges'
import { PlayerBadges } from '@/components/player/player-badges'
import { motion } from 'framer-motion'

interface PlayerData {
  id: string
  firstName: string
  lastName: string
  nickname?: string
  email: string
  phone: string
  position: string
  jerseyNumber: number
  teamId: string
  teamName?: string
  photo?: string
  grade: string
  height: number
  foot: string
  birthDate?: string
  tshirtSize?: string
  stats?: {
    matchesPlayed: number
    minutesPlayed: number
    goals: number
    assists: number
    yellowCards: number
    redCards: number
    cleanSheets?: number
  }
}

interface CoachData {
  firstName: string
  lastName: string
  birthDate: string
  email: string
  phone: string
}

export default function PlayerProfilePage() {
  const { user, isAdmin } = useAuth()
  const [playerData, setPlayerData] = useState<PlayerData | null>(null)
  const [coachData, setCoachData] = useState<CoachData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [editData, setEditData] = useState<Partial<PlayerData>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadPlayerData = async () => {
      try {
        let playerDoc
        let playerDataRaw

        // Vérifier si on est en mode impersonation
        const impersonatePlayerId = sessionStorage.getItem('impersonatePlayerId')
        
        if (isAdmin && impersonatePlayerId) {
          // Charger les données du joueur impersonné
          const playerDocRef = doc(db, 'playerAccounts', impersonatePlayerId)
          const playerDocSnap = await getDoc(playerDocRef)
          
          if (!playerDocSnap.exists()) {
            console.log('Joueur impersonné non trouvé')
            setLoading(false)
            return
          }
          
          playerDoc = playerDocSnap
          playerDataRaw = playerDocSnap.data()
        } else {
          if (!user?.email) {
            setLoading(false)
            return
          }

          // Trouver le joueur par email dans playerAccounts
          const playerAccountsQuery = query(
            collection(db, 'playerAccounts'),
            where('email', '==', user.email)
          )
          const playerAccountsSnap = await getDocs(playerAccountsQuery)

          if (playerAccountsSnap.empty) {
            console.log('Aucun joueur trouvé pour cet email')
            setLoading(false)
            return
          }

          playerDoc = playerAccountsSnap.docs[0]
          playerDataRaw = playerDoc.data()
        }
        
        const player: PlayerData = {
          id: playerDoc.id,
          firstName: playerDataRaw.firstName,
          lastName: playerDataRaw.lastName,
          nickname: playerDataRaw.nickname,
          email: playerDataRaw.email,
          phone: playerDataRaw.phone,
          position: playerDataRaw.position,
          jerseyNumber: playerDataRaw.jerseyNumber,
          teamId: playerDataRaw.teamId,
          teamName: playerDataRaw.teamName,
          photo: playerDataRaw.photo,
          grade: playerDataRaw.grade || '1ère',
          height: playerDataRaw.height || 0,
          foot: playerDataRaw.foot || 'Droitier',
          birthDate: playerDataRaw.birthDate,
          tshirtSize: playerDataRaw.tshirtSize,
          stats: playerDataRaw.stats || {
            matchesPlayed: 0,
            minutesPlayed: 0,
            goals: 0,
            assists: 0,
            yellowCards: 0,
            redCards: 0
          }
        }

        // Récupérer le nom de l'équipe et l'entraîneur si pas déjà présent
        if (player.teamId && !player.teamName) {
          const teamDoc = await getDoc(doc(db, 'teams', player.teamId))
          if (teamDoc.exists()) {
            const teamData = teamDoc.data()
            player.teamName = teamData.name
            
            // Récupérer les infos de l'entraîneur
            if (teamData.coach) {
              setCoachData(teamData.coach)
            }
          }
        }

        setPlayerData(player)
        // Pré-remplir editData avec toutes les valeurs actuelles
        setEditData({
          phone: player.phone || '',
          photo: player.photo || '',
          foot: player.foot || 'Droitier',
          tshirtSize: player.tshirtSize || '',
          birthDate: player.birthDate || '',
          position: player.position || '',
          height: player.height || 0
        })
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPlayerData()
  }, [user, isAdmin])

  const handleSave = async () => {
    if (!user || !playerData) return

    setSaving(true)
    try {
      const updates: any = {}
      
      // Vérifier quels champs ont changé
      if (editData.phone !== playerData.phone) updates.phone = editData.phone
      if (editData.foot !== playerData.foot) updates.foot = editData.foot
      if (editData.tshirtSize !== playerData.tshirtSize) updates.tshirtSize = editData.tshirtSize
      if (editData.birthDate !== playerData.birthDate) updates.birthDate = editData.birthDate
      if (editData.position !== playerData.position) updates.position = editData.position
      if (editData.height !== playerData.height) updates.height = editData.height

      if (Object.keys(updates).length === 0) {
        setEditing(false)
        setSaving(false)
        return
      }

      const response = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.uid,
          userType: 'player',
          updates
        })
      })

      if (response.ok) {
        // Mettre à jour les données locales
        setPlayerData({
          ...playerData,
          ...updates
        })
        setEditing(false)
        alert('Profil mis à jour avec succès!')
      } else {
        const data = await response.json()
        alert(`Erreur: ${data.error}`)
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      alert('Erreur lors de la sauvegarde du profil')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user || !playerData) {
      console.log('Missing file, user, or playerData:', { file: !!file, user: !!user, playerData: !!playerData })
      return
    }

    console.log('📸 Photo upload started:', { fileName: file.name, fileSize: file.size, fileType: file.type })

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      alert('Le fichier doit être une image')
      return
    }

    // Vérifier la taille (max 5MB avant compression)
    if (file.size > 5 * 1024 * 1024) {
      alert('L\'image ne doit pas dépasser 5MB')
      return
    }

    setUploadingPhoto(true)
    try {
      // Compresser l'image si nécessaire (max 800 KB pour base64)
      let fileToUpload = file
      const maxSizeKB = 800 // Limite pour base64 dans Firestore
      const fileSizeKB = file.size / 1024
      
      if (fileSizeKB > maxSizeKB) {
        console.log('📦 Compressing image...', { originalSize: fileSizeKB.toFixed(2), targetSize: maxSizeKB })
        const { compressImage } = await import('@/lib/image-compression')
        fileToUpload = await compressImage(file, maxSizeKB)
        console.log('✅ Image compressed:', { 
          original: `${fileSizeKB.toFixed(2)} KB`, 
          compressed: `${(fileToUpload.size / 1024).toFixed(2)} KB` 
        })
      }
      
      console.log('📤 Uploading via API route...', { playerId: playerData.id, fileName: fileToUpload.name, fileSize: fileToUpload.size })
      
      // Vérifier que l'utilisateur est authentifié
      if (!user || !user.uid) {
        throw new Error('Utilisateur non authentifié')
      }
      
      // Upload via API route (contourne les problèmes CORS)
      const formData = new FormData()
      formData.append('file', fileToUpload)
      formData.append('userId', user.uid)
      formData.append('userType', 'player')
      
      // Ajouter un timeout pour éviter un chargement infini
      const uploadPromise = fetch('/api/profile/upload-photo-client', {
        method: 'POST',
        body: formData
      })
      
      const timeoutPromise = new Promise<Response>((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout après 30 secondes')), 30000)
      )
      
      const response = await Promise.race([uploadPromise, timeoutPromise])
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('❌ Upload failed:', errorData)
        throw new Error(errorData.error || 'Erreur lors de l\'upload')
      }

      const uploadData = await response.json()
      const photoUrl = uploadData.photoUrl
      console.log('✅ Upload successful, photo URL:', photoUrl)
      
      if (!photoUrl) {
        throw new Error('URL de photo non retournée')
      }

      // Mettre à jour les données locales (le profil est déjà mis à jour par l'API)
      setPlayerData({ ...playerData, photo: photoUrl })
      setEditData({ ...editData, photo: photoUrl })
      alert('Photo de profil mise à jour avec succès!')
    } catch (error: any) {
      console.error('❌ Erreur upload photo:', error)
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      })
      alert(`Erreur lors de l'upload de la photo: ${error.message || 'Erreur inconnue'}\n\nVérifiez la console pour plus de détails.`)
    } finally {
      console.log('🔄 Resetting upload state...')
      setUploadingPhoto(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!playerData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Profil non trouvé
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Aucun profil joueur n'est associé à votre compte.
          </p>
          <Link href="/player" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-semibold">
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4 md:p-8 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-center justify-between flex-wrap gap-4"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">Mon Profil</h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Mes informations personnelles</p>
          </div>
          {!editing ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                // Réinitialiser editData avec les valeurs actuelles du profil
                setEditData({
                  phone: playerData.phone || '',
                  photo: playerData.photo || '',
                  foot: playerData.foot || 'Droitier',
                  tshirtSize: playerData.tshirtSize || '',
                  birthDate: playerData.birthDate || '',
                  position: playerData.position || '',
                  height: playerData.height || 0
                })
                setEditing(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg font-semibold"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </motion.button>
          ) : (
            <div className="flex gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setEditing(false)
                  setEditData({
                    phone: playerData.phone,
                    photo: playerData.photo,
                    foot: playerData.foot,
                    tshirtSize: playerData.tshirtSize,
                    birthDate: playerData.birthDate,
                    position: playerData.position,
                    height: playerData.height
                  })
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-all font-semibold"
              >
                <X className="w-4 h-4" />
                Annuler
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 shadow-lg font-semibold"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Photo et infos principales */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl p-6 md:p-8 mb-6"
        >
          <div className="flex items-center gap-6 mb-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                {(editData.photo || playerData.photo) ? (
                  <img 
                    src={editData.photo || playerData.photo} 
                    alt={`${playerData.firstName} ${playerData.lastName}`}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  `${playerData.firstName[0]}${playerData.lastName[0]}`
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white z-10">
                {playerData.jerseyNumber}
              </div>
              
              {/* Bouton pour changer la photo - toujours visible */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute top-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed z-20 border-2 border-white"
                title="Changer la photo"
              >
                {uploadingPhoto ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <span className="text-lg font-bold leading-none">+</span>
                )}
              </button>
            </div>
            
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {playerData.firstName} {playerData.lastName}
                {playerData.nickname && (
                  <span className="text-lg text-blue-600 ml-2">
                    "{playerData.nickname}"
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2 text-gray-600">
                <Activity className="w-4 h-4" />
                <span>{playerData.position} • #{playerData.jerseyNumber}</span>
              </div>
            </div>
          </div>

          {/* Équipe */}
          {playerData.teamName && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3 mb-3">
                <Shield className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Mon Équipe</p>
                  <p className="font-bold text-gray-900">{playerData.teamName}</p>
                </div>
              </div>
              
              {/* Coach Info */}
              {coachData && (
                <div className="mt-3 pt-3 border-t border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-green-600 text-white flex items-center justify-center font-bold text-sm">
                      {coachData.firstName.charAt(0)}{coachData.lastName.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-600">Entraîneur</p>
                      <p className="font-semibold text-gray-900">
                        {coachData.firstName} {coachData.lastName}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-600">
                        {coachData.email && (
                          <span className="flex items-center gap-1">
                            📧 {coachData.email}
                          </span>
                        )}
                        {coachData.phone && (
                          <span className="flex items-center gap-1">
                            📞 {coachData.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Informations personnelles */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Informations Personnelles
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{playerData.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Phone className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Téléphone</p>
                {editing ? (
                  <input
                    type="tel"
                    value={editData.phone || ''}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    placeholder="Numéro de téléphone"
                  />
                ) : (
                  <p className="font-medium text-gray-900">{playerData.phone || 'Non renseigné'}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Classe</p>
                <p className="font-medium text-gray-900">{playerData.grade}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Date de naissance</p>
                {editing ? (
                  <input
                    type="date"
                    value={editData.birthDate || ''}
                    onChange={(e) => setEditData({ ...editData, birthDate: e.target.value })}
                    className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  />
                ) : (
                  <p className="font-medium text-gray-900">
                    {playerData.birthDate ? new Date(playerData.birthDate).toLocaleDateString('fr-FR') : 'Non renseigné'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Informations sportives */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-600" />
            Informations Sportives
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Users className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Position</p>
                {editing ? (
                  <select
                    value={editData.position || ''}
                    onChange={(e) => setEditData({ ...editData, position: e.target.value })}
                    className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="">Sélectionner</option>
                    <option value="Gardien">Gardien</option>
                    <option value="Défenseur">Défenseur</option>
                    <option value="Milieu">Milieu</option>
                    <option value="Attaquant">Attaquant</option>
                  </select>
                ) : (
                  <p className="font-medium text-gray-900">{playerData.position || 'Non renseigné'}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Shield className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Numéro de maillot</p>
                <p className="font-medium text-gray-900">#{playerData.jerseyNumber}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Ruler className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Taille (cm)</p>
                {editing ? (
                  <input
                    type="number"
                    min="100"
                    max="250"
                    value={editData.height || ''}
                    onChange={(e) => setEditData({ ...editData, height: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                    placeholder="Taille en cm"
                  />
                ) : (
                  <p className="font-medium text-gray-900">
                    {playerData.height > 0 ? `${playerData.height} cm` : 'Non renseigné'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Activity className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Pied</p>
                {editing ? (
                  <select
                    value={editData.foot || ''}
                    onChange={(e) => setEditData({ ...editData, foot: e.target.value })}
                    className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="">Sélectionner</option>
                    <option value="Droitier">Droitier</option>
                    <option value="Gaucher">Gaucher</option>
                    <option value="Ambidextre">Ambidextre</option>
                  </select>
                ) : (
                  <p className="font-medium text-gray-900">{playerData.foot || 'Non renseigné'}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-gray-600" />
              <div className="flex-1">
                <p className="text-sm text-gray-600">Taille T-shirt</p>
                {editing ? (
                  <select
                    value={editData.tshirtSize || ''}
                    onChange={(e) => setEditData({ ...editData, tshirtSize: e.target.value })}
                    className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  >
                    <option value="">Sélectionner</option>
                    <option value="4XXS">4XXS</option>
                    <option value="3XXS">3XXS</option>
                    <option value="2XXS">2XXS</option>
                    <option value="XXS">XXS</option>
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                    <option value="3XL">3XL</option>
                    <option value="4XL">4XL</option>
                    <option value="5XL">5XL</option>
                    <option value="6XL">6XL</option>
                    <option value="3XXL">3XXL</option>
                    <option value="4XXL">4XXL</option>
                    <option value="5XXL">5XXL</option>
                    <option value="6XXL">6XXL</option>
                  </select>
                ) : (
                  <p className="font-medium text-gray-900">{playerData.tshirtSize || 'Non renseigné'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Note d'information */}
        {!editing && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 Vous pouvez modifier votre téléphone, photo, position, taille, pied et taille de t-shirt en cliquant sur "Modifier".
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
