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

interface CoachData {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  teamId: string
  teamName?: string
  photo?: string
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
        if (!user?.email) {
          setLoading(false)
          return
        }

        // Trouver le coach par email dans coachAccounts
        const coachAccountsQuery = query(
          collection(db, 'coachAccounts'),
          where('email', '==', user.email)
        )
        const coachAccountsSnap = await getDocs(coachAccountsQuery)

        if (coachAccountsSnap.empty) {
          console.log('Aucun coach trouvé pour cet email')
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
          photo: coachDataRaw.photo
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
          photo: coach.photo || ''
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
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!coachData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Profil non trouvé
          </h2>
          <p className="text-gray-600 mb-6">
            Aucun profil coach n'est associé à votre compte.
          </p>
          <Link href="/coach" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mon Profil</h1>
            <p className="text-gray-600">Mes informations personnelles</p>
          </div>
          {!editing ? (
            <button
              onClick={() => {
                // Réinitialiser editData avec les valeurs actuelles
                setEditData({
                  phone: coachData.phone || '',
                  photo: coachData.photo || ''
                })
                setEditing(true)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Edit className="w-4 h-4" />
              Modifier
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditing(false)
                  setEditData({
                    phone: coachData.phone,
                    photo: coachData.photo
                  })
                }}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          )}
        </div>

        {/* Photo et infos principales */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-600 to-green-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
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
                {coachData.firstName} {coachData.lastName}
              </h2>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-4 h-4" />
                <span>Coach</span>
              </div>
            </div>
          </div>

          {/* Équipe */}
          {coachData.teamName && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Mon Équipe</p>
                  <p className="font-bold text-gray-900">{coachData.teamName}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Informations personnelles */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Informations Personnelles
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{coachData.email}</p>
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
                  <p className="font-medium text-gray-900">{coachData.phone || 'Non renseigné'}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Note d'information */}
        {!editing && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 Vous pouvez modifier votre téléphone et photo de profil en cliquant sur "Modifier".
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

