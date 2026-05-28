-- ============================================================
-- PLaiT Turnero — Supabase Migration
-- Correr en: Supabase Dashboard > SQL Editor > New query
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'cliente' CHECK(rol IN ('admin','staff','cliente')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '',
  activo INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  duracion_minutos INTEGER NOT NULL,
  precio NUMERIC NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS staff_specialties (
  staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  service_id INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  PRIMARY KEY (staff_id, service_id)
);

CREATE TABLE IF NOT EXISTS staff_schedules (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK(dia_semana >= 0 AND dia_semana <= 6),
  hora_inicio TEXT NOT NULL,
  hora_fin TEXT NOT NULL,
  slot_minutos INTEGER NOT NULL DEFAULT 30,
  UNIQUE(staff_id, dia_semana)
);

CREATE TABLE IF NOT EXISTS staff_exceptions (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  fecha TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK(tipo IN ('libre','horario_especial')),
  hora_inicio TEXT,
  hora_fin TEXT,
  motivo TEXT
);

CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES users(id),
  guest_nombre TEXT,
  guest_telefono TEXT,
  staff_id INTEGER NOT NULL REFERENCES staff(id),
  service_id INTEGER NOT NULL REFERENCES services(id),
  fecha TEXT NOT NULL,
  hora_inicio TEXT NOT NULL,
  hora_fin TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK(estado IN ('pendiente','confirmado','cancelado','completado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Deshabilitar RLS (el servidor usa service_role key que bypasea RLS de todas formas)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;
ALTER TABLE services DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_specialties DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_schedules DISABLE ROW LEVEL SECURITY;
ALTER TABLE staff_exceptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE shop_config DISABLE ROW LEVEL SECURITY;
