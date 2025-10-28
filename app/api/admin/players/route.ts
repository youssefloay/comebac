import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const teamId = searchParams.get('teamId')
    
    let playersSnapshot
    if (teamId) {
      const playersQuery = query(collection(db, 'players'), where('teamId', '==', teamId))
      playersSnapshot = await getDocs(playersQuery)
    } else {
      playersSnapshot = await getDocs(collection(db, 'players'))
    }
    
    const players = playersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    return NextResponse.json(players)
  } catch (error) {
    console.error('Error fetching players:', error)
    return NextResponse.json({ error: 'Failed to fetch players' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const playerData = await request.json()
    
    const docRef = await addDoc(collection(db, 'players'), {
      ...playerData,
      seasonStats: playerData.seasonStats || {
        goals: 0,
        assists: 0,
        matches: 0,
        yellowCards: 0,
        redCards: 0,
        minutesPlayed: 0
      },
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    
    return NextResponse.json({ id: docRef.id, ...playerData })
  } catch (error) {
    console.error('Error creating player:', error)
    return NextResponse.json({ error: 'Failed to create player' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...playerData } = await request.json()
    
    await updateDoc(doc(db, 'players', id), {
      ...playerData,
      updatedAt: Timestamp.now()
    })
    
    return NextResponse.json({ id, ...playerData })
  } catch (error) {
    console.error('Error updating player:', error)
    return NextResponse.json({ error: 'Failed to update player' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Player ID is required' }, { status: 400 })
    }
    
    await deleteDoc(doc(db, 'players', id))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting player:', error)
    return NextResponse.json({ error: 'Failed to delete player' }, { status: 500 })
  }
}