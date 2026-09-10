const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const root = path.join(__dirname, '..');
const brand = path.join(root, 'assets', 'brand');
const out = path.join(root, 'assets', 'images');
const pub = path.join(root, 'public');

const icon = fs.readFileSync(path.join(brand, 'icon.svg'));
const mark = fs.readFileSync(path.join(brand, 'mark.svg'));
const background = fs.readFileSync(path.join(brand, 'background.svg'));

async function run() {
  fs.mkdirSync(pub, { recursive: true });

  // Full app icon (iOS + web + Android fallback) — 1024x1024, no alpha
  await sharp(icon).resize(1024, 1024).flatten({ background: '#046A48' }).png().toFile(path.join(out, 'icon.png'));

  // Android adaptive icon layers
  await sharp(mark).resize(1024, 1024).png().toFile(path.join(out, 'android-icon-foreground.png'));
  await sharp(background).resize(1024, 1024).png().toFile(path.join(out, 'android-icon-background.png'));
  await sharp(mark).resize(1024, 1024).png().toFile(path.join(out, 'android-icon-monochrome.png'));

  // Splash mark (transparent, shown on the brand background colour)
  await sharp(mark).resize(1024, 1024).png().toFile(path.join(out, 'splash-icon.png'));

  // Web favicon
  await sharp(icon).resize(64, 64).png().toFile(path.join(out, 'favicon.png'));

  // PWA icons (served from the web root)
  await sharp(icon).resize(192, 192).flatten({ background: '#046A48' }).png().toFile(path.join(pub, 'icon-192.png'));
  await sharp(icon).resize(512, 512).flatten({ background: '#046A48' }).png().toFile(path.join(pub, 'icon-512.png'));
  await sharp(icon).resize(180, 180).flatten({ background: '#046A48' }).png().toFile(path.join(pub, 'apple-touch-icon.png'));

  console.log('Generated app icons + PWA icons.');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
