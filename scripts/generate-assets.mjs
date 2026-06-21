import sharp from 'sharp';

const OG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f3ebfb"/>
      <stop offset="100%" stop-color="#e4c7fe"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#g)"/>
  <circle cx="600" cy="210" r="90" fill="#5d4297" opacity="0.12"/>
  <text x="600" y="360" text-anchor="middle" font-size="108" fill="#4b2e7a" font-family="YuGothic, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', sans-serif" font-weight="bold">TarotScryer</text>
  <text x="600" y="430" text-anchor="middle" font-size="40" fill="#5d4297" font-family="YuGothic, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', sans-serif">内省のためのライダー・ウェイト・スミス・タロット</text>
</svg>`;

function iconSvg(size) {
  const fontSize = Math.round(size * 0.55);
  const radius = Math.round(size * 0.2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${radius}" fill="#5d4297"/>
    <text x="${size / 2}" y="${Math.round(size * 0.72)}" text-anchor="middle" font-size="${fontSize}" fill="#ffffff" font-family="YuGothic, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', sans-serif" font-weight="bold">TS</text>
  </svg>`;
}

async function main() {
  await sharp(Buffer.from(OG_SVG))
    .png({ compressionLevel: 9 })
    .toFile('public/ogp-default.png');
  console.log('Generated public/ogp-default.png');

  for (const { size, name } of [
    { size: 180, name: 'apple-touch-icon.png' },
    { size: 192, name: 'icon-192.png' },
    { size: 512, name: 'icon-512.png' },
  ]) {
    await sharp(Buffer.from(iconSvg(size)))
      .png({ compressionLevel: 9 })
      .toFile(`public/${name}`);
    console.log(`Generated public/${name}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
