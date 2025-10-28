import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc, Timestamp } from 'firebase/firestore'

const testTeams = [
  {
    name: "Lycée Français du Caire FC",
    logo: "https://images.unsplash.com/photo-1614632537190-23e4b21ff3c3?w=200&h=200&fit=crop",
    color: "#1E40AF"
  },
  {
    name: "École Oasis United",
    logo: "https://images.unsplash.com/photo-1579952363873-27d3bfad9c0d?w=200&h=200&fit=crop",
    color: "#DC2626"
  },
  {
    name: "Collège Sainte Famille",
    logo: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=200&h=200&fit=crop",
    color: "#059669"
  },
  {
    name: "Lycée Balzac Sports",
    logo: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=200&h=200&fit=crop",
    color: "#7C3AED"
  },
  {
    name: "École Française de Maadi",
    logo: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=200&h=200&fit=crop",
    color: "#EA580C"
  },
  {
    name: "Collège Saint-Marc",
    logo: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=200&h=200&fit=crop",
    color: "#0891B2"
  }
]

export async function POST(request: NextRequest) {
  try {
    console.log("🏫 Création des équipes de test...")
    
    const createdTeams = []
    
    for (const teamData of testTeams) {
      try {
        const docRef = await addDoc(collection(db, 'teams'), {
          ...teamData,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        })
        
        const createdTeam = { id: docRef.id, ...teamData }
        createdTeams.push(createdTeam)
        console.log(`✅ Équipe créée: ${teamData.name}`)
      } catch (error) {
        console.error(`❌ Erreur pour ${teamData.name}:`, error)
      }
    }
    
    console.log(`🎉 ${createdTeams.length} équipes créées avec succès!`)
    
    return NextResponse.json({ 
      success: true, 
      message: `${createdTeams.length} équipes créées avec succès`,
      teams: createdTeams
    })
    
  } catch (error) {
    console.error("❌ Erreur lors de la création des équipes:", error)
    return NextResponse.json({ error: 'Failed to create test teams' }, { status: 500 })
  }
}