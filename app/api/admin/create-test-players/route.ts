import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, Timestamp } from 'firebase/firestore'

// Noms de joueurs égyptiens
const playerNames = [
  "Ahmed El-Masry", "Youssef Farouk", "Mohamed Nasser", "Karim Abdel-Rahman", "Omar El-Shenawy",
  "Amine Hosny", "Rachid Mahmoud", "Saad El-Hadary", "Mehdi Salah", "Hamza Ibrahim",
  "Nabil Zidan", "Tarik Mostafa", "Ilyas El-Sayed", "Zakaria Hassan", "Ayoub Fathy",
  "Soufiane Gaber", "Bilal Ramadan", "Othmane Khaled", "Reda Tawfik", "Walid Essam"
]

const schools = [
  "Lycée Français du Caire",
  "École Française Internationale du Caire", 
  "Collège de la Sainte Famille",
  "École Oasis Internationale",
  "Lycée Balzac",
  "École Française de Maadi"
]

const grades = ["2nde", "1ère S", "1ère ES", "Terminale S", "Terminale ES"]
const subjects = ["Mathématiques", "Physique", "Histoire", "Français", "Anglais", "Sport"]
const birthPlaces = ["Le Caire", "Alexandrie", "Gizeh", "Port-Saïd", "Suez"]
const positions = ["Gardien", "Défenseur", "Milieu", "Attaquant"]

function generatePersonalInfo() {
  const currentYear = new Date().getFullYear()
  const birthYear = currentYear - (16 + Math.floor(Math.random() * 3)) // 16-18 ans
  const birthMonth = 1 + Math.floor(Math.random() * 12)
  const birthDay = 1 + Math.floor(Math.random() * 28)
  const birthDate = `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`
  
  return {
    birthDate,
    age: currentYear - birthYear,
    height: 165 + Math.floor(Math.random() * 25),
    weight: 60 + Math.floor(Math.random() * 20),
    birthPlace: birthPlaces[Math.floor(Math.random() * birthPlaces.length)],
    school: schools[Math.floor(Math.random() * schools.length)],
    grade: grades[Math.floor(Math.random() * grades.length)],
    favoriteSubject: subjects[Math.floor(Math.random() * subjects.length)],
    languages: ["Arabe", "Français"],
    strongFoot: Math.random() > 0.7 ? "Gauche" : "Droit",
    experienceYears: 3 + Math.floor(Math.random() * 6),
    preferredNumber: 1 + Math.floor(Math.random() * 99),
    overall: 65 + Math.floor(Math.random() * 25)
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("👥 Création des joueurs de test...")
    
    // Récupérer les équipes existantes
    const teamsSnapshot = await getDocs(collection(db, 'teams'))
    const teams = teamsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
    if (teams.length === 0) {
      return NextResponse.json({ 
        error: 'No teams found. Please create teams first.' 
      }, { status: 400 })
    }
    
    console.log(`📋 ${teams.length} équipes trouvées`)
    
    const createdPlayers = []
    let playerIndex = 0
    
    // Créer 3-4 joueurs par équipe
    for (const team of teams) {
      const playersPerTeam = 3 + Math.floor(Math.random() * 2) // 3-4 joueurs
      
      for (let i = 0; i < playersPerTeam; i++) {
        if (playerIndex >= playerNames.length) break
        
        const personalInfo = generatePersonalInfo()
        const position = positions[Math.floor(Math.random() * positions.length)]
        
        const playerData = {
          name: playerNames[playerIndex],
          number: (i + 1) + Math.floor(Math.random() * 20), // Numéros variés
          position,
          teamId: team.id,
          nationality: "Égypte",
          photo: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&h=300&fit=crop&crop=face",
          
          // Nouvelles informations personnelles
          ...personalInfo,
          
          // Positions alternatives
          alternativePositions: position === "Milieu" ? ["MOC", "MDC"] : [],
          
          // Statistiques de saison
          seasonStats: {
            goals: Math.floor(Math.random() * 8),
            assists: Math.floor(Math.random() * 6),
            matches: 8 + Math.floor(Math.random() * 7),
            yellowCards: Math.floor(Math.random() * 3),
            redCards: Math.floor(Math.random() * 2),
            minutesPlayed: (8 + Math.floor(Math.random() * 7)) * 90
          }
        }
        
        try {
          const docRef = await addDoc(collection(db, 'players'), {
            ...playerData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
          })
          
          const createdPlayer = { id: docRef.id, ...playerData }
          createdPlayers.push(createdPlayer)
          console.log(`✅ Joueur créé: ${playerData.name} (${team.name})`)
        } catch (error) {
          console.error(`❌ Erreur pour ${playerData.name}:`, error)
        }
        
        playerIndex++
      }
    }
    
    console.log(`🎉 ${createdPlayers.length} joueurs créés avec succès!`)
    
    return NextResponse.json({ 
      success: true, 
      message: `${createdPlayers.length} joueurs créés avec succès`,
      players: createdPlayers.length,
      teams: teams.length
    })
    
  } catch (error) {
    console.error("❌ Erreur lors de la création des joueurs:", error)
    return NextResponse.json({ error: 'Failed to create test players' }, { status: 500 })
  }
}