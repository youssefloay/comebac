import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'

export async function GET() {
  try {
    const archivesSnapshot = await getDocs(
      query(collection(db, 'seasonArchives'), orderBy('archivedAt', 'desc'))
    )
    
    const archives = archivesSnapshot.docs.map(doc => ({
      id: doc.id,
      seasonName: doc.data().seasonName,
      archivedAt: doc.data().archivedAt,
      summary: doc.data().summary
    }))
    
    return NextResponse.json(archives)
  } catch (error) {
    console.error('Error fetching archives:', error)
    return NextResponse.json({ error: 'Failed to fetch archives' }, { status: 500 })
  }
}
