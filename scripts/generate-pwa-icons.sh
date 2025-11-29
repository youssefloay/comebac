#!/bin/bash

# Script pour générer les icônes PWA optimisées à partir du logo principal
# Usage: ./scripts/generate-pwa-icons.sh

SOURCE_IMAGE="public/comebac.png"
OUTPUT_DIR="public/icons"

# Créer le dossier de sortie
mkdir -p "$OUTPUT_DIR"

# Tailles nécessaires pour PWA
SIZES=(
  "16x16"
  "32x32"
  "48x48"
  "57x57"
  "60x60"
  "72x72"
  "76x76"
  "96x96"
  "114x114"
  "120x120"
  "144x144"
  "152x152"
  "180x180"
  "192x192"
  "512x512"
)

echo "🎨 Génération des icônes PWA optimisées..."
echo "Source: $SOURCE_IMAGE"
echo "Destination: $OUTPUT_DIR"
echo ""

# Vérifier que l'image source existe
if [ ! -f "$SOURCE_IMAGE" ]; then
  echo "❌ Erreur: $SOURCE_IMAGE n'existe pas"
  exit 1
fi

# Générer chaque taille
for size in "${SIZES[@]}"; do
  width=$(echo $size | cut -d'x' -f1)
  height=$(echo $size | cut -d'x' -f2)
  output_file="$OUTPUT_DIR/icon-${size}.png"
  
  echo "📐 Génération: ${size} -> $output_file"
  
  # Utiliser sips pour redimensionner avec une qualité optimale
  sips -z $height $width "$SOURCE_IMAGE" --out "$output_file" > /dev/null 2>&1
  
  if [ $? -eq 0 ]; then
    file_size=$(ls -lh "$output_file" | awk '{print $5}')
    echo "   ✅ Créé: $output_file ($file_size)"
  else
    echo "   ❌ Erreur lors de la génération de $output_file"
  fi
done

echo ""
echo "✨ Génération terminée!"
echo ""
echo "📊 Résumé des fichiers générés:"
ls -lh "$OUTPUT_DIR" | tail -n +2 | awk '{print "   " $9 " (" $5 ")"}'

