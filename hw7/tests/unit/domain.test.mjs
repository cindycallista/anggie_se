import assert from 'node:assert/strict';
import test from 'node:test';
import { createBookingStore, overlaps, validateBooking } from '../../domain.mjs';

const sample = { name: 'Hong Ying Pei', room: 'N101', date: '2026-10-23', start: '10:00', duration: 60, purpose: 'Software review' };

test('validateBooking trims values and calculates the end time', () => {
  const booking = validateBooking({ ...sample, name: '  Hong Ying Pei  ' });
  assert.equal(booking.name, 'Hong Ying Pei');
  assert.equal(booking.startMinutes, 600);
  assert.equal(booking.endMinutes, 660);
});

test('overlaps detects a collision in the same room', () => {
  const first = validateBooking(sample);
  const second = validateBooking({ ...sample, start: '10:30', duration: 30 });
  assert.equal(overlaps(first, second), true);
  assert.equal(overlaps(first, { ...second, room: 'N204' }), false);
});

test('store rejects an overlapping booking', () => {
  const store = createBookingStore([sample]);
  assert.throws(() => store.add({ ...sample, name: 'Second student', start: '10:30' }), /already booked/);
});

test('booking outside opening hours is rejected', () => {
  assert.throws(() => validateBooking({ ...sample, start: '21:30', duration: 60 }), /08:00 and 22:00/);
});
