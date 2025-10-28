import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'

// Données pour les nouvelles informations personnelles
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

const grades = [
  "6ème", "5ème", "4ème", "3ème",
  "2nde", "1ère S", "1ère ES", "1ère L",
  "Terminale S", "Terminale ES", "Terminale L"
]

const favoriteSubjects = [
  "Mathématiques", "Physique", "Histoire", "Géographie", 
  "Français", "Anglais", "Arabe", "SVT", "Sport", "Arts"
]

const birthPlaces = [
  "Le Caire", "Alexandrie", "Gizeh", "Shubra El-Kheima",
  "Port-Saïd", "Suez", "Louxor", "Assouan", "Mansoura", "Tanta"
]

const languageOptions = [
  ["Arabe", "Français"],
  ["Arabe", "Français", "Anglais"],
  ["Français", "Arabe"],
  ["Arabe", "Anglais"],
  ["Français", "Anglais", "Arabe"],
  ["Arabe", "Français", "Italien"],
  ["Arabe", "Français", "Espagnol"]
]

const alternativePositions: Record<string, string[]> = {
  "Gardien": [],
  "Défenseur": ["DC", "DG", "DD", "MDC"],
  "Milieu": ["MC", "MOC", "MDC", "MG", "MD"],
  "Attaquant": ["BU", "AG", "AD", "MOC"]
}

const strongFootOptions = ["Droit", "Gauche", "Ambidextre"] as const

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
  const overall = 65 + Math.floor(Math.random() * 25) // 65-90

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

export async function POST(request: NextRequest) {
  try {
    console.log("🔄 Mise à jour des profils joueurs avec les nouvelles informations personnelles...")
    
    // Récupérer tous les joueurs
    const playersSnapshot = await getDocs(collection(db, 'players'))
    const players = playersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    console.log(`👥 ${players.length} joueurs trouvés`)
    
    let updatedCount = 0
    
    // Mettre à jour chaque joueur
    for (const player of players) {
      // Vérifier si le joueur a déjà les nouvelles informations
      const needsUpdate = !player.birthDate || !player.school || !player.overall
      
      if (needsUpdate) {
        const personalInfo = generatePersonalInfo()
        
        // Générer les positions alternatives
        const altPositions = alternativePositions[player.position] || []
        const playerAltPositions = altPositions.length > 0 
          ? altPositions.slice(0, 1 + Math.floor(Math.random() * Math.min(2, altPositions.length)))
          : []
        
        try {
          await updateDoc(doc(db, 'players', player.id), {
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
            overall: personalInfo.overall,
            // Garder la nationalité existante ou mettre Égypte par défaut
            nationality: player.nationality || "Égypte",
            updatedAt: new Date()
          })
          
          updatedCount++
          console.log(`✅ Profil mis à jour pour ${player.name}`)
        } catch (error) {
          console.error(`❌ Erreur pour ${player.name}:`, error)
        }
      } else {
        console.log(`⏭️ ${player.name} a déjà un profil complet`)
      }
    }
    
    console.log(`🎉 ${updatedCount} profils mis à jour avec succès!`)
    
    return NextResponse.json({ 
      success: true, 
      message: `${updatedCount} profils mis à jour avec succès`,
      totalPlayers: players.length,
      updatedPlayers: updatedCount
    })
    
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour des profils:", error)
    return NextResponse.json({ error: 'Failed to update player profiles' }, { status: 500 })
  }
}