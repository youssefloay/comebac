"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth-context'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useRouter } from 'next/navigation'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Users, Shield, User, Edit, Save, X, Trash2, Mail } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAdminI18n } from '@/lib/i18n/admin-i18n-context'

interface Account {
  id: string
  uid: string
  email: string
  firstName?: string
  lastName?: string
  role: 'user' | 'player' | 'admin' | 'coach'
  teamId?: string
  teamName?: string
  position?: string
  jerseyNumber?: number
  createdAt: any
  collection: 'playerAccounts' | 'users' | 'userProfiles' | 'coachAccounts'
  collections?: string[] // Pour les comptes fusionnés (plusieurs collections)
  hasLoggedIn?: boolean
  profileCompleted?: boolean
}

interface Team {
  id: string
  name: string
}

export default function AccountsManagementPage() {
  const { user, loading: authLoading, isAdmin } = useAuth()
  const router = useRouter()
  const { t } = useAdminI18n()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [editingAccount, setEditingAccount] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Account>>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [filter, setFilter] = useState<'all' | 'user' | 'player' | 'admin'>('all')
  const [showActionsMenu, setShowActionsMenu] = useState<string | null>(null)

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
      loadData()
    }
  }, [user, isAdmin])

  const parseFullName = (fullName?: string) => {
    if (!fullName) {
      return { firstName: undefined, lastName: undefined }
    }
    const parts = fullName.trim().split(' ')
    if (parts.length === 0) {
      return { firstName: undefined, lastName: undefined }
    }
    const [firstName, ...rest] = parts
    return { firstName, lastName: rest.join(' ') || undefined }
  }

  const loadData = async () => {
    try {
      // Charger les équipes
      const teamsSnap = await getDocs(collection(db, 'teams'))
      const teamsData = teamsSnap.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      })) as Team[]
      setTeams(teamsData)

      // Charger les comptes coaches
      const coachAccountsSnap = await getDocs(collection(db, 'coachAccounts'))
      const coachAccounts = coachAccountsSnap.docs.map(doc => {
        const data = doc.data()
        const team = teamsData.find(t => t.id === data.teamId)
        return {
          id: doc.id,
          uid: data.uid || doc.id,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: 'coach' as const,
          teamId: data.teamId,
          teamName: team?.name || data.teamName,
          createdAt: data.createdAt,
          collection: 'coachAccounts' as const,
          hasLoggedIn: !!data.lastLogin
        }
      })

      // Charger les comptes joueurs
      const playerAccountsSnap = await getDocs(collection(db, 'playerAccounts'))
      const playerAccounts = playerAccountsSnap.docs.map(doc => {
        const data = doc.data()
        const team = teamsData.find(t => t.id === data.teamId)
        return {
          id: doc.id,
          uid: data.uid,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          role: 'player' as const,
          teamId: data.teamId,
          teamName: team?.name,
          position: data.position,
          jerseyNumber: data.jerseyNumber,
          createdAt: data.createdAt,
          collection: 'playerAccounts' as const,
          hasLoggedIn: !!data.lastLogin
        }
      })

      // Charger les userProfiles pour enrichir les données
      const userProfilesSnap = await getDocs(collection(db, 'userProfiles'))
      const profilesByUid = new Map<string, { id: string; data: any }>()
      const profilesByEmail = new Map<string, { id: string; data: any }>()
      userProfilesSnap.docs.forEach(doc => {
        const data = doc.data()
        const uidKey = (data.uid || doc.id) as string
        if (uidKey) {
          profilesByUid.set(uidKey, { id: doc.id, data })
        }
        if (data.email) {
          profilesByEmail.set(data.email.toLowerCase().trim(), { id: doc.id, data })
        }
      })

      // Charger les comptes utilisateurs/admins
      const usersSnap = await getDocs(collection(db, 'users'))
      const userAccounts = usersSnap.docs.map(doc => {
        const data = doc.data()
        const normalizedEmail = data.email?.toLowerCase().trim()
        const profile = profilesByUid.get(doc.id) || (normalizedEmail ? profilesByEmail.get(normalizedEmail) : undefined)
        const { firstName, lastName } = parseFullName(profile?.data?.fullName)

        return {
          id: doc.id,
          uid: doc.id,
          email: data.email,
          firstName: firstName || data.firstName,
          lastName: lastName || data.lastName,
          role: (profile?.data?.role || data.role || 'user') as 'user' | 'player' | 'admin',
          teamId: profile?.data?.teamId,
          teamName: profile?.data?.teamName,
          createdAt: data.createdAt,
          collection: 'users' as const,
          hasLoggedIn: !!data.lastLogin,
          profileCompleted: !!profile
        }
      })

      // Ajouter les profils orphelins (profil sans entrée users)
      const userIds = new Set(userAccounts.map(account => account.uid))
      const orphanProfiles = userProfilesSnap.docs
        .filter(doc => {
          const data = doc.data()
          const uidKey = data.uid || doc.id
          return data.email && (!uidKey || !userIds.has(uidKey))
        })
        .map(doc => {
          const data = doc.data()
          const { firstName, lastName } = parseFullName(data.fullName)
          return {
            id: doc.id,
            uid: data.uid,
            email: data.email,
            firstName,
            lastName,
            role: (data.role || 'user') as 'user' | 'player' | 'admin',
            teamId: data.teamId,
            teamName: data.teamName,
            createdAt: data.createdAt,
            collection: 'userProfiles' as const,
            profileCompleted: true
          }
        })

      // Regrouper les comptes par email pour éviter les doublons dans l'affichage
      const accountsByEmail = new Map<string, Account[]>()
      
      const allAccountsRaw = [...coachAccounts, ...playerAccounts, ...userAccounts, ...orphanProfiles]
      
      // Grouper par email
      allAccountsRaw.forEach(account => {
        const email = account.email?.toLowerCase()?.trim()
        if (email) {
          if (!accountsByEmail.has(email)) {
            accountsByEmail.set(email, [])
          }
          accountsByEmail.get(email)!.push(account)
        }
      })
      
      // Pour chaque email, garder le meilleur compte (priorité: playerAccounts > users > userProfiles)
      const deduplicatedAccounts: Account[] = []
      
      accountsByEmail.forEach((accounts, email) => {
        if (accounts.length === 1) {
          // Un seul compte, s'assurer que teamName est correct
          const account = accounts[0]
          if (account.teamId) {
            const team = teamsData.find(t => t.id === account.teamId)
            if (team) {
              account.teamName = team.name
            }
          }
          deduplicatedAccounts.push(account)
        } else {
          // Plusieurs comptes, fusionner intelligemment
          // Priorité: coachAccounts > playerAccounts > users > userProfiles
          const coachAccount = accounts.find(a => a.collection === 'coachAccounts')
          const playerAccount = accounts.find(a => a.collection === 'playerAccounts')
          const userAccount = accounts.find(a => a.collection === 'users')
          const profileAccount = accounts.find(a => a.collection === 'userProfiles')
          
          // Créer un compte fusionné avec toutes les informations
          // Priorité: coach > player > user
          const mergedTeamId = coachAccount?.teamId || playerAccount?.teamId || userAccount?.teamId || profileAccount?.teamId
          const mergedTeam = mergedTeamId ? teamsData.find(t => t.id === mergedTeamId) : null
          
          const mergedAccount: Account = {
            ...(coachAccount || playerAccount || userAccount || profileAccount || accounts[0]),
            // Ajouter un champ pour indiquer les collections liées
            collections: accounts.map(a => a.collection),
            // Prendre les meilleures données de chaque source (priorité: coach > player > user)
            firstName: coachAccount?.firstName || playerAccount?.firstName || userAccount?.firstName || profileAccount?.firstName || accounts[0].firstName,
            lastName: coachAccount?.lastName || playerAccount?.lastName || userAccount?.lastName || profileAccount?.lastName || accounts[0].lastName,
            role: coachAccount?.role || playerAccount?.role || userAccount?.role || profileAccount?.role || accounts[0].role,
            teamId: mergedTeamId,
            teamName: mergedTeam?.name || coachAccount?.teamName || playerAccount?.teamName || userAccount?.teamName || profileAccount?.teamName,
            position: playerAccount?.position,
            jerseyNumber: playerAccount?.jerseyNumber,
            hasLoggedIn: userAccount?.hasLoggedIn || playerAccount?.hasLoggedIn || coachAccount?.hasLoggedIn || false,
            profileCompleted: profileAccount?.profileCompleted || userAccount?.profileCompleted || false
          } as any
          
          deduplicatedAccounts.push(mergedAccount)
        }
      })
      
      setAccounts(deduplicatedAccounts)
    } catch (error) {
      console.error('Erreur lors du chargement des comptes:', error)
      setMessage({ type: 'error', text: t.accounts.loadError })
    } finally {
      setLoading(false)
    }
  }

  const startEdit = (account: Account) => {
    setEditingAccount(account.id)
    setEditForm({
      firstName: account.firstName || '',
      lastName: account.lastName || '',
      role: account.role,
      teamId: account.teamId
    })
  }

  const cancelEdit = () => {
    setEditingAccount(null)
    setEditForm({})
  }

  const saveAccount = async (accountId: string) => {
    setSaving(true)
    setMessage(null)

    try {
      const account = accounts.find(a => a.id === accountId)
      if (!account) return

      const updates: Record<string, any> = {}
      if (editForm.firstName !== undefined) {
        const newFirstName = editForm.firstName.trim()
        const currentFirstName = (account.firstName || '').trim()
        if (newFirstName !== currentFirstName) {
          updates.firstName = newFirstName
        }
      }
      if (editForm.lastName !== undefined) {
        const newLastName = editForm.lastName.trim()
        const currentLastName = (account.lastName || '').trim()
        if (newLastName !== currentLastName) {
          updates.lastName = newLastName
        }
      }
      if (editForm.role && editForm.role !== account.role) {
        updates.role = editForm.role
      }

      if (Object.keys(updates).length === 0) {
        setMessage({ type: 'error', text: t.accounts.noChanges })
        return
      }

      const response = await fetch('/api/admin/update-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: account.id,
          accountType: account.collection === 'playerAccounts'
            ? 'player'
            : account.role === 'admin'
              ? 'admin'
              : 'user',
          uid: account.uid,
          teamId: editForm.teamId || account.teamId,
          updates
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Compte mis à jour avec succès!' })
        setEditingAccount(null)
        setEditForm({})
        loadData()
      } else {
        setMessage({ type: 'error', text: data.error || t.accounts.updateError })
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      setMessage({ type: 'error', text: t.accounts.updateErrorDetails })
    } finally {
      setSaving(false)
    }
  }

  const deleteAccount = async (account: Account) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le compte de ${account.firstName} ${account.lastName} (${account.email})?\n\nCette action est irréversible!`)) {
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const collection_name = account.collection
      
      const response = await fetch('/api/admin/manage-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete',
          uid: account.uid,
          accountId: account.id,
          collection: collection_name
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: t.accounts.deleteSuccess })
        loadData()
      } else {
        setMessage({ type: 'error', text: data.error || t.accounts.deleteError })
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      setMessage({ type: 'error', text: t.accounts.deleteErrorDetails })
    } finally {
      setSaving(false)
      setShowActionsMenu(null)
    }
  }

  const sendPasswordReset = async (account: Account) => {
    if (!confirm(`${t.accounts.resetConfirm} ${account.email}?`)) {
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/manage-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resetPassword',
          email: account.email
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: `${t.accounts.resetSuccess} ${account.email}!` })
        console.log('Lien de réinitialisation:', data.resetLink)
      } else {
        setMessage({ type: 'error', text: data.error || t.accounts.resetError })
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error)
      setMessage({ type: 'error', text: t.accounts.resetErrorDetails })
    } finally {
      setSaving(false)
      setShowActionsMenu(null)
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

  const filteredAccounts = accounts.filter(acc => 
    filter === 'all' ? true : acc.role === filter
  )

  const stats = {
    total: accounts.length,
    users: accounts.filter(a => a.role === 'user').length,
    players: accounts.filter(a => a.role === 'player').length,
    coaches: accounts.filter(a => a.role === 'coach').length,
    admins: accounts.filter(a => a.role === 'admin').length
  }

  // Debug: vérifier que t est bien défini
  if (!t || !t.accounts) {
    console.error('❌ Traductions non disponibles:', { t, hasAccounts: !!t?.accounts })
    return (
      <div className="p-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p className="font-bold">{t.accounts.translationError}</p>
          <p>{t.accounts.translationErrorDetails}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6 md:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2 flex items-center gap-2 sm:gap-3">
            <Users className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-600" />
            <span className="leading-tight">{t.accounts.title}</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600">{t.accounts.subtitle}</p>
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

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
          <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">{t.common.total}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-400 opacity-20 hidden sm:block" />
            </div>
          </div>
          <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">{t.accounts.users}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600">{stats.users}</p>
              </div>
              <User className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-blue-600 opacity-20 hidden sm:block" />
            </div>
          </div>
          <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">{t.accounts.players}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600">{stats.players}</p>
              </div>
              <Users className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-green-600 opacity-20 hidden sm:block" />
            </div>
          </div>
          <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">{t.accounts.coaches || 'Coaches'}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-orange-600">{stats.coaches}</p>
              </div>
              <User className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-orange-600 opacity-20 hidden sm:block" />
            </div>
          </div>
          <div className="bg-white p-3 sm:p-4 md:p-6 rounded-lg border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600">{t.accounts.admins}</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600">{stats.admins}</p>
              </div>
              <Shield className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-purple-600 opacity-20 hidden sm:block" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-3 sm:p-4 rounded-lg border border-gray-200 mb-4 sm:mb-6 shadow-sm">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition whitespace-nowrap text-sm sm:text-base flex-shrink-0 touch-manipulation ${
                filter === 'all' ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
              }`}
              style={{ minHeight: '44px' }}
            >
              {t.accounts.all} ({stats.total})
            </button>
            <button
              onClick={() => setFilter('user')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition whitespace-nowrap text-sm sm:text-base flex-shrink-0 touch-manipulation ${
                filter === 'user' ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
              }`}
              style={{ minHeight: '44px' }}
            >
              {t.accounts.users} ({stats.users})
            </button>
            <button
              onClick={() => setFilter('player')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition whitespace-nowrap text-sm sm:text-base flex-shrink-0 touch-manipulation ${
                filter === 'player' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
              }`}
              style={{ minHeight: '44px' }}
            >
              {t.accounts.players} ({stats.players})
            </button>
            <button
              onClick={() => setFilter('coach')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition whitespace-nowrap text-sm sm:text-base flex-shrink-0 touch-manipulation ${
                filter === 'coach' ? 'bg-orange-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
              }`}
              style={{ minHeight: '44px' }}
            >
              {t.accounts.coaches || 'Coaches'} ({stats.coaches})
            </button>
            <button
              onClick={() => setFilter('admin')}
              className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition whitespace-nowrap text-sm sm:text-base flex-shrink-0 touch-manipulation ${
                filter === 'admin' ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
              }`}
              style={{ minHeight: '44px' }}
            >
              {t.accounts.admins} ({stats.admins})
            </button>
          </div>
        </div>

        {/* Accounts Table */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full min-w-[640px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.accounts.user}
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.accounts.role}
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.accounts.team}
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t.common.actions}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAccounts.map((account, index) => (
                  <motion.tr
                    key={account.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      {editingAccount === account.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editForm.firstName || ''}
                            onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Prénom"
                          />
                          <input
                            type="text"
                            value={editForm.lastName || ''}
                            onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                            placeholder="Nom"
                          />
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {account.firstName} {account.lastName}
                          </div>
                          {account.position && (
                            <div className="text-xs text-gray-500">
                              {account.position} • #{account.jerseyNumber}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      <div className="text-xs sm:text-sm text-gray-900 break-all">{account.email}</div>
                      {account.collections && account.collections.length > 1 && (
                        <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          <span>⚠️</span>
                          <span>Fusionné: {account.collections.join(', ')}</span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      {editingAccount === account.id ? (
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                          className="px-3 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="user">{t.accounts.user}</option>
                          <option value="player">{t.accounts.player}</option>
                          <option value="coach">{t.accounts.coaches || 'Coach'}</option>
                          <option value="admin">{t.accounts.admin}</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          account.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          account.role === 'player' ? 'bg-green-100 text-green-800' :
                          account.role === 'coach' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {account.role === 'admin' ? t.accounts.admin : 
                           account.role === 'player' ? t.accounts.player : 
                           account.role === 'coach' ? (t.accounts.coaches || 'Coach') : 
                           t.accounts.user}
                        </span>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4">
                      {editingAccount === account.id && editForm.role === 'player' ? (
                        <select
                          value={editForm.teamId || ''}
                          onChange={(e) => setEditForm({ ...editForm, teamId: e.target.value })}
                          className="px-3 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="">{t.accounts.selectTeam}</option>
                          {teams.map(team => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="text-sm text-gray-900">
                          {account.teamName || '-'}
                        </div>
                      )}
                    </td>
                    <td className="px-3 sm:px-6 py-3 sm:py-4 text-sm font-medium">
                      {editingAccount === account.id ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => saveAccount(account.id)}
                            disabled={saving}
                            className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 disabled:bg-gray-400 transition font-medium text-sm touch-manipulation flex items-center justify-center gap-1.5"
                            title={t.common.save}
                            style={{ minHeight: '40px' }}
                          >
                            <Save className="w-4 h-4" />
                            <span className="hidden xs:inline">{t.common.save}</span>
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={saving}
                            className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 disabled:bg-gray-400 transition font-medium text-sm touch-manipulation flex items-center justify-center gap-1.5"
                            title={t.common.cancel}
                            style={{ minHeight: '40px' }}
                          >
                            <X className="w-4 h-4" />
                            <span className="hidden xs:inline">{t.common.cancel}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 relative">
                          <button
                            onClick={() => startEdit(account)}
                            className="px-2.5 sm:px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition touch-manipulation flex items-center justify-center"
                            title={t.common.edit}
                            style={{ minHeight: '40px', minWidth: '40px' }}
                          >
                            <Edit className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <button
                            onClick={() => sendPasswordReset(account)}
                            disabled={saving}
                            className="px-2.5 sm:px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 active:bg-orange-800 disabled:bg-gray-400 transition touch-manipulation flex items-center justify-center"
                            title={t.accounts.resetPassword}
                            style={{ minHeight: '40px', minWidth: '40px' }}
                          >
                            <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <button
                            onClick={() => deleteAccount(account)}
                            disabled={saving}
                            className="px-2.5 sm:px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:bg-red-800 disabled:bg-gray-400 transition touch-manipulation flex items-center justify-center"
                            title={t.common.delete}
                            style={{ minHeight: '40px', minWidth: '40px' }}
                          >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
