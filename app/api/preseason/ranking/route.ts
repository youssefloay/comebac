import { NextResponse } from 'next/server'
import { calculatePreseasonRanking } from '@/lib/preseason/db'

// GET - Get preseason ranking
export async function GET() {
  try {
    const ranking = await calculatePreseasonRanking()
    return NextResponse.json({ ranking })
  } catch (error) {
    console.error('Error calculating preseason ranking:', error)
    return NextResponse.json(
      { error: 'Failed to calculate ranking' },
      { status: 500 }
    )
  }
}

