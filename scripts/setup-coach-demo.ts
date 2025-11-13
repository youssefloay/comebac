import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function setupCoachDemo() {
  try {
    console.log('🚀 Configuration de la démo Espace Entraîneur...\n')

    // 1. Créer une équipe de test
    console.log('📝 Création de l\'équipe de test...')
    const teamData = {
      name: 'FC Comebac',
      color: '#3B82F6',
      logo: '',
      stats: {
        matchesPlayed: 5,
        wins: 3,
        draws: 1,
        losses: 1,
        goalsFor: 12,
        goalsAgainst: 7
      },
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const teamRef = await addDoc(collection(db, 'teams'), teamData)
    const teamId = teamRef.id
    console.log(`✅ Équipe créée: ${teamData.name} (${teamId})`)

    // 2. Créer des joueurs de test
    console.log('\n📝 Création des joueurs...')
    const players = [
      { firstName: 'Ahmed', lastName: 'Mohamed', position: 'Gardien', jerseyNumber: 1, email: 'ahmed@test.com', phone: '+20 123 456 7890' },
      { firstName: 'Omar', lastName: 'Hassan', position: 'Défenseur', jerseyNumber: 2, email: 'omar@test.com', phone: '+20 123 456 7891' },
      { firstName: 'Youssef', lastName: 'Ali', position: 'Défenseur', jerseyNumber: 3, email: 'youssef@test.com', phone: '+20 123 456 7892' },
      { firstName: 'Karim', lastName: 'Ibrahim', position: 'Milieu', jerseyNumber: 8, email: 'karim@test.com', phone: '+20 123 456 7893' },
      { firstName: 'Mahmoud', lastName: 'Samir', position: 'Milieu', jerseyNumber: 10, email: 'mahmoud@test.com', phone: '+20 123 456 7894' },
      { firstName: 'Hassan', lastName: 'Khaled', position: 'Attaquant', jerseyNumber: 9, email: 'hassan@test.com', phone: '+20 123 456 7895' },
      { firstName: 'Mohamed', lastName: 'Tarek', position: 'Attaquant', jerseyNumber: 11, email: 'mohamed@test.com', phone: '+20 123 456 7896' },
    ]

    for (const player of players) {
      const playerData = {
        ...player,
        teamId: teamId,
        teamName: teamData.name,
        nickname: '',
        birthDate: '2005-01-01',
        height: 175,
        stats: {
          matchesPlayed: Math.floor(Math.random() * 5),
          goals: Math.floor(Math.random() * 5),
          assists: Math.floor(Math.random() * 3),
          yellowCards: Math.floor(Math.random() * 2),
          redCards: 0
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }
      await addDoc(collection(db, 'playerAccounts'), playerData)
      console.log(`   ✅ ${player.firstName} ${player.lastName} (#${player.jerseyNumber})`)
    }

    // 3. Créer le compte entraîneur
    console.log('\n📝 Création du compte entraîneur...')
    const coachEmail = 'contact@comebac.com'
    
    // Vérifier