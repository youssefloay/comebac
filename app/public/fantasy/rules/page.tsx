"use client"

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Sparkles,
  Trophy,
  Users,
  TrendingUp,
  DollarSign,
  Zap,
  Award,
  HelpCircle,
  ArrowRight,
  Star,
  Shield,
  Target,
  Calendar,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react'

export default function FantasyRulesPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
              <HelpCircle className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Règles du Fantasy ComeBac
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Tout ce que vous devez savoir pour devenir un champion Fantasy
          </p>
        </motion.div>

        {/* Introduction */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg mb-8 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
            <CardContent className="p-8">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                    Bienvenue dans le Fantasy ComeBac League
                  </h2>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">
                    Le Mode Fantasy vous permet de créer et gérer votre équipe virtuelle composée de joueurs réels 
                    du championnat ComeBac League. Vos joueurs gagnent des points basés sur leurs performances réelles 
                    lors des matchs. Plus vos joueurs performent, plus vous gagnez de points et grimpez dans le classement !
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-purple-600 text-white">
                      <Users className="w-3 h-3 mr-1" />
                      7 joueurs
                    </Badge>
                    <Badge className="bg-blue-600 text-white">
                      <DollarSign className="w-3 h-3 mr-1" />
                      Budget 100M€
                    </Badge>
                    <Badge className="bg-green-600 text-white">
                      <Trophy className="w-3 h-3 mr-1" />
                      Points réels
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Budget et Formation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg mb-8">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <DollarSign className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Budget et Formation
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Budget de 100M€
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    Vous disposez d'un budget de 100 millions d'euros pour composer votre équipe de 7 joueurs. 
                    Chaque joueur a un prix basé sur sa position et ses performances récentes.
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-gray-600 dark:text-gray-400 mb-1">Gardien</div>
                        <div className="font-semibold text-gray-900 dark:text-white">4.0M - 6.0M€</div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400 mb-1">Défenseur</div>
                        <div className="font-semibold text-gray-900 dark:text-white">4.5M - 7.0M€</div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400 mb-1">Milieu</div>
                        <div className="font-semibold text-gray-900 dark:text-white">5.0M - 10.0M€</div>
                      </div>
                      <div>
                        <div className="text-gray-600 dark:text-gray-400 mb-1">Attaquant</div>
                        <div className="font-semibold text-gray-900 dark:text-white">6.0M - 15.0M€</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-blue-600" />
                    Composition de l'équipe
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    Vous devez sélectionner exactement 7 joueurs en respectant les contraintes suivantes :
                  </p>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span><strong>1 Gardien</strong> obligatoire</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span><strong>2 à 3 Défenseurs</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span><strong>2 à 4 Milieux</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span><strong>1 à 2 Attaquants</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <span><strong>Maximum 3 joueurs</strong> d'une même équipe</span>
                    </li>
                  </ul>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Formations disponibles :</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-sm">4-3-0</Badge>
                      <Badge variant="outline" className="text-sm">3-3-1</Badge>
                      <Badge variant="outline" className="text-sm">3-4-0</Badge>
                      <Badge variant="outline" className="text-sm">2-4-1</Badge>
                      <Badge variant="outline" className="text-sm">2-3-2</Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-600" />
                    Le Capitaine
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Vous devez désigner un capitaine dans votre équipe. <strong className="text-purple-600 dark:text-purple-400">
                    Les points de votre capitaine sont doublés (x2)</strong>, alors choisissez judicieusement !
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Grille de Points */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg mb-8">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Trophy className="w-6 h-6 text-yellow-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Grille de Points
                </h2>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Vos joueurs gagnent des points en fonction de leurs performances réelles lors des matchs. 
                Voici comment les points sont calculés :
              </p>

              {/* Points Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        Action
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">
                        Gardien
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-green-600 dark:text-green-400">
                        Défenseur
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-purple-600 dark:text-purple-400">
                        Milieu
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-red-600 dark:text-red-400">
                        Attaquant
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        Match joué (60+ min)
                      </td>
                      <td className="text-center py-3 px-4 font-semibold text-green-600">+2</td>
                      <td className="text-center py-3 px-4 font-semibold text-green-600">+2</td>
                      <td className="text-center py-3 px-4 font-semibold text-green-600">+2</td>
                      <td className="text-center py-3 px-4 font-semibold text-green-600">+2</td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        Match joué (&lt;60 min)
                      </td>
                      <td className="text-center py-3 px-4 font-semibold text-green-600">+1</td>
                      <td className="text-center py-3 px-4 font-semibold text-green-600">+1</td>
                      <td className="text-center py-3 px-4 font-semibold text-green-600">+1</td>
                      <td className="text-center py-3 px-4 font-semibold text-green-600">+1</td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 bg-yellow-50 dark:bg-yellow-900/10">
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300 font-semibold">
                        ⚽ But marqué
                      </td>
                      <td className="text-center py-3 px-4 font-bold text-green-600 text-lg">+10</td>
                      <td className="text-center py-3 px-4 font-bold text-green-600 text-lg">+6</td>
                      <td className="text-center py-3 px-4 font-bold text-green-600 text-lg">+5</td>
                      <td className="text-center py-3 px-4 font-bold text-green-600 text-lg">+4</td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        🎯 Passe décisive
                      </td>
                      <td className="text-center py-3 px-4 font-semibold text-green-600">+3</td>
                      <td className="text-center py-3 px-4 font-semibold text-green-600">+3</td>
                      <td className="text-center py-3 px-4 font-semibold text-green-600">+3</td>
                      <td className="text-center py-3 px-4 font-semibold text-green-600">+3</td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        🛡️ Clean sheet (0 but encaissé)
                      </td>
                      <td className="text-center py-3 px-4 font-semibold text-green-600">+4</td>
                      <td className="text-center py-3 px-4 font-semibold text-green-600">+4</td>
                      <td className="text-center py-3 px-4 font-semibold text-green-600">+1</td>
                      <td className="text-center py-3 px-4 text-gray-400">-</td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        🏆 Victoire de l'équipe
                      </td>
                      <td className="text-center py-3 px-4 font-semibold text-green-600">+2</td>
                      <td className="text-center py-3 px-4 font-semibold text-green-600">+2</td>
                      <td className="text-center py-3 px-4 font-semibold text-green-600">+2</td>
                      <td className="text-center py-3 px-4 font-semibold text-green-600">+2</td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        Match nul
                      </td>
                      <td className="text-center py-3 px-4 font-semibold text-green-600">+1</td>
                      <td className="text-center py-3 px-4 font-semibold text-green-600">+1</td>
                      <td className="text-center py-3 px-4 font-semibold text-green-600">+1</td>
                      <td className="text-center py-3 px-4 font-semibold text-green-600">+1</td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 bg-red-50 dark:bg-red-900/10">
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        🟨 Carton jaune
                      </td>
                      <td className="text-center py-3 px-4 font-semibold text-red-600">-1</td>
                      <td className="text-center py-3 px-4 font-semibold text-red-600">-1</td>
                      <td className="text-center py-3 px-4 font-semibold text-red-600">-1</td>
                      <td className="text-center py-3 px-4 font-semibold text-red-600">-1</td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 bg-red-50 dark:bg-red-900/10">
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        🟥 Carton rouge
                      </td>
                      <td className="text-center py-3 px-4 font-semibold text-red-600">-3</td>
                      <td className="text-center py-3 px-4 font-semibold text-red-600">-3</td>
                      <td className="text-center py-3 px-4 font-semibold text-red-600">-3</td>
                      <td className="text-center py-3 px-4 font-semibold text-red-600">-3</td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        2 buts encaissés ou plus
                      </td>
                      <td className="text-center py-3 px-4 font-semibold text-red-600">-1</td>
                      <td className="text-center py-3 px-4 text-gray-400">-</td>
                      <td className="text-center py-3 px-4 text-gray-400">-</td>
                      <td className="text-center py-3 px-4 text-gray-400">-</td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        ✋ Penalty arrêté
                      </td>
                      <td className="text-center py-3 px-4 font-semibold text-green-600">+5</td>
                      <td className="text-center py-3 px-4 text-gray-400">-</td>
                      <td className="text-center py-3 px-4 text-gray-400">-</td>
                      <td className="text-center py-3 px-4 text-gray-400">-</td>
                    </tr>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                        ❌ Penalty manqué
                      </td>
                      <td className="text-center py-3 px-4 font-semibold text-red-600">-2</td>
                      <td className="text-center py-3 px-4 font-semibold text-red-600">-2</td>
                      <td className="text-center py-3 px-4 font-semibold text-red-600">-2</td>
                      <td className="text-center py-3 px-4 font-semibold text-red-600">-2</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Bonus Capitaine
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      N'oubliez pas : les points de votre capitaine sont <strong className="text-purple-600">doublés (x2)</strong> ! 
                      Si votre capitaine marque 10 points, vous recevrez 20 points.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transferts et Wildcard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg mb-8">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <TrendingUp className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Système de Transferts et Wildcard
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Transferts Gratuits
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    Vous pouvez modifier votre équipe entre les journées de championnat (gameweeks) grâce aux transferts.
                  </p>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span><strong>2 transferts gratuits</strong> par gameweek</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Les transferts gratuits se réinitialisent à chaque nouvelle gameweek</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <span>Les transferts sont <strong>bloqués une fois la gameweek commencée</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <span>Chaque transfert supplémentaire coûte <strong className="text-red-600">-4 points</strong></span>
                    </li>
                  </ul>

                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      Exemple de pénalité
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Si vous effectuez 4 transferts dans une gameweek, les 2 premiers sont gratuits, 
                      mais les 2 suivants vous coûteront 4 points chacun, soit <strong>-8 points au total</strong>.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-600" />
                    Le Wildcard
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    Le Wildcard est un bonus spécial qui vous permet de refaire entièrement votre équipe sans pénalité.
                  </p>
                  <ul className="space-y-2 mb-4">
                    <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <Star className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <span><strong>1 Wildcard par saison</strong> (à utiliser stratégiquement)</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Permet de modifier <strong>tous vos joueurs</strong> sans pénalité</span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>Permet de changer votre <strong>formation</strong></span>
                    </li>
                    <li className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                      <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                      <span>Une fois utilisé, il n'est <strong>plus disponible</strong> pour le reste de la saison</span>
                    </li>
                  </ul>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <Target className="w-5 h-5 text-yellow-600" />
                      Quand utiliser le Wildcard ?
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Utilisez-le stratégiquement : après une série de mauvaises performances, 
                      pour profiter d'un calendrier favorable, ou pour réagir à des blessures multiples dans votre équipe.
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Deadline des Transferts
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Les transferts doivent être effectués <strong>avant le début de la gameweek</strong>. 
                    Une fois le premier match de la journée commencé, les transferts sont bloqués jusqu'à la prochaine gameweek. 
                    Vous recevrez une notification 24h avant la deadline.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Badges et Récompenses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="border-0 shadow-lg mb-8">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <Award className="w-6 h-6 text-purple-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Badges et Récompenses
                </h2>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Gagnez des badges en accomplissant des exploits avec votre équipe Fantasy ! 
                Ces récompenses sont affichées sur votre profil et témoignent de vos performances.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">🏆</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Top 10 de la semaine
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Terminez dans le top 10 d'une gameweek
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">🥇</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Podium
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Terminez dans le top 3 du classement général
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">💯</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Century
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Marquez 100 points ou plus en une gameweek
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">👑</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Capitaine Parfait
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Votre capitaine est le meilleur joueur de la gameweek
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">⚡</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Wildcard Master
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Gagnez 50+ points après avoir utilisé votre Wildcard
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">🔥</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Série Gagnante
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Terminez 1er pendant 5 gameweeks consécutives
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4 md:col-span-2">
                  <div className="flex items-start gap-3">
                    <div className="text-3xl">👑</div>
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                        Champion Fantasy
                      </h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        Terminez 1er du classement général à la fin de la saison
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Award className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                      Notifications de badges
                    </h4>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Vous recevrez une notification instantanée lorsque vous gagnez un nouveau badge. 
                      Consultez tous vos badges dans la section Récompenses.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="border-0 shadow-lg mb-8">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <HelpCircle className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Questions Fréquentes (FAQ)
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Quand les points sont-ils mis à jour ?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Les points sont calculés et mis à jour automatiquement après chaque match réel. 
                    Vous recevrez une notification avec le total de points gagnés par votre équipe.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Puis-je modifier mon capitaine pendant la gameweek ?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Non, une fois la gameweek commencée, vous ne pouvez plus modifier votre équipe ni votre capitaine. 
                    Assurez-vous de faire vos choix avant la deadline !
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Que se passe-t-il si un de mes joueurs ne joue pas ?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Si un joueur ne participe pas au match (blessure, suspension, choix du coach), 
                    il ne marquera aucun point pour cette gameweek. C'est pourquoi il est important de suivre 
                    l'actualité et d'utiliser vos transferts judicieusement.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Comment sont calculés les prix des joueurs ?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Les prix sont basés sur la position du joueur et ses performances récentes. 
                    Les prix peuvent varier chaque semaine (±0.5M€ maximum) en fonction de la forme du joueur. 
                    Les joueurs performants deviennent plus chers, tandis que ceux en difficulté baissent de prix.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Puis-je avoir plusieurs joueurs de la même équipe ?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Oui, mais vous êtes limité à <strong>maximum 3 joueurs d'une même équipe</strong>. 
                    Cette règle encourage la diversification et rend le jeu plus équilibré.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Que se passe-t-il si je dépasse mon budget lors d'un transfert ?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Le système vérifie automatiquement votre budget. Si vous n'avez pas assez d'argent pour 
                    acheter un joueur, le transfert sera refusé. Vous devrez choisir un joueur moins cher ou 
                    vendre d'autres joueurs pour libérer du budget.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Comment fonctionne le classement ?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Il existe deux classements : le <strong>classement général</strong> basé sur vos points totaux 
                    depuis le début de la saison, et le <strong>classement hebdomadaire</strong> basé uniquement 
                    sur les points de la gameweek en cours. Les deux classements sont mis à jour après chaque match.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Puis-je supprimer mon équipe et recommencer ?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Non, une fois votre équipe créée, vous ne pouvez pas la supprimer. Cependant, vous pouvez 
                    utiliser votre <strong>Wildcard</strong> pour refaire entièrement votre équipe si vous souhaitez 
                    un nouveau départ stratégique.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Les transferts non utilisés sont-ils reportés ?
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">
                    Non, les 2 transferts gratuits ne sont <strong>pas cumulables</strong>. 
                    Si vous n'utilisez pas vos transferts pendant une gameweek, vous aurez toujours 2 transferts 
                    gratuits (et pas plus) pour la gameweek suivante.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-blue-600 text-white">
            <CardContent className="p-8 text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-3">
                Prêt à créer votre équipe Fantasy ?
              </h2>
              <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                Maintenant que vous connaissez les règles, il est temps de composer votre équipe de rêve 
                et de commencer à gagner des points !
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/public/fantasy/create">
                  <Button 
                    size="lg" 
                    className="bg-white text-purple-600 hover:bg-gray-100"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Créer mon équipe
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/public/fantasy">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-white text-white hover:bg-white/10"
                  >
                    Retour au Hub Fantasy
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
