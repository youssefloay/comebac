import { NextRequest, NextResponse } from "next/server"
import { seedPlayersWithPhotos, updateAllPlayerStats } from "@/lib/seed-players"

export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json()
    
    if (action === "seed") {
      await seedPlayersWithPhotos()
      return NextResponse.json({ 
        success: true, 
        message: "Joueurs seedés avec succès avec photos et statistiques!" 
      })
    } else if (action === "update-stats") {
      await updateAllPlayerStats()
      return NextResponse.json({ 
        success: true, 
        message: "Statistiques des joueurs mises à jour!" 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        message: "Action non reconnue. Utilisez 'seed' ou 'update-stats'" 
      }, { status: 400 })
    }
    
  } catch (error) {
    console.error("Erreur lors du seed des joueurs:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Erreur lors du seed des joueurs",
      error: error instanceof Error ? error.message : "Erreur inconnue"
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "API de seed des joueurs",
    endpoints: {
      "POST /api/seed-players": {
        description: "Seed les joueurs avec photos et statistiques",
        body: { action: "seed | update-stats" }
      }
    }
  })
}