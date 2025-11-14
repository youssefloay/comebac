"use client"

import { motion } from "framer-motion"
import { Sparkles, Trophy, Star, Zap, TrendingUp, Award } from "lucide-react"

export default function PlayerFantasyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-6">
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
              <Sparkles className="w-16 h-16 text-yellow-300" />
            </motion.div>
            
            <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
              Fantasy Stats
            </h1>
            <p className="text-lg text-purple-100">
              Bientôt disponible ! ✨
            </p>
          </div>

          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Vos statistiques Fantasy arrivent ! 🎮
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Suivez vos performances, comparez-vous aux autres joueurs et grimpez dans le classement Fantasy !
              </p>
            </div>

            {/* Preview Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl border-2 border-purple-200"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900">Points Fantasy</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Gagnez des points à chaque match selon vos performances
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-pink-50 to-pink-100 p-6 rounded-2xl border-2 border-pink-200"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-pink-600 rounded-xl flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900">Classement</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Comparez-vous aux autres joueurs de la ligue
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border-2 border-blue-200"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900">Performances</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Analysez vos stats détaillées match par match
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-2xl border-2 border-yellow-200"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-yellow-600 rounded-xl flex items-center justify-center">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900">Récompenses</h3>
                </div>
                <p className="text-sm text-gray-600">
                  Débloquez des badges et récompenses exclusives
                </p>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-6 text-center"
        >
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-100 to-pink-100 px-6 py-3 rounded-full mb-4">
            <Zap className="w-5 h-5 text-purple-600" />
            <span className="font-bold text-gray-900">En développement</span>
          </div>
          <p className="text-gray-600">
            Cette fonctionnalité sera bientôt disponible. Restez connecté pour ne rien manquer ! 🚀
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
