"use client"

import { motion } from "framer-motion"
import { Sparkles, Trophy, Users, Star, Zap } from "lucide-react"
import Link from "next/link"

export default function FantasyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full"
      >
        {/* Card principale */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Header avec gradient */}
          <div className="relative bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 p-8 text-center">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
              className="inline-block mb-4"
            >
              <Sparkles className="w-20 h-20 text-yellow-300" />
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-black text-white mb-2">
              ComeBac Fantasy
            </h1>
            <p className="text-xl text-purple-100">
              Bientôt disponible ! 🎮
            </p>
          </div>

          {/* Contenu */}
          <div className="p-8 md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Une expérience unique arrive ! ✨
              </h2>
              <p className="text-gray-600 text-lg leading-relaxed">
                Préparez-vous à vivre la ComeBac League comme jamais auparavant. 
                Créez votre équipe de rêve, affrontez vos amis et devenez le meilleur manager !
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl"
              >
                <Trophy className="w-10 h-10 text-purple-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Compétitions</h3>
                <p className="text-sm text-gray-600">
                  Participez à des ligues privées et publiques
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-2xl"
              >
                <Users className="w-10 h-10 text-pink-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Équipe de rêve</h3>
                <p className="text-sm text-gray-600">
                  Composez votre équipe avec les meilleurs joueurs
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl"
              >
                <Star className="w-10 h-10 text-blue-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Points en direct</h3>
                <p className="text-sm text-gray-600">
                  Suivez vos points en temps réel pendant les matchs
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-2xl"
              >
                <Zap className="w-10 h-10 text-yellow-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-2">Transferts</h3>
                <p className="text-sm text-gray-600">
                  Gérez vos transferts et optimisez votre équipe
                </p>
              </motion.div>
            </div>

            {/* CTA */}
            <div className="text-center">
              <div className="inline-block bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-6 mb-6">
                <p className="text-gray-700 font-medium mb-2">
                  🚀 En cours de développement
                </p>
                <p className="text-sm text-gray-600">
                  Restez connectés pour ne rien manquer du lancement !
                </p>
              </div>

              <Link
                href="/public"
                className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Retour à l'accueil
              </Link>
            </div>
          </div>
        </div>

        {/* Animation de particules */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-purple-400 rounded-full opacity-20"
              initial={{
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
              }}
              animate={{
                y: [null, Math.random() * window.innerHeight],
                x: [null, Math.random() * window.innerWidth],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
