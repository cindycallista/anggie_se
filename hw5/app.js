const key = 'promptbench-runs-v1';
const sample = [
  { id: 1, prompt: 'Explain the bug and propose a minimal fix.', model: 'Model A', latency: 4.8, correctness: 5, clarity: 4, notes: 'Found the null case and added one regression test.' },
  { id: 2, prompt: 'Explain the bug and propose a minimal fix.', model: 'Model B', latency: 2.3, correctness: 3, clarity: 5, notes: 'Fast and readable, but changed unrelated code.' }
];
let runs;
try { runs = JSON.parse(localStorage.getItem(key)) || sample; } catch { runs = sample; }
const rows = document.querySelector('#rows');
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const score = run => (run.correctness * 0.65 + run.clarity * 0.35).toFixed(1);
function save() { localStorage.setItem(key, JSON.stringify(runs)); }
function render() {
  document.querySelector('#count').textContent = `${runs.length} comparable run${runs.length === 1 ? '' : 's'}`;
  rows.innerHTML = runs.length ? runs.map(run => `<tr><td><strong>${escapeHtml(run.model)}</strong><small>${escapeHtml(run.prompt)}${run.notes ? ` — ${escapeHtml(run.notes)}` : ''}</small></td><td>${run.latency}s</td><td>${run.correctness}/5</td><td>${run.clarity}/5</td><td class="score">${score(run)}</td><td><button class="remove" data-id="${run.id}" aria-label="Delete run">Remove</button></td></tr>`).join('') : '<tr><td class="empty" colspan="6">No runs recorded yet.</td></tr>';
  save();
}
document.querySelector('#runForm').addEventListener('submit', event => {
  event.preventDefault();
  runs.unshift({ id: Date.now(), prompt: document.querySelector('#prompt').value.trim(), model: document.querySelector('#model').value.trim(), latency: Number(document.querySelector('#latency').value), correctness: Number(document.querySelector('#correctness').value), clarity: Number(document.querySelector('#clarity').value), notes: document.querySelector('#notes').value.trim() });
  document.querySelector('#model').value = ''; document.querySelector('#notes').value = ''; render();
});
rows.addEventListener('click', event => { if (event.target.dataset.id) { runs = runs.filter(run => run.id !== Number(event.target.dataset.id)); render(); } });
document.querySelector('#download').addEventListener('click', () => {
  const quote = value => `"${String(value).replaceAll('"', '""')}"`;
  const csv = ['Model,Prompt,Latency,Correctness,Clarity,Score,Notes', ...runs.map(run => [run.model, run.prompt, run.latency, run.correctness, run.clarity, score(run), run.notes].map(quote).join(','))].join('\n');
  const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); link.download = 'promptbench.csv'; link.click(); URL.revokeObjectURL(link.href);
});
render();
