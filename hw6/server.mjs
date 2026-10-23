import express from 'express';
import pg from 'pg';

const app = express();
const port = Number(process.env.PORT || 3000);
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL || 'postgres://parceldock:parceldock@localhost:5432/parceldock' });
app.use(express.json());

app.get('/api/health', async (_request, response) => {
  try { await pool.query('SELECT 1'); response.json({ status: 'ok' }); }
  catch { response.status(503).json({ status: 'database unavailable' }); }
});

app.get('/api/parcels', async (_request, response, next) => {
  try {
    const result = await pool.query('SELECT id, recipient, carrier, tracking_code, shelf, status, received_at FROM parcels ORDER BY received_at DESC');
    response.json(result.rows);
  } catch (error) { next(error); }
});

app.post('/api/parcels', async (request, response, next) => {
  const { recipient, carrier, tracking_code: trackingCode, shelf } = request.body;
  if (![recipient, carrier, trackingCode, shelf].every(value => typeof value === 'string' && value.trim())) return response.status(400).json({ error: 'All fields are required.' });
  try {
    const result = await pool.query('INSERT INTO parcels (recipient, carrier, tracking_code, shelf) VALUES ($1, $2, $3, $4) RETURNING *', [recipient.trim(), carrier.trim(), trackingCode.trim(), shelf.trim()]);
    response.status(201).json(result.rows[0]);
  } catch (error) { next(error); }
});

app.patch('/api/parcels/:id/pickup', async (request, response, next) => {
  try {
    const result = await pool.query("UPDATE parcels SET status = 'collected' WHERE id = $1 RETURNING *", [request.params.id]);
    if (!result.rowCount) return response.status(404).json({ error: 'Parcel not found.' });
    response.json(result.rows[0]);
  } catch (error) { next(error); }
});

app.use((error, _request, response, _next) => { console.error(error); response.status(500).json({ error: 'Unexpected server error.' }); });
app.listen(port, '0.0.0.0', () => console.log(`ParcelDock API listening on ${port}`));

