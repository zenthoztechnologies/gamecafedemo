// Downloads source photos (once) and builds responsive AVIF + WebP variants,
// plus a tiny blurred placeholder (LQIP) for each, into public/img.
// Output manifest: public/img/manifest.json — consumed by the <pic> tag in vite.config.js.
import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { images, widths } from './images.config.mjs';

const root = path.resolve(import.meta.dirname, '..');
const srcDir = path.join(root, 'images-src');
const outDir = path.join(root, 'public', 'img');
await fs.mkdir(srcDir, { recursive: true });
await fs.mkdir(outDir, { recursive: true });

const exists = (p) => fs.access(p).then(() => true, () => false);

async function download(img) {
  const file = path.join(srcDir, `${img.name}.jpg`);
  if (await exists(file)) return file;
  const url = `https://images.unsplash.com/photo-${img.id}?w=2400&q=85&fm=jpg`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed (${res.status}) for ${img.name}: ${url}`);
  await fs.writeFile(file, Buffer.from(await res.arrayBuffer()));
  console.log(`  ↓ ${img.name}`);
  return file;
}

const manifest = {};
for (const img of images) {
  const file = await download(img);
  const meta = await sharp(file).metadata();
  const ratio = meta.height / meta.width;
  const ws = widths.filter((w) => w <= meta.width);
  if (!ws.length) ws.push(meta.width);

  for (const w of ws) {
    const base = path.join(outDir, `${img.name}-${w}`);
    const pipe = () => sharp(file).resize({ width: w, withoutEnlargement: true });
    if (!(await exists(`${base}.avif`))) await pipe().avif({ quality: 52, effort: 5 }).toFile(`${base}.avif`);
    if (!(await exists(`${base}.webp`))) await pipe().webp({ quality: 74, effort: 5 }).toFile(`${base}.webp`);
  }

  const lqip = await sharp(file).resize(24).blur(1.2).webp({ quality: 40 }).toBuffer();
  manifest[img.name] = {
    widths: ws,
    width: ws.at(-1),
    height: Math.round(ws.at(-1) * ratio),
    lqip: `data:image/webp;base64,${lqip.toString('base64')}`,
    credit: `https://unsplash.com/photos/${img.id}`,
  };
  console.log(`  ✓ ${img.name} (${ws.join(', ')})`);
}

await fs.writeFile(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`\nDone: ${Object.keys(manifest).length} images → public/img`);
