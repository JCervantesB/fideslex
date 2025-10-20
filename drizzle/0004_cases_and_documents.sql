-- Create cases table
CREATE TABLE IF NOT EXISTS cases (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES profiles(user_id),
  client_id TEXT NOT NULL REFERENCES profiles(user_id),
  appointment_id INTEGER REFERENCES appointments(id),
  nombre VARCHAR(120) NOT NULL,
  asunto VARCHAR(200) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create case_documents table
CREATE TABLE IF NOT EXISTS case_documents (
  id SERIAL PRIMARY KEY,
  case_id INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  file_key TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  uploaded_by TEXT NOT NULL REFERENCES profiles(user_id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);