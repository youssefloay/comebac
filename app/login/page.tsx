"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AlertCircle, Mail, Lock, Chrome } from "lucide-react";
import { SimpleLogo } from "@/components/ui/logo";
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
      await resetPassword(email);
      setResetEmailSent(true);
      setShowForgotPassword(false);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        setError("Aucun compte trouvé avec cet email");
      } else {
        setError("Erreur lors de l'envoi de l'email de réinitialisation");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
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
    <div className="sofa-theme min-h-screen flex items-center justify-center p-4">
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
              <SimpleLogo
                className="w-16 h-16 object-contain rounded-lg"
                alt="ComeBac League"
              />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-sofa-text-primary">
              ComeBac League
            </CardTitle>
            <CardDescription className="text-sofa-text-secondary">
              {isSignUp
                ? "Créez votre compte"
                : "Connectez-vous au championnat scolaire"}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
                {showResendButton && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResendVerification}
                    disabled={isLoading}
                    className="mt-2 text-xs"
                  >
                    Renvoyer l'email de vérification
                  </Button>
                )}
              </motion.div>
            )}

            {emailSent && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm"
              >
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-800 mb-2">
                      ✅ Compte créé avec succès !
                    </p>
                    <p className="mb-2 font-medium text-orange-700">
                      ⚠️ Vous devez vérifier votre email avant de pouvoir vous
                      connecter.
                    </p>
                    <p className="mb-2">
                      Un email de vérification a été envoyé à :
                    </p>
                    <p className="font-medium bg-green-100 px-2 py-1 rounded text-green-800 mb-3">
                      {email}
                    </p>
                    <div className="text-xs space-y-1">
                      <p>
                        📧 <strong>Étapes suivantes :</strong>
                      </p>
                      <p>1. Vérifiez votre boîte mail (et le dossier spam)</p>
                      <p>2. Cliquez sur le lien de vérification</p>
                      <p>3. Revenez ici pour vous connecter</p>
                      <p className="font-medium text-orange-700 mt-2">
                        🚫 Vous ne pouvez pas accéder à la plateforme sans
                        vérification !
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleEmailAuth} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-700"
                  >
                    Mot de passe
                  </Label>
                  {!isSignUp && (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-xs text-sofa-text-accent hover:text-sofa-green underline"
                    >
                      Mot de passe oublié?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {resetEmailSent && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm"
                >
                  ✅ Email de réinitialisation envoyé à <strong>{email}</strong>. Vérifiez votre boîte mail!
                </motion.div>
              )}

              {showForgotPassword && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                >
                  <p className="text-sm text-blue-800 mb-3">
                    Entrez votre email pour recevoir un lien de réinitialisation
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={isLoading}
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      Envoyer
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                  </div>
                </motion.div>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 sofa-btn"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" className="text-white" />
                ) : isSignUp ? (
                  "Créer le compte"
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">ou</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full h-12 border-sofa-border hover:bg-sofa-bg-hover"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Chrome className="w-5 h-5 mr-2 text-sofa-blue" />
                  Continuer avec Google
                </>
              )}
            </Button>

            <div className="text-center space-y-3">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-sm text-sofa-text-accent hover:text-sofa-green underline"
              >
                {isSignUp
                  ? "Déjà un compte ? Se connecter"
                  : "Pas de compte ? Créer un compte"}
              </button>

              <div className="pt-2 border-t border-gray-200">
                <a
                  href="/register-team"
                  className="inline-flex items-center justify-center w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-lg hover:shadow-xl"
                >
                  REGISTER NOW
                </a>
              </div>

              <div className="text-xs text-gray-500">
                En vous connectant, vous acceptez nos conditions d'utilisation
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
