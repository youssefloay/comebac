"use client"

import { useMemo, useState } from "react"
import { getPlayerWelcomeEmailHtml, getCoachWelcomeEmailHtml } from "@/lib/email-templates"

type TemplateType = "player" | "coach"

export default function EmailPreviewPage() {
  const [template, setTemplate] = useState<TemplateType>("player")

  const templates = useMemo(() => ({
    player: {
      label: "⚽ Email Joueur",
      html: getPlayerWelcomeEmailHtml("Jean Dupont", "Les Aigles", "#", "jean.dupont@example.com"),
    },
    coach: {
      label: "🏆 Email Coach",
      html: getCoachWelcomeEmailHtml("marie.martin@example.com", "Marie", "Martin", "Les Lions", "#"),
    }
  }), [])

  const emailHtml = templates[template].html
  const isCoach = template === 'coach'

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">📧 Templates d'Emails</h1>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              ← Retour
            </button>
          </div>
          
          <div className="flex gap-4 mb-6">
            {Object.entries(templates).map(([key, info]) => (
              <button
                key={key}
                onClick={() => setTemplate(key as TemplateType)}
                className={`flex-1 px-6 py-3 rounded-lg font-medium transition ${
                  template === key
                    ? key === 'coach'
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-lg'
                      : 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {info.label}
              </button>
            ))}
          </div>

          <div className="bg-gray-100 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Objet:</strong> {template === 'coach' ? '🏆 Bienvenue Coach - Activez votre compte ComeBac League' : '⚽ Bienvenue dans ComeBac League - Activez votre compte'}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Destinataire:</strong> {isCoach ? 'Entraîneurs' : 'Joueurs'} lors de la validation de l'équipe
            </p>
            <p className="text-sm text-gray-600">
              <strong>Expéditeur:</strong> ComeBac League &lt;noreply@comebac.com&gt;
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div 
            dangerouslySetInnerHTML={{ __html: emailHtml }}
            className="email-preview"
          />
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-bold text-blue-900 mb-2">ℹ️ Caractéristiques</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Design moderne et épuré</li>
            <li>✅ Lien d'activation valable 1 heure</li>
            <li>✅ Instructions claires si le lien expire</li>
            <li>✅ Informations de contact (Email, WhatsApp, Instagram)</li>
            <li>✅ Responsive et compatible tous appareils</li>
            <li>✅ Couleurs adaptées selon le type (joueur/coach)</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
