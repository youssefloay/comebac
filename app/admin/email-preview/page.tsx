"use client"

import { generateWelcomeEmail } from '@/lib/email-service'
import { useState } from 'react'

export default function EmailPreviewPage() {
  const [playerName, setPlayerName] = useState('Mohamed Salah')
  const [teamName, setTeamName] = useState('Les Pharaons FC')
  const [resetLink] = useState('https://scolar-league.firebaseapp.com/__/auth/action?mode=resetPassword&oobCode=ABC123')

  const emailContent = generateWelcomeEmail(playerName, teamName, resetLink)

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            📧 Prévisualisation Email
          </h1>
          <p className="text-gray-600">
            Visualisez le template d'email envoyé aux joueurs
          </p>
        </div>

        {/* Controls */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Personnaliser l'aperçu</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom du joueur
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nom de l'équipe
              </label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Email Info */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold mb-4">Informations de l'email</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">De:</span>
              <span className="text-gray-600">ComeBac League &lt;onboarding@resend.dev&gt;</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Sujet:</span>
              <span className="text-gray-600">{emailContent.subject}</span>
            </div>
          </div>
        </div>

        {/* Email Preview */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Aperçu de l'email</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const blob = new Blob([emailContent.html], { type: 'text/html' })
                  const url = URL.createObjectURL(blob)
                  window.open(url, '_blank')
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Ouvrir dans un nouvel onglet
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(emailContent.html)
                  alert('HTML copié dans le presse-papier!')
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Copier HTML
              </button>
            </div>
          </div>
          
          {/* Email Preview Frame */}
          <div className="border-4 border-gray-300 rounded-lg overflow-hidden">
            <div className="bg-gray-200 px-4 py-2 flex items-center gap-2">
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <span className="text-sm text-gray-600 ml-2">Email Preview</span>
            </div>
            <iframe
              srcDoc={emailContent.html}
              className="w-full h-[800px] bg-white"
              title="Email Preview"
            />
          </div>
        </div>

        {/* Code View */}
        <div className="bg-white p-6 rounded-lg shadow mt-6">
          <h2 className="text-xl font-bold mb-4">Code HTML</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
            <pre className="text-sm">
              <code>{emailContent.html}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
