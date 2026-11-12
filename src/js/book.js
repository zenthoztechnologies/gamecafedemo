import { HOURS, fmtHour } from './main.js';

// Rates per hour. VR is sold in 30-minute blocks ($12 off-peak / $14 peak).
const ZONES = {
  ps5:   { name: 'PS5 Lounge',   offpeak: 9,  peak: 12, perBooth: 4, min: 1 },
  pc:    { name: 'PC Station',   offpeak: 7,  peak: 9,  min: 1 },
  vr:    { name: 'VR Bay',       offpeak: 24, peak: 28, min: 0.5, max: 2 },
  retro: { name: 'Retro Corner', offpeak: 5,  peak: 5,  min: 1, memberFree: true },
};
const MEMBER_DISCOUNT = 2; // $ off per hour (per 30 min block for VR → $4/hr)

const form = document.querySelector('[data-form]');
if (form) {
  const $ = (s) => form.querySelector(s);
  const dateInput = $('[data-date]');
  const slotsEl = $('[data-slots]');
  const timeInput = $('[data-time]');
  const durationInput = $('[data-duration]');
  const durationLabel = $('[data-duration-label]');
  const durationHint = $('[data-duration-hint]');
  const playersInput = $('[data-players]');
  const memberInput = $('[data-member]');
  const sum = Object.fromEntries([...document.querySelectorAll('[data-sum]')].map((el) => [el.dataset.sum, el]));

  const state = { zone: 'ps5', date: null, time: null, duration: 2 };

  const params = new URLSearchParams(location.search);
  if (params.get('zone') in ZONES) {
    state.zone = params.get('zone');
    form.querySelector(`input[name="zone"][value="${state.zone}"]`).checked = true;
  }

  // Date limits: today → 14 days ahead
  const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const today = new Date();
  const maxDate = new Date();
  maxDate.setDate(today.getDate() + 14);
  dateInput.min = iso(today);
  dateInput.max = iso(maxDate);
  dateInput.value = iso(today);
  state.date = dateInput.value;

  const parseDate = (v) => {
    const [y, m, d] = v.split('-').map(Number);
    return new Date(y, m - 1, d);
  };
  const isPeak = (date, hour) => {
    const day = date.getDay();
    return day === 0 || day === 6 || hour >= 17;
  };
  const fmtDuration = (h) => (h === 0.5 ? '30 minutes' : h === 1 ? '1 hour' : `${h} hours`);
  const money = (n) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

  function renderSlots() {
    slotsEl.innerHTML = '';
    if (!state.date) return;
    const date = parseDate(state.date);
    const [open, close] = HOURS[date.getDay()];
    const isToday = iso(date) === iso(new Date());
    const nowH = new Date().getHours() + new Date().getMinutes() / 60;
    let firstFree = null;

    for (let h = open; h <= close - 1; h++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.setAttribute('role', 'radio');
      btn.dataset.hour = String(h);
      btn.textContent = fmtHour(h);
      const past = isToday && h <= nowH;
      btn.disabled = past;
      btn.setAttribute('aria-checked', 'false');
      btn.setAttribute('aria-pressed', 'false');
      if (!past && firstFree === null) firstFree = h;
      slotsEl.append(btn);
    }

    if (firstFree === null) {
      slotsEl.innerHTML = '<p class="hint">We\'re fully closed for the rest of this day. Pick another date.</p>';
      state.time = null;
    } else if (state.time === null || !slotsEl.querySelector(`[data-hour="${state.time}"]:not(:disabled)`)) {
      state.time = null;
    }
    markSlot();
  }

  function markSlot() {
    slotsEl.querySelectorAll('[data-hour]').forEach((b) => {
      const on = Number(b.dataset.hour) === state.time;
      b.setAttribute('aria-checked', String(on));
      b.setAttribute('aria-pressed', String(on));
      b.tabIndex = on || (state.time === null && !b.disabled && b === slotsEl.querySelector('[data-hour]:not(:disabled)')) ? 0 : -1;
    });
    timeInput.value = state.time === null ? '' : fmtHour(state.time);
  }

  function clampDuration() {
    const z = ZONES[state.zone];
    const step = z.min;
    let max = z.max ?? 6;
    if (state.date && state.time !== null) {
      const close = HOURS[parseDate(state.date).getDay()][1];
      max = Math.min(max, close - state.time);
    }
    state.duration = Math.min(Math.max(state.duration, step), max);
    state.duration = Math.round(state.duration / step) * step;
    durationInput.value = String(state.duration);
    durationLabel.textContent = fmtDuration(state.duration);
    durationHint.textContent = state.zone === 'vr' ? 'VR is booked in 30-minute blocks, up to 2 hours.' : 'Up to 6 hours. Need longer? Ask about a day pass.';
    return { step, max };
  }

  function update() {
    clampDuration();
    const z = ZONES[state.zone];
    const players = Number(playersInput.value);
    const member = memberInput.value === 'yes';
    const date = state.date ? parseDate(state.date) : null;
    const peak = date && state.time !== null ? isPeak(date, state.time) : date ? date.getDay() % 6 === 0 : false;

    let rate = peak ? z.peak : z.offpeak;
    if (member) rate = z.memberFree ? 0 : Math.max(0, rate - (state.zone === 'vr' ? MEMBER_DISCOUNT * 2 : MEMBER_DISCOUNT));
    const units = z.perBooth ? Math.ceil(players / z.perBooth) : players;
    const total = rate * state.duration * units;

    sum.zone.textContent = z.name;
    sum.date.textContent = date ? new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(date) : 'Choose a date';
    sum.time.textContent = state.time === null ? 'Choose a time' : `${fmtHour(state.time)} to ${fmtHour(state.time + state.duration)}`;
    sum.duration.textContent = fmtDuration(state.duration);
    sum.players.textContent = z.perBooth ? `${players} (${units} booth${units > 1 ? 's' : ''})` : `${players} (${units} seat${units > 1 ? 's' : ''})`;
    sum.rate.textContent = rate === 0 ? 'Free for members' : `${money(rate)} an hour${z.perBooth ? ' per booth' : ' per seat'}${peak ? ', peak' : ''}`;
    sum.total.textContent = money(total);
  }

  // Events
  form.addEventListener('change', (e) => {
    if (e.target.name === 'zone') state.zone = e.target.value;
    if (e.target === dateInput) {
      state.date = dateInput.value || null;
      renderSlots();
      setError('date', '');
    }
    update();
  });

  slotsEl.addEventListener('click', (e) => {
    const b = e.target.closest('[data-hour]');
    if (!b || b.disabled) return;
    state.time = Number(b.dataset.hour);
    markSlot();
    setError('time', '');
    update();
  });
  slotsEl.addEventListener('keydown', (e) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
    const enabled = [...slotsEl.querySelectorAll('[data-hour]:not(:disabled)')];
    const i = enabled.indexOf(document.activeElement);
    const next = enabled[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length];
    if (next) {
      e.preventDefault();
      next.click();
      next.focus();
    }
  });

  form.querySelectorAll('[data-step]').forEach((b) =>
    b.addEventListener('click', () => {
      const { step } = clampDuration();
      state.duration += Number(b.dataset.step) * step;
      update();
    }),
  );

  // Validation + submit
  function setError(field, msg) {
    const el = form.querySelector(`[data-error-for="${field}"]`);
    if (el) el.textContent = msg;
    const input = form.querySelector(`[name="${field}"]`);
    if (input && input.type !== 'hidden') input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  function validate() {
    let firstBad = null;
    const check = (field, ok, msg, focusEl) => {
      setError(field, ok ? '' : msg);
      if (!ok && !firstBad) firstBad = focusEl;
    };
    check('date', !!state.date, 'Choose a date within the next two weeks.', dateInput);
    check('time', state.time !== null, 'Choose a start time.', slotsEl.querySelector('[data-hour]:not(:disabled)'));
    const name = form.elements.name;
    check('name', name.value.trim().length > 1, 'Enter the name to book under.', name);
    const email = form.elements.email;
    check('email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()), 'Enter an email address like name@example.com.', email);
    firstBad?.focus();
    return !firstBad;
  }

  ['name', 'email'].forEach((n) => form.elements[n].addEventListener('input', () => setError(n, '')));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;
    const submit = form.querySelector('[data-submit]');
    const formError = form.querySelector('[data-form-error]');
    formError.textContent = '';
    const ref = 'SP-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    const data = new FormData(form);
    data.set('reference', ref);
    data.set('estimated_total', sum.total.textContent);

    const endpoint = form.getAttribute('action');
    if (endpoint) {
      submit.disabled = true;
      submit.textContent = 'Sending…';
      try {
        const res = await fetch(endpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(String(res.status));
      } catch {
        submit.disabled = false;
        submit.textContent = 'Request booking';
        formError.textContent = 'The booking didn\'t go through. Check your connection and try again, or call us on (555) 014-2290.';
        return;
      }
    }

    const confirm = document.querySelector('[data-confirm]');
    document.querySelector('[data-booking]').hidden = true;
    confirm.hidden = false;
    confirm.querySelector('[data-confirm-ref]').textContent = ref;
    confirm.querySelector('[data-confirm-text]').textContent =
      `${sum.zone.textContent} on ${sum.date.textContent}, ${sum.time.textContent}. We'll email ${form.elements.email.value.trim()} to confirm.`;
    confirm.focus();
    confirm.scrollIntoView({ block: 'center' });
  });

  renderSlots();
  update();
}
