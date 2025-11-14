"use client"

import { useState, useEffect } from 'react'
import { db } from '@/lib/firebase'
import { collection, getDocs } from 'firebase/firestore'
import { Bell, Send } from 'lucide-react'

export default function TestFavoriteNotificationsPage() {
  const [teams, setTeams] = useState<any[]>([])
  const [selectedTeam, setSelectedTeam] = useState('')
  const [notifType, setNotifType] = useState('match_upcoming')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    const snapshot = await getDocs(collection(db, 'teams'))
    const teamsData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    setTeams(teamsData)
    if (teamsData.length > 0) {
      setSelectedTeam(teamsData[0].id)
    }
  }

  const sendTestNotification = async () => {
    if (!selectedTeam) return

    setLoading(true)
    setResult(null)

    try {
      const team = teams.find(t => t.id === selectedTeam)
      const teamName = team?.name || 'Équipe'

      let response
      const baseUrl = '/api/coach'

      switch (notifType) {
        case 'match_upcoming':
          response = await fetch(`${baseUrl}/notify-followers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              teamId: selectedTeam,
              teamName,
              announcement: `⚽ Match demain : ${teamName} affronte Saints à 15h au stade`
            })
          })
          break

        case 'match_result':
          response = await fetch(`${baseUrl}/notify-followers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              teamId: selectedTeam,
              teamName,
              announcement: `🎉 ${teamName} a gagné 3-1 contre Blues !`
            })
          })
          break

        case 'new_captain':
          response = await fetch(`${baseUrl}/notify-followers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              teamId: selectedTeam,
              teamName,
              announcement: `👑 Nouveau capitaine pour ${teamName} : Ali Sabry`
            })
          })
          break

        case 'new_player':
          response = await fetch(`${baseUrl}/notify-followers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              teamId: selectedTeam,
              teamName,
              announcement: `✨ Nouveau joueur rejoint ${teamName} : Karim Benzema (Attaquant)`
            })
          })
          break

        case 'ranking_change':
          response = await fetch(`${baseUrl}/notify-followers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              teamId: selectedTeam,
              teamName,
              announcement: `📈 ${teamName} monte à la 2ème place du classement !`
            })
          })
          break

        case 'badge_unlocked':
          response = await fetch(`${baseUrl}/notify-followers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              teamId: selectedTeam,
              teamName,
              announcement: `🏆 ${teamName} a débloqué le badge "Série de victoires"`
            })
          })
          break

        case 'announcement':
          response = await fetch(`${baseUrl}/notify-followers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              teamId: selectedTeam,
              teamName,
              announcement: `📢 Entraînement annulé demain en raison de la pluie`
            })
          })
          break
      }

      if (response) {
        const data = await response.json()
        setResult(data)
      }
    } catch (error) {
      console.error('Erreur:', error)
      setResult({ success: false, error: 'Erreur lors de l\'envoi' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-8 h-8 text-blue-500" />
          <h1 className="text-2xl font-bold text-gray-900">
            Test Notifications Favoris
          </h1>
        </div>

        <div className="space-y-6">
          {/* Sélection équipe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Équipe
            </label>
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type de notification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de notification
            </label>
            <select
              value={notifType}
              onChange={(e) => setNotifType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="match_upcoming">⚽ Match à venir</option>
              <option value="match_result">🎉 Résultat de match</option>
              <option value="new_captain">👑 Nouveau capitaine</option>
              <option value="new_player">✨ Nouveau joueur</option>
              <option value="ranking_change">📈 Changement classement</option>
              <option value="badge_unlocked">🏆 Badge débloqué</option>
              <option value="announcement">📢 Annonce</option>
            </select>
          </div>

          {/* Bouton d'envoi */}
          <button
            onClick={sendTestNotification}
            disabled={loading || !selectedTeam}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Envoi en cours...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Envoyer la notification test</span>
              </>
            )}
          </button>

          {/* Résultat */}
          {result && (
            <div className={`p-4 rounded-lg ${
              result.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <p className={`font-medium ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.success 
                  ? `✅ ${result.count} notification(s) envoyée(s) avec succès !`
                  : `❌ Erreur: ${result.error}`
                }
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">
              💡 Instructions
            </h3>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Ajoutez d'abord une équipe en favoris</li>
              <li>Sélectionnez l'équipe ci-dessus</li>
              <li>Choisissez le type de notification</li>
              <li>Cliquez sur "Envoyer"</li>
              <li>Vérifiez vos notifications 🔔</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
