import { NextRequest, NextResponse } from 'next/server'
import { getStorage } from 'firebase-admin/storage'
import { initializeApp, getApps, cert } from 'firebase-admin/app'

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const teamId = formData.get('teamId') as string

    if (!file || !teamId) {
      return NextResponse.json(
        { error: 'File and teamId are required' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Get storage bucket
    const bucket = getStorage().bucket()
    
    // Create file path
    const fileName = `team-logos/${teamId}-${Date.now()}.${file.name.split('.').pop()}`
    const fileUpload = bucket.file(fileName)

    // Upload file
    await fileUpload.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    })

    // Make file public
    await fileUpload.makePublic()

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`

    return NextResponse.json({
      success: true,
      url: publicUrl,
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}
