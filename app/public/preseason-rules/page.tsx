"use client"

import { motion } from "framer-motion"
import {
  Users,
  Calendar,
  Clock,
  Trophy,
  AlertCircle,
  Shield,
  Ban,
  FileText,
  Award,
  Target,
  Timer,
  UserCheck,
  MapPin,
  Eye,
  Gavel,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from "lucide-react"

export default function PreseasonRulesPage() {
  const rules = [
    {
      id: 1,
      icon: Users,
      title: "General Format",
      color: "from-blue-500 to-cyan-500",
      content: (
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            The Preseason includes <span className="font-bold text-blue-600 dark:text-blue-400">16 teams</span>.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Each team plays <span className="font-bold">2 matches</span>.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            After all matches, teams are placed into <span className="font-bold">4 categories (A, B, C, D)</span> for the main league.
          </p>
        </div>
      )
    },
    {
      id: 2,
      icon: Shield,
      title: "Team Requirements",
      color: "from-green-500 to-emerald-500",
      content: (
        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <span>A minimum of <span className="font-bold">7 players</span> must be present to start a match.</span>
          </li>
          <li className="flex items-start gap-2">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <span>If a team has fewer than 7 players, the match is automatically lost <span className="font-bold">(3–0 forfeit)</span>.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <span><span className="font-bold">Team jerseys are mandatory</span>.</span>
          </li>
          <li className="flex items-start gap-2">
            <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <span>All players and coaches must have a <span className="font-bold">valid ID</span> with them at all times during matches.</span>
          </li>
          <li className="flex items-start gap-2">
            <UserCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <span>All players must be <span className="font-bold">registered and validated</span> before playing.</span>
          </li>
          <li className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <span>Teams from the <span className="font-bold">same school cannot play each other</span> for their first match.</span>
          </li>
        </ul>
      )
    },
    {
      id: 3,
      icon: Calendar,
      title: "Schedule & Availability",
      color: "from-purple-500 to-pink-500",
      content: (
        <div className="space-y-3">
          <p className="text-gray-700 dark:text-gray-300">
            <span className="font-bold">First match dates:</span> December 11th
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            Every <span className="font-bold">Thursday</span> and a few <span className="font-bold">Fridays</span>
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            A team <span className="font-bold text-red-600 dark:text-red-400">cannot play two matches on the same day</span>.
          </p>
        </div>
      )
    },
    {
      id: 4,
      icon: Clock,
      title: "Match Rules",
      color: "from-orange-500 to-red-500",
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Timer className="w-5 h-5" />
              Duration
            </h4>
            <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-7">
              <li>Match duration: <span className="font-bold">2×20 min</span></li>
              <li>Break Time: <span className="font-bold">5 min</span></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              Discipline
            </h4>
            <ul className="space-y-1 text-gray-700 dark:text-gray-300 ml-7">
              <li>🟨 <span className="font-bold">Yellow card</span></li>
              <li>🟥 <span className="font-bold text-red-600 dark:text-red-400">Red card</span> → player is suspended.</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Substitutions
            </h4>
            <p className="text-gray-700 dark:text-gray-300 ml-7">
              <span className="font-bold">Unlimited rolling substitutions</span> allowed.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 5,
      icon: Trophy,
      title: "Point System (Special Preseason Rules)",
      color: "from-yellow-500 to-orange-500",
      content: (
        <div className="space-y-3">
          <p className="text-red-600 dark:text-red-400 font-bold mb-3">
            ⚠️ No final draws allowed.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-left font-bold text-gray-900 dark:text-white">Result</th>
                  <th className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center font-bold text-gray-900 dark:text-white">Points</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-green-50 dark:bg-green-900/20">
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-700 dark:text-gray-300">Win in regular time</td>
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center font-bold text-green-600 dark:text-green-400">3 pts</td>
                </tr>
                <tr className="bg-blue-50 dark:bg-blue-900/20">
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-700 dark:text-gray-300">Draw + win on penalties</td>
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center font-bold text-blue-600 dark:text-blue-400">2 pts</td>
                </tr>
                <tr className="bg-orange-50 dark:bg-orange-900/20">
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-700 dark:text-gray-300">Draw + loss on penalties</td>
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center font-bold text-orange-600 dark:text-orange-400">1 pt</td>
                </tr>
                <tr className="bg-red-50 dark:bg-red-900/20">
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-gray-700 dark:text-gray-300">Loss in regular time</td>
                  <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-center font-bold text-red-600 dark:text-red-400">0 pts</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )
    },
    {
      id: 6,
      icon: Target,
      title: "Penalty Rules",
      color: "from-indigo-500 to-purple-500",
      content: (
        <div className="space-y-3 text-gray-700 dark:text-gray-300">
          <p>If the match ends in a draw:</p>
          <ul className="space-y-2 ml-4">
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span><span className="font-bold">5 penalties</span> each.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold">•</span>
              <span>Then <span className="font-bold">sudden death</span> if needed.</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 7,
      icon: Award,
      title: "Ranking & Categories",
      color: "from-cyan-500 to-blue-500",
      content: (
        <div className="space-y-4">
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">Tie-breaking order:</h4>
            <ol className="space-y-1 text-gray-700 dark:text-gray-300 ml-4 list-decimal">
              <li>Total points</li>
              <li>Goal difference</li>
              <li>Goals scored</li>
              <li>Head-to-head (if applicable)</li>
              <li>Penalty shootout ranking</li>
            </ol>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2">Category placement:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg p-3 text-center">
                <div className="font-bold text-white text-lg">A</div>
                <div className="text-white text-sm">1st–4th</div>
              </div>
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg p-3 text-center">
                <div className="font-bold text-white text-lg">B</div>
                <div className="text-white text-sm">5th–8th</div>
              </div>
              <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-lg p-3 text-center">
                <div className="font-bold text-white text-lg">C</div>
                <div className="text-white text-sm">9th–12th</div>
              </div>
              <div className="bg-gradient-to-br from-gray-400 to-gray-600 rounded-lg p-3 text-center">
                <div className="font-bold text-white text-lg">D</div>
                <div className="text-white text-sm">13th–16th</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 8,
      icon: AlertTriangle,
      title: "Late Arrival & Forfeits",
      color: "from-red-500 to-pink-500",
      content: (
        <ul className="space-y-3 text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <span>Teams must arrive at least <span className="font-bold">10 min before kickoff</span>.</span>
          </li>
          <li className="flex items-start gap-2">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <span>More than <span className="font-bold text-red-600 dark:text-red-400">10 minutes late</span> → forfeit <span className="font-bold">3–0</span>.</span>
          </li>
          <li className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <span>Teams that forfeit automatically fall into <span className="font-bold">Category D</span>.</span>
          </li>
        </ul>
      )
    },
    {
      id: 9,
      icon: Eye,
      title: "Spectators",
      color: "from-teal-500 to-cyan-500",
      content: (
        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
          <li>Limited spots for the preseason.</li>
          <li>Entrance may require <span className="font-bold">QR code</span> if ticketing is used in the main season.</li>
          <li>Spectators must follow venue rules.</li>
          <li><span className="font-bold">Spectators are only allowed to attend their favorite team match</span>.</li>
        </ul>
      )
    },
    {
      id: 10,
      icon: MapPin,
      title: "Venue Rules",
      color: "from-gray-500 to-slate-500",
      content: (
        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <Ban className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <span><span className="font-bold">Smoking and vaping are strictly prohibited</span>.</span>
          </li>
          <li className="flex items-start gap-2">
            <Ban className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <span><span className="font-bold">No audio speakers or music</span> are allowed.</span>
          </li>
        </ul>
      )
    },
    {
      id: 11,
      icon: Gavel,
      title: "Safety & Behavior",
      color: "from-red-600 to-rose-600",
      content: (
        <ul className="space-y-3 text-gray-700 dark:text-gray-300">
          <li className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <span><span className="font-bold text-red-600 dark:text-red-400">Violence, insults, or referee abuse</span> → strict elimination of a player or team from the league.</span>
          </li>
          <li className="flex items-start gap-2">
            <Ban className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
            <span>The organizer may remove players, teams, or spectators due to <span className="font-bold">unacceptable behavior</span>.</span>
          </li>
        </ul>
      )
    },
    {
      id: 12,
      icon: Shield,
      title: "Liability",
      color: "from-slate-500 to-gray-600",
      content: (
        <div className="space-y-2 text-gray-700 dark:text-gray-300">
          <p>The organizer is <span className="font-bold">not responsible for injuries</span>.</p>
          <p>Participation is at <span className="font-bold">players' own risk</span>.</p>
        </div>
      )
    },
    {
      id: 13,
      icon: Gavel,
      title: "Refereeing",
      color: "from-indigo-600 to-purple-600",
      content: (
        <div className="space-y-2 text-gray-700 dark:text-gray-300">
          <p><span className="font-bold">Referee decisions are final</span>.</p>
          <p><span className="font-bold text-red-600 dark:text-red-400">No appeals</span>.</p>
        </div>
      )
    },
    {
      id: 14,
      icon: FileText,
      title: "General Agreement",
      color: "from-blue-600 to-indigo-600",
      content: (
        <div className="space-y-2 text-gray-700 dark:text-gray-300">
          <p className="font-bold mb-2">By registering, teams accept:</p>
          <ul className="space-y-1 ml-4">
            <li>• All rules above.</li>
            <li>• Use of photos/videos for communication.</li>
          </ul>
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 sm:mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full mb-4 shadow-lg">
            <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 bg-clip-text text-transparent mb-3">
            Preseason Rules & Conditions
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400">
            ComeBac League Official Regulations
          </p>
        </motion.div>

        {/* Rules Grid */}
        <div className="space-y-6">
          {rules.map((rule, index) => {
            const Icon = rule.icon
            return (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden hover:shadow-2xl transition-shadow"
              >
                {/* Header */}
                <div className={`bg-gradient-to-r ${rule.color} p-4 sm:p-6`}>
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white/80 text-sm sm:text-base font-medium">
                          {String(rule.id).padStart(2, '0')}
                        </span>
                        <h2 className="text-xl sm:text-2xl font-bold text-white">
                          {rule.title}
                        </h2>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6">
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    {rule.content}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Footer Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="mt-8 sm:mt-12 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-1">
                Important Notice
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-400">
                All teams are required to read and understand these rules before participating in the preseason. 
                Failure to comply with any rule may result in penalties or disqualification.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
