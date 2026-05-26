import { DatabaseSync } from 'node:sqlite';

export function createSchema(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nombre TEXT NOT NULL,
      rol TEXT NOT NULL DEFAULT 'cliente' CHECK(rol IN ('admin','staff','cliente')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS staff (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      avatar TEXT NOT NULL DEFAULT '✂️',
      activo INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      duracion_minutos INTEGER NOT NULL,
      precio REAL NOT NULL,
      activo INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS staff_specialties (
      staff_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      PRIMARY KEY (staff_id, service_id),
      FOREIGN KEY (staff_id) REFERENCES staff(id),
      FOREIGN KEY (service_id) REFERENCES services(id)
    );

    CREATE TABLE IF NOT EXISTS staff_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      dia_semana INTEGER NOT NULL CHECK(dia_semana >= 0 AND dia_semana <= 6),
      hora_inicio TEXT NOT NULL,
      hora_fin TEXT NOT NULL,
      slot_minutos INTEGER NOT NULL DEFAULT 30,
      UNIQUE(staff_id, dia_semana),
      FOREIGN KEY (staff_id) REFERENCES staff(id)
    );

    CREATE TABLE IF NOT EXISTS staff_exceptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_id INTEGER NOT NULL,
      fecha TEXT NOT NULL,
      tipo TEXT NOT NULL CHECK(tipo IN ('libre','horario_especial')),
      hora_inicio TEXT,
      hora_fin TEXT,
      motivo TEXT,
      FOREIGN KEY (staff_id) REFERENCES staff(id)
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      guest_nombre TEXT,
      guest_telefono TEXT,
      staff_id INTEGER NOT NULL,
      service_id INTEGER NOT NULL,
      fecha TEXT NOT NULL,
      hora_inicio TEXT NOT NULL,
      hora_fin TEXT NOT NULL,
      estado TEXT NOT NULL DEFAULT 'pendiente' CHECK(estado IN ('pendiente','confirmado','cancelado','completado')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES users(id),
      FOREIGN KEY (staff_id) REFERENCES staff(id),
      FOREIGN KEY (service_id) REFERENCES services(id)
    );

    CREATE TABLE IF NOT EXISTS shop_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Migraciones sobre tablas existentes
  for (const col of ['guest_nombre TEXT', 'guest_telefono TEXT']) {
    try {
      db.exec(`ALTER TABLE appointments ADD COLUMN ${col}`);
    } catch {
      // La columna ya existe — ignorar
    }
  }

  // Permite client_id nulo para reservas de invitados en BD existente
  // (SQLite no soporta ALTER COLUMN, la constraint se relaja al crear nuevos registros)
}
