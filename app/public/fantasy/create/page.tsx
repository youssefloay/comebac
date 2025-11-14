"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { 
  Sparkles,
  Users,
  DollarSign,
  ArrowRight,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

const INITIAL_BUDGET = 100 // 100M€

export default function CreateFantasyTeamPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [teamName, setTeamName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  // Validate team name in real-time
  const validateTeamName = (name: string): string | null => {
    if (name.length === 0) {
      return null // Don't show error for empty field
    }
    if (name.length < 3) {
      return 'Le nom doit contenir au moins 3 caractères'
    }
    if (name.length > 30) {
      return 'Le nom ne peut pas dépasser 30 caractères'
    }
    return null
  }

  const handleTeamNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setTeamName(value)
    setValidationError(validateTeamName(value))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setError('Vous devez être connecté pour créer une équipe')
      return
    }

    // Final validation
    const nameError = validateTeamName(teamName)
    if (nameError) {
      setValidationError(nameError)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Store team name in sessionStorage to use in squad selection
      sessionStorage.setItem('fantasyTeamName', teamName.trim())
      
      // Redirect to squad selection page
      router.push('/public/fantasy/squad')
    } catch (err) {
      console.error('Error creating team:', err)
      setError('Une erreur est survenue. Veuillez réessayer.')
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Connexion requise
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Vous devez être connecté pour créer une équipe Fantasy
            </p>
            <Button onClick={() => router.push('/login')}>
              Se connecter
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-green-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Créer votre équipe Fantasy
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Commencez par choisir un nom pour votre équipe
            </p>
          </div>

          {/* Main Card */}
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Team Name Input */}
                <div>
                  <Label htmlFor="teamName" className="text-base font-semibold text-gray-900 dark:text-white mb-2 block">
                    Nom de votre équipe
                  </Label>
                  <Input
                    id="teamName"
                    type="text"
                    value={teamName}
                    onChange={handleTeamNameChange}
                    placeholder="Ex: Les Champions, Dream Team..."
                    className={`text-lg h-12 ${
                      validationError 
                        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                        : teamName.length >= 3 
                        ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                        : ''
                    }`}
                    maxLength={30}
                    disabled={loading}
                    autoFocus
                  />
                  
                  {/* Character Counter */}
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-sm">
                      {validationError ? (
                        <span className="text-red-600 dark:text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {validationError}
                        </span>
                      ) : teamName.length >= 3 ? (
                        <span className="text-green-600 dark:text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          Nom valide
                        </span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">
                          Minimum 3 caractères
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {teamName.length}/30
                    </span>
                  </div>
                </div>

                {/* Budget Display */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        Budget initial
                      </h3>
                    </div>
                  </div>
                  <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                    {INITIAL_BUDGET}M€
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Vous utiliserez ce budget pour sélectionner 7 joueurs
                  </p>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                          7 joueurs à sélectionner
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          1 Gardien, 2-3 Défenseurs, 2-3 Milieux, 1-2 Attaquants
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                          Gagnez des points
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          Basés sur les performances réelles de vos joueurs
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">{error}</span>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white h-12 text-base shadow-lg"
                  disabled={loading || !!validationError || teamName.length < 3}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Création en cours...
                    </>
                  ) : (
                    <>
                      Continuer vers la sélection
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>

              {/* Help Text */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Après avoir choisi votre nom, vous pourrez sélectionner vos 7 joueurs 
                  et choisir votre formation tactique.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Back Link */}
          <div className="text-center mt-6">
            <button
              onClick={() => router.push('/public/fantasy')}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              disabled={loading}
            >
              ← Retour au hub Fantasy
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
