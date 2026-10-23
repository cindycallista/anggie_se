CREATE TABLE IF NOT EXISTS parcels (
  id SERIAL PRIMARY KEY,
  recipient VARCHAR(80) NOT NULL,
  carrier VARCHAR(40) NOT NULL,
  tracking_code VARCHAR(80) NOT NULL UNIQUE,
  shelf VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting',
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO parcels (recipient, carrier, tracking_code, shelf, status)
VALUES
  ('Mei Chen', 'Black Cat', 'BC-845019', 'A-12', 'waiting'),
  ('Yu Han', 'Post Office', 'PO-229138', 'B-04', 'waiting'),
  ('Ting Lin', 'HCT', 'HC-773401', 'C-08', 'collected')
ON CONFLICT (tracking_code) DO NOTHING;

