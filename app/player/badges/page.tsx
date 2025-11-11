"use client"

import { Award, Lock } from 'lucide-react'

const badges = [
  { id: 1, name: 'Premier But', description: 'Marquer votre premier but', icon: '⚽', unlocked: true },
  { id: 2, name: 'Hat-trick', description: 'Marquer 3 buts dans un match', icon: '🎩', unlocked: false },
  { id: 3, name: 'Passeur Décisif', description: 'Faire 5 passes décisives', icon: '🎯', unlocked: true },
  { id: 4, name: 'Gardien Invincible', description: 'Ne pas encaisser de but', icon: '🧤', unlocked: false },
  { id: 5, name: 'Joueur du Match', description: 'Être élu joueur du match', icon: '⭐', unlocked: true },
  { id: 6, name: 'Capitaine', description: 'Porter le brassard de capitaine', icon: '👑', unlocked: false },
]

export default function BadgesPage() {
  return (
    <div className="p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Mes Badges</h1>
          <p className="text-gray-600">Débloquez des badges en accomplissant des exploits</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`p-6 rounded-lg border-2 transition ${
                badge.unlocked
                  ? 'bg-white border-green-200 shadow-md'
                  : 'bg-gray-50 border-gray-200 opacity-60'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl ${
                  badge.unlocked ? 'bg-green-100' : 'bg-gray-200'
                }`}>
                  {badge.unlocked ? badge.icon : <Lock className="w-6 h-6 text-gray-400" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">{badge.name}</h3>
                  <p className="text-sm text-gray-600">{badge.description}</p>
                  {badge.unlocked && (
                    <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                      Débloqué
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
