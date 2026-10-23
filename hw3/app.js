const key = 'freshfirst-items-v1';
const day = 86400000;
const addDays = value => new Date(Date.now() + value * day).toISOString().slice(0, 10);
const starter = [
  { id: 1, name: 'Baby spinach', quantity: 1, category: 'Produce', expiry: addDays(1) },
  { id: 2, name: 'Miso tofu', quantity: 2, category: 'Fridge', expiry: addDays(4) },
  { id: 3, name: 'Frozen dumplings', quantity: 12, category: 'Freezer', expiry: addDays(45) }
];
let items;
try { items = JSON.parse(localStorage.getItem(key)) || starter; } catch { items = starter; }
const list = document.querySelector('#items');

function save() { localStorage.setItem(key, JSON.stringify(items)); }
function daysLeft(date) { return Math.ceil((new Date(`${date}T23:59:59`) - new Date()) / day); }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]); }
function render() {
  const filter = document.querySelector('#filter').value;
  const visible = items.filter(item => filter === 'All' || item.category === filter).sort((a, b) => a.expiry.localeCompare(b.expiry));
  document.querySelector('#summary').textContent = `${items.length} item${items.length === 1 ? '' : 's'} saved`;
  list.innerHTML = visible.length ? visible.map(item => {
    const remaining = daysLeft(item.expiry);
    const label = remaining < 0 ? `${Math.abs(remaining)} day(s) overdue` : remaining === 0 ? 'Use today' : `${remaining} day(s) left`;
    const tone = remaining < 0 ? 'late' : remaining <= 3 ? 'soon' : '';
    return `<article class="food"><div><h3>${escapeHtml(item.name)}</h3><p>${item.quantity} · ${item.category} · ${item.expiry}</p></div><span class="status ${tone}">${label}</span><div class="actions"><button data-use="${item.id}">Used</button><button data-remove="${item.id}">×</button></div></article>`;
  }).join('') : '<div class="empty">No items match this location.</div>';
}
document.querySelector('#itemForm').addEventListener('submit', event => {
  event.preventDefault();
  items.push({ id: Date.now(), name: document.querySelector('#itemName').value.trim(), quantity: Number(document.querySelector('#quantity').value), category: document.querySelector('#category').value, expiry: document.querySelector('#expiry').value });
  event.target.reset(); document.querySelector('#quantity').value = 1; save(); render();
});
list.addEventListener('click', event => {
  const id = Number(event.target.dataset.use || event.target.dataset.remove);
  if (!id) return;
  const item = items.find(entry => entry.id === id);
  if (event.target.dataset.use && item && item.quantity > 1) item.quantity -= 1;
  else items = items.filter(entry => entry.id !== id);
  save(); render();
});
document.querySelector('#filter').addEventListener('change', render);
document.querySelector('#exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
  const anchor = document.createElement('a'); anchor.href = URL.createObjectURL(blob); anchor.download = 'freshfirst.json'; anchor.click(); URL.revokeObjectURL(anchor.href);
});
document.querySelector('#expiry').value = addDays(7);
render();
