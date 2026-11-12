import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, 'src');
const pages = ['index', 'stations', 'games', 'pricing', 'events', 'cafe', 'book', '404'].filter((p) =>
  fs.existsSync(path.join(root, `${p}.html`)),
);

/**
 * Tiny static-site helper — no framework needed.
 *  <!-- include:header -->              → contents of src/partials/header.html
 *  <!-- pic name="x" alt="" sizes="" priority|eager --> → responsive <picture> (AVIF + WebP, 3 widths, blur-up placeholder)
 *  Marks the current page's nav link with aria-current="page".
 */
function staticSite() {
  const manifestPath = path.resolve(import.meta.dirname, 'public/img/manifest.json');
  const loadManifest = () => JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  const attrs = (str) =>
    Object.fromEntries([...str.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map((m) => [m[1], m[2] ?? true]));

  const picture = (a, manifest) => {
    const img = manifest[a.name];
    if (!img) throw new Error(`<pic>: unknown image "${a.name}"`);
    const set = (ext) => img.widths.map((w) => `img/${a.name}-${w}.${ext} ${w}w`).join(', ');
    const sizes = a.sizes || '100vw';
    // `priority` = LCP image (eager + high fetch priority); `eager` = above the fold
    const priority = a.priority === true;
    const eager = priority || a.eager === true;
    const mid = img.widths[Math.min(1, img.widths.length - 1)];
    return (
      `<picture${a.wrap ? ` class="${a.wrap}"` : ''}>` +
      `<source type="image/avif" srcset="${set('avif')}" sizes="${sizes}">` +
      `<source type="image/webp" srcset="${set('webp')}" sizes="${sizes}">` +
      `<img src="img/${a.name}-${mid}.webp" alt="${a.alt ?? ''}" width="${img.width}" height="${img.height}"` +
      `${a.class ? ` class="${a.class}"` : ''}` +
      `${priority ? ' fetchpriority="high"' : ''}${eager ? ' loading="eager"' : ' loading="lazy"'} decoding="async"` +
      ` style="background-image:url(${img.lqip})">` +
      `</picture>`
    );
  };

  return {
    name: 'static-site',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const manifest = loadManifest();
        const page = path.basename(ctx.filename);
        html = html.replace(/<!--\s*include:([\w-]+)\s*-->/g, (_, name) =>
          fs.readFileSync(path.join(root, 'partials', `${name}.html`), 'utf8'),
        );
        html = html.replace(/<!--\s*pic\s+(.*?)\s*-->/g, (_, a) => picture(attrs(a), manifest));
        html = html.replace(new RegExp(`(<a[^>]*class="[^"]*nav-link[^"]*"[^>]*href="${page}")`, 'g'), '$1 aria-current="page"');
        html = html.replaceAll('{{year}}', String(new Date().getFullYear()));
        return html;
      },
    },
    handleHotUpdate({ file, server }) {
      if (file.includes(`${path.sep}partials${path.sep}`)) server.ws.send({ type: 'full-reload' });
    },
  };
}

export default defineConfig({
  root,
  base: './',
  publicDir: path.resolve(import.meta.dirname, 'public'),
  plugins: [staticSite()],
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    target: 'es2020',
    cssMinify: 'lightningcss',
    assetsInlineLimit: 2048,
    rollupOptions: {
      input: Object.fromEntries(pages.map((p) => [p, path.join(root, `${p}.html`)])),
    },
  },
});
