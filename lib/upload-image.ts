import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { app } from './firebase'

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

export async function uploadPlayerPhoto(playerId: string, file: Blob): Promise<string> {
  try {
    const fileName = `player-photos/${playerId}-${Date.now()}.jpg`
    const storageRef = ref(storage, fileName)
    
    await uploadBytes(storageRef, file, {
      contentType: 'image/jpeg',
    })
    
    const downloadURL = await getDownloadURL(storageRef)
    return downloadURL
  } catch (error) {
    console.error('Error uploading player photo:', error)
    throw error
  }
}
