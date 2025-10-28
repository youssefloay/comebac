const fs = require('fs');
const path = require('path');

// Ce script copie le logo principal vers favicon.ico
// En production, vous devriez utiliser un outil comme ImageMagick ou Sharp
// pour générer les différentes tailles d'icônes

const sourceLogo = path.join(__dirname, '../public/comebac.png');
const faviconPath = path.join(__dirname, '../public/favicon.ico');

// Pour l'instant, on copie juste le PNG vers favicon.ico
// Dans un vrai projet, on convertirait en ICO avec les bonnes tailles
try {
  fs.copyFileSync(sourceLogo, faviconPath);
  console.log('✅ Favicon créé avec succès');
} catch (error) {
  console.error('❌ Erreur lors de la création du favicon:', error);
}

console.log('🎨 Génération des icônes terminée');
console.log('💡 Pour une meilleure optimisation, utilisez un outil comme:');
console.log('   - ImageMagick: convert comebac.png -resize 32x32 favicon.ico');
console.log('   - Online converter: https://favicon.io/favicon-converter/');
console.log('   - Sharp (Node.js): npm install sharp');