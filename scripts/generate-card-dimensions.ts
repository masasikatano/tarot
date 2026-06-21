import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
import { CARDS } from '../src/lib/tarotData.ts';

async function main() {
  const dimensions: Record<string, { width: number; height: number }> = {};

  await Promise.all(
    CARDS.map(async (card) => {
      try {
        const meta = await sharp(`public${card.imageUrl}`).metadata();
        dimensions[card.slug] = {
          width: meta.width ?? 400,
          height: meta.height ?? 694,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`Failed to read dimensions for ${card.name}:`, message);
        dimensions[card.slug] = { width: 400, height: 694 };
      }
    }),
  );

  await writeFile('src/data/card-dimensions.json', JSON.stringify(dimensions, null, 2));
  console.log('Generated src/data/card-dimensions.json');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
