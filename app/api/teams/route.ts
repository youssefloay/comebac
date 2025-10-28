import { NextResponse } from "next/server"
import { getTeams } from "@/lib/db"

export async function GET() {
  try {
    const teams = await getTeams()
    return NextResponse.json(teams)
  } catch (error) {
    console.error("Erreur lors de la récupération des équipes:", error)
    return NextResponse.json({ 
      error: "Erreur lors de la récupération des équipes" 
    }, { status: 500 })
  }
}