import assert from 'node:assert/strict';
import test from 'node:test';
import { createStudyServer } from '../../server.mjs';

const sample = { name: 'Hong Ying Pei', room: 'N204', date: '2026-10-23', start: '13:00', duration: 60, purpose: 'Test planning' };

async function withServer(run) {
  const server = createStudyServer();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  try { await run(`http://127.0.0.1:${port}`); } finally { await new Promise(resolve => server.close(resolve)); }
}

test('health endpoint reports an available service', () => withServer(async base => {
  const response = await fetch(`${base}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
}));

test('POST creates a booking that GET can retrieve', () => withServer(async base => {
  const created = await fetch(`${base}/api/bookings`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(sample) });
  assert.equal(created.status, 201);
  const response = await fetch(`${base}/api/bookings?date=${sample.date}`);
  const bookings = await response.json();
  assert.equal(bookings.length, 1);
  assert.equal(bookings[0].purpose, 'Test planning');
}));

test('API returns 409 for a conflicting reservation', () => withServer(async base => {
  const request = () => fetch(`${base}/api/bookings`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(sample) });
  assert.equal((await request()).status, 201);
  assert.equal((await request()).status, 409);
}));
