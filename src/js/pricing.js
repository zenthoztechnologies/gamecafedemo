// Pay-as-you-go / member price switch on the rate table
const toggle = document.querySelector('[data-price-toggle]');
const cells = document.querySelectorAll('[data-guest]');

toggle?.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-mode]');
  if (!btn) return;
  const mode = btn.dataset.mode;
  toggle.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  cells.forEach((cell) => {
    const small = cell.querySelector('small');
    cell.textContent = cell.dataset[mode] + (small ? ' ' : '');
    if (small) cell.append(small);
  });
});
