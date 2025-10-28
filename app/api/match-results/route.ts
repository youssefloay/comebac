import { NextResponse } from "next/server"
import { getAllMatchResults } from "@/lib/db"

export async function GET() {
  try {
    const results = await getAllMatchResults()
    return NextResponse.json(results)
  } catch (error) {
    console.error("Erreur lors de la récupération des résultats:", error)
    return NextResponse.json({ 
      error: "Erreur lors de la récupération des résultats" 
    }, { status: 500 })
  }
}