"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { 
  User, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword
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
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false)
  const router = useRouter()

  const isAdmin = user?.email === "admin@admin.com"

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
        
        // User is not logged in - only redirect to login for admin routes
        const currentPath = window.location.pathname
        if (currentPath.startsWith('/admin') || currentPath === '/user') {
          router.push('/login')
        }
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error('Error signing in with email:', error)
      throw error
    }
  }

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password)
    } catch (error) {
      console.error('Error signing up with email:', error)
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