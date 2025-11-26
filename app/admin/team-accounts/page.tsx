"use client"

import { useState, useEffect } from "react"
import { ArrowLeft, Mail, CheckCircle, XCircle, Clock, Send } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAdminI18n } from '@/lib/i18n/admin-i18n-context'

interface Player {
  id: string
  email: string
  name: string
  hasAccount: boolean
  lastSignIn: string | null
  emailVerified: boolean
  createdAt: string | null
  lastResendDate: string | null
}

interface Coach {
  id: string
  uid?: string | null
  email: string
  firstName?: string
  lastName?: string
  name: string
  hasAccount: boolean
  lastSignIn: string | null
  emailVerified: boolean
  createdAt: string | null
  lastResendDate: string | null
}

interface Team {
  id: string
  name: string
  players: Player[]
  coaches: Coach[]
  connectedCount: number
  neverConnectedCount: number
  noAccountCount: number
}

export default function TeamAccountsPage() {
  const router = useRouter()
  const { t } = useAdminI18n()
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<Team[]>([])
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)
  const [creatingPlayerAccount, setCreatingPlayerAccount] = useState<string | null>(null)
  const [creatingCoachAccount, setCreatingCoachAccount] = useState<string | null>(null)
  const [teamResending, setTeamResending] = useState<string | null>(null)

  useEffect(() => {
    loadTeamAccounts()
  }, [])

  const loadTeamAccounts = async () => {
    try {
      const response = await fetch('/api/admin/team-accounts')
      if (response.ok) {
        const data = await response.json()
        setTeams(data.teams.map((team: Team) => ({
          ...team,
          coaches: team.coaches || []
        })))
      }
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  const sendActivationEmail = async (email: string, name: string) => {
    setSendingEmail(email)
    try {
      console.log(`📧 Tentative d'envoi d'email à ${email}...`)
      const response = await fetch('/api/admin/resend-activation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name })
      })

      console.log(`📧 Réponse reçue:`, response.status, response.statusText)

      const data = await response.json().catch(() => ({ 
        error: 'Erreur lors de la lecture de la réponse',
        success: false
      }))

      console.log(`📧 Données reçues:`, data)

      if (response.ok && data.success) {
        console.log(`✅ Email envoyé avec succès:`, data)
        let message = `✅ Email d'activation envoyé à ${email}`
        if (data.emailId) {
          message += `\n\n📧 Email ID: ${data.emailId}`
          message += `\n🔍 Vérifiez le statut: https://resend.com/emails/${data.emailId}`
          message += `\n\n💡 Si l'email n'arrive pas:`
          message += `\n- Vérifiez les spams`
          message += `\n- Vérifiez le statut sur Resend`
          message += `\n- Attendez quelques minutes (greylisting possible)`
        }
        alert(message)
        await loadTeamAccounts() // Recharger pour afficher la nouvelle date de relance
      } else {
        console.error(`❌ Erreur API:`, response.status, data)
        const errorMessage = data.error || data.details || `Erreur ${response.status}`
        
        // Message spécial pour les erreurs de configuration
        if (data.isConfigError) {
          alert(`❌ Configuration manquante:\n\n${errorMessage}\n\n⚠️ Action requise: Configurez RESEND_API_KEY dans les variables d'environnement de Vercel.`)
        } else {
          alert(`❌ Erreur: ${errorMessage}\n\nVérifiez la console du navigateur (F12) pour plus de détails.`)
        }
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'envoi:', error)
      console.error('❌ Stack:', error.stack)
      alert(`❌ Erreur lors de l'envoi: ${error.message || 'Erreur de connexion'}\n\nVérifiez la console du navigateur (F12) pour plus de détails.`)
    } finally {
      setSendingEmail(null)
    }
  }

  const createPlayerAccount = async (playerId: string, playerName: string) => {
    setCreatingPlayerAccount(playerId)
    try {
      const response = await fetch('/api/admin/create-account-from-player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId })
      })

      if (response.ok) {
        alert(`✅ Compte créé pour ${playerName}`)
        await loadTeamAccounts()
      } else {
        const data = await response.json()
        alert(`❌ Erreur: ${data.error}`)
      }
    } catch (error) {
      alert('❌ Erreur lors de la création du compte')
    } finally {
      setCreatingPlayerAccount(null)
    }
  }

  const createCoachAccount = async (coach: Coach, teamName: string) => {
    setCreatingCoachAccount(coach.id)
    try {
      const response = await fetch('/api/admin/create-coach-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: coach.email,
          firstName: coach.firstName || coach.name.split(' ')[0] || 'Coach',
          lastName: coach.lastName || coach.name.split(' ').slice(1).join(' '),
          teamName
        })
      })

      if (response.ok) {
        alert(`✅ Compte créé pour ${coach.name}`)
        await loadTeamAccounts()
      } else {
        const data = await response.json()
        alert(`❌ Erreur: ${data.error}`)
      }
    } catch (error) {
      alert('❌ Erreur lors de la création du compte coach')
    } finally {
      setCreatingCoachAccount(null)
    }
  }

  const resendTeamActivations = async (teamId: string, teamName: string, players: Player[], coaches: Coach[]) => {
    const targets = [...players, ...coaches].filter(person => person.hasAccount && !person.lastSignIn)
    if (targets.length === 0) {
      alert('Aucun joueur à relancer pour cette équipe')
      return
    }

    if (!confirm(`Relancer ${targets.length} joueur(s) pour ${teamName} ?`)) {
      return
    }

    setTeamResending(teamId)
    let successCount = 0
    let errorCount = 0

    for (const player of targets) {
      try {
        console.log(`📧 Relance pour ${player.name} (${player.email})...`)
        const response = await fetch('/api/admin/resend-activation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: player.email, name: player.name })
        })

        if (response.ok) {
          console.log(`✅ Email envoyé à ${player.email}`)
          successCount++
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
          console.error(`❌ Erreur pour ${player.email}:`, response.status, errorData)
          errorCount++
        }
      } catch (error: any) {
        console.error(`❌ Erreur réseau pour ${player.email}:`, error)
        errorCount++
      }
    }

    alert(`Relance terminée: ${successCount} email(s) envoyé(s), ${errorCount} erreur(s)`)
    setTeamResending(null)
    await loadTeamAccounts() // Recharger pour afficher les nouvelles dates de relance
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Jamais'
    try {
      return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(dateStr))
    } catch {
      return 'Date invalide'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Retour
          </button>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t.teamAccounts.title}</h1>
              <p className="text-sm sm:text-base text-gray-600">{t.teamAccounts.subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Stats globales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {teams.reduce((sum, t) => sum + t.connectedCount, 0)}
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">{t.teamAccounts.connected}</p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {teams.reduce((sum, t) => sum + t.neverConnectedCount, 0)}
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">{t.teamAccounts.neverConnected}</p>
          </div>

          <div className="bg-white rounded-xl p-4 sm:p-5 md:p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 sm:gap-3 mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              </div>
              <div className="text-xl sm:text-2xl font-bold text-gray-900">
                {teams.reduce((sum, t) => sum + t.noAccountCount, 0)}
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-600">{t.teamAccounts.noAccount}</p>
          </div>
        </div>

        {/* Liste par équipe */}
        <div className="space-y-6">
          {teams.map((team) => {
            const connectedPlayers = team.players.filter(
              (player) => player.hasAccount && !!player.lastSignIn
            )
            const neverConnectedPlayers = team.players.filter(
              (player) => player.hasAccount && !player.lastSignIn
            )
            const noAccountPlayers = team.players.filter((player) => !player.hasAccount)

            return (
              <div key={team.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                {/* Header équipe */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">{team.name}</h2>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm">
                      <span className="flex items-center gap-1 text-green-600 whitespace-nowrap">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        {connectedPlayers.length} {t.teamAccounts.connected}
                      </span>
                      <span className="flex items-center gap-1 text-orange-600 whitespace-nowrap">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                        {neverConnectedPlayers.length} {t.teamAccounts.neverConnected}
                      </span>
                      <span className="flex items-center gap-1 text-red-600 whitespace-nowrap">
                        <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        {noAccountPlayers.length} {t.teamAccounts.noAccount}
                      </span>
                    </div>
                    <button
                      onClick={() => resendTeamActivations(team.id, team.name, team.players, team.coaches)}
                      disabled={teamResending === team.id || neverConnectedPlayers.length === 0}
                      className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full border border-orange-200 text-orange-700 hover:bg-orange-100 active:bg-orange-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-xs sm:text-sm touch-manipulation w-full sm:w-auto"
                      style={{ minHeight: '40px' }}
                    >
                      {teamResending === team.id ? (
                        <>
                          <div className="w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                          {t.common.loading}
                        </>
                      ) : (
                        <>
                          <Send className="w-3 h-3" />
                          {t.teamAccounts.resendTeam}
                        </>
                      )}
                    </button>
                  </div>
                </div>
                </div>

                {/* Listes catégorisées */}
                <div className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
                  {team.coaches.length > 0 && (
                    <div className="rounded-xl border border-blue-100 bg-blue-50/60">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-blue-100">
                        <div className="flex items-center gap-2 text-blue-700 font-semibold">
                          👤 {t.teamAccounts.coaches} ({team.coaches.length})
                        </div>
                      </div>
                      <div className="divide-y divide-blue-100">
                        {team.coaches.map((coach) => {
                          const status = coach.hasAccount
                            ? (coach.lastSignIn
                              ? `${t.teamAccounts.lastLogin}: ${formatDate(coach.lastSignIn)}`
                              : t.teamAccounts.accountCreated + ' ' + t.teamAccounts.neverConnected)
                            : t.teamAccounts.noAccount

                          return (
                            <div key={coach.id} className="px-4 py-3">
                              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                <div>
                                  <p className="font-semibold text-gray-900">{coach.name}</p>
                                  <p className="text-sm text-gray-600">{coach.email}</p>
                                  <p className={`text-xs mt-1 ${coach.hasAccount ? 'text-blue-700' : 'text-red-600'}`}>
                                    {status}
                                  </p>
                                  {coach.createdAt && coach.hasAccount && (
                                    <p className="text-xs text-gray-500">
                                      {t.teamAccounts.accountCreated}: {formatDate(coach.createdAt)}
                                    </p>
                                  )}
                                  {coach.lastResendDate && (
                                    <p className="text-xs text-orange-600 font-medium">
                                      📧 {t.teamAccounts.lastResend}: {formatDate(coach.lastResendDate)}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {coach.hasAccount ? (
                                    <button
                                      onClick={() => sendActivationEmail(coach.email, coach.name)}
                                      disabled={sendingEmail === coach.email}
                                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {sendingEmail === coach.email ? (
                                        <>
                                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                          Envoi...
                                        </>
                                      ) : (
                                        <>
                                          <Send className="w-3 h-3" />
                                          {t.teamAccounts.resendEmail}
                                        </>
                                      )}
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => createCoachAccount(coach, team.name)}
                                      disabled={creatingCoachAccount === coach.id}
                                      className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                      {creatingCoachAccount === coach.id ? (
                                        <>
                                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                          {t.common.loading}
                                        </>
                                      ) : (
                                        <>
                                          <Send className="w-3 h-3" />
                                          {t.teamAccounts.createAccount}
                                        </>
                                      )}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Déjà connectés */}
                    <div className="rounded-xl border border-green-100 bg-green-50/60">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-green-100">
                        <div className="flex items-center gap-2 text-green-700 font-semibold">
                          <CheckCircle className="w-4 h-4" />
                          {t.teamAccounts.connected}
                        </div>
                        <span className="text-sm text-green-700">{connectedPlayers.length}</span>
                      </div>
                      <div className="divide-y divide-green-100">
                        {connectedPlayers.length === 0 ? (
                          <p className="px-4 py-6 text-sm text-green-900/70">{t.common.loading}</p>
                        ) : (
                          connectedPlayers.map((player) => (
                            <div key={player.id} className="px-4 py-3">
                              <p className="font-semibold text-gray-900 flex items-center gap-2">
                                {player.name}
                                {player.emailVerified && (
                                  <span className="text-[10px] bg-white text-green-600 px-2 py-0.5 rounded-full border border-green-200">
                                    {t.search.emailVerified}
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-600 truncate">{player.email}</p>
                              <p className="text-xs text-gray-500 mt-1">{t.teamAccounts.lastLogin}: {formatDate(player.lastSignIn)}</p>
                              {player.lastResendDate && (
                                <p className="text-xs text-orange-600 font-medium mt-1">
                                  📧 {t.teamAccounts.lastResend}: {formatDate(player.lastResendDate)}
                                </p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Jamais connectés */}
                    <div className="rounded-xl border border-orange-100 bg-orange-50/60">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-orange-100">
                        <div className="flex items-center gap-2 text-orange-700 font-semibold">
                          <Clock className="w-4 h-4" />
                          {t.teamAccounts.neverConnected}
                        </div>
                        <span className="text-sm text-orange-700">{neverConnectedPlayers.length}</span>
                      </div>
                      <div className="divide-y divide-orange-100">
                        {neverConnectedPlayers.length === 0 ? (
                          <p className="px-4 py-6 text-sm text-orange-900/70">{t.common.loading}</p>
                        ) : (
                          neverConnectedPlayers.map((player) => (
                            <div key={player.id} className="px-4 py-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-gray-900">{player.name}</p>
                                  <p className="text-sm text-gray-600 truncate">{player.email}</p>
                                  <p className="text-xs text-gray-500 mt-1">{t.teamAccounts.accountCreated}: {formatDate(player.createdAt)}</p>
                                  {player.lastResendDate && (
                                    <p className="text-xs text-orange-600 font-medium mt-1">
                                      📧 {t.teamAccounts.lastResend}: {formatDate(player.lastResendDate)}
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => sendActivationEmail(player.email, player.name)}
                                  disabled={sendingEmail === player.email}
                                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {sendingEmail === player.email ? (
                                    <>
                                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      {t.common.loading}
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-3 h-3" />
                                      {t.teamAccounts.resendEmail}
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Sans compte */}
                    <div className="rounded-xl border border-red-100 bg-red-50/60">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-red-100">
                        <div className="flex items-center gap-2 text-red-700 font-semibold">
                          <XCircle className="w-4 h-4" />
                          {t.teamAccounts.noAccount}
                        </div>
                        <span className="text-sm text-red-700">{noAccountPlayers.length}</span>
                      </div>
                      <div className="divide-y divide-red-100">
                        {noAccountPlayers.length === 0 ? (
                          <p className="px-4 py-6 text-sm text-red-900/70">{t.common.loading}</p>
                        ) : (
                          noAccountPlayers.map((player) => (
                            <div key={player.id} className="px-4 py-3">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="font-semibold text-gray-900">{player.name}</p>
                                  <p className="text-sm text-gray-600 truncate">{player.email}</p>
                                  <p className="text-xs text-red-600 mt-1">{t.teamAccounts.noAccount}</p>
                                </div>
                                <button
                                  onClick={() => createPlayerAccount(player.id, player.name)}
                                  disabled={creatingPlayerAccount === player.id}
                                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {creatingPlayerAccount === player.id ? (
                                    <>
                                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                      {t.common.loading}
                                    </>
                                  ) : (
                                    <>
                                      <Send className="w-3 h-3" />
                                      {t.teamAccounts.createAccount}
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
