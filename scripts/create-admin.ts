import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../lib/firebase'

export async function createAdminAccount() {
  try {
    console.log('🔐 Creating admin account...')
    
    const userCredential = await createUserWithEmailAndPassword(
      auth, 
      'admin@admin.com', 
      'Youssef'
    )
    
    console.log('✅ Admin account created successfully!')
    console.log('👤 User ID:', userCredential.user.uid)
    
    return userCredential.user
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log('ℹ️ Admin account already exists')
    } else {
      console.error('❌ Error creating admin account:', error.message)
      throw error
    }
  }
}

// Function to call from browser console
if (typeof window !== 'undefined') {
  (window as any).createAdminAccount = createAdminAccount
}