-- ============================================================
-- PLaiT — Migraciones Supabase
-- Ejecutar en: Supabase → SQL Editor
-- ============================================================

-- Tabla: registros_pendientes
-- Guarda los datos del formulario pre-pago hasta que se confirme el pago.
CREATE TABLE IF NOT EXISTS registros_pendientes (
  id                   UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre               TEXT NOT NULL,
  apellido             TEXT NOT NULL,
  telefono             TEXT NOT NULL,
  gmail                TEXT NOT NULL,
  nombre_negocio       TEXT NOT NULL,
  slug                 TEXT NOT NULL,
  tiendanube_order_id  TEXT,
  estado               TEXT NOT NULL DEFAULT 'pendiente_pago',
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_registros_slug
  ON registros_pendientes(slug);

CREATE INDEX IF NOT EXISTS idx_registros_order
  ON registros_pendientes(tiendanube_order_id);

CREATE INDEX IF NOT EXISTS idx_registros_estado
  ON registros_pendientes(estado);

-- Tabla: negocios
-- Registro definitivo de cada negocio que compró PLaiT.
CREATE TABLE IF NOT EXISTS negocios (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre           TEXT NOT NULL,
  apellido         TEXT NOT NULL,
  telefono         TEXT NOT NULL,
  gmail            TEXT NOT NULL,
  nombre_negocio   TEXT NOT NULL,
  slug             TEXT NOT NULL UNIQUE,
  clerk_user_id    TEXT,
  url_cliente      TEXT NOT NULL,
  url_admin        TEXT NOT NULL,
  estado           TEXT NOT NULL DEFAULT 'activo',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_negocios_slug
  ON negocios(slug);

CREATE INDEX IF NOT EXISTS idx_negocios_clerk
  ON negocios(clerk_user_id);
