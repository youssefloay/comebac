"use client"

import { createContext, useContext, useEffect, useState } from 'react'
import { 
  User, 
  signInWithEmailAndPassword, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendEmailVerification
} from 'firebase/auth'
import { auth, db } from './firebase'
import { useRouter } from 'next/navigation'
import { getUserProfile } from './db'
import type { UserProfile } from './types'
import { serverTimestamp } from 'firebase/firestore'
import { doc } from 'firebase/firestore'
import { setDoc } from 'firebase/firestore'

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  needsProfileCompletion: boolean
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, phone?: string) => Promise<void>
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

  const isAdmin = userProfile?.role === 'admin'

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
    // Gérer le résultat de la redirection Google
    const handleRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth)
        if (result && result.user) {
          console.log('Google sign-in redirect successful')
          if (result.user.email) {
            updateLastLogin(result.user.email)
          }
        }
      } catch (error: any) {
        console.error('Error handling redirect result:', error)
        // Ne pas bloquer l'application si la redirection échoue
      }
    }
    
    handleRedirectResult()
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      
      if (user) {
        const profile = await loadUserProfile(user)
        
        // Mettre à jour lastLogin immédiatement
        updateLastLogin(user.email)
        
        // Check if we need to redirect after profile loading
        const currentPath = window.location.pathname
        console.log('Current path:', currentPath, 'Profile exists:', !!profile)
        
        if (currentPath === '/login') {
          if (!profile) {
            // User needs to complete profile - stay on login page
            // The login page will show the profile completion component
            console.log('User needs to complete profile, staying on login page')
          } else if (profile?.role === 'admin') {
            console.log('Admin user, redirecting to /admin')
            router.push('/admin')
          } else if (profile?.role === 'player') {
            console.log('Player user, redirecting to /player')
            router.push('/player')
          } else {
            console.log('Regular user with profile, redirecting to /public')
            router.push('/public')
          }
        } else if (currentPath === '/') {
          // For root path, redirect authenticated users appropriately
          if (profile) {
            if (profile?.role === 'admin') {
              console.log('Admin user, redirecting to /admin')
              router.push('/admin')
            } else if (profile?.role === 'player') {
              console.log('Player user, redirecting to /player')
              router.push('/player')
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
        
        // User is not logged in - redirect to login for all pages except public routes
        const currentPath = window.location.pathname
        const publicRoutes = [
          '/login',
          '/',
          '/register-team',
          '/register-team',
          '/register-team/collaborative',
          '/update-registration',
          '/team-registration',
          '/join-team',
          '/join-team-coach'
        ]
        
        const isPublicRoute = publicRoutes.some(route => currentPath.startsWith(route))
        
        if (!isPublicRoute) {
          router.push('/login')
        }
      }
      
      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  // Mettre à jour lastLogin périodiquement (toutes les 5 minutes)
  useEffect(() => {
    if (!user?.email) return

    const updateActivity = () => {
      updateLastLogin(user.email)
    }

    // Mettre à jour toutes les 5 minutes
    const interval = setInterval(updateActivity, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [user])

  const updateLastLogin = async (email: string | null) => {
    if (!email) return

    try {
      const { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } = await import('firebase/firestore')
      const { getDeviceInfo } = await import('@/lib/device-info')
      
      const deviceInfo = getDeviceInfo()
      
      let updated = false
      
      // Chercher dans playerAccounts
      const playerQuery = query(collection(db, 'playerAccounts'), where('email', '==', email))
      const playerSnap = await getDocs(playerQuery)
      
      if (!playerSnap.empty) {
        await updateDoc(doc(db, 'playerAccounts', playerSnap.docs[0].id), {
          lastLogin: serverTimestamp(),
          lastDevice: deviceInfo.device,
          lastOS: deviceInfo.os,
          lastBrowser: deviceInfo.browser,
          lastIsPWA: deviceInfo.isPWA,
          lastScreenResolution: deviceInfo.screenResolution,
          lastViewportSize: deviceInfo.viewportSize,
          lastLanguage: deviceInfo.language,
          lastTimezone: deviceInfo.timezone,
          lastConnectionType: deviceInfo.connectionType,
          lastDownlink: deviceInfo.downlink,
          deviceMemory: deviceInfo.deviceMemory,
          hardwareConcurrency: deviceInfo.hardwareConcurrency
        })
        updated = true
      }
      
      // Chercher dans coachAccounts
      if (!updated) {
        const coachQuery = query(collection(db, 'coachAccounts'), where('email', '==', email))
        const coachSnap = await getDocs(coachQuery)
        
        if (!coachSnap.empty) {
          await updateDoc(doc(db, 'coachAccounts', coachSnap.docs[0].id), {
            lastLogin: serverTimestamp(),
            lastDevice: deviceInfo.device,
            lastOS: deviceInfo.os,
            lastBrowser: deviceInfo.browser,
            lastIsPWA: deviceInfo.isPWA,
            lastScreenResolution: deviceInfo.screenResolution,
            lastViewportSize: deviceInfo.viewportSize,
            lastLanguage: deviceInfo.language,
            lastTimezone: deviceInfo.timezone,
            lastConnectionType: deviceInfo.connectionType,
            lastDownlink: deviceInfo.downlink,
            deviceMemory: deviceInfo.deviceMemory,
            hardwareConcurrency: deviceInfo.hardwareConcurrency
          })
          updated = true
        }
      }
      
      // Chercher dans users (pour admins et utilisateurs réguliers)
      if (!updated) {
        const usersQuery = query(collection(db, 'users'), where('email', '==', email))
        const usersSnap = await getDocs(usersQuery)
        
        if (!usersSnap.empty) {
          await updateDoc(doc(db, 'users', usersSnap.docs[0].id), {
            lastLogin: serverTimestamp(),
            lastDevice: deviceInfo.device,
            lastOS: deviceInfo.os,
            lastBrowser: deviceInfo.browser,
            lastIsPWA: deviceInfo.isPWA,
            lastScreenResolution: deviceInfo.screenResolution,
            lastViewportSize: deviceInfo.viewportSize,
            lastLanguage: deviceInfo.language,
            lastTimezone: deviceInfo.timezone,
            lastConnectionType: deviceInfo.connectionType,
            lastDownlink: deviceInfo.downlink,
            deviceMemory: deviceInfo.deviceMemory,
            hardwareConcurrency: deviceInfo.hardwareConcurrency
          })
          updated = true
        }
      }
      
      // Chercher dans userProfiles
      if (!updated) {
        const profilesQuery = query(collection(db, 'userProfiles'), where('email', '==', email))
        const profilesSnap = await getDocs(profilesQuery)
        
        if (!profilesSnap.empty) {
          await updateDoc(doc(db, 'userProfiles', profilesSnap.docs[0].id), {
            lastLogin: serverTimestamp(),
            lastDevice: deviceInfo.device,
            lastOS: deviceInfo.os,
            lastBrowser: deviceInfo.browser,
            lastIsPWA: deviceInfo.isPWA,
            lastScreenResolution: deviceInfo.screenResolution,
            lastViewportSize: deviceInfo.viewportSize,
            lastLanguage: deviceInfo.language,
            lastTimezone: deviceInfo.timezone,
            lastConnectionType: deviceInfo.connectionType,
            lastDownlink: deviceInfo.downlink,
            deviceMemory: deviceInfo.deviceMemory,
            hardwareConcurrency: deviceInfo.hardwareConcurrency
          })
        }
      }
    } catch (error) {
      console.error('Error updating lastLogin:', error)
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      
      // Vérifier si l'email est vérifié (sauf pour l'admin principal)
      if (!userCredential.user.emailVerified && email !== "contact@comebac.com") {
        await signOut(auth) // Déconnecter l'utilisateur
        throw new Error("Veuillez vérifier votre email avant de vous connecter. Vérifiez votre boîte mail et cliquez sur le lien de vérification.")
      }

      // Mettre à jour lastLogin
      updateLastLogin(email)
    } catch (error: any) {
      console.error('Error signing in with email:', error)
      
      // Améliorer les messages d'erreur
      if (error.code === 'auth/invalid-credential') {
        // Firebase a consolidé auth/wrong-password et auth/user-not-found en auth/invalid-credential
        throw new Error('Email ou mot de passe incorrect. Vérifiez vos identifiants et réessayez.')
      } else if (error.code === 'auth/user-not-found') {
        throw new Error('Aucun compte trouvé avec cet email. Créez un compte d\'abord.')
      } else if (error.code === 'auth/wrong-password') {
        throw new Error('Mot de passe incorrect. Vérifiez votre mot de passe.')
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('L\'adresse email n\'est pas valide.')
      } else if (error.code === 'auth/too-many-requests') {
        throw new Error('Trop de tentatives de connexion. Réessayez plus tard.')
      } else if (error.code === 'auth/user-disabled') {
        throw new Error('Ce compte a été désactivé. Contactez le support.')
      }
      
      throw error
    }
  }

  const signUpWithEmail = async (email: string, password: string, phone?: string) => {
    try {
      const sanitizedEmail = email.trim()
      const normalizedEmail = sanitizedEmail.toLowerCase()

      // Vérifier si l'email existe déjà en tant que joueur ou coach
      const { collection, query, where, getDocs, setDoc, updateDoc, doc, serverTimestamp } = await import('firebase/firestore')
      
      // Vérifier dans playerAccounts (compte déjà créé)
      const playerAccountsQuery = query(
        collection(db, 'playerAccounts'),
        where('email', '==', sanitizedEmail)
      )
      const playerAccountsSnap = await getDocs(playerAccountsQuery)
      
      // Vérifier dans coachAccounts (compte déjà créé)
      const coachAccountsQuery = query(
        collection(db, 'coachAccounts'),
        where('email', '==', sanitizedEmail)
      )
      const coachAccountsSnap = await getDocs(coachAccountsQuery)
      
      // Vérifier dans players (collection principale) - pour les joueurs inscrits mais sans compte
      const playersQuery = query(
        collection(db, 'players'),
        where('email', '==', sanitizedEmail)
      )
      const playersSnap = await getDocs(playersQuery)

      const playerAccountExists = !playerAccountsSnap.empty
      const coachAccountExists = !coachAccountsSnap.empty
      const playerExists = !playersSnap.empty

      // Si l'email existe déjà dans playerAccounts ou coachAccounts, bloquer
      if (playerAccountExists || coachAccountExists) {
        throw new Error('Cet email a déjà accès à l\'application Joueur/Coach. Connecte-toi directement comme joueur ou utilise "Mot de passe oublié".')
      }

      // Créer le compte Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, sanitizedEmail, password)
      const uid = userCredential.user.uid

      // Si l'email existe dans players (inscrit dans une équipe), créer automatiquement playerAccount
      if (playerExists) {
        const playerDoc = playersSnap.docs[0]
        const playerData = playerDoc.data()
        
        // Créer le playerAccount avec les données du joueur
        await setDoc(doc(db, 'playerAccounts', uid), {
          uid: uid,
          email: sanitizedEmail,
          firstName: playerData.firstName || playerData.name?.split(' ')[0] || '',
          lastName: playerData.lastName || playerData.name?.split(' ').slice(1).join(' ') || '',
          nickname: playerData.nickname || '',
          phone: phone || playerData.phone || '',
          position: playerData.position || '',
          jerseyNumber: playerData.number || playerData.jerseyNumber || 0,
          teamId: playerData.teamId || '',
          birthDate: playerData.birthDate || '',
          height: playerData.height || 0,
          tshirtSize: playerData.tshirtSize || 'M',
          foot: playerData.strongFoot === 'Droit' ? 'Droitier' : playerData.strongFoot === 'Gauche' ? 'Gaucher' : 'Ambidextre',
          role: 'player',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        })
        
        console.log('✅ Compte joueur créé automatiquement pour:', sanitizedEmail)
      } else if (!coachAccountsSnap.empty) {
        // Si l'email existe dans coachAccounts (même sans uid), mettre à jour avec l'UID
        const coachDoc = coachAccountsSnap.docs[0]
        const coachData = coachDoc.data()
        
        // Mettre à jour le coachAccount avec l'UID si manquant
        if (!coachData.uid || coachData.uid !== uid) {
          await updateDoc(coachDoc.ref, {
            uid: uid,
            updatedAt: serverTimestamp()
          })
          console.log('✅ Compte coach mis à jour automatiquement pour:', sanitizedEmail)
        }
      } else {
        // Sinon, créer un compte utilisateur normal
        await setDoc(doc(db, 'users', uid), {
          email: sanitizedEmail,
          phone: phone || '',
          role: 'user',
          createdAt: serverTimestamp(),
          emailVerified: false
        })
      }
      
      // Envoyer l'email de vérification
      await sendEmailVerification(userCredential.user)
      
      // IMPORTANT: Déconnecter l'utilisateur immédiatement après création
      // Il ne pourra se reconnecter qu'après avoir vérifié son email
      await signOut(auth)
      
      console.log('Email de vérification envoyé à:', sanitizedEmail, '- Utilisateur déconnecté en attente de vérification')
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
      // Ajouter des scopes si nécessaire
      provider.addScope('profile')
      provider.addScope('email')
      // Forcer la sélection du compte
      provider.setCustomParameters({
        prompt: 'select_account'
      })
      
      // Essayer d'abord avec popup
      try {
        const result = await signInWithPopup(auth, provider)
        
        // Mettre à jour lastLogin après connexion réussie
        if (result.user.email) {
          updateLastLogin(result.user.email)
        }
      } catch (popupError: any) {
        // Si popup échoue avec internal-error, essayer avec redirect
        if (popupError.code === 'auth/internal-error' || popupError.code === 'auth/popup-blocked') {
          console.log('Popup failed, trying redirect method...')
          await signInWithRedirect(auth, provider)
          // Note: signInWithRedirect ne retourne pas immédiatement
          // Le résultat sera géré par getRedirectResult dans useEffect
          return
        }
        throw popupError
      }
    } catch (error: any) {
      console.error('Error signing in with Google:', error)
      
      // Améliorer les messages d'erreur
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('La fenêtre de connexion a été fermée. Veuillez réessayer.')
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('La fenêtre popup a été bloquée. Veuillez autoriser les popups pour ce site.')
      } else if (error.code === 'auth/unauthorized-domain') {
        const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'unknown'
        throw new Error(`Ce domaine (${currentDomain}) n'est pas autorisé. Veuillez l'ajouter dans Firebase Console → Authentication → Settings → Authorized domains.`)
      } else if (error.code === 'auth/internal-error') {
        throw new Error('Erreur interne Firebase. Vérifiez que :\n1. Google Sign-In est activé dans Firebase Console\n2. Le domaine est autorisé\n3. Les clés OAuth sont correctement configurées')
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('La méthode de connexion Google n\'est pas activée. Activez-la dans Firebase Console → Authentication → Sign-in method.')
      }
      
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
      if (userProfile?.role === 'admin') {
        console.log('Admin user, redirecting to /admin')
        router.push('/admin')
      } else if (userProfile?.role === 'player') {
        console.log('Player user, redirecting to /player')
        router.push('/player')
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
      // Utiliser notre API personnalisée pour envoyer un email avec notre template
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi de l\'email de réinitialisation')
      }

      console.log('✅ Email de réinitialisation envoyé via notre service personnalisé à:', email)
      if (data.emailId) {
        console.log('📧 Email ID Resend:', data.emailId)
        console.log('📧 Vérifiez le statut sur:', data.checkStatusUrl)
      }
    } catch (error: any) {
      console.error('❌ Erreur lors de l\'envoi de l\'email de réinitialisation:', error)
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
