"use client"

import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, AtSign, Check, AlertCircle, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { createUserProfile, checkUsernameAvailability } from '@/lib/db'
import type { User as FirebaseUser } from 'firebase/auth'

interface ProfileCompletionProps {
  user: FirebaseUser
  onComplete: () => void
}

export function ProfileCompletion({ user, onComplete }: ProfileCompletionProps) {
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState(user.displayName || '')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [usernameChecking, setUsernameChecking] = useState(false)
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null)

  const checkUsername = async (value: string) => {
    if (value.length < 3) {
      setUsernameAvailable(null)
      return
    }

    setUsernameChecking(true)
    try {
      const available = await checkUsernameAvailability(value)
      setUsernameAvailable(available)
    } catch (error) {
      console.error('Error checking username:', error)
    } finally {
      setUsernameChecking(false)
    }
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUsername(value)
    
    // Debounce username check
    const timeoutId = setTimeout(() => {
      if (value.length >= 3) {
        checkUsername(value)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username || !fullName || !phone) {
      setError('Veuillez remplir tous les champs')
      return
    }

    if (username.length < 3) {
      setError('Le nom d\'utilisateur doit contenir au moins 3 caractères')
      return
    }

    if (!usernameAvailable) {
      setError('Ce nom d\'utilisateur n\'est pas disponible')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      await createUserProfile({
        uid: user.uid,
        email: user.email || '',
        username,
        fullName,
        phone,
      })
      
      onComplete()
    } catch (error: any) {
      setError(error.message || 'Erreur lors de la création du profil')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mx-auto mb-4 w-16 h-16 flex items-center justify-center"
            >
              <img 
                src="/comebac.png" 
                alt="ComeBac League" 
                className="w-16 h-16 object-contain object-center rounded-lg bg-white dark:bg-gray-900"
                style={{ imageRendering: 'auto' }}
              />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Complétez votre profil
            </CardTitle>
            <CardDescription className="text-gray-600">
              Choisissez un nom d'utilisateur et confirmez votre nom complet
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
              >
                <AlertCircle className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="bg-gray-50 text-gray-500"
                />
              </div>

              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Nom d'utilisateur
                </Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="nom_utilisateur"
                    value={username}
                    onChange={handleUsernameChange}
                    className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {usernameChecking && <LoadingSpinner size="sm" />}
                    {!usernameChecking && usernameAvailable === true && (
                      <Check className="w-4 h-4 text-green-500" />
                    )}
                    {!usernameChecking && usernameAvailable === false && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
                {username.length >= 3 && (
                  <p className={`text-xs ${usernameAvailable ? 'text-green-600' : 'text-red-600'}`}>
                    {usernameAvailable ? 'Nom d\'utilisateur disponible' : 'Nom d\'utilisateur déjà pris'}
                  </p>
                )}
              </div>

              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium text-gray-700">
                  Nom complet
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Prénom Nom"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                  Numéro de téléphone
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+20 123 456 7890"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading || !usernameAvailable || !username || !fullName || !phone}
                className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium rounded-lg transition-all duration-200"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" className="text-white" />
                ) : (
                  'Créer mon profil'
                )}
              </Button>
            </form>

            <div className="text-center text-xs text-gray-500">
              Votre nom d'utilisateur sera visible par les autres utilisateurs
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}