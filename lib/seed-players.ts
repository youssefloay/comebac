import { addDoc, collection, Timestamp } from "firebase/firestore"
import { db } from "./firebase"
import { updatePlayerProfile, updateTeamLogo, getTeams, getPlayersWithProfiles, getAllMatchResults } from "./db"

// Photo par défaut pour tous les joueurs
const defaultPlayerPhoto = "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&h=300&fit=crop&crop=face"

// Logos d'équipes génériques
const teamLogos = [
  "https://images.unsplash.com/photo-1614632537190-23e4b21ff3c3?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&h=200&fit=crop",
  "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=200&h=200&fit=crop"
]

// Noms de joueurs égyptiens avec écoles françaises du Caire
const playerNames = [
  "Ahmed El-Masry", "Youssef Farouk", "Mohamed Nasser", "Karim Abdel-Rahman", "Omar El-Shenawy",
  "Amine Hosny", "Rachid Mahmoud", "Saad El-Hadary", "Mehdi Salah", "Hamza Ibrahim",
  "Nabil Zidan", "Tarik Mostafa", "Ilyas El-Sayed", "Zakaria Hassan", "Ayoub Fathy",
  "Soufiane Gaber", "Bilal Ramadan", "Othmane Khaled", "Reda Tawfik", "Walid Essam",
  "Anass Sherif", "Badr Youssef", "Chakib Adel", "Driss Magdy", "Ezzeddine Wael",
  "Farid Amr", "Ghali Hany", "Hicham Ashraf", "Ismail Tamer", "Jamal Osama"
]

// Nationalités (principalement égyptienne avec quelques autres)
const nationalities = [
  "Égypte", "France", "Maroc", "Algérie", "Tunisie", "Liban", "Syrie", "Jordanie"
]

// Écoles françaises du Caire
const schools = [
  "Lycée Français du Caire",
  "École Française Internationale du Caire", 
  "Collège de la Sainte Famille",
  "École Oasis Internationale",
  "Lycée Balzac",
  "École Française de Maadi",
  "Collège Saint-Marc",
  "École Voltaire du Caire"
]

// Classes/niveaux scolaires
const grades = [
  "6ème", "5ème", "4ème", "3ème",
  "2nde", "1ère S", "1ère ES", "1ère L",
  "Terminale S", "Terminale ES", "Terminale L"
]

// Matières préférées
const favoriteSubjects = [
  "Mathématiques", "Physique", "Histoire", "Géographie", 
  "Français", "Anglais", "Arabe", "SVT", "Sport", "Arts"
]

// Villes de naissance égyptiennes
const birthPlaces = [
  "Le Caire", "Alexandrie", "Gizeh", "Shubra El-Kheima",
  "Port-Saïd", "Suez", "Louxor", "Assouan", "Mansoura", "Tanta"
]

// Langues parlées
const languageOptions = [
  ["Arabe", "Français"],
  ["Arabe", "Français", "Anglais"],
  ["Français", "Arabe"],
  ["Arabe", "Anglais"],
  ["Français", "Anglais", "Arabe"],
  ["Arabe", "Français", "Italien"],
  ["Arabe", "Français", "Espagnol"]
]

// Positions alternatives par position principale
const alternativePositions: Record<string, string[]> = {
  "Gardien": [],
  "Défenseur": ["DC", "DG", "DD", "MDC"],
  "Milieu": ["MC", "MOC", "MDC", "MG", "MD"],
  "Attaquant": ["BU", "AG", "AD", "MOC"]
}

// Pieds forts
const strongFootOptions = ["Droit", "Gauche", "Ambidextre"] as const

// Fonction pour générer des informations personnelles réalistes
function generatePersonalInfo(): {
  birthDate: string
  age: number
  height: number
  weight: number
  birthPlace: string
  school: string
  grade: string
  favoriteSubject: string
  languages: string[]
  strongFoot: "Droit" | "Gauche" | "Ambidextre"
  experienceYears: number
  preferredNumber: number
  overall: number
} {
  // Générer une date de naissance (16-19 ans pour lycéens)
  const currentYear = new Date().getFullYear()
  const birthYear = currentYear - (16 + Math.floor(Math.random() * 4)) // 16-19 ans
  const birthMonth = 1 + Math.floor(Math.random() * 12)
  const birthDay = 1 + Math.floor(Math.random() * 28)
  const birthDate = `${birthYear}-${birthMonth.toString().padStart(2, '0')}-${birthDay.toString().padStart(2, '0')}`
  
  const age = currentYear - birthYear
  const height = 165 + Math.floor(Math.random() * 25) // 165-190 cm
  const weight = Math.floor(height * 0.35 + Math.random() * 15) // Poids réaliste selon la taille
  
  const birthPlace = birthPlaces[Math.floor(Math.random() * birthPlaces.length)]
  const school = schools[Math.floor(Math.random() * schools.length)]
  const grade = grades[Math.floor(Math.random() * grades.length)]
  const favoriteSubject = favoriteSubjects[Math.floor(Math.random() * favoriteSubjects.length)]
  const languages = languageOptions[Math.floor(Math.random() * languageOptions.length)]
  const strongFoot = strongFootOptions[Math.floor(Math.random() * strongFootOptions.length)]
  const experienceYears = 3 + Math.floor(Math.random() * 8) // 3-10 ans d'expérience
  const preferredNumber = 1 + Math.floor(Math.random() * 99) // 1-99
  const overall = 65 + Math.floor(Math.random() * 25) // 65-90 pour compatibilité

  return {
    birthDate,
    age,
    height,
    weight,
    birthPlace,
    school,
    grade,
    favoriteSubject,
    languages,
    strongFoot,
    experienceYears,
    preferredNumber,
    overall
  }
}

// Fonction pour générer des statistiques de saison réalistes
function generateSeasonStats(position: string): {
  goals: number
  assists: number
  matches: number
  yellowCards: number
  redCards: number
  minutesPlayed: number
} {
  const matches = 8 + Math.floor(Math.random() * 7) // 8-15 matchs
  const minutesPlayed = matches * (60 + Math.floor(Math.random() * 30)) // 60-90 min par match
  
  let goals = 0
  let assists = 0
  
  switch (position) {
    case "Gardien":
      goals = Math.floor(Math.random() * 2) // 0-1 buts
      assists = Math.floor(Math.random() * 3) // 0-2 passes
      break
    
    case "Défenseur":
      goals = Math.floor(Math.random() * 4) // 0-3 buts
      assists = Math.floor(Math.random() * 5) // 0-4 passes
      break
    
    case "Milieu":
      goals = Math.floor(Math.random() * 8) // 0-7 buts
      assists = 2 + Math.floor(Math.random() * 8) // 2-9 passes
      break
    
    case "Attaquant":
      goals = 3 + Math.floor(Math.random() * 12) // 3-14 buts
      assists = Math.floor(Math.random() * 6) // 0-5 passes
      break
  }
  
  return {
    goals,
    assists,
    matches,
    yellowCards: Math.floor(Math.random() * 4), // 0-3 cartons jaunes
    redCards: Math.floor(Math.random() * 2), // 0-1 carton rouge
    minutesPlayed
  }
}

export async function seedPlayersWithPhotos() {
  try {
    console.log("🌱 Début de l'ajout de photos aux joueurs existants...")
    
    // Récupérer les équipes existantes
    const teams = await getTeams()
    
    if (teams.length === 0) {
      console.log("❌ Aucune équipe trouvée. Veuillez d'abord créer des équipes.")
      return
    }
    
    console.log(`📋 ${teams.length} équipes trouvées`)
    
    // Ajouter des logos aux équipes qui n'en ont pas
    for (let i = 0; i < Math.min(teams.length, teamLogos.length); i++) {
      const team = teams[i]
      if (!team.logo || team.logo === "") {
        const logoUrl = teamLogos[i]
        
        try {
          await updateTeamLogo(team.id, logoUrl)
          console.log(`✅ Logo ajouté pour ${team.name}`)
        } catch (error) {
          console.error(`❌ Erreur logo pour ${team.name}:`, error)
        }
      }
    }
    
    // Récupérer les joueurs existants
    const existingPlayers = await getPlayersWithProfiles()
    
    if (existingPlayers.length === 0) {
      console.log("❌ Aucun joueur trouvé. Veuillez d'abord créer des joueurs.")
      return
    }
    
    console.log(`👥 ${existingPlayers.length} joueurs existants trouvés`)
    
    // Mettre à jour SEULEMENT les joueurs qui n'ont pas encore de profil complet
    for (let i = 0; i < existingPlayers.length; i++) {
      const player = existingPlayers[i]
      
      // Vérifier si le joueur a déjà un profil complet
      const needsUpdate = !player.photo || !player.stats || !player.age
      
      if (needsUpdate) {
        // Utiliser la photo par défaut pour tous les joueurs
        const photoUrl = defaultPlayerPhoto
        
        const nationality = nationalities[Math.floor(Math.random() * nationalities.length)]
        const personalInfo = generatePersonalInfo()
        const seasonStats = generateSeasonStats(player.position)
        
        // Générer les positions alternatives
        const altPositions = alternativePositions[player.position] || []
        const playerAltPositions = altPositions.length > 0 
          ? altPositions.slice(0, 1 + Math.floor(Math.random() * Math.min(2, altPositions.length)))
          : []
        
        try {
          await updatePlayerProfile(player.id, {
            photo: photoUrl,
            nationality,
            seasonStats,
            // Nouvelles informations personnelles
            birthDate: personalInfo.birthDate,
            age: personalInfo.age,
            height: personalInfo.height,
            weight: personalInfo.weight,
            birthPlace: personalInfo.birthPlace,
            school: personalInfo.school,
            grade: personalInfo.grade,
            favoriteSubject: personalInfo.favoriteSubject,
            languages: personalInfo.languages,
            alternativePositions: playerAltPositions,
            strongFoot: personalInfo.strongFoot,
            experienceYears: personalInfo.experienceYears,
            preferredNumber: personalInfo.preferredNumber,
            overall: personalInfo.overall
          })
          
          console.log(`✅ Profil mis à jour pour ${player.name} (${player.position})`)
        } catch (error) {
          console.error(`❌ Erreur pour ${player.name}:`, error)
        }
      } else {
        console.log(`⏭️ ${player.name} a déjà un profil complet`)
      }
    }
    
    console.log("🎉 Mise à jour des profils joueurs terminée avec succès!")
    
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour des joueurs:", error)
    throw error
  }
}

// Fonction pour mettre à jour les statistiques de saison depuis les résultats de matchs
export async function updateAllPlayerStats() {
  try {
    console.log("📊 Mise à jour des statistiques des joueurs...")
    
    const players = await getPlayersWithProfiles()
    const results = await getAllMatchResults()
    
    // Calculer les vraies statistiques depuis les résultats
    const playerStats: Record<string, {
      goals: number
      assists: number
      matches: number
      yellowCards: number
      redCards: number
      minutesPlayed: number
    }> = {}
    
    // Initialiser les stats
    players.forEach((player: any) => {
      playerStats[player.name] = {
        goals: 0,
        assists: 0,
        matches: 0,
        yellowCards: 0,
        redCards: 0,
        minutesPlayed: 0
      }
    })
    
    // Calculer depuis les résultats de matchs
    results.forEach((result: any) => {
      const matchPlayers = new Set<string>()
      
      // Compter les buts
      result.homeTeamGoalScorers.forEach((goal: any) => {
        if (playerStats[goal.playerName]) {
          playerStats[goal.playerName].goals++
          matchPlayers.add(goal.playerName)
        }
        
        if (goal.assists && playerStats[goal.assists]) {
          playerStats[goal.assists].assists++
          matchPlayers.add(goal.assists)
        }
      })
      
      result.awayTeamGoalScorers.forEach((goal: any) => {
        if (playerStats[goal.playerName]) {
          playerStats[goal.playerName].goals++
          matchPlayers.add(goal.playerName)
        }
        
        if (goal.assists && playerStats[goal.assists]) {
          playerStats[goal.assists].assists++
          matchPlayers.add(goal.assists)
        }
      })
      
      // Compter les matchs joués
      matchPlayers.forEach(playerName => {
        if (playerStats[playerName]) {
          playerStats[playerName].matches++
          playerStats[playerName].minutesPlayed += 90 // Assume full match
        }
      })
    })
    
    // Mettre à jour chaque joueur
    for (const player of players) {
      if (playerStats[player.name]) {
        try {
          await updatePlayerProfile(player.id, {
            seasonStats: playerStats[player.name]
          })
          console.log(`✅ Stats mises à jour pour ${player.name}`)
        } catch (error) {
          console.error(`❌ Erreur stats pour ${player.name}:`, error)
        }
      }
    }
    
    console.log("🎉 Mise à jour des statistiques terminée!")
    
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour des stats:", error)
    throw error
  }
}