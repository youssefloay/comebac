"use client"

import { useState } from 'react'
import Link from 'next/link'
import { AlertForm } from '@/components/admin/AlertForm'
import Image from 'next/image'

export default function RegisterTeamPage() {
  const [showLogo, setShowLogo] = useState(false)

  const handleSubmit = (data: any) => {
    // Juste pour la démo - pas de logique réelle
    console.log('Formulaire soumis:', data)
  }

  const handleRegisterClick = () => {
    setShowLogo(true)
    // Masquer le logo après 3 secondes
    setTimeout(() => {
      setShowLogo(false)
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 relative">
      {/* Logo overlay */}
      {showLogo && (
        <div className="fixed inset-0 bg-white flex items-center justify-center z-50 animate-fadeIn">
          <div className="animate-scaleIn">
            <Image
              src="/comebac.png"
              alt="ComeBac Logo"
              width={300}
              height={300}
              className="rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/public" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
            ← Back
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Registre your team
          </h1>
          <p className="text-lg text-gray-600">
            Register your team and join the competition
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <AlertForm onSubmit={handleSubmit} onRegisterClick={handleRegisterClick} />
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes scaleIn {
          from {
            transform: scale(0.5);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}
