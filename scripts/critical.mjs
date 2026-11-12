// Post-build: inline above-the-fold CSS into every page and load the rest
// without blocking render (via Beasties — the maintained fork of Google's Critters).
import fs from 'node:fs/promises';
import path from 'node:path';
import Beasties from 'beasties';

const dist = path.resolve(import.meta.dirname, '..', 'dist');
const beasties = new Beasties({
  path: dist,
  publicPath: './',
  preload: 'media',
  pruneSource: false,
  reduceInlineStyles: false,
  fonts: false,
  logLevel: 'warn',
});

// Preload the two Latin variable fonts so headings don't swap late
const assets = await fs.readdir(path.join(dist, 'assets'));
const fontPreloads = assets
  .filter((f) => /^(sora|manrope)-latin-wght-normal-.*\.woff2$/.test(f))
  .map((f) => `<link rel="preload" href="./assets/${f}" as="font" type="font/woff2" crossorigin>`)
  .join('');

const files = (await fs.readdir(dist)).filter((f) => f.endsWith('.html'));
for (const f of files) {
  const file = path.join(dist, f);
  const html = (await fs.readFile(file, 'utf8')).replace('</title>', `</title>${fontPreloads}`);
  const out = await beasties.process(html);
  await fs.writeFile(file, out);
  console.log(`  ✓ critical CSS inlined → ${f}`);
}
