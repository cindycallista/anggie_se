const storageKey = 'campusline-tickets-v1';
const queueEl = document.querySelector('#queue');
const waitingEl = document.querySelector('#waitingCount');
const servedEl = document.querySelector('#servedCount');
const estimateEl = document.querySelector('#estimate');
const initial = {
  served: 12,
  tickets: [
    { id: 'DOC-041', name: 'Lin Yu-ting', service: 'Official document', note: 'Transcript copy', created: Date.now() - 12 * 60000 },
    { id: 'REG-042', name: 'Chen Wei', service: 'Registration record', note: '', created: Date.now() - 5 * 60000 }
  ]
};
let state;
try { state = JSON.parse(localStorage.getItem(storageKey)) || initial; } catch { state = initial; }

document.querySelector('#today').textContent = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

function save() { localStorage.setItem(storageKey, JSON.stringify(state)); }
function render() {
  waitingEl.textContent = state.tickets.length;
  servedEl.textContent = state.served;
  estimateEl.textContent = `${state.tickets.length * 7} min`;
  if (!state.tickets.length) {
    queueEl.innerHTML = '<div class="empty">The queue is clear. New tickets will appear here.</div>';
    return;
  }
  queueEl.innerHTML = state.tickets.map((ticket, index) => `
    <article class="ticket">
      <span class="ticket-code">${ticket.id}</span>
      <div><strong>${escapeHtml(ticket.name)}</strong><p>${ticket.service}${ticket.note ? ` · ${escapeHtml(ticket.note)}` : ''}</p></div>
      <span class="wait">~${(index + 1) * 7} min</span>
    </article>`).join('');
}
function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[char]);
}
document.querySelector('#ticketForm').addEventListener('submit', event => {
  event.preventDefault();
  const select = document.querySelector('#service');
  const count = state.served + state.tickets.length + 1;
  state.tickets.push({ id: `${select.value}-${String(count).padStart(3, '0')}`, name: document.querySelector('#name').value.trim(), service: select.options[select.selectedIndex].text, note: document.querySelector('#note').value.trim(), created: Date.now() });
  event.target.reset(); save(); render();
});
document.querySelector('#serveBtn').addEventListener('click', () => {
  if (!state.tickets.length) return;
  state.tickets.shift(); state.served += 1; save(); render();
});
render();

