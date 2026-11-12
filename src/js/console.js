/* Home hero: a console-style tile row.
   ← / → (or Home / End) move between tiles, the art behind crossfades,
   and the big title + details swap. Background art for tiles 2–5 is held in
   <template>s and only added after the page has loaded, so the first paint
   downloads a single hero image. */

const root = document.querySelector('[data-console]');

if (root) {
  const tiles = [...root.querySelectorAll('[role="tab"]')];
  const panels = tiles.map((t) => document.getElementById(t.getAttribute('aria-controls')));
  const bg = root.querySelector('.console__bg');
  const now = root.querySelector('[data-console-now]');
  let current = 0;

  const ensureLayer = (i) => {
    let layer = bg.querySelector(`[data-layer="${i}"]`);
    if (layer) return layer;
    const tpl = root.querySelector(`template[data-layer-tpl="${i}"]`);
    if (!tpl) return null;
    layer = document.createElement('div');
    layer.className = 'console__layer';
    layer.dataset.layer = String(i);
    layer.append(tpl.content.cloneNode(true));
    bg.append(layer);
    return layer;
  };

  const select = (i, { focus = false } = {}) => {
    if (i === current && !focus) return;
    const prev = current;
    current = (i + tiles.length) % tiles.length;

    tiles.forEach((t, n) => {
      const on = n === current;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p, n) => {
      p.hidden = n !== current;
      p.classList.remove('is-entering');
    });
    const panel = panels[current];
    void panel.offsetWidth; // restart entrance animation
    panel.classList.add('is-entering');

    const layer = ensureLayer(current);
    bg.querySelectorAll('.console__layer').forEach((l) => l.classList.toggle('is-active', l === layer));

    if (now) now.textContent = tiles[current].dataset.name;
    const tile = tiles[current];
    if (focus) tile.focus();
    tile.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: prev === current ? 'auto' : 'smooth' });
  };

  tiles.forEach((tile, i) => {
    tile.addEventListener('click', () => select(i));
    tile.addEventListener('keydown', (e) => {
      const map = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: tiles.length - 1 };
      if (e.key in map) {
        e.preventDefault();
        select(map[e.key], { focus: true });
      }
    });
  });

  // Preload remaining art once the page is idle
  const warm = () => tiles.forEach((_, i) => ensureLayer(i));
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
  if (document.readyState === 'complete') idle(warm);
  else window.addEventListener('load', () => idle(warm), { once: true });
}
