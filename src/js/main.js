import '../styles/main.css';

document.documentElement.classList.remove('no-js');

/* Opening hours — single source of truth for "open now" + booking slots.
   Day index: 0 = Sunday. Times in 24h; a close past midnight is > 24. */
export const HOURS = {
  0: [10, 22],
  1: [12, 24],
  2: [12, 24],
  3: [12, 24],
  4: [12, 24],
  5: [12, 26],
  6: [10, 26],
};

export const fmtHour = (h) => {
  const hh = ((h % 24) + 24) % 24;
  const whole = Math.floor(hh);
  const mins = Math.round((hh - whole) * 60);
  const suffix = whole >= 12 ? 'pm' : 'am';
  const h12 = whole % 12 || 12;
  return mins ? `${h12}:${String(mins).padStart(2, '0')}${suffix}` : `${h12}${suffix}`;
};

function openStatus(now = new Date()) {
  const day = now.getDay();
  const hour = now.getHours() + now.getMinutes() / 60;
  const yesterday = HOURS[(day + 6) % 7];
  // Still inside yesterday's late session (e.g. 1am after a Friday)
  if (yesterday[1] > 24 && hour < yesterday[1] - 24) return { open: true, text: `Open until ${fmtHour(yesterday[1])}` };
  const [o, c] = HOURS[day];
  if (hour >= o && hour < c) return { open: true, text: `Open until ${fmtHour(c)}` };
  if (hour < o) return { open: false, text: `Opens at ${fmtHour(o)}` };
  const next = HOURS[(day + 1) % 7];
  return { open: false, text: `Opens tomorrow at ${fmtHour(next[0])}` };
}

function updateLive() {
  const status = openStatus();
  document.querySelectorAll('[data-open-status]').forEach((el) => {
    el.textContent = status.text;
    el.classList.toggle('is-closed', !status.open);
  });
  const time = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date());
  document.querySelectorAll('[data-clock]').forEach((el) => (el.textContent = time));
}
updateLive();
setInterval(updateLive, 20_000);

/* Recurring events: show the next date for a weekday ([data-next="5"] = next Friday) */
document.querySelectorAll('[data-next]').forEach((el) => {
  const target = Number(el.dataset.next);
  const d = new Date();
  const offset = (target - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + offset);
  const wd = new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(d);
  el.innerHTML = `<div><b>${d.getDate()}</b><br><span>${wd}</span></div>`;
  const row = el.closest('.event');
  if (row) row.style.order = String(offset); // keep the list in date order
});

/* Header: solid background once the page scrolls */
const header = document.querySelector('[data-header]');
if (header) {
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* Mobile menu */
const toggle = document.querySelector('[data-menu-toggle]');
const menu = document.querySelector('[data-mobile-menu]');
if (toggle && menu) {
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
    menu.inert = !open;
    document.body.classList.toggle('menu-open', open);
    header?.classList.toggle('is-solid', open);
    if (open) menu.querySelector('a')?.focus({ preventScroll: true });
  };
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      setOpen(false);
      toggle.focus();
    }
  });
  matchMedia('(min-width: 1000px)').addEventListener('change', (e) => e.matches && setOpen(false));
}

/* One reveal per page, for blocks marked .reveal */
const reveals = document.querySelectorAll('.reveal');
if (reveals.length && 'IntersectionObserver' in window) {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -10% 0px' },
  );
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('is-in'));
}
