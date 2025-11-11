"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { 
  User, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth'
import { auth } from './firebase'
import { useRouter } from 'next/navigation'
import { getUserProfile } from './db'
import type { UserProfile } from './types'

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  needsProfileCompletion: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
  resendVerificationEmail: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false)
  const router = useRouter()

  const isAdmin = user?.email === "admin@admin.com" || user?.email === "contact@comebac.com"

  const loadUserProfile = async (firebaseUser: User) => {
    try {
      console.log('Loading profile for user:', firebaseUser.uid)
      const profile = await getUserProfile(firebaseUser.uid)
      console.log('Profile found:', !!profile)
      setUserProfile(profile)
      setNeedsProfileCompletion(!profile)
      return profile
    } catch (error) {
      console.error('Error loading user profile:', error)
      setNeedsProfileCompletion(true)
      return null
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      
      if (user) {
        const profile = await loadUserProfile(user)
        
        // Check if we need to redirect after profile loading
        const currentPath = window.location.pathname
        console.log('Current path:', currentPath, 'Profile exists:', !!profile)
        
        if (currentPath === '/login') {
          if (!profile) {
            // User needs to complete profile - stay on login page
            // The login page will show the profile completion component
            console.log('User needs to complete profile, staying on login page')
          } else if (user.email === "admin@admin.com") {
            console.log('Admin user, redirecting to /admin')
            router.push('/admin')
          } else {
            console.log('Regular user with profile, redirecting to /public')
            router.push('/public')
          }
        } else if (currentPath === '/') {
          // For root path, redirect authenticated users appropriately
          if (profile) {
            if (user.email === "admin@admin.com") {
              console.log('Admin user, redirecting to /admin')
              router.push('/admin')
            } else {
              console.log('Regular user with profile, redirecting to /public')
              router.push('/public')
            }
          }
          // If no profile, stay on root page to show login/public options
        }
      } else {
        setUserProfile(null)
        setNeedsProfileCompletion(false)
        
        // User is not logged in - redirect to login for all pages except login, root, and register-team
        const currentPath = window.location.pathname
        if (currentPath !== '/login' && currentPath !== '/' && currentPath !== '/register-team') {
          router.push('/login')
        }
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      
      // Vérifier si l'email est vérifié (sauf pour l'admin)
      if (!userCredential.user.emailVerified && email !== "admin@admin.com") {
        await signOut(auth) // Déconnecter l'utilisateur
        throw new Error("Veuillez vérifier votre email avant de vous connecter. Vérifiez votre boîte mail et cliquez sur le lien de vérification.")
      }
    } catch (error: any) {
      console.error('Error signing in with email:', error)
      
      // Améliorer les messages d'erreur
      if (error.code === 'auth/user-not-found') {
        throw new Error('Aucun compte trouvé avec cet email. Créez un compte d\'abord.')
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Mot de passe incorrect. Vérifiez votre mot de passe.')
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('L\'adresse email n\'est pas valide.')
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Trop de tentatives de connexion. Réessayez plus tard.')
      }
      
      throw error
    }
  }

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      
      // Envoyer l'email de vérification
      await sendEmailVerification(userCredential.user)
      
      // IMPORTANT: Déconnecter l'utilisateur immédiatement après création
      // Il ne pourra se reconnecter qu'après avoir vérifié son email
      await signOut(auth)
      
      console.log('Email de vérification envoyé à:', email, '- Utilisateur déconnecté en attente de vérification')
    } catch (error: any) {
      console.error('Error signing up with email:', error)
      
      // Améliorer les messages d'erreur
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Cet email est déjà utilisé. Essayez de vous connecter ou utilisez un autre email.')
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Le mot de passe est trop faible. Utilisez au moins 6 caractères.')
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('L\'adresse email n\'est pas valide.')
      }
      
      throw error
    }
  }

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (error) {
      console.error('Error signing in with Google:', error)
      throw error
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
      setUserProfile(null)
      setNeedsProfileCompletion(false)
      router.push('/login')
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user)
      
      // After profile completion, redirect appropriately
      if (user.email === "admin@admin.com") {
        router.push('/admin')
      } else {
        router.push('/public')
      }
    }
  }

  const resendVerificationEmail = async () => {
    if (user && !user.emailVerified) {
      await sendEmailVerification(user)
      console.log('Email de vérification renvoyé à:', user.email)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
      console.log('Email de réinitialisation envoyé à:', email)
    } catch (error) {
      console.error('Error sending password reset email:', error)
      throw error
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    needsProfileCompletion,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    logout,
    refreshProfile,
    resendVerificationEmail,
    resetPassword,
    isAdmin
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}