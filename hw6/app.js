const key = 'parceldock-demo-v1';
const seed = [
  { id: 101, recipient: 'Mei Chen', carrier: 'Black Cat', tracking_code: 'BC-845019', shelf: 'A-12', status: 'waiting', received_at: new Date().toISOString() },
  { id: 102, recipient: 'Yu Han', carrier: 'Post Office', tracking_code: 'PO-229138', shelf: 'B-04', status: 'waiting', received_at: new Date(Date.now() - 4200000).toISOString() },
  { id: 103, recipient: 'Ting Lin', carrier: 'HCT', tracking_code: 'HC-773401', shelf: 'C-08', status: 'collected', received_at: new Date(Date.now() - 86400000).toISOString() }
];
let parcels = [];
let localMode = false;
const list = document.querySelector('#parcels');
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

function localLoad() {
  try { return JSON.parse(localStorage.getItem(key)) || seed; } catch { return seed; }
}
function saveLocal() { if (localMode) localStorage.setItem(key, JSON.stringify(parcels)); }
function setMode(isLocal) {
  localMode = isLocal;
  document.querySelector('#mode').textContent = isLocal ? 'Browser demo mode' : 'Docker API connected';
  document.querySelector('#modeDot').classList.toggle('ready', true);
}
function render() {
  const query = document.querySelector('#search').value.toLowerCase();
  const visible = parcels.filter(parcel => `${parcel.recipient} ${parcel.tracking_code} ${parcel.carrier}`.toLowerCase().includes(query));
  const waiting = parcels.filter(parcel => parcel.status === 'waiting');
  document.querySelector('#waitingCount').textContent = waiting.length;
  document.querySelector('#collectedCount').textContent = parcels.length - waiting.length;
  document.querySelector('#shelfCount').textContent = new Set(waiting.map(parcel => parcel.shelf)).size;
  list.innerHTML = visible.length ? visible.map(parcel => `<article class="parcel ${parcel.status === 'collected' ? 'collected' : ''}"><span class="code">${escapeHtml(parcel.tracking_code)}</span><div><h3>${escapeHtml(parcel.recipient)}</h3><p>${escapeHtml(parcel.carrier)} · ${new Date(parcel.received_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p></div><span class="shelf">${escapeHtml(parcel.shelf)}</span>${parcel.status === 'waiting' ? `<button class="pickup" data-id="${parcel.id}">Picked up</button>` : '<span class="status">Collected</span>'}</article>`).join('') : '<div class="empty">No parcel matches this search.</div>';
  saveLocal();
}
async function load() {
  try {
    const response = await fetch('/api/parcels', { headers: { Accept: 'application/json' } });
    if (!response.ok || !response.headers.get('content-type')?.includes('json')) throw new Error('No API');
    parcels = await response.json(); setMode(false);
  } catch { parcels = localLoad(); setMode(true); }
  render();
}
document.querySelector('#parcelForm').addEventListener('submit', async event => {
  event.preventDefault();
  const parcel = { recipient: document.querySelector('#recipient').value.trim(), carrier: document.querySelector('#carrier').value, tracking_code: document.querySelector('#tracking').value.trim(), shelf: document.querySelector('#shelf').value.trim() };
  try {
    if (localMode) throw new Error('local');
    const response = await fetch('/api/parcels', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parcel) });
    if (!response.ok) throw new Error('Could not save parcel');
    parcels.unshift(await response.json());
  } catch (error) {
    if (!localMode) { document.querySelector('#formMessage').textContent = error.message; return; }
    parcels.unshift({ ...parcel, id: Date.now(), status: 'waiting', received_at: new Date().toISOString() });
  }
  event.target.reset(); document.querySelector('#formMessage').textContent = 'Parcel recorded.'; render();
});
list.addEventListener('click', async event => {
  const id = Number(event.target.dataset.id); if (!id) return;
  if (!localMode) await fetch(`/api/parcels/${id}/pickup`, { method: 'PATCH' });
  const parcel = parcels.find(entry => entry.id === id); if (parcel) parcel.status = 'collected'; render();
});
document.querySelector('#search').addEventListener('input', render);
document.querySelector('#clock').textContent = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date());
load();
