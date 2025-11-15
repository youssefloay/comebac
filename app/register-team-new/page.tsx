"use client"

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, Link as LinkIcon, FileText, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { SimpleLogo } from '@/components/ui/logo'

export default function RegisterTeamModePage() {
  // Force light mode
  useEffect(() => {
    document.documentElement.classList.remove('dark')
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/public" className="flex items-center gap-3">
              <SimpleLogo className="w-10 h-10" />
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                ComeBac League
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Inscrivez votre équipe
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choisissez le mode d'inscription qui vous convient le mieux
          </p>
        </motion.div>

        {/* Mode Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Mode Complet */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Link href="/register-team">
              <div className="group relative bg-white rounded-2xl border-2 border-gray-200 hover:border-blue-500 transition-all duration-300 overflow-hidden cursor-pointer h-full">
                {/* Badge */}
                <div className="absolute top-4 right-4 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-semibold">
                  Classique
                </div>

                <div className="p-8">
                  {/* Icon */}
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <FileText className="w-8 h-8 text-white" />
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Mode Complet
                  </h2>

                  {/* Description */}
                  <p className="text-gray-600 mb-6">
                    Vous remplissez toutes les informations de l'équipe et des joueurs en une seule fois
                  </p>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                      </div>
                      <span>Rapide si vous avez toutes les infos</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                      </div>
                      <span>Contrôle total sur les données</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                      </div>
                      <span>Soumission immédiate</span>
                    </li>
                  </ul>

                  {/* Button */}
                  <div className="flex items-center justify-between text-blue-600 font-semibold group-hover:text-blue-700">
                    <span>Commencer</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </Link>
          </motion.div>

          {/* Mode Collaboratif */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Link href="/register-team/collaborative">
              <div className="group relative bg-white rounded-2xl border-2 border-gray-200 hover:border-green-500 transition-all duration-300 overflow-hidden cursor-pointer h-full">
                {/* Badge */}
                <div className="absolute top-4 right-4 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
                  Nouveau
                </div>

                <div className="p-8">
                  {/* Icon */}
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <LinkIcon className="w-8 h-8 text-white" />
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    Mode Collaboratif
                  </h2>

                  {/* Description */}
                  <p className="text-gray-600 mb-6">
                    Chaque joueur remplit ses propres informations via un lien unique
                  </p>

                  {/* Features */}
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-green-600" />
                      </div>
                      <span>Lien + QR code à partager</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-green-600" />
                      </div>
                      <span>Moins d'erreurs de saisie</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-gray-700">
                      <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 rounded-full bg-green-600" />
                      </div>
                      <span>Inscription à leur rythme</span>
                    </li>
                  </ul>

                  {/* Button */}
                  <div className="flex items-center justify-between text-green-600 font-semibold group-hover:text-green-700">
                    <span>Commencer</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* Hover effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </div>
            </Link>
          </motion.div>
        </div>

        {/* Help text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-gray-500">
            Besoin d'aide pour choisir?{' '}
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              Comparer les modes
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  )
}
