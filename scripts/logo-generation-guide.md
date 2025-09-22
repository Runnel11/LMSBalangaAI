# BalangaAI Logo Asset Generation Guide

This guide provides multiple methods to generate all required PNG assets from your SVG logo files for the BalangaAI mobile app.

## 🎯 What You Need

Your app requires PNG assets in multiple sizes for:
- **App Icons**: iOS (10 sizes) + Android (5 sizes) + Main (1024x1024)
- **Splash Screen**: 200x200 logo
- **Favicon**: 32x32 for web
- **Adaptive Icons**: Android foreground, background, monochrome
- **Component Usage**: Small (50px), Medium (100px), Large (200px) variants

## 🚀 Method 1: Automated Script (Recommended)

### Prerequisites
```bash
npm install sharp
```

### Run the Generation Script
```bash
node scripts/generate-logo-assets.js
```

This will automatically create all 25+ required PNG files from your SVG sources.

## 🔧 Method 2: Manual Generation with Sharp CLI

### Install Sharp CLI
```bash
npm install -g sharp-cli
```

### Generate Main Assets
```bash
# Main app icon (1024x1024)
sharp-cli -i assets/images/logos/logo-master.svg -o assets/images/icon.png -f png --width 1024 --height 1024

# Favicon (32x32)
sharp-cli -i assets/images/logos/logo-master.svg -o assets/images/favicon.png -f png --width 32 --height 32

# Splash icon (200x200)
sharp-cli -i assets/images/logos/logo-master.svg -o assets/images/splash-icon.png -f png --width 200 --height 200
```

### Generate iOS Icons
```bash
sharp-cli -i assets/images/logos/logo-master.svg -o assets/images/ios/icon-20.png -f png --width 20 --height 20
sharp-cli -i assets/images/logos/logo-master.svg -o assets/images/ios/icon-29.png -f png --width 29 --height 29
sharp-cli -i assets/images/logos/logo-master.svg -o assets/images/ios/icon-40.png -f png --width 40 --height 40
sharp-cli -i assets/images/logos/logo-master.svg -o assets/images/ios/icon-58.png -f png --width 58 --height 58
sharp-cli -i assets/images/logos/logo-master.svg -o assets/images/ios/icon-60.png -f png --width 60 --height 60
sharp-cli -i assets/images/logos/logo-master.svg -o assets/images/ios/icon-80.png -f png --width 80 --height 80
sharp-cli -i assets/images/logos/logo-master.svg -o assets/images/ios/icon-87.png -f png --width 87 --height 87
sharp-cli -i assets/images/logos/logo-master.svg -o assets/images/ios/icon-120.png -f png --width 120 --height 120
sharp-cli -i assets/images/logos/logo-master.svg -o assets/images/ios/icon-180.png -f png --width 180 --height 180
sharp-cli -i assets/images/logos/logo-master.svg -o assets/images/ios/icon-1024.png -f png --width 1024 --height 1024
```

### Generate Android Icons
```bash
sharp-cli -i assets/images/logos/logo-master.svg -o assets/images/android/mdpi/icon.png -f png --width 48 --height 48
sharp-cli -i assets/images/logos/logo-master.svg -o assets/images/android/hdpi/icon.png -f png --width 72 --height 72
sharp-cli -i assets/images/logos/logo-master.svg -o assets/images/android/xhdpi/icon.png -f png --width 96 --height 96
sharp-cli -i assets/images/logos/logo-master.svg -o assets/images/android/xxhdpi/icon.png -f png --width 144 --height 144
sharp-cli -i assets/images/logos/logo-master.svg -o assets/images/android/xxxhdpi/icon.png -f png --width 192 --height 192
```

## 🌐 Method 3: Online Converters

If you prefer not to install tools, use online SVG to PNG converters:

### Recommended Online Tools:
1. **CloudConvert** (cloudconvert.com) - Batch conversion
2. **SVG to PNG** (svgtopng.com) - Simple single conversions
3. **Convertio** (convertio.co) - Multiple format support

### Upload & Convert:
1. Upload `assets/images/logos/logo-master.svg`
2. Convert to PNG at each required size
3. Download and place in the correct directories

### Required Sizes:
```
Main Icons: 1024, 200, 100, 50, 32
iOS: 20, 29, 40, 58, 60, 80, 87, 120, 180, 1024
Android: 48, 72, 96, 144, 192, 432 (foreground)
```

## 🎨 Method 4: Design Tools (Figma/Sketch)

### Figma Export:
1. Import SVG to Figma
2. Create frames for each required size
3. Use "Export" with PNG format
4. Select appropriate scales (1x, 2x, 3x as needed)

### Sketch Export:
1. Import SVG as symbol
2. Create artboards for each size
3. Export as PNG with appropriate naming

## 📱 Special Android Requirements

### Adaptive Icon Background:
Create a solid color PNG (432x432) with your brand color `#8A9BFF`:
```bash
# Using ImageMagick
convert -size 432x432 xc:"#8A9BFF" assets/images/android-icon-background.png
```

### Foreground Icon:
The logo should be 432x432 with 108px padding (324x324 effective area):
```bash
sharp-cli -i assets/images/logos/logo-master.svg -o assets/images/android-icon-foreground.png -f png --width 324 --height 324
```

## ✅ Verification Checklist

After generation, verify you have:

### Required Files:
- [ ] `assets/images/icon.png` (1024x1024)
- [ ] `assets/images/favicon.png` (32x32)
- [ ] `assets/images/splash-icon.png` (200x200)
- [ ] `assets/images/android-icon-foreground.png` (432x432)
- [ ] `assets/images/android-icon-background.png` (432x432)
- [ ] `assets/images/android-icon-monochrome.png` (432x432)
- [ ] All iOS icons (10 files in `assets/images/ios/`)
- [ ] All Android density icons (5 files in `assets/images/android/*/`)
- [ ] Logo variations (6 files in `assets/images/logos/`)

### Test Your Icons:
1. **Expo Dev**: `npx expo start` - check in Expo Go app
2. **iOS Simulator**: Icons appear correctly in app drawer
3. **Android Emulator**: Adaptive icon displays properly
4. **Web**: Favicon shows in browser tab

## 🔧 Troubleshooting

### Common Issues:

**"Sharp not found"**
```bash
npm install sharp
# or globally
npm install -g sharp-cli
```

**"Permission denied"**
```bash
chmod +x scripts/generate-logo-assets.js
```

**"Directory not found"**
- Run script from project root
- Ensure SVG files exist in `assets/images/logos/`

**"Icons appear blurry"**
- Ensure source SVG is high resolution
- Check PNG export quality settings
- Verify correct sizes are being generated

## 🎉 Next Steps

After successful generation:

1. **Update app.json** if needed (paths should already be correct)
2. **Test splash screen** - update background color if needed
3. **Build and test** on actual devices
4. **Submit to app stores** with new icon assets

Your BalangaAI app now has professional, consistent branding across all platforms! 🚀