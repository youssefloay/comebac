"use client"

import { ImageIcon, Upload, Folder } from 'lucide-react'

export default function MediaSection() {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <ImageIcon className="w-8 h-8 text-blue-500" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Media Manager</h2>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Manage logos, photos, and other media files for teams and players.
        </p>
        <button
          onClick={() => window.location.href = '/admin/media'}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Folder className="w-4 h-4" />
          Open Media Manager
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Upload className="w-6 h-6 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Upload Files</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Upload team logos, player photos, and other media files.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <ImageIcon className="w-6 h-6 text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Manage Files</h3>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            View, edit, and delete existing media files.
          </p>
        </div>
      </div>
    </div>
  )
}
