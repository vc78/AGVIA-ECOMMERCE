const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const IMAGES_DIR = path.join(__dirname, '../public/images');

async function run() {
  const files = fs.readdirSync(IMAGES_DIR);
  const baseMap = new Map();

  for (const f of files) {
    const m = f.match(/^(.*?)\.(jpg|jpeg|png)$/i);
    if (m) {
      const baseName = m[1];
      // Skip already derivative files if any
      if (baseName.endsWith('-400') || baseName.endsWith('-600') || baseName.endsWith('-900')) continue;
      baseMap.set(baseName, {
        fileName: f,
        fullPath: path.join(IMAGES_DIR, f),
        ext: m[2].toLowerCase(),
      });
    }
  }

  console.log(`Found ${baseMap.size} base images to generate responsive variants for.`);

  const widths = [400, 600, 900];

  for (const [baseName, info] of baseMap.entries()) {
    try {
      const meta = await sharp(info.fullPath).metadata();
      const origWidth = meta.width;

      // 1. Generate full webp if not already existing or optimize it
      const fullWebpPath = path.join(IMAGES_DIR, `${baseName}.webp`);
      if (!fs.existsSync(fullWebpPath)) {
        await sharp(info.fullPath)
          .webp({ quality: 82, effort: 4 })
          .toFile(fullWebpPath);
      }

      // 2. Generate responsive width variants
      for (const w of widths) {
        const outPath = path.join(IMAGES_DIR, `${baseName}-${w}.webp`);
        // If target width is larger than original width, cap at original width
        const resizeWidth = Math.min(w, origWidth);

        await sharp(info.fullPath)
          .resize({ width: resizeWidth, withoutEnlargement: true })
          .webp({ quality: 80, effort: 4 })
          .toFile(outPath);
      }

      console.log(`Generated variants for: ${baseName} (orig ${origWidth}x${meta.height})`);
    } catch (err) {
      console.error(`Error processing ${baseName}:`, err.message);
    }
  }

  console.log('All responsive WebP images generated successfully!');
}

run();
