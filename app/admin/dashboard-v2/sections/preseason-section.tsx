"use client"

import { Trophy, Calendar, TrendingUp } from 'lucide-react'

export default function PreseasonSection() {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Trophy className="w-8 h-8 text-orange-500" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Preseason</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => window.location.href = '/admin/preseason/matches'}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition text-left"
        >
          <Calendar className="w-8 h-8 mb-3 text-blue-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Matches</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Manage preseason matches
          </p>
        </button>

        <button
          onClick={() => window.location.href = '/admin/preseason/results'}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition text-left"
        >
          <Trophy className="w-8 h-8 mb-3 text-green-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Results</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Enter preseason match results
          </p>
        </button>

        <button
          onClick={() => window.location.href = '/admin/preseason/ranking'}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition text-left"
        >
          <TrendingUp className="w-8 h-8 mb-3 text-purple-500" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ranking</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            View preseason standings
          </p>
        </button>
      </div>
    </div>
  )
}
