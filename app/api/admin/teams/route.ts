import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore'

export async function GET() {
  try {
    const teamsSnapshot = await getDocs(collection(db, 'teams'))
    const teams = teamsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
    
    return NextResponse.json(teams)
  } catch (error) {
    console.error('Error fetching teams:', error)
    return NextResponse.json({ error: 'Failed to fetch teams' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const teamData = await request.json()
    
    const docRef = await addDoc(collection(db, 'teams'), {
      ...teamData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    })
    
    return NextResponse.json({ id: docRef.id, ...teamData })
  } catch (error) {
    console.error('Error creating team:', error)
    return NextResponse.json({ error: 'Failed to create team' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { id, ...teamData } = await request.json()
    
    await updateDoc(doc(db, 'teams', id), {
      ...teamData,
      updatedAt: Timestamp.now()
    })
    
    return NextResponse.json({ id, ...teamData })
  } catch (error) {
    console.error('Error updating team:', error)
    return NextResponse.json({ error: 'Failed to update team' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Team ID is required' }, { status: 400 })
    }
    
    await deleteDoc(doc(db, 'teams', id))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting team:', error)
    return NextResponse.json({ error: 'Failed to delete team' }, { status: 500 })
  }
}