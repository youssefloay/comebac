import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"

export async function GET() {
  try {
    const playersSnapshot = await getDocs(collection(db, 'players'))
    const players = playersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    return NextResponse.json(players)
  } catch (error) {
    console.error("Erreur lors de la récupération des joueurs:", error)
    return NextResponse.json({ 
      error: "Erreur lors de la récupération des joueurs" 
    }, { status: 500 })
  }
}