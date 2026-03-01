# Génération des icônes PWA

## Option 1 : Utiliser PWA Asset Generator (Recommandé)

```bash
# Installer l'outil
npm install -g pwa-asset-generator

# Générer toutes les tailles depuis icon.svg
pwa-asset-generator icon.svg ./public --icon-only --path-override ./

# Générera :
# - icon-96.png
# - icon-192.png
# - icon-512.png
# + maskable variants
```

## Option 2 : Utiliser ImageMagick

```bash
# Installer ImageMagick
sudo apt-get install imagemagick

# Générer 96x96
convert icon.svg -resize 96x96 icon-96.png

# Générer 192x192
convert icon.svg -resize 192x192 icon-192.png

# Générer 512x512
convert icon.svg -resize 512x512 icon-512.png
```

## Option 3 : Utiliser un service en ligne

1. Aller sur https://realfavicongenerator.net/
2. Upload `icon.svg`
3. Configurer pour PWA
4. Télécharger et placer dans `/public`

## Icons nécessaires

- ✅ `icon.svg` (créé - source)
- ⏳ `icon-96.png` (96x96) - pour shortcuts
- ⏳ `icon-192.png` (192x192) - PWA standard
- ⏳ `icon-512.png` (512x512) - PWA high-res

## Pour l'instant

Un placeholder SVG a été créé. Pour la production, générez les vraies images PNG.

## Commande rapide (si ImageMagick installé)

```bash
cd /home/billy/appel-offre-automation/web-client/public

convert icon.svg -resize 96x96 icon-96.png
convert icon.svg -resize 192x192 icon-192.png
convert icon.svg -resize 512x512 icon-512.png
```
