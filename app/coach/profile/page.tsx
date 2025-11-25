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
  Users,
  Shield,
  AlertCircle,
  Edit,
  Save,
  X,
  Camera
} from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface CoachData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  teamId: string
  teamName?: string
  photo?: string
  tshirtSize?: string
}

export default function CoachProfilePage() {
  const { user, isAdmin } = useAuth()
  const [coachData, setCoachData] = useState<CoachData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [editData, setEditData] = useState<Partial<CoachData>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const loadCoachData = async () => {
      try {
        if (!user?.email && !isAdmin) {
          console.log('❌ Pas d\'email utilisateur')
          setLoading(false)
          return
        }

        // Si c'est un admin, utiliser des données de démo
        if (isAdmin) {
          // Vérifier si on est en mode impersonation
          const impersonateCoachId = sessionStorage.getItem('impersonateCoachId')
          
          if (impersonateCoachId) {
            // Charger les données du coach impersonné
            const coachDoc = await getDoc(doc(db, 'coachAccounts', impersonateCoachId))
            if (coachDoc.exists()) {
              const data = coachDoc.data()
              const coach: CoachData = {
                id: coachDoc.id,
                firstName: data.firstName,
                lastName: data.lastName,
                email: data.email,
                phone: data.phone || '',
                teamId: data.teamId,
                teamName: data.teamName,
                photo: data.photo,
                tshirtSize: data.tshirtSize
              }
              setCoachData(coach)
              setEditData({
                phone: coach.phone || '',
                photo: coach.photo || '',
                tshirtSize: coach.tshirtSize || ''
              })
              setLoading(false)
              return
            }
          }
          
          // Admin sans impersonation: données de démo
          const coach: CoachData = {
            id: 'admin',
            firstName: 'Admin',
            lastName: 'Comebac',
            email: user?.email || 'contact@comebac.com',
            phone: '',
            teamId: 'demo',
            teamName: 'Équipe Demo',
            photo: '',
            tshirtSize: ''
          }
          setCoachData(coach)
          setEditData({
            phone: '',
            photo: '',
            tshirtSize: ''
          })
          setLoading(false)
          return
        }

        // Normaliser l'email (trim et lowercase pour la recherche)
        const normalizedEmail = user.email.trim().toLowerCase()
        console.log('🔍 Recherche du coach avec email:', user.email, '(normalisé:', normalizedEmail + ')')
        // Essayer d'abord avec l'email exact, puis avec l'email normalisé
        const coachAccountsQuery = query(
          collection(db, 'coachAccounts'),
          where('email', '==', normalizedEmail)
        )
        const coachAccountsSnap = await getDocs(coachAccountsQuery)

        console.log('📊 Résultats de la requête:', {
          empty: coachAccountsSnap.empty,
          size: coachAccountsSnap.size,
          docs: coachAccountsSnap.docs.map(d => ({
            id: d.id,
            email: d.data().email,
            name: `${d.data().firstName} ${d.data().lastName}`
          }))
        })

        if (coachAccountsSnap.empty) {
          // Ne pas logger comme erreur si c'est normal (admin ou coach intérimaire)
          console.log('ℹ️ Aucun coach trouvé pour cet email:', user.email)
          // Essayer aussi avec l'email en lowercase au cas où
          const coachAccountsQueryLower = query(
            collection(db, 'coachAccounts'),
            where('email', '==', user.email.toLowerCase())
          )
          const coachAccountsSnapLower = await getDocs(coachAccountsQueryLower)
          if (!coachAccountsSnapLower.empty) {
            console.log('✅ Trouvé avec email en lowercase')
            const coachDoc = coachAccountsSnapLower.docs[0]
            const coachDataRaw = coachDoc.data()
            
            const coach: CoachData = {
              id: coachDoc.id,
              firstName: coachDataRaw.firstName,
              lastName: coachDataRaw.lastName,
              email: coachDataRaw.email,
              phone: coachDataRaw.phone || '',
              teamId: coachDataRaw.teamId,
              teamName: coachDataRaw.teamName,
              photo: coachDataRaw.photo,
              tshirtSize: coachDataRaw.tshirtSize
            }

            if (coach.teamId && !coach.teamName) {
              const teamDoc = await getDoc(doc(db, 'teams', coach.teamId))
              if (teamDoc.exists()) {
                const teamData = teamDoc.data()
                coach.teamName = teamData.name
              }
            }

            setCoachData(coach)
            setEditData({
              phone: coach.phone || '',
              photo: coach.photo || '',
              tshirtSize: coach.tshirtSize || ''
            })
          setLoading(false)
          return
        }
        
        // Si pas de compte coach, vérifier si c'est un coach intérimaire (joueur avec isActingCoach)
        const playerAccountsQuery = query(
          collection(db, 'playerAccounts'),
          where('email', '==', normalizedEmail),
          where('isActingCoach', '==', true)
        )
        const playerAccountsSnap = await getDocs(playerAccountsQuery)
        
        if (!playerAccountsSnap.empty) {
          console.log('✅ Coach intérimaire trouvé')
          const playerDoc = playerAccountsSnap.docs[0]
          const playerDataRaw = playerDoc.data()
          
          const coach: CoachData = {
            id: playerDoc.id,
            firstName: playerDataRaw.firstName,
            lastName: playerDataRaw.lastName,
            email: playerDataRaw.email,
            phone: playerDataRaw.phone || '',
            teamId: playerDataRaw.teamId,
            teamName: playerDataRaw.teamName,
            photo: playerDataRaw.photo,
            tshirtSize: playerDataRaw.tshirtSize
          }

          if (coach.teamId && !coach.teamName) {
            const teamDoc = await getDoc(doc(db, 'teams', coach.teamId))
            if (teamDoc.exists()) {
              const teamData = teamDoc.data()
              coach.teamName = teamData.name
            }
          }

          setCoachData(coach)
          setEditData({
            phone: coach.phone || '',
            photo: coach.photo || '',
            tshirtSize: coach.tshirtSize || ''
          })
          setLoading(false)
          return
        }
        
        setLoading(false)
          return
        }

        const coachDoc = coachAccountsSnap.docs[0]
        const coachDataRaw = coachDoc.data()
        
        const coach: CoachData = {
          id: coachDoc.id,
          firstName: coachDataRaw.firstName,
          lastName: coachDataRaw.lastName,
          email: coachDataRaw.email,
          phone: coachDataRaw.phone || '',
          teamId: coachDataRaw.teamId,
          teamName: coachDataRaw.teamName,
          photo: coachDataRaw.photo,
          tshirtSize: coachDataRaw.tshirtSize
        }

        // Récupérer le nom de l'équipe si pas déjà présent
        if (coach.teamId && !coach.teamName) {
          const teamDoc = await getDoc(doc(db, 'teams', coach.teamId))
          if (teamDoc.exists()) {
            const teamData = teamDoc.data()
            coach.teamName = teamData.name
          }
        }

        setCoachData(coach)
        // Pré-remplir editData avec toutes les valeurs actuelles
        setEditData({
          phone: coach.phone || '',
          photo: coach.photo || '',
          tshirtSize: coach.tshirtSize || ''
        })
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCoachData()
  }, [user])

  const handleSave = async () => {
    if (!user || !coachData) return

    setSaving(true)
    try {
      const updates: any = {}
      
      // Vérifier quels champs ont changé
      if (editData.phone !== coachData.phone) updates.phone = editData.phone
      if (editData.tshirtSize !== coachData.tshirtSize) updates.tshirtSize = editData.tshirtSize

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
          userType: 'coach',
          updates
        })
      })

      if (response.ok) {
        // Mettre à jour les données locales
        setCoachData({
          ...coachData,
          ...updates
        } as CoachData)
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
    if (!file || !user || !coachData) {
      console.log('Missing file, user, or coachData:', { file: !!file, user: !!user, coachData: !!coachData })
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
      
      console.log('📤 Uploading via API route...', { coachId: coachData.id, fileName: fileToUpload.name, fileSize: fileToUpload.size })
      
      // Vérifier que l'utilisateur est authentifié
      if (!user || !user.uid) {
        throw new Error('Utilisateur non authentifié')
      }
      
      // Upload via API route (contourne les problèmes CORS)
      const formData = new FormData()
      formData.append('file', fileToUpload)
      formData.append('userId', user.uid)
      formData.append('userType', 'coach')
      
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
      setCoachData({ ...coachData, photo: photoUrl })
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

  if (!coachData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 p-8 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl"
        >
          <AlertCircle className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Profil non trouvé
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Aucun profil coach n'est associé à votre compte.
          </p>
          <Link href="/coach" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-semibold inline-block">
            Retour au tableau de bord
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 p-4 md:p-8 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent mb-2">Mon Profil</h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">Mes informations personnelles</p>
          </div>
          {!editing ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                // Réinitialiser editData avec les valeurs actuelles
                setEditData({
                  phone: coachData.phone || '',
                  photo: coachData.photo || '',
                  tshirtSize: coachData.tshirtSize || ''
                })
                setEditing(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl font-semibold"
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
                    phone: coachData.phone,
                    photo: coachData.photo,
                    tshirtSize: coachData.tshirtSize
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
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl font-semibold disabled:opacity-50"
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
          className="bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl p-6 mb-6"
        >
          <div className="flex items-center gap-6 mb-6">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="relative group"
            >
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 flex items-center justify-center text-white text-3xl md:text-4xl font-bold overflow-hidden shadow-xl border-4 border-white dark:border-gray-800">
                {(editData.photo || coachData.photo) ? (
                  <img 
                    src={editData.photo || coachData.photo} 
                    alt={`${coachData.firstName} ${coachData.lastName}`}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  `${coachData.firstName[0]}${coachData.lastName[0]}`
                )}
              </div>
              
              {/* Bouton pour changer la photo - toujours visible */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute top-0 right-0 w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full flex items-center justify-center hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed z-20 border-2 border-white dark:border-gray-800"
                title="Changer la photo"
              >
                {uploadingPhoto ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Camera className="w-4 h-4 md:w-5 md:h-5" />
                )}
              </motion.button>
            </motion.div>
            
            <div className="flex-1">
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-1">
                {coachData.firstName} {coachData.lastName}
              </h2>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Users className="w-4 h-4" />
                <span>Coach</span>
              </div>
            </div>
          </div>

          {/* Équipe */}
          {coachData.teamName && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mon Équipe</p>
                  <p className="font-bold text-gray-900 dark:text-white">{coachData.teamName}</p>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* Informations personnelles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-white via-white to-blue-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl p-6"
        >
          <h3 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <User className="w-5 h-5 text-white" />
            </div>
            Informations Personnelles
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              whileHover={{ scale: 1.02, x: 5 }}
              className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                <p className="font-semibold text-gray-900 dark:text-white">{coachData.email}</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, x: 5 }}
              className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Téléphone</p>
                {editing ? (
                  <input
                    type="tel"
                    value={editData.phone || ''}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
                    placeholder="Numéro de téléphone"
                  />
                ) : (
                  <p className="font-semibold text-gray-900 dark:text-white">{coachData.phone || 'Non renseigné'}</p>
                )}
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02, x: 5 }}
              className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-700"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Taille T-shirt</p>
                {editing ? (
                  <select
                    value={editData.tshirtSize || ''}
                    onChange={(e) => setEditData({ ...editData, tshirtSize: e.target.value })}
                    className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 dark:text-white bg-white dark:bg-gray-700"
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
                  <p className="font-semibold text-gray-900 dark:text-white">{coachData.tshirtSize || 'Non renseigné'}</p>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Note d'information */}
        {!editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
          >
            <p className="text-sm text-blue-800 dark:text-blue-300">
              💡 Vous pouvez modifier votre téléphone et photo de profil en cliquant sur "Modifier".
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

