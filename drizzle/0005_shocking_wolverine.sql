-- Create appointment_requests table only (avoid duplicates of existing tables)
CREATE TABLE IF NOT EXISTS appointment_requests (
  id SERIAL PRIMARY KEY,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  client_id VARCHAR(255) NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  client_name VARCHAR(120) NOT NULL,
  client_email VARCHAR(120) NOT NULL,
  client_phone VARCHAR(20) NOT NULL,
  desired_date DATE NOT NULL,
  desired_start_min INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'solicitada',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes to improve query performance
CREATE INDEX IF NOT EXISTS appointment_requests_client_idx ON appointment_requests(client_id);
CREATE INDEX IF NOT EXISTS appointment_requests_date_idx ON appointment_requests(desired_date);
CREATE INDEX IF NOT EXISTS appointment_requests_created_idx ON appointment_requests(created_at);