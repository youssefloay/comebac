import { initializeApp } from "firebase/app"
import { getFirestore, collection, addDoc, Timestamp } from "firebase/firestore"
import { NextResponse } from "next/server"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const teamsData = [
  {
    name: "Lycée Français du Caire",
    color: "#1e40af",
    logo: "🇫🇷",
    players: [
      { name: "Ahmed Hassan", number: 1, position: "Gardien" },
      { name: "Mohamed Salah", number: 2, position: "Défenseur" },
      { name: "Omar Farouk", number: 3, position: "Défenseur" },
      { name: "Youssef Mahmoud", number: 4, position: "Défenseur" },
      { name: "Karim Mostafa", number: 5, position: "Milieu" },
      { name: "Amr Tarek", number: 6, position: "Milieu" },
      { name: "Mahmoud Trezeguet", number: 7, position: "Attaquant" },
      { name: "Marwan Mohsen", number: 8, position: "Attaquant" },
      { name: "Ramadan Sobhi", number: 9, position: "Attaquant" },
      { name: "Abdallah Said", number: 10, position: "Milieu" },
      { name: "Mostafa Fathi", number: 11, position: "Attaquant" },
    ],
  },
  {
    name: "École Oasis Internationale",
    color: "#dc2626",
    logo: "🌴",
    players: [
      { name: "Tarek Hamed", number: 1, position: "Gardien" },
      { name: "Sherif Ekramy", number: 2, position: "Défenseur" },
      { name: "Ramy Rabia", number: 3, position: "Défenseur" },
      { name: "Ali Gabr", number: 4, position: "Défenseur" },
      { name: "Walid Soliman", number: 5, position: "Milieu" },
      { name: "Emad Moteab", number: 6, position: "Milieu" },
      { name: "Salah Mohsen", number: 7, position: "Attaquant" },
      { name: "Bassem Morsy", number: 8, position: "Attaquant" },
      { name: "Zizo", number: 9, position: "Attaquant" },
      { name: "Nasser Maher", number: 10, position: "Milieu" },
      { name: "Ayman Hefny", number: 11, position: "Attaquant" },
    ],
  },
  {
    name: "Collège Saint-Marc",
    color: "#0369a1",
    logo: "✝️",
    players: [
      { name: "Essam El Hadary", number: 1, position: "Gardien" },
      { name: "Wael Gomaa", number: 2, position: "Défenseur" },
      { name: "Hany Said", number: 3, position: "Défenseur" },
      { name: "Mahmoud Fathalla", number: 4, position: "Défenseur" },
      { name: "Hosny Abd Rabo", number: 5, position: "Milieu" },
      { name: "Shikabala", number: 6, position: "Milieu" },
      { name: "Geddo", number: 7, position: "Attaquant" },
      { name: "Aboutrika", number: 8, position: "Attaquant" },
      { name: "Zidan", number: 9, position: "Attaquant" },
      { name: "Barakat", number: 10, position: "Milieu" },
      { name: "Mido", number: 11, position: "Attaquant" },
    ],
  },
  {
    name: "Institut Balzac",
    color: "#16a34a",
    logo: "📚",
    players: [
      { name: "Sherif Hazem", number: 1, position: "Gardien" },
      { name: "Ahmed Fathy", number: 2, position: "Défenseur" },
      { name: "Karim Hafez", number: 3, position: "Défenseur" },
      { name: "Ayman Ashraf", number: 4, position: "Défenseur" },
      { name: "Mahmoud Kahraba", number: 5, position: "Milieu" },
      { name: "Abdallah El Said", number: 6, position: "Milieu" },
      { name: "Amr Barakat", number: 7, position: "Attaquant" },
      { name: "Islam Issa", number: 8, position: "Attaquant" },
      { name: "Koka", number: 9, position: "Attaquant" },
      { name: "Junior Ajayi", number: 10, position: "Milieu" },
      { name: "Walid Azaro", number: 11, position: "Attaquant" },
    ],
  },
  {
    name: "École Française de Maadi",
    color: "#7c3aed",
    logo: "🏫",
    players: [
      { name: "Mohamed Abou Gabal", number: 1, position: "Gardien" },
      { name: "Baher El Mohamady", number: 2, position: "Défenseur" },
      { name: "Ahmed Hegazi", number: 3, position: "Défenseur" },
      { name: "Mahmoud Hamdy", number: 4, position: "Défenseur" },
      { name: "Tarek Hamed", number: 5, position: "Milieu" },
      { name: "Sam Morsy", number: 6, position: "Milieu" },
      { name: "Trézéguet", number: 7, position: "Attaquant" },
      { name: "Mostafa Mohamed", number: 8, position: "Attaquant" },
      { name: "Omar Marmoush", number: 9, position: "Attaquant" },
      { name: "Mohamed Elneny", number: 10, position: "Milieu" },
      { name: "Zizo", number: 11, position: "Attaquant" },
    ],
  },
  {
    name: "Lycée Concordia",
    color: "#ea580c",
    logo: "🤝",
    players: [
      { name: "Aly Lotfy", number: 1, position: "Gardien" },
      { name: "Mohamed Abdel Shafy", number: 2, position: "Défenseur" },
      { name: "Ragab Omran", number: 3, position: "Défenseur" },
      { name: "Mahmoud Alaa", number: 4, position: "Défenseur" },
      { name: "Ibrahim Hassan", number: 5, position: "Milieu" },
      { name: "Hossam Hassan", number: 6, position: "Milieu" },
      { name: "Ahmed Hossam Mido", number: 7, position: "Attaquant" },
      { name: "Emad Meteab", number: 8, position: "Attaquant" },
      { name: "Flavio Amado", number: 9, position: "Attaquant" },
      { name: "Hazem Emam", number: 10, position: "Milieu" },
      { name: "Hady Khashaba", number: 11, position: "Attaquant" },
    ],
  },
]

export async function POST() {
  try {
    const app = initializeApp(firebaseConfig)
    const db = getFirestore(app)

    let totalPlayers = 0

    for (const teamData of teamsData) {
      const teamRef = await addDoc(collection(db, "teams"), {
        name: teamData.name,
        color: teamData.color,
        logo: teamData.logo,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      })

      for (const player of teamData.players) {
        // Générer des statistiques FIFA selon la position
        const generateStats = (position: string) => {
          const baseStats = {
            pace: 60 + Math.floor(Math.random() * 30),
            shooting: 50 + Math.floor(Math.random() * 40),
            passing: 55 + Math.floor(Math.random() * 35),
            dribbling: 55 + Math.floor(Math.random() * 35),
            defending: 45 + Math.floor(Math.random() * 40),
            physical: 60 + Math.floor(Math.random() * 30)
          }
          
          // Ajuster selon la position
          switch (position) {
            case 'Gardien':
              baseStats.defending = 75 + Math.floor(Math.random() * 20)
              baseStats.physical = 70 + Math.floor(Math.random() * 20)
              baseStats.shooting = 20 + Math.floor(Math.random() * 20)
              baseStats.pace = 40 + Math.floor(Math.random() * 20)
              break
            case 'Défenseur':
              baseStats.defending = 70 + Math.floor(Math.random() * 20)
              baseStats.physical = 65 + Math.floor(Math.random() * 25)
              break
            case 'Milieu':
              baseStats.passing = 70 + Math.floor(Math.random() * 20)
              baseStats.dribbling = 65 + Math.floor(Math.random() * 25)
              break
            case 'Attaquant':
              baseStats.shooting = 70 + Math.floor(Math.random() * 20)
              baseStats.pace = 70 + Math.floor(Math.random() * 20)
              break
          }
          
          const overall = Math.round(
            (baseStats.pace + baseStats.shooting + baseStats.passing + 
             baseStats.dribbling + baseStats.defending + baseStats.physical) / 6
          )
          
          return { ...baseStats, overall }
        }

        const stats = generateStats(player.position)

        await addDoc(collection(db, "players"), {
          name: player.name,
          number: player.number,
          position: player.position,
          teamId: teamRef.id,
          nationality: "Égypte",
          photo: "",
          stats: stats,
          seasonStats: {
            goals: Math.floor(Math.random() * (player.position === 'Attaquant' ? 15 : player.position === 'Milieu' ? 8 : 2)),
            assists: Math.floor(Math.random() * (player.position === 'Milieu' ? 12 : player.position === 'Attaquant' ? 8 : 3)),
            matches: 15 + Math.floor(Math.random() * 10),
            yellowCards: Math.floor(Math.random() * 5),
            redCards: Math.floor(Math.random() * 2)
          },
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        })
      }

      totalPlayers += teamData.players.length
    }

    return NextResponse.json(
      {
        success: true,
        message: `${teamsData.length} équipes et ${totalPlayers} joueurs ont été créés avec succès!`,
        teams: teamsData.length,
        players: totalPlayers,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error("[v0] Erreur lors de la création des données:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 },
    )
  }
}
