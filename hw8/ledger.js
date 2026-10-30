const STORE = "settle-sheet-v1";

const example = {
  people: [
    { id: "p1", name: "Anggie" },
    { id: "p2", name: "Mei" },
    { id: "p3", name: "Han" },
    { id: "p4", name: "Nora" }
  ],
  expenses: [
    { id: "e1", payer: "p1", amount: 860, description: "Dinner", participants: ["p1", "p2", "p3", "p4"] },
    { id: "e2", payer: "p3", amount: 420, description: "Taxi", participants: ["p1", "p2", "p3"] },
    { id: "e3", payer: "p2", amount: 300, description: "Museum tickets", participants: ["p2", "p4"] }
  ]
};

const memberForm = document.querySelector("#member-form");
const expenseForm = document.querySelector("#expense-form");
const memberList = document.querySelector("#member-list");
const payerSelect = document.querySelector("#payer");
const splitOptions = document.querySelector("#split-options");
const expenseRows = document.querySelector("#expense-rows");
const balanceList = document.querySelector("#balance-list");
const transferList = document.querySelector("#transfer-list");

let state = readState();

function cloneExample() {
  return JSON.parse(JSON.stringify(example));
}

function readState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE));
    if (saved?.people && saved?.expenses) return saved;
  } catch {}
  return cloneExample();
}

function save() {
  localStorage.setItem(STORE, JSON.stringify(state));
}

function currency(value) {
  return `NT$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function personName(id) {
  return state.people.find((person) => person.id === id)?.name ?? "Unknown";
}

function escapeHtml(value) {
  const element = document.createElement("span");
  element.textContent = value;
  return element.innerHTML;
}

function balances() {
  const result = Object.fromEntries(state.people.map((person) => [person.id, 0]));

  state.expenses.forEach((expense) => {
    if (!expense.participants.length) return;
    result[expense.payer] += expense.amount;
    const share = expense.amount / expense.participants.length;
    expense.participants.forEach((id) => { result[id] -= share; });
  });

  Object.keys(result).forEach((id) => { result[id] = Math.round(result[id] * 100) / 100; });
  return result;
}

function transfersFrom(balanceMap) {
  const creditors = Object.entries(balanceMap).filter(([, value]) => value > 0.005).map(([id, value]) => ({ id, value })).sort((a, b) => b.value - a.value);
  const debtors = Object.entries(balanceMap).filter(([, value]) => value < -0.005).map(([id, value]) => ({ id, value: -value })).sort((a, b) => b.value - a.value);
  const transfers = [];
  let creditorIndex = 0;
  let debtorIndex = 0;

  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const amount = Math.min(creditors[creditorIndex].value, debtors[debtorIndex].value);
    transfers.push({ from: debtors[debtorIndex].id, to: creditors[creditorIndex].id, amount: Math.round(amount * 100) / 100 });
    creditors[creditorIndex].value -= amount;
    debtors[debtorIndex].value -= amount;
    if (creditors[creditorIndex].value < 0.005) creditorIndex += 1;
    if (debtors[debtorIndex].value < 0.005) debtorIndex += 1;
  }
  return transfers;
}

function renderPeople() {
  document.querySelector("#member-count").textContent = `${state.people.length} people in this sheet`;
  memberList.innerHTML = state.people.map((person, index) => `
    <div class="member-row">
      <span class="member-number">${String(index + 1).padStart(2, "0")}</span>
      <span>${escapeHtml(person.name)}</span>
      <button type="button" data-remove-member="${person.id}" aria-label="Remove ${escapeHtml(person.name)}">Remove</button>
    </div>`).join("");

  payerSelect.innerHTML = state.people.map((person) => `<option value="${person.id}">${escapeHtml(person.name)}</option>`).join("");
  splitOptions.innerHTML = state.people.map((person) => `
    <label><input type="checkbox" name="participants" value="${person.id}" checked>${escapeHtml(person.name)}</label>`).join("");
}

function renderExpenses() {
  const total = state.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  document.querySelector("#ledger-total").textContent = `${state.expenses.length} entries · ${currency(total)} total`;

  if (!state.expenses.length) {
    expenseRows.innerHTML = '<tr><td class="empty-row" colspan="5">No expenses recorded.</td></tr>';
    return;
  }

  expenseRows.innerHTML = state.expenses.map((expense) => `
    <tr>
      <td>${escapeHtml(expense.description)}</td>
      <td>${escapeHtml(personName(expense.payer))}</td>
      <td>${expense.participants.map((id) => escapeHtml(personName(id))).join(", ")}</td>
      <td class="money">${currency(expense.amount)}</td>
      <td><button class="expense-delete" type="button" data-remove-expense="${expense.id}" aria-label="Delete expense">Delete</button></td>
    </tr>`).join("");
}

function renderSettlement() {
  const currentBalances = balances();
  const transfers = transfersFrom(currentBalances);

  balanceList.innerHTML = state.people.map((person) => {
    const amount = currentBalances[person.id] ?? 0;
    const className = amount > 0 ? "balance-positive" : amount < 0 ? "balance-negative" : "";
    const prefix = amount > 0 ? "+" : "";
    return `<div class="balance-row"><span>${escapeHtml(person.name)}</span><strong class="${className}">${prefix}${currency(amount)}</strong></div>`;
  }).join("");

  transferList.innerHTML = transfers.length
    ? transfers.map((transfer) => `<li>${escapeHtml(personName(transfer.from))} pays ${escapeHtml(personName(transfer.to))} <strong>${currency(transfer.amount)}</strong></li>`).join("")
    : '<li class="settled">Everyone is settled.</li>';
}

function render() {
  renderPeople();
  renderExpenses();
  renderSettlement();
  save();
}

memberForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(memberForm);
  const name = data.get("name").trim();
  if (!name) return;
  state.people.push({ id: crypto.randomUUID(), name });
  memberForm.reset();
  render();
});

memberList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-member]");
  if (!button) return;
  const id = button.dataset.removeMember;
  const used = state.expenses.some((expense) => expense.payer === id || expense.participants.includes(id));
  if (used) {
    alert("Delete this person's expenses before removing them.");
    return;
  }
  state.people = state.people.filter((person) => person.id !== id);
  render();
});

expenseForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(expenseForm);
  const participants = data.getAll("participants");
  if (!participants.length) {
    alert("Select at least one person for this expense.");
    return;
  }
  state.expenses.push({
    id: crypto.randomUUID(),
    payer: data.get("payer"),
    amount: Math.round(Number(data.get("amount")) * 100) / 100,
    description: data.get("description").trim(),
    participants
  });
  expenseForm.reset();
  render();
});

expenseRows.addEventListener("click", (event) => {
  const button = event.target.closest("[data-remove-expense]");
  if (!button) return;
  state.expenses = state.expenses.filter((expense) => expense.id !== button.dataset.removeExpense);
  render();
});

document.querySelector("#clear-expenses").addEventListener("click", () => {
  state.expenses = [];
  render();
});

document.querySelector("#load-example").addEventListener("click", () => {
  state = cloneExample();
  render();
});

document.querySelector("#download-summary").addEventListener("click", () => {
  const currentBalances = balances();
  const transfers = transfersFrom(currentBalances);
  const lines = ["SETTLE SHEET", "", "Balances:"];
  state.people.forEach((person) => lines.push(`${person.name}: ${currency(currentBalances[person.id] ?? 0)}`));
  lines.push("", "Transfers:");
  if (!transfers.length) lines.push("Everyone is settled.");
  transfers.forEach((transfer) => lines.push(`${personName(transfer.from)} pays ${personName(transfer.to)} ${currency(transfer.amount)}`));
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain" }));
  link.download = "settle-sheet-summary.txt";
  link.click();
  URL.revokeObjectURL(link.href);
});

render();
