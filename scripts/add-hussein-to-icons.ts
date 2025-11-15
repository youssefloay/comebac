// Script pour ajouter Hussein Essam à l'équipe Icons
// Usage: npx tsx scripts/add-hussein-to-icons.ts

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function addHusseinToIcons() {
  try {
    console.log('🔍 Recherche de l\'équipe Icons...')
    
    // Trouver l'équipe Icons
    const teamsSnap = await getDocs(collection(db, 'teams'))
    const iconsTeam = teamsSnap.docs.find(doc => doc.data().name.toLowerCase().includes('icons'))
    
    if (!iconsTeam) {
      console.error('❌ Équipe Icons non trouvée')
      return
    }
    
    console.log('✅ Équipe Icons trouvée:', iconsTeam.id)
    
    // Données de Hussein depuis teamRegistrations
    const hussein = {
      firstName: 'Hussein',
      lastName: 'Essam',
      nickname: 'Sons',
      email: 'husseinessam787@gmail.com',
      phone: '01012030210202',
      birthDate: '2008-01-01',
      height: 175,
      tshirtSize: 'M',
      position: 'Gardien',
      foot: 'Droitier',
      jerseyNumber: 23
    }
    
    // 1. Ajouter dans players
    console.log('📝 Ajout dans la collection players...')
    await addDoc(collection(db, 'players'), {
      name: `${hussein.firstName} ${hussein.lastName}`,
      number: hussein.jerseyNumber,
      position: hussein.position,
      teamId: iconsTeam.id,
      nationality: 'Égypte',
      isCaptain: false,
      email: hussein.email,
      phone: hussein.phone,
      firstName: hussein.firstName,
      lastName: hussein.lastName,
      nickname: hussein.nickname,
      birthDate: hussein.birthDate,
      height: hussein.height,
      tshirtSize: hussein.tshirtSize,
      strongFoot: hussein.foot === 'Droitier' ? 'Droit' : 'Gauche',
      overall: 75,
      seasonStats: {
        goals: 0,
        assists: 0,
        matches: 0,
        yellowCards: 0,
        redCards: 0
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    })
    console.log('✅ Ajouté dans players')
    
    // 2. Créer le compte et envoyer l'email via API
    console.log('📧 Création du compte et envoi de l\'email...')
    const response = await fetch('https://www.comebac.com/api/admin/create-player-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamId: iconsTeam.id,
        players: [hussein]
      })
    })
    
    if (response.ok) {
      console.log('✅ Compte créé et email envoyé!')
    } else {
      const error = await response.json()
      console.error('❌ Erreur:', error)
    }
    
    console.log('\n🎉 Hussein Essam a été ajouté à l\'équipe Icons!')
    
  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

addHusseinToIcons()
