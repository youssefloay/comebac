import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { app } from './firebase'

// @ts-ignore - app is properly typed in firebase.ts
const storage = getStorage(app)

export async function uploadTeamLogo(teamId: string, file: Blob): Promise<string> {
  try {
    const fileName = `team-logos/${teamId}-${Date.now()}.jpg`
    const storageRef = ref(storage, fileName)
    
    await uploadBytes(storageRef, file, {
      contentType: 'image/jpeg',
    })
    
    const downloadURL = await getDownloadURL(storageRef)
    return downloadURL
  } catch (error) {
    console.error('Error uploading team logo:', error)
    throw error
  }
}

export async function uploadPlayerPhoto(playerId: string, file: File | Blob): Promise<string> {
  try {
    console.log('📤 Starting upload for player:', playerId)
    const fileName = `player-photos/${playerId}-${Date.now()}.jpg`
    console.log('📁 File path:', fileName)
    const storageRef = ref(storage, fileName)
    
    console.log('⬆️ Uploading bytes...')
    await uploadBytes(storageRef, file, {
      contentType: 'image/jpeg',
    })
    console.log('✅ Bytes uploaded, getting download URL...')
    
    const downloadURL = await getDownloadURL(storageRef)
    console.log('✅ Download URL obtained:', downloadURL)
    return downloadURL
  } catch (error: any) {
    console.error('❌ Error uploading player photo:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    throw new Error(`Erreur upload photo: ${error.message || error.code || 'Erreur inconnue'}`)
  }
}

export async function uploadCoachPhoto(coachId: string, file: File | Blob): Promise<string> {
  try {
    console.log('📤 Starting upload for coach:', coachId)
    const fileName = `coach-photos/${coachId}-${Date.now()}.jpg`
    console.log('📁 File path:', fileName)
    const storageRef = ref(storage, fileName)
    
    console.log('⬆️ Uploading bytes...')
    await uploadBytes(storageRef, file, {
      contentType: 'image/jpeg',
    })
    console.log('✅ Bytes uploaded, getting download URL...')
    
    const downloadURL = await getDownloadURL(storageRef)
    console.log('✅ Download URL obtained:', downloadURL)
    return downloadURL
  } catch (error: any) {
    console.error('❌ Error uploading coach photo:', error)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    throw new Error(`Erreur upload photo: ${error.message || error.code || 'Erreur inconnue'}`)
  }
}
