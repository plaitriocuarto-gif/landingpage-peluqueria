import 'dotenv/config';
import bcrypt from 'bcryptjs';
import db from './index';

console.log('Iniciando seed...');

db.exec('BEGIN');

try {
  db.prepare(
    'INSERT OR IGNORE INTO users (email, password_hash, nombre, rol) VALUES (?, ?, ?, ?)'
  ).run('admin@peluqueria.com', bcrypt.hashSync('admin123', 10), 'Administrador', 'admin');

  db.prepare(
    'INSERT OR IGNORE INTO users (email, password_hash, nombre, rol) VALUES (?, ?, ?, ?)'
  ).run('cliente@peluqueria.com', bcrypt.hashSync('cliente123', 10), 'Cliente Ejemplo', 'cliente');

  console.log('✓ Usuarios creados');

  const staff1 = db.prepare(
    'INSERT OR IGNORE INTO staff (nombre, avatar, activo) VALUES (?, ?, ?)'
  ).run('Juan García', '✂️', 1);

  const staff2 = db.prepare(
    'INSERT OR IGNORE INTO staff (nombre, avatar, activo) VALUES (?, ?, ?)'
  ).run('María López', '💇', 1);

  const staff1Id = Number(staff1.lastInsertRowid);
  const staff2Id = Number(staff2.lastInsertRowid);

  if (staff1Id === 0) {
    console.log('Los empleados ya existen, omitiendo resto del seed.');
    db.exec('COMMIT');
    console.log('\nSeed completado (datos ya existentes).');
    process.exit(0);
  }

  console.log('✓ Empleados creados: Juan García, María López');

  const insertSchedule = db.prepare(
    'INSERT OR IGNORE INTO staff_schedules (staff_id, dia_semana, hora_inicio, hora_fin, slot_minutos) VALUES (?, ?, ?, ?, ?)'
  );

  for (let day = 1; day <= 6; day++) {
    insertSchedule.run(staff1Id, day, '09:00', '19:00', 30);
    insertSchedule.run(staff2Id, day, '09:00', '18:00', 30);
  }
  console.log('✓ Horarios creados (Lun-Sáb)');

  const svc1 = db.prepare(
    'INSERT OR IGNORE INTO services (nombre, duracion_minutos, precio, activo) VALUES (?, ?, ?, ?)'
  ).run('Corte de cabello', 30, 800, 1);

  const svc2 = db.prepare(
    'INSERT OR IGNORE INTO services (nombre, duracion_minutos, precio, activo) VALUES (?, ?, ?, ?)'
  ).run('Arreglo de barba', 20, 500, 1);

  const svc3 = db.prepare(
    'INSERT OR IGNORE INTO services (nombre, duracion_minutos, precio, activo) VALUES (?, ?, ?, ?)'
  ).run('Corte + Barba', 50, 1200, 1);

  const svc1Id = Number(svc1.lastInsertRowid);
  const svc2Id = Number(svc2.lastInsertRowid);
  const svc3Id = Number(svc3.lastInsertRowid);

  console.log('✓ Servicios creados: Corte, Barba, Corte+Barba');

  const insertSpec = db.prepare(
    'INSERT OR IGNORE INTO staff_specialties (staff_id, service_id) VALUES (?, ?)'
  );
  insertSpec.run(staff1Id, svc1Id);
  insertSpec.run(staff1Id, svc3Id);
  insertSpec.run(staff2Id, svc2Id);
  insertSpec.run(staff2Id, svc3Id);

  const upsertConfig = db.prepare(
    'INSERT OR REPLACE INTO shop_config (key, value) VALUES (?, ?)'
  );
  upsertConfig.run('nombre', 'Peluquería Ejemplo');
  upsertConfig.run('logo', '✂️');
  upsertConfig.run('color', '#7C3AED');
  upsertConfig.run('cancellation_hours', '2');
  upsertConfig.run('descripcion', 'Tu peluquería de confianza. Reservá tu turno online.');
  console.log('✓ Configuración del local creada');

  db.exec('COMMIT');
} catch (err) {
  db.exec('ROLLBACK');
  console.error('Error en seed:', err);
  process.exit(1);
}

console.log('\n🎉 Seed completado exitosamente!');
console.log('\nCredenciales de acceso:');
console.log('  Admin:   admin@peluqueria.com / admin123');
console.log('  Cliente: cliente@peluqueria.com / cliente123');
