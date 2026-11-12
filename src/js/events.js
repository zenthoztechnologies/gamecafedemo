// Monthly championship countdown, event-type filter and today's highlight.
// Recurring event dates are filled in by main.js ([data-next]).

const lastSaturday = (year, month) => {
  const d = new Date(year, month + 1, 0, 18, 0, 0); // last day of month, 6pm
  d.setDate(d.getDate() - ((d.getDay() + 1) % 7));
  return d;
};

function nextMonthly(now = new Date()) {
  let d = lastSaturday(now.getFullYear(), now.getMonth());
  if (d <= now) d = lastSaturday(now.getFullYear(), now.getMonth() + 1);
  return d;
}

const target = nextMonthly();
const dateEl = document.querySelector('[data-monthly-date]');
if (dateEl) {
  dateEl.textContent = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(target) + ', 6pm';
}

const countdown = document.querySelector('[data-countdown]');
if (countdown) {
  const units = Object.fromEntries([...countdown.querySelectorAll('[data-unit]')].map((el) => [el.dataset.unit, el]));
  const tick = () => {
    const ms = Math.max(0, target - Date.now());
    units.d.textContent = String(Math.floor(ms / 864e5));
    units.h.textContent = String(Math.floor((ms / 36e5) % 24)).padStart(2, '0');
    units.m.textContent = String(Math.floor((ms / 6e4) % 60)).padStart(2, '0');
  };
  tick();
  setInterval(tick, 30_000);
}

// Filter
const filter = document.querySelector('[data-event-filter]');
const events = document.querySelectorAll('[data-events] .event');
const empty = document.querySelector('[data-events-empty]');
filter?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-type]');
  if (!btn) return;
  const type = btn.dataset.type;
  filter.querySelectorAll('[data-type]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  let shown = 0;
  events.forEach((ev) => {
    const ok = type === 'all' || ev.dataset.type === type;
    ev.hidden = !ok;
    if (ok) shown++;
  });
  empty.hidden = shown > 0;
});

// Highlight today in the weekly schedule
document.querySelector(`[data-week] [data-day="${new Date().getDay()}"]`)?.classList.add('is-today');
