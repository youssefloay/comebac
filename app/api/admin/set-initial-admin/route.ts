import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, query, where, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ 
        error: 'Email requis' 
      }, { status: 400 })
    }

    // Vérifier si c'est le premier admin (contact@comebac.com)
    if (email !== 'contact@comebac.com') {
      return NextResponse.json({ 
        error: 'Seul contact@comebac.com peut être défini comme admin initial' 
      }, { status: 403 })
    }

    // Chercher le profil utilisateur
    const userProfilesQuery = query(
      collection(db, 'userProfiles'),
      where('email', '==', email)
    )
    
    const userProfilesSnap = await getDocs(userProfilesQuery)
    
    if (!userProfilesSnap.empty) {
      // Mettre à jour le profil existant
      const profileDoc = userProfilesSnap.docs[0]
      await updateDoc(doc(db, 'userProfiles', profileDoc.id), {
        role: 'admin'
      })
    } else {
      // Créer un nouveau profil admin
      await addDoc(collection(db, 'userProfiles'), {
        email: email,
        fullName: 'Admin ComeBac',
        username: 'admin',
        role: 'admin',
        createdAt: new Date()
      })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Admin initial configuré avec succès'
    })
  } catch (error) {
    console.error('Erreur lors de la configuration de l\'admin:', error)
    return NextResponse.json({ 
      error: 'Erreur lors de la configuration de l\'admin' 
    }, { status: 500 })
  }
}
