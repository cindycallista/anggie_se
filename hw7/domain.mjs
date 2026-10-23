const rooms = new Set(['N101', 'N204', 'N305']);

export function toMinutes(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(String(value));
  if (!match) return NaN;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours < 24 && minutes < 60 ? hours * 60 + minutes : NaN;
}

export function validateBooking(input = {}) {
  const booking = {
    name: String(input.name || '').trim(),
    room: String(input.room || '').trim(),
    date: String(input.date || '').trim(),
    start: String(input.start || '').trim(),
    duration: Number(input.duration),
    purpose: String(input.purpose || '').trim()
  };

  if (booking.name.length < 2 || booking.name.length > 60) throw new Error('Name must contain 2–60 characters.');
  if (!rooms.has(booking.room)) throw new Error('Choose a valid room.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(booking.date)) throw new Error('Choose a valid date.');
  if (![30, 60, 90, 120].includes(booking.duration)) throw new Error('Choose a valid duration.');
  if (!booking.purpose || booking.purpose.length > 80) throw new Error('Purpose must contain 1–80 characters.');

  const startMinutes = toMinutes(booking.start);
  if (!Number.isFinite(startMinutes) || startMinutes < 8 * 60 || startMinutes + booking.duration > 22 * 60) {
    throw new Error('Bookings must stay between 08:00 and 22:00.');
  }

  return { ...booking, startMinutes, endMinutes: startMinutes + booking.duration };
}

export function overlaps(left, right) {
  return left.room === right.room && left.date === right.date && left.startMinutes < right.endMinutes && right.startMinutes < left.endMinutes;
}

export function createBookingStore(initial = []) {
  let nextId = 1;
  const bookings = initial.map(item => ({ ...validateBooking(item), id: nextId++ }));

  return {
    list(date) {
      return bookings.filter(item => !date || item.date === date).map(item => ({ ...item }));
    },
    add(input) {
      const candidate = validateBooking(input);
      if (bookings.some(item => overlaps(item, candidate))) throw new Error('That room is already booked for this time.');
      const saved = { ...candidate, id: nextId++ };
      bookings.push(saved);
      return { ...saved };
    },
    remove(id) {
      const index = bookings.findIndex(item => item.id === Number(id));
      if (index === -1) return false;
      bookings.splice(index, 1);
      return true;
    }
  };
}
