"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { auth } from '@/lib/firebase'
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth'
import { CheckCircle2, LockKeyhole, Loader2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<'checking' | 'ready' | 'success' | 'error'>('checking')
  const [email, setEmail] = useState('')
  const [oobCode, setOobCode] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const searchParams = new URLSearchParams(window.location.search)
    const code = searchParams.get('oobCode')
    const mode = searchParams.get('mode')
    
    // Vérifier si on arrive depuis Firebase avec une erreur
    if (!code && mode !== 'resetPassword') {
      // Vérifier si on a un paramètre d'erreur dans l'URL
      const errorParam = searchParams.get('error')
      if (errorParam || window.location.href.includes('expired') || window.location.href.includes('already')) {
        setError('Votre demande de réinitialisation du mot de passe a expiré ou ce lien a déjà été utilisé.')
        setStatus('error')
        return
      }
      
      setError('Lien invalide. Veuillez demander un nouveau mail de réinitialisation.')
      setStatus('error')
      return
    }

    if (!code) {
      setError('Lien invalide. Veuillez demander un nouveau mail de réinitialisation.')
      setStatus('error')
      return
    }

    setOobCode(code)
    verifyPasswordResetCode(auth, code)
      .then(retrievedEmail => {
        setEmail(retrievedEmail)
        setStatus('ready')
      })
      .catch((err: any) => {
        console.error('Erreur vérification code:', err)
        // Détecter le type d'erreur
        if (err.code === 'auth/expired-action-code') {
          setError('Votre demande de réinitialisation du mot de passe a expiré. Les liens sont valables pendant 1 heure.')
        } else if (err.code === 'auth/invalid-action-code') {
          setError('Ce lien a déjà été utilisé ou est invalide. Chaque lien ne peut être utilisé qu\'une seule fois.')
        } else {
          setError('Ce lien a expiré ou a déjà été utilisé. Merci de recommencer la procédure depuis l\'application.')
        }
        setStatus('error')
      })
  }, [])

  const passwordsMatch = password === confirmPassword
  const isPasswordStrong = password.length >= 8

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!oobCode) return

    if (!isPasswordStrong) {
      setError('Choisissez un mot de passe d\'au moins 8 caractères.')
      return
    }

    if (!passwordsMatch) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }

    try {
      setSubmitting(true)
      setError(null)
      await confirmPasswordReset(auth, oobCode, password)
      setStatus('success')
    } catch (err) {
      console.error('Erreur reset password:', err)
      setError('Impossible de valider ce lien. Veuillez recommencer depuis l\'application.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl bg-white/95 rounded-3xl shadow-2xl overflow-hidden border border-white/20">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-10 text-white">
            <div>
              <p className="uppercase tracking-[0.3em] text-sm mb-6 opacity-80">ComeBac League</p>
              <h1 className="text-3xl font-bold leading-tight">Réinitialise ton mot de passe en toute sécurité</h1>
              <p className="mt-4 text-white/80">Accède à ton espace joueur ou coach et retrouve toutes tes statistiques, compositions et notifications.</p>
            </div>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <span className="text-xl">⚽</span>
                </div>
                <p>Suivi en temps réel de tes performances et badges débloqués.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <span className="text-xl">📅</span>
                </div>
                <p>Calendrier à jour des matchs et notifications importantes.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  <span className="text-xl">🔐</span>
                </div>
                <p>Processus sécurisé validé par la ligue pour protéger ton compte.</p>
              </div>
            </div>
          </div>

          <div className="p-8 lg:p-10">
            {status === 'checking' && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                <p className="mt-4 text-gray-600">Nous vérifions ton lien...</p>
              </div>
            )}

            {status === 'error' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-4">
                  <LockKeyhole className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-semibold mb-3 text-gray-900">Lien expiré ou invalide</h2>
                <p className="text-gray-600 mb-2">
                  Votre demande de réinitialisation du mot de passe a expiré ou ce lien a déjà été utilisé.
                </p>
                <p className="text-sm text-gray-500 mb-8">
                  Les liens de réinitialisation sont valables pendant 1 heure et ne peuvent être utilisés qu'une seule fois.
                </p>
                <div className="space-y-3">
                  <Link 
                    href="/login" 
                    className="inline-block w-full px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold shadow-lg hover:bg-indigo-700 transition-colors"
                  >
                    Retourner à la connexion
                  </Link>
                  <p className="text-sm text-gray-500">
                    Vous pouvez demander un nouveau lien depuis la page de connexion en cliquant sur "Mot de passe oublié".
                  </p>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-green-50 text-green-600 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-semibold mb-2">Mot de passe mis à jour !</h2>
                <p className="text-gray-600 mb-6">Tu peux maintenant te connecter avec ton nouveau mot de passe.</p>
                <Link href="/login" className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold shadow-lg hover:bg-green-700">
                  Aller à la connexion
                </Link>
              </div>
            )}

            {status === 'ready' && (
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <LockKeyhole className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm uppercase tracking-widest text-gray-500">Sécurisé</p>
                    <h2 className="text-2xl font-semibold text-gray-900">Définis ton nouveau mot de passe</h2>
                  </div>
                </div>

                <div className="mb-6 p-4 rounded-2xl bg-gray-50 border border-gray-100">
                  <p className="text-sm text-gray-500">Compte concerné</p>
                  <p className="font-semibold text-gray-900">{email}</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <p className="text-xs text-gray-500 mt-2">Minimum 8 caractères.</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirme ton mot de passe</label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    {!passwordsMatch && confirmPassword.length > 0 && (
                      <p className="text-xs text-red-500 mt-2">Les mots de passe doivent être identiques.</p>
                    )}
                  </div>

                  {error && (
                    <div className="p-3 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 text-white font-semibold shadow-lg hover:opacity-95 transition disabled:opacity-60"
                  >
                    {submitting ? 'Mise à jour...' : 'Mettre à jour mon mot de passe'}
                  </button>
                </form>

                <p className="mt-6 text-sm text-gray-500 text-center">
                  Besoin d'aide ? Contacte <a href="mailto:contact@comebac.com" className="text-indigo-600 font-semibold">contact@comebac.com</a>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
