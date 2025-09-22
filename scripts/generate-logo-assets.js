#!/usr/bin/env node

/**
 * Logo Asset Generation Script for BalangaAI
 *
 * This script generates all required PNG assets from the SVG logo files
 * for use in the Expo/React Native application.
 *
 * Requirements:
 * - sharp package: npm install sharp
 * - OR use online converters with the specifications provided
 */

const fs = require('fs').promises;
const path = require('path');

// Check if sharp is available
let sharp;
try {
  sharp = require('sharp');
  console.log('✅ Sharp package found - generating assets...');
} catch (error) {
  console.log('❌ Sharp package not found. Please install with: npm install sharp');
  console.log('📋 Alternatively, use the manual conversion specifications below.');
  process.exit(1);
}

const assetsDir = path.join(__dirname, '..', 'assets', 'images');
const logosDir = path.join(assetsDir, 'logos');

// Asset specifications
const assets = [
  // Main app icons
  { input: 'logo-master.svg', output: 'icon.png', size: 1024 },
  { input: 'logo-master.svg', output: 'favicon.png', size: 32 },
  { input: 'logo-master.svg', output: 'splash-icon.png', size: 200 },

  // Adaptive icon components
  { input: 'logo-master.svg', output: 'android-icon-foreground.png', size: 432, padding: 108 },
  { input: 'logo-icon-only.svg', output: 'android-icon-monochrome.png', size: 432, monochrome: true },

  // Logo variations in different sizes
  { input: 'logo-master.svg', output: 'logos/logo-large.png', size: 200 },
  { input: 'logo-master.svg', output: 'logos/logo-medium.png', size: 100 },
  { input: 'logo-master.svg', output: 'logos/logo-small.png', size: 50 },
  { input: 'logo-white.svg', output: 'logos/logo-white-large.png', size: 200 },
  { input: 'logo-white.svg', output: 'logos/logo-white-medium.png', size: 100 },
  { input: 'logo-white.svg', output: 'logos/logo-white-small.png', size: 50 },

  // iOS specific icons
  { input: 'logo-master.svg', output: 'ios/icon-20.png', size: 20 },
  { input: 'logo-master.svg', output: 'ios/icon-29.png', size: 29 },
  { input: 'logo-master.svg', output: 'ios/icon-40.png', size: 40 },
  { input: 'logo-master.svg', output: 'ios/icon-58.png', size: 58 },
  { input: 'logo-master.svg', output: 'ios/icon-60.png', size: 60 },
  { input: 'logo-master.svg', output: 'ios/icon-80.png', size: 80 },
  { input: 'logo-master.svg', output: 'ios/icon-87.png', size: 87 },
  { input: 'logo-master.svg', output: 'ios/icon-120.png', size: 120 },
  { input: 'logo-master.svg', output: 'ios/icon-180.png', size: 180 },
  { input: 'logo-master.svg', output: 'ios/icon-1024.png', size: 1024 },

  // Android specific icons
  { input: 'logo-master.svg', output: 'android/mdpi/icon.png', size: 48 },
  { input: 'logo-master.svg', output: 'android/hdpi/icon.png', size: 72 },
  { input: 'logo-master.svg', output: 'android/xhdpi/icon.png', size: 96 },
  { input: 'logo-master.svg', output: 'android/xxhdpi/icon.png', size: 144 },
  { input: 'logo-master.svg', output: 'android/xxxhdpi/icon.png', size: 192 },
];

async function generateAsset(asset) {
  try {
    const inputPath = path.join(logosDir, asset.input);
    const outputPath = path.join(assetsDir, asset.output);

    // Ensure output directory exists
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    let sharpInstance = sharp(inputPath)
      .resize(asset.size, asset.size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent background
      });

    // Apply special processing
    if (asset.monochrome) {
      sharpInstance = sharpInstance.greyscale();
    }

    if (asset.padding) {
      const contentSize = asset.size - (asset.padding * 2);
      sharpInstance = sharp(inputPath)
        .resize(contentSize, contentSize, { fit: 'contain' })
        .extend({
          top: asset.padding,
          bottom: asset.padding,
          left: asset.padding,
          right: asset.padding,
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        });
    }

    await sharpInstance.png().toFile(outputPath);
    console.log(`✅ Generated: ${asset.output} (${asset.size}x${asset.size})`);

  } catch (error) {
    console.error(`❌ Failed to generate ${asset.output}:`, error.message);
  }
}

async function generateAndroidIconBackground() {
  try {
    const outputPath = path.join(assetsDir, 'android-icon-background.png');

    // Create a solid color background matching the brand color
    await sharp({
      create: {
        width: 432,
        height: 432,
        channels: 4,
        background: { r: 138, g: 155, b: 255, alpha: 1 } // #8A9BFF
      }
    })
    .png()
    .toFile(outputPath);

    console.log('✅ Generated: android-icon-background.png (432x432)');
  } catch (error) {
    console.error('❌ Failed to generate android background:', error.message);
  }
}

async function main() {
  console.log('🚀 Starting logo asset generation...\n');

  // Verify source files exist
  const requiredSvgs = ['logo-master.svg', 'logo-white.svg', 'logo-icon-only.svg'];
  for (const svg of requiredSvgs) {
    const svgPath = path.join(logosDir, svg);
    try {
      await fs.access(svgPath);
    } catch (error) {
      console.error(`❌ Missing required SVG: ${svg}`);
      process.exit(1);
    }
  }

  // Generate all assets
  for (const asset of assets) {
    await generateAsset(asset);
  }

  // Generate special Android background
  await generateAndroidIconBackground();

  console.log('\n🎉 Logo asset generation complete!');
  console.log('\n📱 Next steps:');
  console.log('1. Run your Expo app to see the new logos');
  console.log('2. Test on both iOS and Android devices');
  console.log('3. Update splash screen background color if needed in app.json');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { generateAsset, assets };