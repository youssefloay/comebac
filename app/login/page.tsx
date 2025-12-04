"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AlertCircle, Mail, Lock, UserPlus, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { DomainError } from "@/components/auth/domain-error";
import { ProfileCompletion } from "@/components/auth/profile-completion";

export default function LoginPage() {
  const {
    user,
    needsProfileCompletion,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    refreshProfile,
    resendVerificationEmail,
    resetPassword,
    loading,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isDomainError, setIsDomainError] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
        setEmailSent(true);
        setIsSignUp(false); // Revenir au mode connexion après création
        setError(""); // Clear any previous errors
        setShowResendButton(false); // Reset resend button
      } else {
        await signInWithEmail(email, password);
      }
    } catch (error: any) {
      if (error.code === "auth/unauthorized-domain") {
        setIsDomainError(true);
        setError("");
      } else {
        const errorMessage =
          error.message ||
          (isSignUp ? "Erreur de création de compte" : "Erreur de connexion");
        setError(errorMessage);
        setIsDomainError(false);

        // Afficher le bouton de renvoi si c'est une erreur de vérification d'email
        if (errorMessage.includes("vérifier votre email")) {
          setShowResendButton(true);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      await signInWithGoogle();
    } catch (error: any) {
      if (error.code === "auth/unauthorized-domain") {
        setIsDomainError(true);
        setError("");
      } else {
        setError(error.message || "Erreur de connexion avec Google");
        setIsDomainError(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      setIsLoading(true);
      await resendVerificationEmail();
      setEmailSent(true);
      setShowResendButton(false);
      setError("");
    } catch (error: any) {
      setError("Erreur lors de l'envoi de l'email de vérification");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Veuillez entrer votre email");
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi de l'email de réinitialisation");
      }

      // Afficher l'ID Resend si disponible pour le débogage
      if (data.emailId) {
        console.log('📧 Email ID Resend:', data.emailId);
        console.log('📧 Vérifiez le statut:', data.checkStatusUrl);
      }

      setResetEmailSent(true);
      setShowForgotPassword(false);
    } catch (error: any) {
      console.error('❌ Erreur reset password:', error);
      if (error.message?.includes('user-not-found')) {
        setError("Aucun compte trouvé avec cet email");
      } else {
        setError(error.message || "Erreur lors de l'envoi de l'email de réinitialisation");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Show domain error if detected
  if (isDomainError) {
    return (
      <div className="sofa-theme min-h-screen flex items-center justify-center p-4">
        <DomainError
          currentDomain={
            typeof window !== "undefined" ? window.location.hostname : undefined
          }
        />
      </div>
    );
  }

  // Show profile completion if user is authenticated but needs to complete profile
  if (user && needsProfileCompletion) {
    return <ProfileCompletion user={user} onComplete={refreshProfile} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-white via-white to-gray-50/50 dark:from-gray-800 dark:via-gray-800/50 dark:to-gray-900 rounded-2xl sm:rounded-3xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-xl shadow-2xl overflow-hidden"
        >
          {/* Header with gradient */}
          <div className="relative bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8 pb-8 sm:pb-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-400/20 rounded-full blur-xl"></div>
            
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="relative mx-auto mb-4 sm:mb-6 w-16 h-16 sm:w-20 sm:h-20 bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center overflow-hidden border-2 border-white/50 shadow-xl"
            >
              <img
                src="/comebac.png?v=2"
                alt="ComeBac League"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  if (e.currentTarget.parentElement) {
                    e.currentTarget.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-white font-bold text-lg sm:text-xl">CB</div>'
                  }
                }}
              />
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl sm:text-3xl font-bold text-white text-center mb-2"
            >
              ComeBac League
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-blue-100 text-center text-sm sm:text-base"
            >
              {isSignUp
                ? "Créez votre compte"
                : "Connectez-vous au championnat scolaire"}
            </motion.p>
          </div>

          <div className="p-6 sm:p-8 space-y-6">

            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col gap-2 p-3 sm:p-4 bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-800/20 border border-red-200/50 dark:border-red-800/50 rounded-xl backdrop-blur-sm text-red-700 dark:text-red-300 text-sm"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
                {showResendButton && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleResendVerification}
                    disabled={isLoading}
                    className="mt-2 text-xs px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    Renvoyer l'email de vérification
                  </motion.button>
                )}
              </motion.div>
            )}

            {emailSent && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 sm:p-5 bg-gradient-to-br from-green-50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-800/50 rounded-xl backdrop-blur-sm text-green-700 dark:text-green-300 text-sm"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg flex-shrink-0">
                    <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-green-800 dark:text-green-300 mb-2 text-base">
                      ✅ Compte créé avec succès !
                    </p>
                    <p className="mb-2 font-semibold text-orange-600 dark:text-orange-400">
                      ⚠️ Vous devez vérifier votre email avant de pouvoir vous
                      connecter.
                    </p>
                    <p className="mb-2">
                      Un email de vérification a été envoyé à :
                    </p>
                    <p className="font-semibold bg-green-100 dark:bg-green-900/30 px-3 py-2 rounded-lg text-green-800 dark:text-green-200 mb-3 border border-green-200 dark:border-green-800">
                      {email}
                    </p>
                    <div className="text-xs sm:text-sm space-y-1.5">
                      <p>
                        📧 <strong>Étapes suivantes :</strong>
                      </p>
                      <p>1. Vérifiez votre boîte mail (et le dossier spam)</p>
                      <p>2. Cliquez sur le lien de vérification</p>
                      <p>3. Revenez ici pour vous connecter</p>
                      <p className="font-semibold text-orange-600 dark:text-orange-400 mt-2">
                        🚫 Vous ne pouvez pas accéder à la plateforme sans
                        vérification !
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4 sm:space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                >
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 sm:pl-12 h-12 sm:h-14 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    Mot de passe
                  </Label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                    >
                      Mot de passe oublié?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-500" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 sm:pl-12 pr-10 sm:pr-12 h-12 sm:h-14 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none"
                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </button>
                </div>
              </div>

              {resetEmailSent && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-emerald-50/50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200/50 dark:border-green-800/50 rounded-xl backdrop-blur-sm text-green-700 dark:text-green-300 text-sm"
                >
                  ✅ Email de réinitialisation envoyé à <strong>{email}</strong>. Vérifiez votre boîte mail!
                </motion.div>
              )}

              {showForgotPassword && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-800/50 rounded-xl backdrop-blur-sm"
                >
                  <p className="text-sm sm:text-base text-blue-800 dark:text-blue-300 mb-4 font-medium">
                    Entrez votre email pour recevoir un lien de réinitialisation
                  </p>
                  <div className="flex gap-2 sm:gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={isLoading}
                      className="flex-1 px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                    >
                      Envoyer
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="flex-1 px-4 py-2.5 sm:py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl font-semibold transition-colors border border-gray-200 dark:border-gray-600"
                    >
                      Annuler
                    </motion.button>
                  </div>
                </motion.div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full h-12 sm:h-14 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-base sm:text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" className="text-white" />
                ) : isSignUp ? (
                  "Créer le compte"
                ) : (
                  "Se connecter"
                )}
              </motion.button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 sm:px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">ou</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full h-12 sm:h-14 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 rounded-xl font-semibold text-gray-700 dark:text-gray-300 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  {/* Google Logo SVG */}
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span className="text-sm sm:text-base">Continuer avec Google</span>
                </>
              )}
            </motion.button>

            <div className="text-center space-y-3 sm:space-y-4 pt-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm sm:text-base text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold transition-colors"
              >
                {isSignUp
                  ? "Déjà un compte ? Se connecter"
                  : "Pas de compte ? Créer un compte"}
              </motion.button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 sm:px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">ou</span>
                </div>
              </div>

              <Link href="/register-team">
                <motion.button
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  className="w-full h-12 sm:h-14 bg-gradient-to-r from-green-600 via-emerald-600 to-green-600 hover:from-green-700 hover:via-emerald-700 hover:to-green-700 text-white rounded-xl font-bold text-sm sm:text-base shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-5 h-5 sm:w-6 sm:h-6" />
                  <span>Inscrire une Équipe</span>
                </motion.button>
              </Link>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Aucun compte requis pour l'inscription d'équipe
              </p>

              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 pt-2">
                En vous connectant, vous acceptez nos conditions d'utilisation
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
