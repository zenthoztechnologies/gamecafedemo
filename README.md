# Savepoint: gaming café website

A multi-page static site for a PlayStation-inspired gaming café. It uses plain HTML, CSS and JavaScript, built with Vite and needs no framework or runtime library.

**Pages:** Home · Stations · Games · Pricing · Events · Café · Book · 404

## Quick start

```bash
npm install
npm run dev        # local dev server with hot reload
npm run build      # production build → dist/
npm run preview    # serve dist/ locally
```

`dist/` is a fully static folder. Deploy it anywhere: Netlify, Vercel, Cloudflare Pages, GitHub Pages or any web host.

**Vercel:** `vercel.json` already sets the build (`npm run build` → `dist`) and long-lived cache headers. Import the repo at vercel.com/new and every push to `main` deploys.

## Design

| | |
|---|---|
| **Concept** | The home hero works like a console home screen: a status bar with a live clock and open/closed state, a row of tiles you browse with ← → (or tap or swipe), and art that crossfades behind a large title. |
| **Colour** | Console navy `#060b24`, panel `#0e1846`, signal blue `#2b6bff`. The four face-button colours are used **as a code**: ✕ blue = PS5 Lounges, □ pink = PC Stations, △ teal = VR Bay, ○ red = Retro Corner. |
| **Type** | Sora Variable (light, large display) + Manrope Variable (body), self-hosted. |
| **Motion** | One orchestrated entrance on the hero. Everything else only moves in response to user input. `prefers-reduced-motion` is respected. |
| **A11y** | Keyboard-operable tabs, a skip link, visible focus rings, `inert` mobile menu, labelled form errors, `aria-live` result counts. |

The design process followed Anthropic's [`frontend-design` skill](https://github.com/anthropics/skills/tree/main/skills/frontend-design).

## Performance

- **Images:** `scripts/images.mjs` (using sharp) turns every photo into **AVIF + WebP at 640/1280/1920px**, plus a ~300-byte blurred placeholder inlined as the image background. A full-width hero background is about 32 KB.
- **Responsive markup:** write `<!-- pic name="burger" alt="…" sizes="50vw" -->` in any page and the build expands it into a full `<picture>` with `srcset`, `width`/`height` (no layout shift) and lazy loading.
- **Hero:** only the first background image loads up front (preloaded, `fetchpriority="high"`). The other four sit in `<template>`s and load when the browser is idle.
- **Critical CSS:** [Beasties](https://github.com/danielroe/beasties) inlines above-the-fold CSS into each page and loads the rest without blocking render.
- **Fonts:** self-hosted via Fontsource, with the Latin subsets preloaded.
- **JS:** a shared `main.js` (~1.5 KB gzipped) plus a small module per page. No libraries.
- **CSS:** minified with Lightning CSS (~9.5 KB gzipped for the whole site).

## Project structure

```
src/
  *.html              one file per page
  partials/           head, header, footer (included with <!-- include:name -->)
  styles/             base (tokens) · components · console (hero) · pages
  js/                 main · console · games · pricing · events · book
public/
  img/                generated images + manifest.json (commit these)
  favicon.svg
scripts/
  images.config.mjs   list of photos (Unsplash IDs)
  images.mjs          download + optimise → public/img
  critical.mjs        post-build critical CSS + font preloads
vite.config.js        multi-page build + the include/<pic> helper plugin
```

## Customising

| What | Where |
|---|---|
| Business name, address, phone, email | `src/partials/header.html`, `src/partials/footer.html`, and the visit section of `src/index.html` and `src/book.html` |
| Opening hours (used for "Open now" and booking slots) | `HOURS` in `src/js/main.js`, plus the hours lists in the footer and home page |
| Rates | `src/pricing.html` table and `ZONES` in `src/js/book.js` |
| Game library | `GAMES` array in `src/js/games.js` |
| Events | `src/events.html`. Recurring events use `data-next="5"` (= next Friday), so dates never go stale. |
| Photos | Add to `scripts/images.config.mjs`, run `npm run images`, then use `<!-- pic name="…" -->` |
| Colours, spacing, type scale | Tokens at the top of `src/styles/base.css` |

### Receiving bookings

The booking form validates and shows a confirmation, but it doesn't send anything until you give it an endpoint. Set the form's `action` in `src/book.html` to any form backend that accepts a POST, for example [Formspree](https://formspree.io) (`https://formspree.io/f/xxxx`). The script posts the form data, including a booking reference and the estimated total, and shows the confirmation when the request succeeds.

## GitHub repos researched for this build

| Repo | Used for |
|---|---|
| [anthropics/skills](https://github.com/anthropics/skills): `frontend-design` | Design process: aesthetic direction, token plan, self-critique |
| [wilwaldon/Claude-Code-Frontend-Design-Toolkit](https://github.com/wilwaldon/Claude-Code-Frontend-Design-Toolkit) | Curated list of design skills and tools for AI-built frontends |
| [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | Optional: design-system skill you can install for further iterations |
| [vitejs/vite](https://github.com/vitejs/vite) | Multi-page static build, hashing, minification |
| [lovell/sharp](https://github.com/lovell/sharp) | AVIF/WebP generation and blur placeholders |
| [danielroe/beasties](https://github.com/danielroe/beasties) | Critical CSS inlining (maintained successor of Google's Critters) |
| [fontsource/fontsource](https://github.com/fontsource/fontsource) | Self-hosted variable fonts |
| [parcel-bundler/lightningcss](https://github.com/parcel-bundler/lightningcss) | CSS minification |
| [FatehAK/vite-plugin-image-optimizer](https://github.com/FatehAK/vite-plugin-image-optimizer) | Considered; replaced by a direct sharp script that also makes AVIF variants and placeholders |
| [darkroomengineering/lenis](https://github.com/darkroomengineering/lenis), [alexfoxy/lax.js](https://github.com/alexfoxy/lax.js) | Considered and left out: smooth-scroll and scroll-animation libraries add JS weight and fight native scrolling |

To keep iterating with the same design guidance, install the `frontend-design` skill from [anthropics/skills](https://github.com/anthropics/skills). Its README has the install steps for Claude Code.

## Credits

Photos are from [Unsplash](https://unsplash.com) and used under the [Unsplash License](https://unsplash.com/license). Each photo's source link is in `public/img/manifest.json`. Savepoint is a fictional business. PlayStation, PS5 and DualSense are trademarks of Sony Interactive Entertainment; this site is not affiliated with Sony.
