#!/bin/bash

# Quick Logo Generation Script for BalangaAI
# This script provides a simple way to generate the most essential logo assets

echo "🚀 BalangaAI Logo Asset Generator"
echo "================================="

# Check if sharp-cli is installed
if ! command -v sharp-cli &> /dev/null; then
    echo "❌ sharp-cli not found. Installing..."
    npm install -g sharp-cli
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install sharp-cli. Please install manually:"
        echo "npm install -g sharp-cli"
        exit 1
    fi
fi

echo "✅ sharp-cli found"

# Check if source SVG exists
SVG_PATH="assets/images/logos/logo-master.svg"
if [ ! -f "$SVG_PATH" ]; then
    echo "❌ Source SVG not found at: $SVG_PATH"
    echo "Please ensure your logo SVG is placed at: assets/images/logos/logo-master.svg"
    exit 1
fi

echo "✅ Source SVG found"
echo ""

# Create directories
echo "📁 Creating directories..."
mkdir -p assets/images/logos
mkdir -p assets/images/ios
mkdir -p assets/images/android/{mdpi,hdpi,xhdpi,xxhdpi,xxxhdpi}

echo "🔄 Generating essential assets..."

# Main app icon
echo "  → Main app icon (1024x1024)"
sharp-cli -i "$SVG_PATH" -o "assets/images/icon.png" -f png --width 1024 --height 1024

# Favicon
echo "  → Favicon (32x32)"
sharp-cli -i "$SVG_PATH" -o "assets/images/favicon.png" -f png --width 32 --height 32

# Splash icon
echo "  → Splash icon (200x200)"
sharp-cli -i "$SVG_PATH" -o "assets/images/splash-icon.png" -f png --width 200 --height 200

# Android foreground (with padding)
echo "  → Android foreground icon"
sharp-cli -i "$SVG_PATH" -o "assets/images/android-icon-foreground.png" -f png --width 324 --height 324

# Most common iOS sizes
echo "  → iOS icons (essential sizes)"
sharp-cli -i "$SVG_PATH" -o "assets/images/ios/icon-60.png" -f png --width 60 --height 60
sharp-cli -i "$SVG_PATH" -o "assets/images/ios/icon-120.png" -f png --width 120 --height 120
sharp-cli -i "$SVG_PATH" -o "assets/images/ios/icon-180.png" -f png --width 180 --height 180

# Most common Android sizes
echo "  → Android icons (essential densities)"
sharp-cli -i "$SVG_PATH" -o "assets/images/android/mdpi/icon.png" -f png --width 48 --height 48
sharp-cli -i "$SVG_PATH" -o "assets/images/android/hdpi/icon.png" -f png --width 72 --height 72
sharp-cli -i "$SVG_PATH" -o "assets/images/android/xhdpi/icon.png" -f png --width 96 --height 96
sharp-cli -i "$SVG_PATH" -o "assets/images/android/xxhdpi/icon.png" -f png --width 144 --height 144
sharp-cli -i "$SVG_PATH" -o "assets/images/android/xxxhdpi/icon.png" -f png --width 192 --height 192

# Component usage sizes
echo "  → Component logos"
sharp-cli -i "$SVG_PATH" -o "assets/images/logos/logo-large.png" -f png --width 200 --height 200
sharp-cli -i "$SVG_PATH" -o "assets/images/logos/logo-medium.png" -f png --width 100 --height 100
sharp-cli -i "$SVG_PATH" -o "assets/images/logos/logo-small.png" -f png --width 50 --height 50

echo ""
echo "✅ Essential logo assets generated successfully!"
echo ""
echo "📱 Next steps:"
echo "1. Run 'npx expo start' to test the new icons"
echo "2. For complete asset generation, run: node scripts/generate-logo-assets.js"
echo "3. Check the logo-generation-guide.md for additional options"
echo ""
echo "🎉 Your BalangaAI app now has professional branding!"