import { Router, Request, Response } from 'express';
import db from '../db';
import { requireAuth, requireRole } from '../middleware/auth';
import { sendConfirmacion } from '../lib/email';

const router = Router();

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

router.get('/available', (req: Request, res: Response) => {
  const { staffId, date, serviceId } = req.query as {
    staffId: string;
    date: string;
    serviceId: string;
  };

  if (!staffId || !date || !serviceId) {
    res.status(400).json({ error: 'staffId, date y serviceId son requeridos' });
    return;
  }

  const service = db
    .prepare('SELECT * FROM services WHERE id = ? AND activo = 1')
    .get(Number(serviceId)) as { duracion_minutos: number } | undefined;

  if (!service) {
    res.status(404).json({ error: 'Servicio no encontrado' });
    return;
  }

  const dateObj = new Date(`${date}T12:00:00`);
  const dayOfWeek = dateObj.getDay();

  const exception = db
    .prepare('SELECT * FROM staff_exceptions WHERE staff_id = ? AND fecha = ?')
    .get(Number(staffId), date) as {
      tipo: string;
      hora_inicio: string;
      hora_fin: string;
    } | undefined;

  if (exception?.tipo === 'libre') {
    res.json({ slots: [] });
    return;
  }

  let horaInicio: string;
  let horaFin: string;
  let slotMinutos: number;

  if (exception?.tipo === 'horario_especial') {
    horaInicio = exception.hora_inicio;
    horaFin = exception.hora_fin;
    const schedule = db
      .prepare('SELECT slot_minutos FROM staff_schedules WHERE staff_id = ? AND dia_semana = ?')
      .get(Number(staffId), dayOfWeek) as { slot_minutos: number } | undefined;
    slotMinutos = schedule?.slot_minutos ?? 30;
  } else {
    const schedule = db
      .prepare('SELECT * FROM staff_schedules WHERE staff_id = ? AND dia_semana = ?')
      .get(Number(staffId), dayOfWeek) as {
        hora_inicio: string;
        hora_fin: string;
        slot_minutos: number;
      } | undefined;

    if (!schedule) {
      res.json({ slots: [] });
      return;
    }

    horaInicio = schedule.hora_inicio;
    horaFin = schedule.hora_fin;
    slotMinutos = schedule.slot_minutos;
  }

  const booked = db
    .prepare(
      "SELECT hora_inicio, hora_fin FROM appointments WHERE staff_id = ? AND fecha = ? AND estado != 'cancelado'"
    )
    .all(Number(staffId), date) as Array<{ hora_inicio: string; hora_fin: string }>;

  const startMin = timeToMinutes(horaInicio);
  const endMin = timeToMinutes(horaFin);
  const duration = service.duracion_minutos;

  const bookedRanges = booked.map((a) => ({
    start: timeToMinutes(a.hora_inicio),
    end: timeToMinutes(a.hora_fin),
  }));

  const slots: string[] = [];

  for (let slot = startMin; slot + duration <= endMin; slot += slotMinutos) {
    const slotEnd = slot + duration;
    const conflict = bookedRanges.some((r) => slot < r.end && slotEnd > r.start);
    if (!conflict) {
      slots.push(minutesToTime(slot));
    }
  }

  res.json({ slots });
});

// Reserva de turno sin autenticación (invitados)
router.post('/guest', (req: Request, res: Response) => {
  const { nombre, telefono, staffId, serviceId, fecha, horaInicio } = req.body as {
    nombre: string;
    telefono: string;
    staffId: number;
    serviceId: number;
    fecha: string;
    horaInicio: string;
  };

  if (!nombre || !telefono || !staffId || !serviceId || !fecha || !horaInicio) {
    res.status(400).json({ error: 'Datos incompletos' });
    return;
  }

  // Buscar o crear usuario invitado identificado por teléfono
  const guestEmail = `${telefono.replace(/\D/g, '')}@guest.plait`;
  let guestUser = db.prepare('SELECT id FROM users WHERE email = ?').get(guestEmail) as
    | { id: number }
    | undefined;

  if (!guestUser) {
    const inserted = db
      .prepare('INSERT INTO users (email, password_hash, nombre, rol) VALUES (?, ?, ?, ?)')
      .run(guestEmail, 'GUEST_NOLOGIN', nombre, 'cliente');
    guestUser = { id: Number(inserted.lastInsertRowid) };
  }

  const service = db
    .prepare('SELECT * FROM services WHERE id = ? AND activo = 1')
    .get(Number(serviceId)) as { duracion_minutos: number } | undefined;

  if (!service) {
    res.status(404).json({ error: 'Servicio no encontrado' });
    return;
  }

  const startMin = timeToMinutes(horaInicio);
  const horaFin = minutesToTime(startMin + service.duracion_minutos);

  const conflictCheck = db
    .prepare(`
      SELECT id FROM appointments
      WHERE staff_id = ? AND fecha = ? AND estado != 'cancelado'
      AND hora_inicio < ? AND hora_fin > ?
    `)
    .get(Number(staffId), fecha, horaFin, horaInicio);

  if (conflictCheck) {
    res.status(409).json({ error: 'El horario ya está reservado' });
    return;
  }

  const result = db
    .prepare(`
      INSERT INTO appointments (client_id, staff_id, service_id, fecha, hora_inicio, hora_fin, estado)
      VALUES (?, ?, ?, ?, ?, ?, 'pendiente')
    `)
    .run(guestUser.id, Number(staffId), Number(serviceId), fecha, horaInicio, horaFin);

  const appointment = db
    .prepare(`
      SELECT a.*, s.nombre AS staff_nombre, sv.nombre AS service_nombre
      FROM appointments a
      JOIN staff s ON a.staff_id = s.id
      JOIN services sv ON a.service_id = sv.id
      WHERE a.id = ?
    `)
    .get(Number(result.lastInsertRowid));

  res.status(201).json(appointment);
});

// Reserva sin cuenta — invitado proporciona nombre y teléfono
router.post('/guest', async (req: Request, res: Response) => {
  const { nombre, telefono, staffId, serviceId, fecha, horaInicio } = req.body as {
    nombre: string;
    telefono: string;
    staffId: number;
    serviceId: number;
    fecha: string;
    horaInicio: string;
  };

  if (!nombre?.trim() || !staffId || !serviceId || !fecha || !horaInicio) {
    res.status(400).json({ error: 'nombre, staffId, serviceId, fecha y horaInicio son requeridos' });
    return;
  }

  const service = db
    .prepare('SELECT * FROM services WHERE id = ? AND activo = 1')
    .get(Number(serviceId)) as { duracion_minutos: number; nombre: string; precio: number } | undefined;

  if (!service) {
    res.status(404).json({ error: 'Servicio no encontrado' });
    return;
  }

  const startMin = timeToMinutes(horaInicio);
  const horaFin = minutesToTime(startMin + service.duracion_minutos);

  const conflictCheck = db
    .prepare(`
      SELECT id FROM appointments
      WHERE staff_id = ? AND fecha = ? AND estado != 'cancelado'
      AND hora_inicio < ? AND hora_fin > ?
    `)
    .get(Number(staffId), fecha, horaFin, horaInicio);

  if (conflictCheck) {
    res.status(409).json({ error: 'El horario ya está reservado' });
    return;
  }

  const result = db
    .prepare(`
      INSERT INTO appointments
        (client_id, guest_nombre, guest_telefono, staff_id, service_id, fecha, hora_inicio, hora_fin, estado)
      VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, 'pendiente')
    `)
    .run(nombre.trim(), telefono?.trim() ?? null, Number(staffId), Number(serviceId), fecha, horaInicio, horaFin);

  const appointment = db
    .prepare(`
      SELECT a.*, s.nombre AS staff_nombre, sv.nombre AS service_nombre, sv.precio AS service_precio
      FROM appointments a
      JOIN staff s ON a.staff_id = s.id
      JOIN services sv ON a.service_id = sv.id
      WHERE a.id = ?
    `)
    .get(Number(result.lastInsertRowid)) as Record<string, unknown> & {
      staff_nombre: string;
      service_nombre: string;
      service_precio: number;
    };

  // Enviar email de confirmación si el invitado dejó email (futuro)
  // Por ahora logueamos la reserva
  console.log(`[Appointments] Reserva invitado: ${nombre} | ${fecha} ${horaInicio} | ${appointment.service_nombre}`);

  // Intentar enviar email si el nombre parece un email
  if (nombre.includes('@')) {
    try {
      const shopName = (db
        .prepare("SELECT value FROM shop_config WHERE key = 'nombre'")
        .get() as { value: string } | undefined)?.value ?? 'Peluquería';

      await sendConfirmacion({
        clienteEmail: nombre,
        clienteNombre: nombre,
        fecha,
        hora_inicio: horaInicio,
        servicio: appointment.service_nombre,
        profesional: appointment.staff_nombre,
        peluqueria: shopName,
        precio: appointment.service_precio,
      });
    } catch (err) {
      console.warn('[Appointments] No se pudo enviar email de confirmación:', err);
    }
  }

  res.status(201).json(appointment);
});

router.get('/my', requireAuth, (req: Request, res: Response) => {
  const appointments = db
    .prepare(`
      SELECT a.*, s.nombre AS staff_nombre, s.avatar AS staff_avatar,
             sv.nombre AS service_nombre, sv.precio AS service_precio
      FROM appointments a
      JOIN staff s ON a.staff_id = s.id
      JOIN services sv ON a.service_id = sv.id
      WHERE a.client_id = ?
      ORDER BY a.fecha DESC, a.hora_inicio DESC
    `)
    .all(req.user!.id);

  res.json(appointments);
});

router.post('/', requireAuth, (req: Request, res: Response) => {
  const { staffId, serviceId, fecha, horaInicio } = req.body as {
    staffId: number;
    serviceId: number;
    fecha: string;
    horaInicio: string;
  };

  if (!staffId || !serviceId || !fecha || !horaInicio) {
    res.status(400).json({ error: 'Datos incompletos' });
    return;
  }

  const service = db
    .prepare('SELECT * FROM services WHERE id = ? AND activo = 1')
    .get(Number(serviceId)) as { duracion_minutos: number } | undefined;

  if (!service) {
    res.status(404).json({ error: 'Servicio no encontrado' });
    return;
  }

  const startMin = timeToMinutes(horaInicio);
  const horaFin = minutesToTime(startMin + service.duracion_minutos);

  const conflictCheck = db
    .prepare(`
      SELECT id FROM appointments
      WHERE staff_id = ? AND fecha = ? AND estado != 'cancelado'
      AND hora_inicio < ? AND hora_fin > ?
    `)
    .get(Number(staffId), fecha, horaFin, horaInicio);

  if (conflictCheck) {
    res.status(409).json({ error: 'El horario ya está reservado' });
    return;
  }

  const result = db
    .prepare(`
      INSERT INTO appointments (client_id, staff_id, service_id, fecha, hora_inicio, hora_fin, estado)
      VALUES (?, ?, ?, ?, ?, ?, 'pendiente')
    `)
    .run(req.user!.id, Number(staffId), Number(serviceId), fecha, horaInicio, horaFin);

  const appointment = db
    .prepare(`
      SELECT a.*, s.nombre AS staff_nombre, sv.nombre AS service_nombre
      FROM appointments a
      JOIN staff s ON a.staff_id = s.id
      JOIN services sv ON a.service_id = sv.id
      WHERE a.id = ?
    `)
    .get(Number(result.lastInsertRowid));

  res.status(201).json(appointment);
});

router.delete('/:id', requireAuth, (req: Request, res: Response) => {
  const appointment = db
    .prepare('SELECT * FROM appointments WHERE id = ? AND client_id = ?')
    .get(Number(req.params.id), req.user!.id) as {
      fecha: string;
      hora_inicio: string;
      estado: string;
    } | undefined;

  if (!appointment) {
    res.status(404).json({ error: 'Turno no encontrado' });
    return;
  }

  if (appointment.estado === 'cancelado') {
    res.status(400).json({ error: 'El turno ya está cancelado' });
    return;
  }

  const configRow = db
    .prepare("SELECT value FROM shop_config WHERE key = 'cancellation_hours'")
    .get() as { value: string } | undefined;

  const cancelHours = Number(configRow?.value ?? 2);
  const appointmentDateTime = new Date(`${appointment.fecha}T${appointment.hora_inicio}:00`);
  const limitDateTime = new Date(appointmentDateTime.getTime() - cancelHours * 60 * 60 * 1000);

  if (new Date() > limitDateTime) {
    res.status(400).json({
      error: `No se puede cancelar con menos de ${cancelHours} hora(s) de anticipación`,
    });
    return;
  }

  db.prepare("UPDATE appointments SET estado = 'cancelado' WHERE id = ?").run(
    Number(req.params.id)
  );

  res.json({ message: 'Turno cancelado exitosamente' });
});

router.get('/', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const { fecha, staffId, estado } = req.query as {
    fecha?: string;
    staffId?: string;
    estado?: string;
  };

  let query = `
    SELECT a.*,
           u.nombre AS client_nombre, u.email AS client_email,
           s.nombre AS staff_nombre, s.avatar AS staff_avatar,
           sv.nombre AS service_nombre, sv.precio AS service_precio
    FROM appointments a
    JOIN users u ON a.client_id = u.id
    JOIN staff s ON a.staff_id = s.id
    JOIN services sv ON a.service_id = sv.id
    WHERE 1=1
  `;

  const params: (string | number)[] = [];

  if (fecha) {
    query += ' AND a.fecha = ?';
    params.push(fecha);
  }
  if (staffId) {
    query += ' AND a.staff_id = ?';
    params.push(Number(staffId));
  }
  if (estado) {
    query += ' AND a.estado = ?';
    params.push(estado);
  }

  query += ' ORDER BY a.fecha DESC, a.hora_inicio ASC';

  const stmt = db.prepare(query);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appointments = (stmt.all as (...args: any[]) => unknown[])(...params);
  res.json(appointments);
});

router.put('/:id/status', requireAuth, requireRole('admin'), (req: Request, res: Response) => {
  const { estado } = req.body as { estado: string };

  const validStates = ['pendiente', 'confirmado', 'cancelado', 'completado'];
  if (!validStates.includes(estado)) {
    res.status(400).json({ error: 'Estado inválido' });
    return;
  }

  const result = db
    .prepare('UPDATE appointments SET estado = ? WHERE id = ?')
    .run(estado, Number(req.params.id));

  if (result.changes === 0) {
    res.status(404).json({ error: 'Turno no encontrado' });
    return;
  }

  const updated = db
    .prepare(`
      SELECT a.*,
             u.nombre AS client_nombre,
             s.nombre AS staff_nombre,
             sv.nombre AS service_nombre
      FROM appointments a
      JOIN users u ON a.client_id = u.id
      JOIN staff s ON a.staff_id = s.id
      JOIN services sv ON a.service_id = sv.id
      WHERE a.id = ?
    `)
    .get(Number(req.params.id));

  res.json(updated);
});

router.get('/staff', requireAuth, requireRole('staff', 'admin'), (req: Request, res: Response) => {
  const { semana } = req.query as { semana?: string };

  let staffId: number;

  if (req.user!.rol === 'staff') {
    const staffUser = db
      .prepare('SELECT id FROM staff WHERE nombre = (SELECT nombre FROM users WHERE id = ?)')
      .get(req.user!.id) as { id: number } | undefined;

    if (!staffUser) {
      res.status(404).json({ error: 'No se encontró perfil de empleado' });
      return;
    }
    staffId = staffUser.id;
  } else {
    staffId = Number(req.query.staffId);
  }

  let dateFilter = '';
  const params: (string | number)[] = [staffId];

  if (semana) {
    const start = new Date(semana);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    dateFilter = ' AND a.fecha >= ? AND a.fecha <= ?';
    params.push(start.toISOString().split('T')[0]);
    params.push(end.toISOString().split('T')[0]);
  } else {
    dateFilter = ' AND a.fecha = ?';
    params.push(new Date().toISOString().split('T')[0]);
  }

  const staffStmt = db.prepare(`
    SELECT a.*,
           u.nombre AS client_nombre, u.email AS client_email,
           sv.nombre AS service_nombre, sv.duracion_minutos
    FROM appointments a
    JOIN users u ON a.client_id = u.id
    JOIN services sv ON a.service_id = sv.id
    WHERE a.staff_id = ? ${dateFilter} AND a.estado != 'cancelado'
    ORDER BY a.fecha ASC, a.hora_inicio ASC
  `);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const appointments = (staffStmt.all as (...args: any[]) => unknown[])(...params);

  res.json(appointments);
});

export default router;
