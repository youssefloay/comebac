"use client"

import { useState, useEffect } from 'react'
import { Archive, Calendar, Download, RotateCcw } from 'lucide-react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

export default function ArchivesSection() {
  const [archives, setArchives] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadArchives()
  }, [])

  const loadArchives = async () => {
    try {
      const res = await fetch('/api/admin/season-archives')
      if (res.ok) {
        const data = await res.json()
        setArchives(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error('Error loading archives:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Archive className="w-8 h-8 text-gray-500" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Archives</h2>
        </div>
        <button
          onClick={() => window.location.href = '/admin/archives'}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          View Full Archives
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {archives.length === 0 ? (
            <div className="p-8 text-center">
              <Archive className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No archived seasons found.
              </p>
              <button
                onClick={() => window.location.href = '/admin'}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                End Current Season
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {archives.map((archive) => (
                <div
                  key={archive.id || archive.season}
                  className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Calendar className="w-6 h-6 text-gray-400" />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {archive.season || archive.name || 'Unknown Season'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Archived on {archive.archivedAt ? new Date(archive.archivedAt).toLocaleDateString() : 'Unknown date'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.location.href = `/admin/archives?season=${archive.season || archive.id}`}
                        className="px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
