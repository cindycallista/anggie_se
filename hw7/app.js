const storageKey = 'studyslot-demo-v1';
const seed = [];
let bookings = [];
let browserMode = false;

const today = new Date().toISOString().slice(0, 10);
const filterDate = document.querySelector('#filterDate');
const formDate = document.querySelector('#date');
filterDate.value = today;
formDate.value = today;
formDate.min = today;

function readLocal() {
  try { return JSON.parse(localStorage.getItem(storageKey)) || seed; } catch { return seed; }
}

function saveLocal() {
  if (browserMode) localStorage.setItem(storageKey, JSON.stringify(bookings));
}

function endTime(start, duration) {
  const [hour, minute] = start.split(':').map(Number);
  const total = hour * 60 + minute + Number(duration);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function render() {
  const visible = bookings.filter(item => item.date === filterDate.value).sort((a, b) => a.start.localeCompare(b.start));
  const rows = document.querySelector('#bookingRows');
  const empty = document.querySelector('#emptyState');
  rows.innerHTML = visible.map(item => `<tr><td>${item.start}–${endTime(item.start, item.duration)}</td><td>${item.room}</td><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.purpose)}</td></tr>`).join('');
  empty.classList.toggle('hidden', visible.length > 0);
  document.querySelector('#scheduleSummary').textContent = `${visible.length} booking${visible.length === 1 ? '' : 's'} on ${filterDate.value}.`;
  saveLocal();
}

async function load() {
  try {
    const response = await fetch(`/api/bookings?date=${filterDate.value}`, { headers: { accept: 'application/json' } });
    if (!response.ok || !response.headers.get('content-type')?.includes('json')) throw new Error('No API');
    bookings = await response.json();
    document.querySelector('#connection').textContent = 'Node API connected';
  } catch {
    browserMode = true;
    bookings = readLocal();
    document.querySelector('#connection').textContent = 'Browser demo mode';
  }
  document.querySelector('#connection').classList.add('ready');
  render();
}

document.querySelector('#bookingForm').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const data = Object.fromEntries(new FormData(form));
  data.duration = Number(data.duration);
  const message = document.querySelector('#formMessage');

  try {
    if (browserMode) {
      const startMinutes = Number(data.start.slice(0, 2)) * 60 + Number(data.start.slice(3));
      const conflict = bookings.some(item => {
        const itemStart = Number(item.startMinutes ?? (Number(item.start.slice(0, 2)) * 60 + Number(item.start.slice(3))));
        return item.room === data.room && item.date === data.date && startMinutes < itemStart + Number(item.duration) && itemStart < startMinutes + data.duration;
      });
      if (conflict) throw new Error('That room is already booked for this time.');
      bookings.push({ ...data, id: Date.now(), startMinutes });
    } else {
      const response = await fetch('/api/bookings', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      bookings.push(result);
    }
    filterDate.value = data.date;
    form.reset();
    formDate.value = today;
    document.querySelector('#start').value = '10:00';
    document.querySelector('#duration').value = '60';
    message.textContent = 'Booking added.';
    render();
  } catch (error) {
    message.textContent = error.message;
  }
});

filterDate.addEventListener('change', async () => {
  if (!browserMode) {
    const response = await fetch(`/api/bookings?date=${filterDate.value}`);
    bookings = await response.json();
  }
  render();
});

load();
