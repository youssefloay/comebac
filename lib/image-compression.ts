/**
 * Compresse une image pour qu'elle soit en dessous d'une taille maximale
 */
export async function compressImage(file: File, maxSizeKB: number = 800): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height
        let quality = 0.9
        
        // Calculer les dimensions maximales (max 1200px de largeur/hauteur)
        const maxDimension = 1200
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = (height / width) * maxDimension
            width = maxDimension
          } else {
            width = (width / height) * maxDimension
            height = maxDimension
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Impossible de créer le contexte canvas'))
          return
        }
        
        // Dessiner l'image redimensionnée
        ctx.drawImage(img, 0, 0, width, height)
        
        // Essayer différentes qualités jusqu'à obtenir la taille souhaitée
        const tryCompress = (currentQuality: number): void => {
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Erreur lors de la compression'))
                return
              }
              
              const sizeKB = blob.size / 1024
              
              if (sizeKB <= maxSizeKB || currentQuality <= 0.1) {
                // Créer un nouveau File avec le blob compressé
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now()
                })
                console.log(`✅ Image compressée: ${(file.size / 1024).toFixed(2)} KB → ${sizeKB.toFixed(2)} KB (qualité: ${(currentQuality * 100).toFixed(0)}%)`)
                resolve(compressedFile)
              } else {
                // Réduire la qualité et réessayer
                tryCompress(currentQuality - 0.1)
              }
            },
            'image/jpeg',
            currentQuality
          )
        }
        
        tryCompress(quality)
      }
      
      img.onerror = () => {
        reject(new Error('Erreur lors du chargement de l\'image'))
      }
      
      if (e.target?.result) {
        img.src = e.target.result as string
      }
    }
    
    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'))
    }
    
    reader.readAsDataURL(file)
  })
}

