const key = 'branchroute-progress-v1';
const steps = [...document.querySelectorAll('.route article')];
let checked;
try { checked = JSON.parse(localStorage.getItem(key)) || []; } catch { checked = []; }
function render() {
  steps.forEach((step, index) => step.classList.toggle('complete', checked.includes(index)));
  document.querySelector('#progress').textContent = `${checked.length} / ${steps.length} complete`;
  localStorage.setItem(key, JSON.stringify(checked));
}
steps.forEach((step, index) => step.querySelector('.check').addEventListener('click', () => {
  checked = checked.includes(index) ? checked.filter(value => value !== index) : [...checked, index];
  render();
}));
document.querySelector('#reset').addEventListener('click', () => { checked = []; render(); });
render();

