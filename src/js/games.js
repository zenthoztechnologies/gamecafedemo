// Game library — edit this list to match what's installed.
// platform: ps5 | pc | vr | retro
const GAMES = [
  { t: 'Astro Bot', p: 'ps5', g: 'Platformer', n: '1 player' },
  { t: "Marvel's Spider-Man 2", p: 'ps5', g: 'Action', n: '1 player' },
  { t: 'God of War Ragnarök', p: 'ps5', g: 'Action', n: '1 player' },
  { t: 'Ghost of Yōtei', p: 'ps5', g: 'Action', n: '1 player' },
  { t: 'Gran Turismo 7', p: 'ps5', g: 'Racing', n: '1–2 players' },
  { t: 'EA Sports FC 26', p: 'ps5', g: 'Sports', n: '1–4 players' },
  { t: 'NBA 2K26', p: 'ps5', g: 'Sports', n: '1–4 players' },
  { t: 'Tekken 8', p: 'ps5', g: 'Fighting', n: '1–2 players' },
  { t: 'Street Fighter 6', p: 'ps5', g: 'Fighting', n: '1–2 players' },
  { t: 'Mortal Kombat 1', p: 'ps5', g: 'Fighting', n: '1–2 players' },
  { t: 'Split Fiction', p: 'ps5', g: 'Co-op', n: '2 players' },
  { t: 'It Takes Two', p: 'ps5', g: 'Co-op', n: '2 players' },
  { t: 'Helldivers 2', p: 'ps5', g: 'Shooter', n: '1–4 players' },
  { t: 'Final Fantasy VII Rebirth', p: 'ps5', g: 'RPG', n: '1 player' },
  { t: 'Stellar Blade', p: 'ps5', g: 'Action', n: '1 player' },
  { t: 'Ratchet & Clank: Rift Apart', p: 'ps5', g: 'Platformer', n: '1 player' },
  { t: 'Counter-Strike 2', p: 'pc', g: 'Shooter', n: 'Online' },
  { t: 'Valorant', p: 'pc', g: 'Shooter', n: 'Online' },
  { t: 'League of Legends', p: 'pc', g: 'Strategy', n: 'Online' },
  { t: 'Dota 2', p: 'pc', g: 'Strategy', n: 'Online' },
  { t: 'Fortnite', p: 'pc', g: 'Shooter', n: 'Online' },
  { t: 'Apex Legends', p: 'pc', g: 'Shooter', n: 'Online' },
  { t: 'Marvel Rivals', p: 'pc', g: 'Shooter', n: 'Online' },
  { t: 'Rocket League', p: 'pc', g: 'Sports', n: '1–4 players' },
  { t: 'Minecraft', p: 'pc', g: 'Sandbox', n: 'Online' },
  { t: "Baldur's Gate 3", p: 'pc', g: 'RPG', n: '1–4 players' },
  { t: 'Beat Saber', p: 'vr', g: 'Rhythm', n: '1 player' },
  { t: 'Half-Life: Alyx', p: 'vr', g: 'Shooter', n: '1 player' },
  { t: 'Superhot VR', p: 'vr', g: 'Action', n: '1 player' },
  { t: 'Pistol Whip', p: 'vr', g: 'Rhythm', n: '1 player' },
  { t: 'Job Simulator', p: 'vr', g: 'Sandbox', n: '1 player' },
  { t: 'Street Fighter II Turbo', p: 'retro', g: 'Fighting', n: '1–2 players' },
  { t: 'Tekken 3', p: 'retro', g: 'Fighting', n: '1–2 players' },
  { t: 'GoldenEye 007', p: 'retro', g: 'Shooter', n: '1–4 players' },
  { t: 'Crash Bandicoot', p: 'retro', g: 'Platformer', n: '1 player' },
  { t: 'Sonic the Hedgehog 2', p: 'retro', g: 'Platformer', n: '1–2 players' },
  { t: 'Metal Gear Solid', p: 'retro', g: 'Action', n: '1 player' },
  { t: 'Gran Turismo 2', p: 'retro', g: 'Racing', n: '1–2 players' },
];

const SHAPE = { ps5: 'cross', pc: 'square', vr: 'triangle', retro: 'circle' };
const LABEL = { ps5: 'PS5', pc: 'PC', vr: 'VR', retro: 'Retro' };

const grid = document.querySelector('[data-grid]');
const search = document.querySelector('[data-search]');
const platformGroup = document.querySelector('[data-platforms]');
const genreGroup = document.querySelector('[data-genres]');
const count = document.querySelector('[data-count]');
const empty = document.querySelector('[data-empty]');

const state = {
  q: '',
  platform: new URLSearchParams(location.search).get('platform') || 'all',
  genre: 'All',
};
if (!(state.platform in SHAPE)) state.platform = 'all';

// Render cards once, then filter by toggling [hidden]
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
grid.innerHTML = GAMES.map(
  (g) => `
  <article class="game" data-platform="${g.p}" data-genre="${g.g}" data-search="${esc(`${g.t} ${g.g} ${LABEL[g.p]}`.toLowerCase())}">
    <svg class="glyph game__glyph" aria-hidden="true"><use href="#g-${SHAPE[g.p]}"/></svg>
    <svg class="glyph game__big" aria-hidden="true"><use href="#g-${SHAPE[g.p]}"/></svg>
    <div>
      <h3>${esc(g.t)}</h3>
      <p class="game__meta"><span>${LABEL[g.p]}</span><span>${g.g}</span><span>${g.n}</span></p>
    </div>
  </article>`,
).join('');
const cards = [...grid.children];

const genres = ['All', ...new Set(GAMES.map((g) => g.g))].sort((a, b) => (a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b)));
genreGroup.innerHTML = genres
  .map((g) => `<button class="chip" type="button" data-genre="${g}" aria-pressed="${g === state.genre}">${g}</button>`)
  .join('');

function apply() {
  const q = state.q.trim().toLowerCase();
  let shown = 0;
  for (const card of cards) {
    const ok =
      (state.platform === 'all' || card.dataset.platform === state.platform) &&
      (state.genre === 'All' || card.dataset.genre === state.genre) &&
      (!q || card.dataset.search.includes(q));
    card.hidden = !ok;
    if (ok) shown++;
  }
  count.textContent = `Showing ${shown} of ${cards.length} games`;
  empty.hidden = shown > 0;
  platformGroup.querySelectorAll('[data-platform]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.platform === state.platform)));
  genreGroup.querySelectorAll('[data-genre]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.genre === state.genre)));

  const url = new URL(location.href);
  if (state.platform === 'all') url.searchParams.delete('platform');
  else url.searchParams.set('platform', state.platform);
  history.replaceState(null, '', url);
}

search.addEventListener('input', () => { state.q = search.value; apply(); });
platformGroup.addEventListener('click', (e) => {
  const b = e.target.closest('[data-platform]');
  if (b) { state.platform = b.dataset.platform; apply(); }
});
genreGroup.addEventListener('click', (e) => {
  const b = e.target.closest('[data-genre]');
  if (b) { state.genre = b.dataset.genre; apply(); }
});
document.querySelector('[data-reset]').addEventListener('click', () => {
  Object.assign(state, { q: '', platform: 'all', genre: 'All' });
  search.value = '';
  apply();
  search.focus();
});

apply();
