import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, doc, setDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAXpEoCb7xwHYgeprZ6CYpMRxZ1MAookSE",
  authDomain: "scolar-league.firebaseapp.com",
  projectId: "scolar-league",
  storageBucket: "scolar-league.firebasestorage.app",
  messagingSenderId: "839839749098",
  appId: "1:839839749098:web:5353561c4f4673cdab9893",
  measurementId: "G-F0EREB6993"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const teams = [
  { name: "Les Aigles", color: "#3B82F6", logo: "", founded: "2020", stadium: "Stade Municipal" },
  { name: "Les Lions", color: "#EF4444", logo: "", founded: "2019", stadium: "Terrain Central" },
  { name: "Les Panthères", color: "#10B981", logo: "", founded: "2021", stadium: "Complexe Sportif" },
  { name: "Les Faucons", color: "#F59E0B", logo: "", founded: "2020", stadium: "Stade des Jeunes" },
  { name: "Les Tigres", color: "#8B5CF6", logo: "", founded: "2022", stadium: "Terrain d'Honneur" },
  { name: "Les Loups", color: "#6B7280", logo: "", founded: "2021", stadium: "Stade Nord" }
]

const players = [
  // Les Aigles
  { name: "Ahmed Benali", age: 16, position: "Gardien", number: 1 },
  { name: "Youssef Alami", age: 17, position: "Défenseur", number: 2 },
  { name: "Omar Tazi", age: 16, position: "Défenseur", number: 3 },
  { name: "Karim Fassi", age: 17, position: "Milieu", number: 8 },
  { name: "Amine Berrada", age: 16, position: "Attaquant", number: 10 },
  
  // Les Lions
  { name: "Mehdi Lahlou", age: 17, position: "Gardien", number: 1 },
  { name: "Saad Benjelloun", age: 16, position: "Défenseur", number: 4 },
  { name: "Hamza Idrissi", age: 17, position: "Milieu", number: 6 },
  { name: "Reda Cherkaoui", age: 16, position: "Attaquant", number: 9 },
  { name: "Nabil Ouali", age: 17, position: "Attaquant", number: 11 },
  
  // Les Panthères
  { name: "Ismail Kadiri", age: 16, position: "Gardien", number: 1 },
  { name: "Zakaria Amrani", age: 17, position: "Défenseur", number: 5 },
  { name: "Ayoub Mansouri", age: 16, position: "Milieu", number: 7 },
  { name: "Bilal Zouani", age: 17, position: "Attaquant", number: 10 },
  { name: "Rachid Benkirane", age: 16, position: "Milieu", number: 8 }
]

const matches = [
  {
    teamA: "Les Aigles",
    teamB: "Les Lions", 
    date: new Date("2024-12-15T15:00:00"),
    status: "today",
    venue: "Stade Municipal",
    scoreA: 2,
    scoreB: 1
  },
  {
    teamA: "Les Panthères",
    teamB: "Les Faucons",
    date: new Date("2024-12-15T17:00:00"), 
    status: "today",
    venue: "Complexe Sportif"
  },
  {
    teamA: "Les Tigres",
    teamB: "Les Loups",
    date: new Date("2024-12-16T15:00:00"),
    status: "upcoming",
    venue: "Terrain d'Honneur"
  },
  {
    teamA: "Les Lions",
    teamB: "Les Panthères",
    date: new Date("2024-12-17T16:00:00"),
    status: "upcoming", 
    venue: "Terrain Central"
  },
  {
    teamA: "Les Faucons",
    teamB: "Les Aigles",
    date: new Date("2024-12-18T15:30:00"),
    status: "upcoming",
    venue: "Stade des Jeunes"
  }
]

const standings = [
  { teamName: "Les Aigles", points: 15, wins: 5, draws: 0, losses: 1, goalsFor: 12, goalsAgainst: 4, matchesPlayed: 6 },
  { teamName: "Les Lions", points: 12, wins: 4, draws: 0, losses: 2, goalsFor: 10, goalsAgainst: 6, matchesPlayed: 6 },
  { teamName: "Les Panthères", points: 10, wins: 3, draws: 1, losses: 2, goalsFor: 8, goalsAgainst: 7, matchesPlayed: 6 },
  { teamName: "Les Faucons", points: 8, wins: 2, draws: 2, losses: 2, goalsFor: 7, goalsAgainst: 8, matchesPlayed: 6 },
  { teamName: "Les Tigres", points: 6, wins: 2, draws: 0, losses: 4, goalsFor: 6, goalsAgainst: 10, matchesPlayed: 6 },
  { teamName: "Les Loups", points: 4, wins: 1, draws: 1, losses: 4, goalsFor: 5, goalsAgainst: 13, matchesPlayed: 6 }
]

async function seedData() {
  try {
    console.log('🌱 Starting data seeding...')
    
    // Add teams
    console.log('📝 Adding teams...')
    const teamIds: string[] = []
    for (const team of teams) {
      const docRef = await addDoc(collection(db, 'teams'), team)
      teamIds.push(docRef.id)
      console.log(`✅ Added team: ${team.name}`)
    }
    
    // Add players to teams
    console.log('👥 Adding players...')
    let playerIndex = 0
    for (let i = 0; i < teamIds.length && playerIndex < players.length; i++) {
      const teamId = teamIds[i]
      const teamPlayers = players.slice(playerIndex, playerIndex + 5) // 5 players per team
      
      for (const player of teamPlayers) {
        await addDoc(collection(db, 'players'), {
          ...player,
          teamId
        })
        console.log(`✅ Added player: ${player.name} to team ${teams[i].name}`)
      }
      playerIndex += 5
    }
    
    // Add matches
    console.log('⚽ Adding matches...')
    for (const match of matches) {
      await addDoc(collection(db, 'matches'), match)
      console.log(`✅ Added match: ${match.teamA} vs ${match.teamB}`)
    }
    
    // Add standings
    console.log('🏆 Adding standings...')
    for (let i = 0; i < standings.length && i < teamIds.length; i++) {
      const standing = standings[i]
      await addDoc(collection(db, 'standings'), {
        ...standing,
        teamId: teamIds[i]
      })
      console.log(`✅ Added standing for: ${standing.teamName}`)
    }
    
    console.log('🎉 Data seeding completed successfully!')
    
  } catch (error) {
    console.error('❌ Error seeding data:', error)
  }
}

// Run the seeding function
seedData()