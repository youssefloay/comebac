// Script pour renommer les fichiers de maillots avec les noms des équipes
// Usage: npx tsx scripts/rename-jersey-files.ts

import * as fs from 'fs'
import * as path from 'path'
import { resolve } from 'path'

// Mapping des fichiers images aux équipes
const imageToTeamMapping: Record<string, string> = {
  'T-shirts_88_page-0010': 'Blues',
  'T-shirts_88_page-0007': 'VII Rising',
  'T-shirts_88_page-0012': 'Prime Team',
  'T-shirts_88_page-0003': 'The Saints',
  'T-shirts_88_page-0009': 'Devils',
  'T-shirts_88_page-0008': 'Road to Glory',
  'T-shirts_88_page-0011': 'Icons',
  'T-shirts_88_page-0014': 'Goats',
  'T-shirts_88_page-0015': 'Les Lions Sacrés',
  'T-shirts_88_page-0006': 'EGO FC',
  'T-shirts_88_page-0001': 'Underdogs',
  'T-shirts_88_page-0005': 'El Matador',
  'T-shirts_88_page-0002': 'Selecao FC',
  'T-shirts_88_page-0016': 'Tiki Taka',
  'T-shirts_88_page-0013': 'Mangoz FC',
  'T-shirts_88_page-0004': 'Santos FC'
}

function normalizeFileName(teamName: string): string {
  // Normaliser le nom pour un nom de fichier valide
  return teamName
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Enlever les caractères spéciaux
    .replace(/\s+/g, ' ') // Normaliser les espaces
    .trim()
}

async function renameFiles() {
  console.log('📝 Renommage des fichiers de maillots avec les noms des équipes...\n')

  const assetsDir = resolve(process.cwd(), 'assets')
  
  if (!fs.existsSync(assetsDir)) {
    console.error(`❌ Le dossier assets n'existe pas: ${assetsDir}`)
    process.exit(1)
  }

  const files = fs.readdirSync(assetsDir)
  const jerseyFiles = files.filter(f => {
    const isJerseyFile = (
      (f.startsWith('T-shirts_88_page-') || f.startsWith('T-shirts 88_page-')) &&
      (f.endsWith('.png') || f.endsWith('.jpg') || f.endsWith('.jpeg'))
    )
    return isJerseyFile
  })

  console.log(`📁 ${jerseyFiles.length} fichiers de maillots trouvés\n`)

  const results = {
    success: [] as string[],
    notFound: [] as string[],
    errors: [] as string[]
  }

  for (const imageFile of jerseyFiles) {
    // Extraire le préfixe du fichier
    let filePrefix = imageFile
      .replace(/-\w{8}-\w{4}-\w{4}-\w{4}-\w{12}\.(png|jpg|jpeg)$/, '') // Format avec UUID
      .replace(/\.(png|jpg|jpeg)$/, '') // Format simple sans UUID
      .replace(/^T-shirts /, 'T-shirts_') // Normaliser l'espace en underscore

    const teamName = imageToTeamMapping[filePrefix]

    if (!teamName) {
      console.log(`⚠️  Pas de mapping pour: ${imageFile}`)
      results.notFound.push(imageFile)
      continue
    }

    const oldPath = path.join(assetsDir, imageFile)
    
    // Déterminer l'extension
    const ext = path.extname(imageFile).toLowerCase()
    
    // Créer le nouveau nom de fichier
    const normalizedTeamName = normalizeFileName(teamName)
    const newFileName = `${normalizedTeamName}${ext}`
    const newPath = path.join(assetsDir, newFileName)

    // Vérifier si le fichier de destination existe déjà
    if (fs.existsSync(newPath) && oldPath !== newPath) {
      console.log(`⚠️  Le fichier ${newFileName} existe déjà, on le saute`)
      results.notFound.push(`${imageFile} -> ${newFileName} (existe déjà)`)
      continue
    }

    try {
      fs.renameSync(oldPath, newPath)
      console.log(`✅ ${imageFile} → ${newFileName}`)
      results.success.push(`${imageFile} → ${newFileName}`)
    } catch (error: any) {
      console.error(`❌ Erreur pour ${imageFile}:`, error.message)
      results.errors.push(`${imageFile}: ${error.message}`)
    }
  }

  // Résumé
  console.log('\n\n📊 RÉSUMÉ:')
  console.log(`✅ Succès: ${results.success.length}`)
  console.log(`❌ Non trouvés: ${results.notFound.length}`)
  console.log(`⚠️  Erreurs: ${results.errors.length}`)

  if (results.success.length > 0) {
    console.log('\n✅ Fichiers renommés:')
    results.success.forEach(name => console.log(`  - ${name}`))
  }

  if (results.notFound.length > 0) {
    console.log('\n❌ Fichiers non trouvés/mappés:')
    results.notFound.forEach(name => console.log(`  - ${name}`))
  }

  if (results.errors.length > 0) {
    console.log('\n⚠️  Erreurs:')
    results.errors.forEach(error => console.log(`  - ${error}`))
  }
}

// Point d'entrée
renameFiles()
  .then(() => {
    console.log('\n✅ Terminé!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erreur:', error)
    process.exit(1)
  })
